import re
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import HTTPException, status
from openai import OpenAI


from app.core.config import settings
from app.models.assessment import (
    AssessmentDBModel, FlashcardModel, MCQModel, ScenarioQuestionModel,
    CaseStudyModel, ShortAnswerQuestionModel, FillBlankModel, TrueFalseModel,
    CodingQuestionModel, AssignmentTaskModel, AssessmentAttemptDBModel,
    SectionAttemptModel, QuestionGradeModel, AssessmentPackageModel, TestPackageModel
)

logger = logging.getLogger(__name__)

class AssessmentService:
    def __init__(self, db):
        self.db = db
        self.assessments_collection = db["assessments"]
        self.attempts_collection = db["assessment_attempts"]
        self.synopses_collection = db[settings.SYNOPSIS_COLLECTION]
        
        # Initialize Groq client
        self.client = OpenAI(
            api_key=settings.GROQ_API_KEY, 
            base_url="https://api.groq.com/openai/v1", 
            max_retries=0
        )

    def _detect_programming(self, title: str, transcript: str) -> bool:
        """
        Detects if the video has programming, algorithms, software development, or coding topics.
        """
        keywords = [
            r"\bpython\b", r"\bjavascript\b", r"\btypescript\b", r"\bjava\b", r"\bc\+\+\b", r"\bcsharp\b",
            r"\bphp\b", r"\bruby\b", r"\bhtml\b", r"\bcss\b", r"\breact\b", r"\bvue\b", r"\bangular\b",
            r"\bnode\.js\b", r"\bexpress\b", r"\bdjango\b", r"\bflask\b", r"\bsql\b", r"\bmongodb\b",
            r"\bpostgres\b", r"\bdatabase\b", r"\bquery\b", r"\bcode\b", r"\bcoding\b", r"\bprogram\b",
            r"\bprogramming\b", r"\balgorithm\b", r"\bsoftware\b", r"\bdeveloper\b", r"\bdevelopment\b",
            r"\bcompiler\b", r"\binterpreter\b", r"\bdebugger\b", r"\bgit\b", r"\bgithub\b", r"\bdocker\b",
            r"\bkubernetes\b", r"\bapi\b", r"\bjson\b", r"\bxml\b", r"\bvariable\b", r"\bfunction\b",
            r"\bclass\b", r"\bobject\b", r"\barray\b", r"\blist\b", r"\bdictionary\b", r"\bloop\b",
            r"\brecursion\b", r"\bstack\b", r"\bqueue\b", r"\btree\b", r"\bgraph\b", r"\bpointer\b",
            r"\bframework\b", r"\blibrary\b", r"\bscript\b"
        ]
        
        combined_text = (title + " " + transcript).lower()
        for kw in keywords:
            if re.search(kw, combined_text):
                return True
        return False

    def _parse_duration_to_minutes(self, duration_str: str) -> float:
        if not duration_str:
            return 10.0
        duration_str = str(duration_str).strip()
        parts = duration_str.split(':')
        try:
            if len(parts) == 3:
                return int(parts[0]) * 60 + int(parts[1]) + int(parts[2]) / 60.0
            elif len(parts) == 2:
                return int(parts[0]) + int(parts[1]) / 60.0
            elif len(parts) == 1:
                val = float(parts[0])
                if val > 500:
                    return val / 60.0
                return val
        except ValueError:
            pass
        return 10.0

    def _get_question_counts(self, duration_mins: float, is_programming: bool) -> dict:
        if duration_mins < 10:
            return {
                "size": "small",
                "flashcards": 5,
                "mcq": 5,
                "scenario": 2,
                "case_study": 1,
                "short_answer": 3,
                "fill_blank": 5,
                "true_false": 5,
                "coding": 1 if is_programming else 0,
                "assignments": 1
            }
        elif duration_mins < 30:
            return {
                "size": "medium",
                "flashcards": 10,
                "mcq": 10,
                "scenario": 4,
                "case_study": 2,
                "short_answer": 5,
                "fill_blank": 8,
                "true_false": 8,
                "coding": 2 if is_programming else 0,
                "assignments": 2
            }
        else:
            return {
                "size": "large",
                "flashcards": 18,
                "mcq": 18,
                "scenario": 6,
                "case_study": 3,
                "short_answer": 9,
                "fill_blank": 12,
                "true_false": 12,
                "coding": 3 if is_programming else 0,
                "assignments": 3
            }

    def _pad_or_fallback_questions(self, package: dict, counts: dict, synopsis: dict, is_test: bool = False):
        """
        Validates and pads questions in the package if the count is lower than required.
        Uses information from keyConcepts and majorConcepts to build conceptual questions.
        """
        concepts = synopsis.get("majorConcepts", []) + synopsis.get("keyConcepts", [])
        title = synopsis.get("metadata", {}).get("title", "Video Lecture")
        theme = synopsis.get("theme", "General")
        
        # 1. Pad MCQs
        mcqs = package.setdefault("mcqs", [])
        required_mcqs = counts["mcq"]
        if len(mcqs) < required_mcqs:
            logger.warning(f"Validation: MCQs count ({len(mcqs)}) is less than required ({required_mcqs}). Generating fallback MCQs.")
            for i in range(len(mcqs), required_mcqs):
                concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                
                mcqs.append({
                    "question": f"Which of the following best defines the concept of '{concept_name}' as discussed in '{title}'?",
                    "options": [
                        explanation[:100],
                        "An unrelated secondary framework.",
                        "A deprecated legacy implementation detail.",
                        "A transient resource initialization parameter."
                    ],
                    "correctAnswer": explanation[:100],
                    "explanation": f"The lecture notes highlight '{concept_name}' as: {explanation}",
                    "topic": concept_name
                })
                
        # 2. Pad Fill in the Blanks
        fbs = package.setdefault("fillBlanks", [])
        required_fbs = counts["fill_blank"]
        if len(fbs) < required_fbs:
            logger.warning(f"Validation: FillBlanks count ({len(fbs)}) is less than required ({required_fbs}). Generating fallbacks.")
            for i in range(len(fbs), required_fbs):
                concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                fbs.append({
                    "sentence": f"According to the lecture, the term ___ is defined as: {explanation[:150]}.",
                    "answer": concept_name,
                    "term": concept_name,
                    "explanation": f"The definition refers to '{concept_name}'.",
                    "topic": concept_name
                })

        # 3. Pad True/False
        tfs = package.setdefault("trueFalse", [])
        required_tfs = counts["true_false"]
        if len(tfs) < required_tfs:
            logger.warning(f"Validation: True/False count ({len(tfs)}) is less than required ({required_tfs}). Generating fallbacks.")
            for i in range(len(tfs), required_tfs):
                concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                
                is_true = (i % 2 == 0)
                statement = f"True or False: '{concept_name}' directly represents {explanation[:120]}." if is_true else f"True or False: '{concept_name}' is defined as a mechanism to bypass {explanation[:120]} completely."
                tfs.append({
                    "statement": statement,
                    "correctAnswer": is_true,
                    "explanation": f"Explanation check for {concept_name}.",
                    "topic": concept_name
                })

        # 4. Pad Scenario Questions
        scs = package.setdefault("scenarioQuestions", [])
        required_scs = counts["scenario"]
        if len(scs) < required_scs:
            logger.warning(f"Validation: Scenarios count ({len(scs)}) is less than required ({required_scs}). Generating fallbacks.")
            for i in range(len(scs), required_scs):
                concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                scs.append({
                    "scenario": f"A developer is implementing a system based on {concept_name} but encounters scaling limits under peak load.",
                    "question": f"How can they apply the principles of {concept_name} to optimize the deployment?",
                    "modelAnswer": f"They should leverage the guidelines: {explanation}. This includes separating concern layers and utilizing caching patterns.",
                    "topic": concept_name
                })

        # 5. Pad Case Studies
        css = package.setdefault("caseStudies", [])
        required_css = counts["case_study"]
        if len(css) < required_css:
            logger.warning(f"Validation: CaseStudies count ({len(css)}) is less than required ({required_css}). Generating fallbacks.")
            for i in range(len(css), required_css):
                concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                css.append({
                    "title": f"Migrating to {concept_name} Architecture",
                    "caseText": f"An enterprise is transitioning its legacy core workflows to align with '{concept_name}'. The implementation must scale to multiple geographic nodes while maintaining strict consistency.",
                    "questions": [
                        f"What is the first step when integrating {concept_name} into legacy environments?",
                        f"How does {concept_name} address geographic database latency issues?"
                    ],
                    "modelAnswers": [
                        f"Audit dependencies and isolate boundaries around {concept_name}.",
                        f"By caching queries locally and using eventual consistency models where appropriate."
                    ],
                    "topic": concept_name
                })

        # 6. Pad Short Answers
        sas = package.setdefault("shortAnswers", [])
        required_sas = counts["short_answer"]
        if len(sas) < required_sas:
            logger.warning(f"Validation: ShortAnswers count ({len(sas)}) is less than required ({required_sas}). Generating fallbacks.")
            for i in range(len(sas), required_sas):
                concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                sas.append({
                    "question": f"Explain the core purpose and implications of '{concept_name}' as described in the lecture.",
                    "modelAnswer": f"The purpose of '{concept_name}' is to enable {explanation}. This is essential for proper operations.",
                    "topic": concept_name
                })

        # 7. Pad Coding (only if required count > 0)
        codings = package.setdefault("codingQuestions", [])
        required_codings = counts["coding"]
        if required_codings > 0 and len(codings) < required_codings:
            logger.warning(f"Validation: CodingQuestions count ({len(codings)}) is less than required ({required_codings}). Generating fallbacks.")
            for i in range(len(codings), required_codings):
                codings.append({
                    "title": f"Algorithmic Challenge {i+1} for {theme}",
                    "description": f"Implement a helper routine that validates and processes structures relating to {theme}.",
                    "starterCode": "def solve_challenge(data):\n    # Write your solution code here\n    return data",
                    "solutionCode": "def solve_challenge(data):\n    # Reference implementation\n    return data",
                    "sampleInput": "'test_data'",
                    "sampleOutput": "'test_data'",
                    "topic": theme
                })

        if not is_test:
            # 8. Pad Flashcards
            fcs = package.setdefault("flashcards", [])
            required_fcs = counts["flashcards"]
            if len(fcs) < required_fcs:
                logger.warning(f"Validation: Flashcards count ({len(fcs)}) is less than required ({required_fcs}). Generating fallbacks.")
                for i in range(len(fcs), required_fcs):
                    concept_item = concepts[i % len(concepts)] if concepts else {"concept": "Key Concept", "explanation": "Core learning point."}
                    concept_name = concept_item.get("concept") or concept_item.get("name") or "Core Topic"
                    explanation = concept_item.get("explanation") or "Core theme presented in the lecture."
                    fcs.append({
                        "question": f"What is the significance of '{concept_name}'?",
                        "answer": explanation
                    })

            # 9. Pad Assignments
            asgs = package.setdefault("assignments", [])
            required_asgs = counts["assignments"]
            if len(asgs) < required_asgs:
                logger.warning(f"Validation: Assignments count ({len(asgs)}) is less than required ({required_asgs}). Generating fallbacks.")
                diffs = ["Beginner", "Medium", "Advanced"]
                for i in range(len(asgs), required_asgs):
                    difficulty = diffs[i % len(diffs)]
                    asgs.append({
                        "title": f"Practical Lab Task: {theme} Integration ({difficulty})",
                        "description": f"Design and implement a structured project incorporating key lecture takeaways under the {difficulty} constraints.",
                        "deliverables": [f"Conceptual design documentation", f"Working source code outline"],
                        "difficulty": difficulty
                    })

    async def generate_assessment(self, user_id: str, synopsis_id: str) -> dict:
        """
        Retrieves the video synopsis and generates a complete student assessment package.
        Checks for duplicate assessments to utilize MongoDB-backed cache.
        """
        if not ObjectId.is_valid(synopsis_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid synopsis ID format."
            )

        # Check existing assessment cache
        existing_doc = await self.assessments_collection.find_one({"synopsis_id": synopsis_id})
        if existing_doc:
            existing_doc["id"] = str(existing_doc["_id"])
            if "_id" in existing_doc:
                del existing_doc["_id"]
            return existing_doc

        # Fetch synopsis content
        synopsis = await self.synopses_collection.find_one({"_id": ObjectId(synopsis_id)})
        if not synopsis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated video synopsis not found."
            )

        title = synopsis.get("metadata", {}).get("title", "Video Lecture")
        transcript_text = synopsis.get("transcript", "")
        summary_text = synopsis.get("executiveSummary", "")
        detailed_exp = synopsis.get("detailedExplanation", "") or summary_text

        # Combine text for context, limiting length to avoid token boundaries
        context_text = f"Title: {title}\nSummary: {summary_text}\n"
        if transcript_text:
            context_text += f"Transcript Excerpt:\n{transcript_text[:12000]}\n"
        else:
            context_text += f"Detailed Context:\n{detailed_exp[:12000]}\n"

        is_programming = self._detect_programming(title, transcript_text or detailed_exp)
        
        # Determine video size and counts dynamically
        duration_str = synopsis.get("metadata", {}).get("duration", "10:00")
        duration_mins = self._parse_duration_to_minutes(duration_str)
        counts = self._get_question_counts(duration_mins, is_programming)
        size_label = counts["size"]
        
        logger.info(f"Generating dual assessment packages for video '{title}'. Size: {size_label}, Programming: {is_programming}")

        quantity_instructions = (
            f"This is a {size_label.upper()} video/transcript. You MUST generate the following exact quantities for BOTH practicePackage and testPackage:\n"
            f"- For practicePackage:\n"
            f"  * flashcards: exactly {counts['flashcards']} items\n"
            f"  * mcqs: exactly {counts['mcq']} items\n"
            f"  * scenarioQuestions: exactly {counts['scenario']} items\n"
            f"  * caseStudies: exactly {counts['case_study']} items (each with exactly 2 sub-questions in the 'questions' list and 2 'modelAnswers')\n"
            f"  * shortAnswers: exactly {counts['short_answer']} items\n"
            f"  * fillBlanks: exactly {counts['fill_blank']} items (each sentence MUST contain exactly one '___' blank placeholder)\n"
            f"  * trueFalse: exactly {counts['true_false']} items\n"
            f"  * codingQuestions: exactly {counts['coding']} items\n"
            f"  * assignments: exactly {counts['assignments']} items (one task per difficulty: beginner, medium, advanced up to {counts['assignments']} count)\n"
            f"- For testPackage:\n"
            f"  * mcqs: exactly {counts['mcq']} items\n"
            f"  * scenarioQuestions: exactly {counts['scenario']} items\n"
            f"  * caseStudies: exactly {counts['case_study']} items (each with exactly 2 sub-questions in the 'questions' list and 2 'modelAnswers')\n"
            f"  * shortAnswers: exactly {counts['short_answer']} items\n"
            f"  * fillBlanks: exactly {counts['fill_blank']} items (each sentence MUST contain exactly one '___' blank placeholder)\n"
            f"  * trueFalse: exactly {counts['true_false']} items\n"
            f"  * codingQuestions: exactly {counts['coding']} items\n"
        )

        system_prompt = (
            "You are an expert Senior Curriculum Architect and Educational Assessment Designer.\n"
            "Analyze the provided video context and generate a complete, high-quality learning package.\n"
            "You MUST generate two separate packages: 'practicePackage' and 'testPackage'.\n"
            "practicePackage questions and testPackage questions MUST be completely different (no duplicates, different wording, examples, and choices).\n"
            "The generated content MUST match the video topic directly (no generic placeholders).\n\n"
            "Provide your response ONLY in valid JSON matching this exact schema (no markdown formatting, no wrappers):\n"
            "{\n"
            '  "practicePackage": {\n'
            '    "flashcards": [\n'
            '      {"question": "Flashcard front question", "answer": "Flashcard back answer"}\n'
            '    ],\n'
            '    "mcqs": [\n'
            '      {\n'
            '        "question": "Practice MCQ question testing basic concepts",\n'
            '        "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '        "correctAnswer": "Option A",\n'
            '        "explanation": "Why Option A is correct",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "scenarioQuestions": [\n'
            '      {\n'
            '        "scenario": "A real-world situation or problem statement",\n'
            '        "question": "Application question based on this scenario",\n'
            '        "modelAnswer": "Comprehensive model response showing practical execution",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "caseStudies": [\n'
            '      {\n'
            '        "title": "Case Study Title",\n'
            '        "caseText": "A detailed practical case situation",\n'
            '        "questions": ["Specific question 1", "Specific question 2"],\n'
            '        "modelAnswers": ["Ideal answer to question 1", "Ideal answer to question 2"],\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "shortAnswers": [\n'
            '      {\n'
            '        "question": "Conceptual prompt for a short textual explanation",\n'
            '        "modelAnswer": "Model answer of around 80-100 words",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "fillBlanks": [\n'
            '      {\n'
            '        "sentence": "A sentence containing a single blank denoted by three underscores: e.g. A ___ is used for database index.",\n'
            '        "answer": "correct term",\n'
            '        "term": "correct term",\n'
            '        "explanation": "Context explaining the term",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "trueFalse": [\n'
            '      {\n'
            '        "statement": "True or False statement for rapid review",\n'
            '        "correctAnswer": true,\n'
            '        "explanation": "Why this statement is true or false",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "codingQuestions": [\n'
            '      {\n'
            '        "title": "Coding Challenge Title",\n'
            '        "description": "Problem description with input/output requirements",\n'
            '        "starterCode": "Template starter code or function outline",\n'
            '        "solutionCode": "Complete working reference implementation",\n'
            '        "sampleInput": "Example input configuration",\n'
            '        "sampleOutput": "Expected output match",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "assignments": [\n'
            '      {\n'
            '        "title": "Project Task Title",\n'
            '        "description": "Task specifications and project requirements",\n'
            '        "deliverables": ["Deliverable item A", "Deliverable item B"],\n'
            '        "difficulty": "Beginner"\n'
            '      }\n'
            '    ]\n'
            '  },\n'
            '  "testPackage": {\n'
            '    "mcqs": [\n'
            '      {\n'
            '        "question": "Assessment MCQ question",\n'
            '        "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '        "correctAnswer": "Option A",\n'
            '        "explanation": "Why Option A is correct",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "scenarioQuestions": [\n'
            '      {\n'
            '        "scenario": "A different scenario context",\n'
            '        "question": "Assessment scenario question",\n'
            '        "modelAnswer": "Model answer",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "caseStudies": [\n'
            '      {\n'
            '        "title": "Assessment Case Study Title",\n'
            '        "caseText": "Assessment case text",\n'
            '        "questions": ["Specific question 1", "Specific question 2"],\n'
            '        "modelAnswers": ["Model answer 1", "Model answer 2"],\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "shortAnswers": [\n'
            '      {\n'
            '        "question": "Assessment short answer question",\n'
            '        "modelAnswer": "Model answer",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "fillBlanks": [\n'
            '      {\n'
            '        "sentence": "Assessment fill blank sentence with a single ___ blank.",\n'
            '        "answer": "correct term",\n'
            '        "term": "correct term",\n'
            '        "explanation": "Explanation",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "trueFalse": [\n'
            '      {\n'
            '        "statement": "Assessment True/False statement",\n'
            '        "correctAnswer": false,\n'
            '        "explanation": "Explanation",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ],\n'
            '    "codingQuestions": [\n'
            '      {\n'
            '        "title": "Assessment Coding Title",\n'
            '        "description": "Assessment coding description",\n'
            '        "starterCode": "Starter code",\n'
            '        "solutionCode": "Solution code",\n'
            '        "sampleInput": "Input",\n'
            '        "sampleOutput": "Output",\n'
            '        "topic": "Topic Category"\n'
            '      }\n'
            '    ]\n'
            "  }\n"
            "}\n\n"
            "QUANTITY CONSTRAINTS:\n"
            f"{quantity_instructions}\n"
            "Ensure complete JSON structure is returned. Do not wrap in markdown tags like ```json."
        )

        user_prompt = f"Video Title: {title}\nContext:\n{context_text}"
        openai_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        response_text = None

        # 1. Try Groq
        if settings.GROQ_API_KEY:
            try:
                response = self.client.chat.completions.create(
                    model=openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=120
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Groq assessment generation failed: {e}. Trying OpenAI fallback.")

        # 2. Try OpenAI fallback
        if not response_text and settings.OPENAI_API_KEY:
            try:
                openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, max_retries=0)
                response = openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=120
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as oai_err:
                logger.error(f"OpenAI fallback assessment generation failed: {oai_err}")

        # Parse AI response text
        assessment_data = None
        if response_text:
            try:
                if response_text.startswith("```"):
                    lines = response_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    response_text = "\n".join(lines).strip()
                assessment_data = json.loads(response_text)
            except Exception as parse_err:
                logger.error(f"Failed to parse AI assessment JSON: {parse_err}")

        # Ensure correct nested structure exists
        if not assessment_data or not isinstance(assessment_data, dict):
            logger.warning("Using procedural fallback to generate default assessments.")
            assessment_data = {
                "practicePackage": {},
                "testPackage": {}
            }

        practice_package = assessment_data.setdefault("practicePackage", {})
        test_package = assessment_data.setdefault("testPackage", {})
        
        # Enforce validation and pad if necessary
        self._pad_or_fallback_questions(practice_package, counts, synopsis, is_test=False)
        self._pad_or_fallback_questions(test_package, counts, synopsis, is_test=True)

        # Map response to model structure
        practice_flashcards_list = [FlashcardModel(**f) for f in practice_package.get("flashcards", [])]
        practice_mcqs_list = [MCQModel(**m) for m in practice_package.get("mcqs", [])]
        practice_scenario_list = [ScenarioQuestionModel(**s) for s in practice_package.get("scenarioQuestions", [])]
        practice_case_studies_list = [CaseStudyModel(**c) for c in practice_package.get("caseStudies", [])]
        practice_short_answers_list = [ShortAnswerQuestionModel(**s) for s in practice_package.get("shortAnswers", [])]
        practice_fill_blanks_list = [FillBlankModel(**f) for f in practice_package.get("fillBlanks", [])]
        practice_true_false_list = [TrueFalseModel(**t) for t in practice_package.get("trueFalse", [])]
        practice_coding_list = [CodingQuestionModel(**c) for c in practice_package.get("codingQuestions", [])]
        practice_assignments_list = [AssignmentTaskModel(**a) for a in practice_package.get("assignments", [])]

        test_mcqs_list = [MCQModel(**m) for m in test_package.get("mcqs", [])]
        test_scenario_list = [ScenarioQuestionModel(**s) for s in test_package.get("scenarioQuestions", [])]
        test_case_studies_list = [CaseStudyModel(**c) for c in test_package.get("caseStudies", [])]
        test_short_answers_list = [ShortAnswerQuestionModel(**s) for s in test_package.get("shortAnswers", [])]
        test_fill_blanks_list = [FillBlankModel(**f) for f in test_package.get("fillBlanks", [])]
        test_true_false_list = [TrueFalseModel(**t) for t in test_package.get("trueFalse", [])]
        test_coding_list = [CodingQuestionModel(**c) for c in test_package.get("codingQuestions", [])]

        assessment_db = AssessmentDBModel(
            synopsisId=synopsis_id,
            userId=user_id,
            
            # Old fields for compatibility
            flashcards=practice_flashcards_list,
            mcqs=practice_mcqs_list,
            scenarioQuestions=practice_scenario_list,
            caseStudies=practice_case_studies_list,
            shortAnswers=practice_short_answers_list,
            fillBlanks=practice_fill_blanks_list,
            trueFalse=practice_true_false_list,
            codingQuestions=practice_coding_list,
            assignments=practice_assignments_list,

            # New nested fields
            practicePackage=AssessmentPackageModel(
                flashcards=practice_flashcards_list,
                mcqs=practice_mcqs_list,
                scenarioQuestions=practice_scenario_list,
                caseStudies=practice_case_studies_list,
                shortAnswers=practice_short_answers_list,
                fillBlanks=practice_fill_blanks_list,
                trueFalse=practice_true_false_list,
                codingQuestions=practice_coding_list,
                assignments=practice_assignments_list
            ),
            testPackage=TestPackageModel(
                mcqs=test_mcqs_list,
                scenarioQuestions=test_scenario_list,
                caseStudies=test_case_studies_list,
                shortAnswers=test_short_answers_list,
                fillBlanks=test_fill_blanks_list,
                trueFalse=test_true_false_list,
                codingQuestions=test_coding_list
            )
        )

        assessment_dict = assessment_db.model_dump(by_alias=True, exclude={"id"})
        result = await self.assessments_collection.insert_one(assessment_dict)
        
        assessment_dict["id"] = str(result.inserted_id)
        if "_id" in assessment_dict:
            del assessment_dict["_id"]
        return assessment_dict

    def _generate_procedural_fallback_assessment(self, synopsis: dict, is_programming: bool) -> dict:
        """Generates raw structural template templates for study assessment material on failure."""
        title = synopsis.get("metadata", {}).get("title", "Video Lecture")
        theme = synopsis.get("theme", "General")
        
        return {
            "flashcards": [
                {"question": f"What is the primary topic of '{title}'?", "answer": f"It covers key concepts in {theme}."}
            ],
            "mcqs": [
                {
                    "question": f"Who created the video course '{title}'?",
                    "options": [
                        synopsis.get("metadata", {}).get("channelName", "Unknown Channel"),
                        "FreeCodeCamp", "Khan Academy", "CrashCourse"
                    ],
                    "correctAnswer": synopsis.get("metadata", {}).get("channelName", "Unknown Channel"),
                    "explanation": "Verified in the channel publisher tag.",
                    "topic": "General"
                }
            ],
            "scenarioQuestions": [
                {
                    "scenario": "A development team wants to deploy a modular framework.",
                    "question": "How do core principles apply here?",
                    "modelAnswer": "They should decouple dependencies, sandbox testing APIs, and log telemetry data.",
                    "topic": "Application"
                }
            ],
            "caseStudies": [
                {
                    "title": "System Migrations Case",
                    "caseText": f"A legacy system needs restructuring to support themes of {theme}.",
                    "questions": ["Outline the target metrics.", "List immediate action items."],
                    "modelAnswers": ["Target metrics include scalability and reduction of tech debt.", "Audit dependencies, create test routes."],
                    "topic": "Case Analysis"
                }
            ],
            "shortAnswers": [
                {
                    "question": f"Explain the core message of '{title}' in your own words.",
                    "modelAnswer": "It highlights key theoretical frameworks and guides implementations.",
                    "topic": "General"
                }
            ],
            "fillBlanks": [
                {
                    "sentence": f"The video analyzed is titled '___'.",
                    "answer": title,
                    "term": title,
                    "explanation": "Found in metadata title.",
                    "topic": "General"
                }
            ],
            "trueFalse": [
                {
                    "statement": f"This video covers '{title}'.",
                    "correctAnswer": True,
                    "explanation": "Confirmed in metadata.",
                    "topic": "General"
                }
            ],
            "codingQuestions": [
                {
                    "title": "Reverse Array",
                    "description": "Write a function that takes an array/list and returns it reversed.",
                    "starterCode": "def reverse_array(arr):\n    # Write code here\n    pass",
                    "solutionCode": "def reverse_array(arr):\n    return arr[::-1]",
                    "sampleInput": "[1, 2, 3]",
                    "sampleOutput": "[3, 2, 1]",
                    "topic": "Programming"
                }
            ] if is_programming else [],
            "assignments": [
                {
                    "title": "Write a Review Paper",
                    "description": "Write a summary of the concepts presented in the video.",
                    "deliverables": ["300-word review document"],
                    "difficulty": "Beginner"
                },
                {
                    "title": "Develop Prototype Layout",
                    "description": "Build a design pattern based on the lecture takeaways.",
                    "deliverables": ["Design map", "Code schemas"],
                    "difficulty": "Medium"
                },
                {
                    "title": "Deploy Production Sandbox",
                    "description": "Orchestrate a fully decoupled local deploy.",
                    "deliverables": ["Config manifests", "Running logs"],
                    "difficulty": "Advanced"
                }
            ]
        }

    async def get_latest_performance(self, user_id: str, synopsis_id: str) -> Optional[dict]:
        """
        Retrieves the latest AssessmentAttempt document for the user/synopsis.
        """
        doc = await self.attempts_collection.find_one(
            {"synopsisId": synopsis_id, "userId": user_id},
            sort=[("createdAt", -1)]
        )
        if doc:
            doc["id"] = str(doc["_id"])
            if "_id" in doc:
                del doc["_id"]
            return doc
        return None

    async def get_attempts(self, user_id: str, synopsis_id: str) -> list:
        """
        Retrieves all attempts for the synopsis and user, sorted by date descending.
        """
        cursor = self.attempts_collection.find(
            {"synopsisId": synopsis_id, "userId": user_id}
        ).sort("createdAt", -1)
        
        history = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            if "_id" in doc:
                del doc["_id"]
            history.append(doc)
        return history

    async def submit_section(self, user_id: str, assessment_id: str, section: str, answers: dict, time_taken: int) -> dict:
        """
        Evaluates a single section attempt (MCQ, short answer, etc.), merges the results
        into the active AssessmentAttempt document, updates study plans, and generates practice questions.
        """
        if not ObjectId.is_valid(assessment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid assessment ID format."
            )

        assessment = await self.assessments_collection.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment document not found."
            )

        synopsis_id = assessment.get("synopsisId") or assessment.get("synopsis_id")
        synopsis = await self.synopses_collection.find_one({"_id": ObjectId(synopsis_id)})
        video_title = synopsis.get("metadata", {}).get("title", "Video") if synopsis else "Video"

        # Load or initialize the active attempt for this session
        attempt = await self.attempts_collection.find_one(
            {"assessmentId": assessment_id, "userId": user_id}
        )
        
        if not attempt:
            attempt_dict = {
                "assessmentId": assessment_id,
                "synopsisId": synopsis_id,
                "userId": user_id,
                "mcqAnswers": {},
                "scenarioAnswers": {},
                "caseStudyAnswers": {},
                "shortAnswers": {},
                "fillBlankAnswers": {},
                "trueFalseAnswers": {},
                "codingAnswers": {},
                "assignmentAnswers": {},
                "testMcqAnswers": {},
                "testScenarioAnswers": {},
                "testCaseStudyAnswers": {},
                "testShortAnswers": {},
                "testFillBlankAnswers": {},
                "testTrueFalseAnswers": {},
                "testCodingAnswers": {},
                "sections": {},
                "overallScore": 0.0,
                "maxScore": 0.0,
                "accuracy": 0.0,
                "timeTaken": 0,
                "weakTopics": [],
                "strongTopics": [],
                "feedback": "First section submitted.",
                "recommendedRevisionSections": [],
                "studyPlan": "",
                "extraPracticeQuestions": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        else:
            attempt_dict = dict(attempt)

        # 1. Update student responses
        field_mapping = {
            "mcq": "mcqAnswers",
            "scenario": "scenarioAnswers",
            "case_study": "caseStudyAnswers",
            "short_answer": "shortAnswers",
            "fill_blank": "fillBlankAnswers",
            "true_false": "trueFalseAnswers",
            "coding": "codingAnswers",
            "assignment": "assignmentAnswers",
            
            "test_mcq": "testMcqAnswers",
            "test_scenario": "testScenarioAnswers",
            "test_case_study": "testCaseStudyAnswers",
            "test_short_answer": "testShortAnswers",
            "test_fill_blank": "testFillBlankAnswers",
            "test_true_false": "testTrueFalseAnswers",
            "test_coding": "testCodingAnswers"
        }
        ans_key = field_mapping.get(section, f"{section}Answers")
        if ans_key in attempt_dict:
            attempt_dict[ans_key].update(answers)
        else:
            attempt_dict[ans_key] = answers

        # Cumulative time taken
        attempt_dict["timeTaken"] = attempt_dict.get("timeTaken", 0) + time_taken

        # Determine package source
        is_test = section.startswith("test_")
        if is_test:
            package_data = assessment.get("testPackage") or assessment.get("test_package") or assessment
            target_key = section.replace("test_", "")
        else:
            package_data = assessment.get("practicePackage") or assessment.get("practice_package") or assessment
            target_key = section

        # 2. Grade Section
        graded_questions = []
        sec_score = 0.0
        sec_max_score = 0.0

        if target_key == "mcq":
            mcqs = package_data.get("mcqs", [])
            sec_max_score = float(len(mcqs))
            for idx, item in enumerate(mcqs):
                correct = item.get("correctAnswer") or item.get("correct_answer")
                student_ans = answers.get(str(idx)) or answers.get(idx) or ""
                is_correct = (student_ans == correct)
                score = 1.0 if is_correct else 0.0
                sec_score += score
                graded_questions.append({
                    "question": item.get("question"),
                    "studentAnswer": student_ans,
                    "correctAnswer": correct,
                    "isCorrect": is_correct,
                    "score": score,
                    "maxScore": 1.0,
                    "feedback": item.get("explanation", "No explanation."),
                    "topic": item.get("topic", "General MCQ")
                })

        elif target_key == "true_false":
            tfs = package_data.get("trueFalse") or package_data.get("true_false") or []
            sec_max_score = float(len(tfs))
            for idx, item in enumerate(tfs):
                correct = item.get("correctAnswer") or item.get("correct_answer")
                student_ans = answers.get(str(idx)) or answers.get(idx)
                # Map inputs to standard booleans
                if isinstance(student_ans, str):
                    student_ans = student_ans.lower() == "true"
                is_correct = (student_ans == correct)
                score = 1.0 if is_correct else 0.0
                sec_score += score
                graded_questions.append({
                    "question": item.get("statement"),
                    "studentAnswer": str(student_ans),
                    "correctAnswer": str(correct),
                    "isCorrect": is_correct,
                    "score": score,
                    "maxScore": 1.0,
                    "feedback": item.get("explanation", "No explanation."),
                    "topic": item.get("topic", "General T/F")
                })

        elif target_key == "fill_blank":
            fbs = package_data.get("fillBlanks") or package_data.get("fill_blanks") or []
            sec_max_score = float(len(fbs))
            for idx, item in enumerate(fbs):
                correct = item.get("answer") or item.get("term") or ""
                student_ans = answers.get(str(idx)) or answers.get(idx) or ""
                
                # Case-insensitive trimming match
                is_correct = (student_ans.strip().lower() == correct.strip().lower())
                score = 1.0 if is_correct else 0.0
                sec_score += score
                graded_questions.append({
                    "question": item.get("sentence"),
                    "studentAnswer": student_ans,
                    "correctAnswer": correct,
                    "isCorrect": is_correct,
                    "score": score,
                    "maxScore": 1.0,
                    "feedback": item.get("explanation", "No explanation."),
                    "topic": item.get("topic", "General Fill In The Blanks")
                })

        else:
            # Short Answer, Scenario, Case Study, Coding, and Assignments are graded by AI
            logger.info(f"Triggering AI Evaluation for text section: '{target_key}'")
            ai_grades = await self._evaluate_text_section_with_ai(target_key, package_data, answers, video_title)
            
            sec_score = ai_grades.get("score", 0.0)
            sec_max_score = ai_grades.get("maxScore", 0.0)
            graded_questions = ai_grades.get("gradedQuestions", [])

        # Write section object
        attempt_dict["sections"][section] = {
            "score": sec_score,
            "maxScore": sec_max_score,
            "gradedQuestions": graded_questions,
            "submittedAt": datetime.utcnow()
        }

        # 3. Recalculate Aggregated Scores (ONLY for test/assessment package attempts)
        overall_score = 0.0
        max_score = 0.0
        test_sections = ["test_mcq", "test_scenario", "test_case_study", "test_short_answer", "test_fill_blank", "test_true_false", "test_coding"]
        for s_key, s_val in attempt_dict["sections"].items():
            if s_key in test_sections:
                overall_score += s_val.get("score", 0.0)
                max_score += s_val.get("maxScore", 0.0)

        attempt_dict["overallScore"] = overall_score
        attempt_dict["maxScore"] = max_score
        attempt_dict["accuracy"] = round((overall_score / max_score * 100) if max_score > 0 else 0.0, 1)

        # 4. Trigger AI Study Plan and Topic Analysis based on cumulative performance
        # Fetch chapters and key concepts for reference sections
        chapters_info = [c.get("title", "") for c in synopsis.get("chapters", [])]
        concepts_info = [c.get("concept", "") or c.get("name", "") for c in synopsis.get("majorConcepts", []) + synopsis.get("keyConcepts", [])]

        logger.info("Generating learning performance metrics and revised study plan...")
        analytics = await self._generate_study_analytics_with_ai(attempt_dict, chapters_info, concepts_info, video_title)

        attempt_dict["weakTopics"] = analytics.get("weakTopics", [])
        attempt_dict["strongTopics"] = analytics.get("strongTopics", [])
        attempt_dict["feedback"] = analytics.get("overallFeedback", "Keep studying!")
        attempt_dict["recommendedRevisionSections"] = analytics.get("recommendedRevisionSections", [])
        attempt_dict["studyPlan"] = analytics.get("studyPlan", "")
        attempt_dict["extraPracticeQuestions"] = analytics.get("extraPracticeQuestions", [])
        attempt_dict["updatedAt"] = datetime.utcnow()

        # Update in database
        if "_id" in attempt_dict:
            await self.attempts_collection.replace_one({"_id": attempt_dict["_id"]}, attempt_dict)
            attempt_dict["id"] = str(attempt_dict["_id"])
            del attempt_dict["_id"]
        else:
            result = await self.attempts_collection.insert_one(attempt_dict)
            attempt_dict["id"] = str(result.inserted_id)

        return attempt_dict

    async def _evaluate_text_section_with_ai(self, section: str, assessment: dict, student_answers: dict, video_title: str) -> dict:
        """Calls the AI to evaluate answers for text or code questions."""
        questions_context = []

        if section == "short_answer":
            items = assessment.get("short_answers") or assessment.get("shortAnswers") or []
            max_per_q = 5.0
            for idx, item in enumerate(items):
                ref_answer = item.get("modelAnswer") or item.get("model_answer")
                student_ans = student_answers.get(str(idx)) or student_answers.get(idx) or ""
                questions_context.append({
                    "question": item.get("question"),
                    "modelAnswer": ref_answer,
                    "studentAnswer": student_ans,
                    "maxScore": max_per_q,
                    "topic": item.get("topic", "Short Answer")
                })

        elif section == "scenario":
            items = assessment.get("scenario_questions") or assessment.get("scenarioQuestions") or []
            max_per_q = 5.0
            for idx, item in enumerate(items):
                ref_answer = item.get("modelAnswer") or item.get("model_answer")
                student_ans = student_answers.get(str(idx)) or student_answers.get(idx) or ""
                questions_context.append({
                    "question": f"Scenario: {item.get('scenario')} - Question: {item.get('question')}",
                    "modelAnswer": ref_answer,
                    "studentAnswer": student_ans,
                    "maxScore": max_per_q,
                    "topic": item.get("topic", "Scenario")
                })

        elif section == "case_study":
            items = assessment.get("case_studies") or assessment.get("caseStudies") or []
            max_per_q = 10.0
            for idx, item in enumerate(items):
                ref_answers = item.get("modelAnswers") or item.get("model_answers") or []
                sub_questions = item.get("questions", [])
                
                # Combine case answers into one string block per case study
                case_ans_block = []
                for sub_idx, sub_q in enumerate(sub_questions):
                    ans_list = student_answers.get(str(idx)) or student_answers.get(idx) or []
                    student_ans = ans_list[sub_idx] if sub_idx < len(ans_list) else ""
                    case_ans_block.append(f"Sub-Q: {sub_q}\nReference: {ref_answers[sub_idx] if sub_idx < len(ref_answers) else ''}\nStudent: {student_ans}")
                
                questions_context.append({
                    "question": f"Case Title: {item.get('title')}\nCase Text: {item.get('caseText')}",
                    "modelAnswer": "\n".join(case_ans_block),
                    "studentAnswer": "Graded via individual parts above",
                    "maxScore": max_per_q,
                    "topic": item.get("topic", "Case Study")
                })

        elif section == "coding":
            items = assessment.get("coding_questions") or assessment.get("codingQuestions") or []
            max_per_q = 10.0
            for idx, item in enumerate(items):
                ref_answer = item.get("solutionCode") or item.get("solution_code")
                student_ans = student_answers.get(str(idx)) or student_answers.get(idx) or ""
                questions_context.append({
                    "question": f"Challenge: {item.get('title')}\nDesc: {item.get('description')}",
                    "modelAnswer": ref_answer,
                    "studentAnswer": student_ans,
                    "maxScore": max_per_q,
                    "topic": item.get("topic", "Coding")
                })

        elif section == "assignment":
            items = assessment.get("assignments") or []
            max_per_q = 10.0
            for idx, item in enumerate(items):
                ref_answer = f"Deliverables: {', '.join(item.get('deliverables', []))}"
                student_ans = student_answers.get(str(idx)) or student_answers.get(idx) or ""
                questions_context.append({
                    "question": f"Assignment: {item.get('title')}\nDesc: {item.get('description')}",
                    "modelAnswer": ref_answer,
                    "studentAnswer": student_ans,
                    "maxScore": max_per_q,
                    "topic": "Assignment"
                })

        if not questions_context:
            return {"score": 0.0, "maxScore": 0.0, "gradedQuestions": []}

        system_prompt = (
            "You are an expert AI Academic Coach and Evaluator.\n"
            f"Review the student's textual submissions for the section '{section}' based on the video context '{video_title}'.\n"
            "Assess their conceptual alignment, technical completeness, and correctness against the model answers.\n"
            "Award a score out of the specified maxScore. Provide highly constructive feedback for each question.\n\n"
            "Return ONLY a valid JSON matching this exact structure (no markdown wrappers, no explanations):\n"
            "{\n"
            '  "graded": [\n'
            '    {\n'
            '      "score": number,\n'
            '      "feedback": "Detailed constructive evaluation notes (around 50 words)."\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        user_prompt = f"Submissions:\n{json.dumps(questions_context)}"
        openai_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        response_text = None

        if settings.GROQ_API_KEY:
            try:
                response = self.client.chat.completions.create(
                    model=openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=60
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Groq text grading failed: {e}. Trying OpenAI fallback.")

        if not response_text and settings.OPENAI_API_KEY:
            try:
                openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, max_retries=0)
                response = openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=60
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as oai_err:
                logger.error(f"OpenAI text grading failed: {oai_err}")

        # Parse AI results
        ai_grades = []
        if response_text:
            try:
                if response_text.startswith("```"):
                    lines = response_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    response_text = "\n".join(lines).strip()
                ai_grades = json.loads(response_text).get("graded", [])
            except Exception as parse_err:
                logger.error(f"Failed to parse text grading JSON: {parse_err}")

        # Process graded array
        total_score = 0.0
        total_max = 0.0
        graded_questions = []

        for idx, qc in enumerate(questions_context):
            ai_g = ai_grades[idx] if idx < len(ai_grades) else {}
            score = float(ai_g.get("score", qc["maxScore"] * 0.7))  # Fallback to 70% average score
            feedback = ai_g.get("feedback", "Good effort. AI grading failed back to default evaluation.")
            
            total_score += score
            total_max += qc["maxScore"]
            
            graded_questions.append({
                "question": qc["question"],
                "studentAnswer": qc["studentAnswer"],
                "modelAnswer": qc["modelAnswer"],
                "score": score,
                "maxScore": qc["maxScore"],
                "feedback": feedback,
                "topic": qc["topic"]
            })

        return {
            "score": total_score,
            "maxScore": total_max,
            "gradedQuestions": graded_questions
        }

    async def _generate_study_analytics_with_ai(self, attempt_dict: dict, chapters: list, concepts: list, video_title: str) -> dict:
        """Calls the AI to generate personalized feedback, weak topics analysis, and customized study plans."""
        # Compile a simplified list of graded inputs to keep prompt size small
        graded_summary = []
        for s_key, s_val in attempt_dict.get("sections", {}).items():
            for gq in s_val.get("gradedQuestions", []):
                graded_summary.append({
                    "section": s_key,
                    "question": gq.get("question")[:100],  # truncate to keep tokens down
                    "score": gq.get("score"),
                    "maxScore": gq.get("maxScore"),
                    "topic": gq.get("topic")
                })

        system_prompt = (
            "You are an expert AI Student Performance Analyst and Study Coach.\n"
            "Review the student's cumulative assessment scores and topics.\n"
            "Identify strong topics (high scores) and weak topics (scores less than 70% or wrong answers).\n"
            "Create a personalized study plan targeting weak areas, recommending specific revision sections from the chapters and concepts.\n"
            "Generate 3 extra practice questions specifically targeting their weak topics.\n\n"
            "Provide your response ONLY in valid JSON matching this exact schema (no markdown blocks, no formatting wrappers):\n"
            "{\n"
            '  "strongTopics": ["Topic Name A"],\n'
            '  "weakTopics": ["Topic Name B"],\n'
            '  "recommendedRevisionSections": ["Title of chapter or concept card to revise"],\n'
            '  "overallFeedback": "Overall performance summary and encouragement (around 80 words).",\n'
            '  "studyPlan": "Detailed study guide path. Example: You scored low in Normalization. Revise DBMS notes, review examples, and attempt practice questions.",\n'
            '  "extraPracticeQuestions": [\n'
            '    {"question": "New practice question prompt", "topic": "Name of weak topic", "type": "short_answer"}\n'
            '  ]\n'
            "}"
        )

        user_prompt = (
            f"Video Title: {video_title}\n"
            f"Cumulative Accuracy: {attempt_dict.get('accuracy')}% ({attempt_dict.get('overallScore')} / {attempt_dict.get('maxScore')} points)\n"
            f"Chapters Available: {json.dumps(chapters)}\n"
            f"Concepts Available: {json.dumps(concepts)}\n"
            f"Student Graded Breakdown:\n{json.dumps(graded_summary)}"
        )

        openai_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        response_text = None

        if settings.GROQ_API_KEY:
            try:
                response = self.client.chat.completions.create(
                    model=openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=45
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Groq analytics generation failed: {e}. Trying OpenAI fallback.")

        if not response_text and settings.OPENAI_API_KEY:
            try:
                openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, max_retries=0)
                response = openai_client.chat.completions.create(
                    model=settings.OPENAI_MODEL or "gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=45
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as oai_err:
                logger.error(f"OpenAI analytics generation failed: {oai_err}")

        # Parse response
        if response_text:
            try:
                if response_text.startswith("```"):
                    lines = response_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    response_text = "\n".join(lines).strip()
                return json.loads(response_text)
            except Exception as parse_err:
                logger.error(f"Failed to parse study analytics JSON: {parse_err}")

        # Rule-based fallback
        strongs = []
        weaks = []
        for s_key, s_val in attempt_dict.get("sections", {}).items():
            for gq in s_val.get("gradedQuestions", []):
                topic = gq.get("topic", "General")
                if gq.get("score", 0) / gq.get("maxScore", 1) >= 0.7:
                    if topic not in strongs: strongs.append(topic)
                else:
                    if topic not in weaks: weaks.append(topic)

        # Filter out from strongs if present in weaks
        strongs = [s for s in strongs if s not in weaks]

        return {
            "strongTopics": strongs or ["Foundational Core"],
            "weakTopics": weaks or ["Advanced Scenarios"],
            "recommendedRevisionSections": [chapters[0]] if chapters else ["Introduction"],
            "overallFeedback": f"You have achieved {attempt_dict.get('accuracy')}% accuracy. Review your incorrect answers to strengthen understanding.",
            "studyPlan": f"Review sections from notes and attempt the practice quiz again.",
            "extraPracticeQuestions": [
                {"question": "Explain a core concept in your own words.", "topic": "General Revision", "type": "short_answer"}
            ]
        }

    async def submit_full_exam(self, user_id: str, assessment_id: str, payload) -> dict:
        """
        Submits and grades all exam sections at once, generates AI grading for descriptive text sections,
        runs cumulative analytics, and saves the attempt.
        """
        if not ObjectId.is_valid(assessment_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid assessment ID format."
            )

        assessment = await self.assessments_collection.find_one({"_id": ObjectId(assessment_id)})
        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assessment document not found."
            )

        synopsis_id = assessment.get("synopsisId") or assessment.get("synopsis_id")
        synopsis = await self.synopses_collection.find_one({"_id": ObjectId(synopsis_id)})
        video_title = synopsis.get("metadata", {}).get("title", "Video") if synopsis else "Video"

        # Load or initialize the active attempt for this session
        attempt = await self.attempts_collection.find_one(
            {"assessmentId": assessment_id, "userId": user_id}
        )

        if not attempt:
            attempt_dict = {
                "assessmentId": assessment_id,
                "synopsisId": synopsis_id,
                "userId": user_id,
                "mcqAnswers": {},
                "scenarioAnswers": {},
                "caseStudyAnswers": {},
                "shortAnswers": {},
                "fillBlankAnswers": {},
                "trueFalseAnswers": {},
                "codingAnswers": {},
                "assignmentAnswers": {},
                "testMcqAnswers": {},
                "testScenarioAnswers": {},
                "testCaseStudyAnswers": {},
                "testShortAnswers": {},
                "testFillBlankAnswers": {},
                "testTrueFalseAnswers": {},
                "testCodingAnswers": {},
                "sections": {},
                "overallScore": 0.0,
                "maxScore": 0.0,
                "accuracy": 0.0,
                "timeTaken": 0,
                "warningCount": 0,
                "weakTopics": [],
                "strongTopics": [],
                "feedback": "Exam submitted.",
                "recommendedRevisionSections": [],
                "studyPlan": "",
                "extraPracticeQuestions": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        else:
            attempt_dict = dict(attempt)

        # Update test answers in the attempt document
        attempt_dict["testMcqAnswers"] = payload.mcq_answers
        attempt_dict["testFillBlankAnswers"] = payload.fill_blank_answers
        attempt_dict["testTrueFalseAnswers"] = payload.true_false_answers
        attempt_dict["testScenarioAnswers"] = payload.scenario_answers
        attempt_dict["testCaseStudyAnswers"] = payload.case_study_answers
        attempt_dict["testShortAnswers"] = payload.short_answers
        attempt_dict["testCodingAnswers"] = payload.coding_answers
        attempt_dict["timeTaken"] = (attempt_dict.get("timeTaken", 0) or 0) + payload.time_taken
        attempt_dict["warningCount"] = payload.warning_count

        test_package = assessment.get("testPackage") or assessment.get("test_package") or assessment

        # 1. Grade MCQ Section
        mcqs = test_package.get("mcqs", [])
        mcq_graded = []
        mcq_score = 0.0
        for idx, item in enumerate(mcqs):
            correct = item.get("correctAnswer") or item.get("correct_answer")
            student_ans = payload.mcq_answers.get(str(idx)) or payload.mcq_answers.get(idx) or ""
            is_correct = (student_ans == correct)
            score = 1.0 if is_correct else 0.0
            mcq_score += score
            mcq_graded.append({
                "question": item.get("question"),
                "studentAnswer": student_ans,
                "correctAnswer": correct,
                "isCorrect": is_correct,
                "score": score,
                "maxScore": 1.0,
                "feedback": item.get("explanation", "No explanation."),
                "topic": item.get("topic", "General MCQ")
            })
        attempt_dict["sections"]["test_mcq"] = {
            "score": mcq_score,
            "maxScore": float(len(mcqs)) if mcqs else 0.0,
            "gradedQuestions": mcq_graded,
            "submittedAt": datetime.utcnow()
        }

        # 2. Grade True/False Section
        tfs = test_package.get("trueFalse") or test_package.get("true_false") or []
        tf_graded = []
        tf_score = 0.0
        for idx, item in enumerate(tfs):
            correct = item.get("correctAnswer") or item.get("correct_answer")
            student_ans = payload.true_false_answers.get(str(idx)) or payload.true_false_answers.get(idx)
            if isinstance(student_ans, str):
                student_ans = student_ans.lower() == "true"
            is_correct = (student_ans == correct)
            score = 1.0 if is_correct else 0.0
            tf_score += score
            tf_graded.append({
                "question": item.get("statement"),
                "studentAnswer": str(student_ans),
                "correctAnswer": str(correct),
                "isCorrect": is_correct,
                "score": score,
                "maxScore": 1.0,
                "feedback": item.get("explanation", "No explanation."),
                "topic": item.get("topic", "General T/F")
            })
        attempt_dict["sections"]["test_true_false"] = {
            "score": tf_score,
            "maxScore": float(len(tfs)) if tfs else 0.0,
            "gradedQuestions": tf_graded,
            "submittedAt": datetime.utcnow()
        }

        # 3. Grade Fill Blank Section
        fbs = test_package.get("fillBlanks") or test_package.get("fill_blanks") or []
        fb_graded = []
        fb_score = 0.0
        for idx, item in enumerate(fbs):
            correct = item.get("answer") or item.get("term") or ""
            student_ans = payload.fill_blank_answers.get(str(idx)) or payload.fill_blank_answers.get(idx) or ""
            is_correct = (student_ans.strip().lower() == correct.strip().lower())
            score = 1.0 if is_correct else 0.0
            fb_score += score
            fb_graded.append({
                "question": item.get("sentence"),
                "studentAnswer": student_ans,
                "correctAnswer": correct,
                "isCorrect": is_correct,
                "score": score,
                "maxScore": 1.0,
                "feedback": item.get("explanation", "No explanation."),
                "topic": item.get("topic", "General Fill In The Blanks")
            })
        attempt_dict["sections"]["test_fill_blank"] = {
            "score": fb_score,
            "maxScore": float(len(fbs)) if fbs else 0.0,
            "gradedQuestions": fb_graded,
            "submittedAt": datetime.utcnow()
        }

        # 4. Grade AI-graded Sections in parallel
        descriptive_sections = []
        grading_tasks = []

        scenarios = test_package.get("scenarioQuestions") or test_package.get("scenario_questions") or []
        if scenarios:
            descriptive_sections.append("test_scenario")
            grading_tasks.append(self._evaluate_text_section_with_ai("scenario", test_package, payload.scenario_answers, video_title))

        cases = test_package.get("caseStudies") or test_package.get("case_studies") or []
        if cases:
            descriptive_sections.append("test_case_study")
            grading_tasks.append(self._evaluate_text_section_with_ai("case_study", test_package, payload.case_study_answers, video_title))

        short_ans = test_package.get("shortAnswers") or test_package.get("short_answers") or []
        if short_ans:
            descriptive_sections.append("test_short_answer")
            grading_tasks.append(self._evaluate_text_section_with_ai("short_answer", test_package, payload.short_answers, video_title))

        coding_qs = test_package.get("codingQuestions") or test_package.get("coding_questions") or []
        if coding_qs:
            descriptive_sections.append("test_coding")
            grading_tasks.append(self._evaluate_text_section_with_ai("coding", test_package, payload.coding_answers, video_title))

        if grading_tasks:
            import asyncio
            ai_results = await asyncio.gather(*grading_tasks)
            for section_name, result in zip(descriptive_sections, ai_results):
                attempt_dict["sections"][section_name] = {
                    "score": result.get("score", 0.0),
                    "maxScore": result.get("maxScore", 0.0),
                    "gradedQuestions": result.get("gradedQuestions", []),
                    "submittedAt": datetime.utcnow()
                }

        # Recalculate scores across test package sections
        overall_score = 0.0
        max_score = 0.0
        test_sections = ["test_mcq", "test_scenario", "test_case_study", "test_short_answer", "test_fill_blank", "test_true_false", "test_coding"]
        for s_key, s_val in attempt_dict["sections"].items():
            if s_key in test_sections:
                overall_score += s_val.get("score", 0.0)
                max_score += s_val.get("maxScore", 0.0)

        attempt_dict["overallScore"] = overall_score
        attempt_dict["maxScore"] = max_score
        attempt_dict["accuracy"] = round((overall_score / max_score * 100) if max_score > 0 else 0.0, 1)

        # Trigger AI study plan generation exactly once
        chapters_info = [c.get("title", "") for c in synopsis.get("chapters", [])] if synopsis else []
        concepts_info = [c.get("concept", "") or c.get("name", "") for c in (synopsis.get("majorConcepts", []) + synopsis.get("keyConcepts", []))] if synopsis else []

        logger.info("Generating learning performance metrics and revised study plan...")
        analytics = await self._generate_study_analytics_with_ai(attempt_dict, chapters_info, concepts_info, video_title)

        attempt_dict["weakTopics"] = analytics.get("weakTopics", [])
        attempt_dict["strongTopics"] = analytics.get("strongTopics", [])
        attempt_dict["feedback"] = analytics.get("overallFeedback", "Exam attempt completed.")
        attempt_dict["recommendedRevisionSections"] = analytics.get("recommendedRevisionSections", [])
        attempt_dict["studyPlan"] = analytics.get("studyPlan", "")
        attempt_dict["extraPracticeQuestions"] = analytics.get("extraPracticeQuestions", [])
        attempt_dict["updatedAt"] = datetime.utcnow()

        # Update in database
        if "_id" in attempt_dict:
            await self.attempts_collection.replace_one({"_id": attempt_dict["_id"]}, attempt_dict)
            attempt_dict["id"] = str(attempt_dict["_id"])
            del attempt_dict["_id"]
        else:
            result = await self.attempts_collection.insert_one(attempt_dict)
            attempt_dict["id"] = str(result.inserted_id)

        return attempt_dict

