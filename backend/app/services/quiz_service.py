import logging
import json
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import settings
from app.models.quiz import QuizDBModel, QuizAttemptDBModel, QuestionModel, AnalyticsModel
from app.schemas.quiz import QuizPublicSchema, QuizAttemptResponseSchema

logger = logging.getLogger(__name__)

def duration_str_to_minutes(duration_str: str) -> float:
    try:
        parts = list(map(int, duration_str.split(':')))
        if len(parts) == 3:
            return parts[0] * 60 + parts[1] + parts[2] / 60
        elif len(parts) == 2:
            return parts[0] + parts[1] / 60
        elif len(parts) == 1:
            return parts[0] / 60
    except Exception:
        pass
    return 10.0 # Default fallback

def get_question_bounds(minutes: float) -> tuple[int, int, int]:
    # Returns (target_questions, min_questions, max_questions)
    if minutes <= 5.0:
        return 8, 5, 10
    elif minutes <= 20.0:
        return 15, 10, 20
    elif minutes <= 60.0:
        return 30, 20, 40
    else:
        return 45, 20, 50

class QuizService:
    def __init__(self, db):
        self.db = db
        self.quizzes_collection = db["quizzes"]
        self.attempts_collection = db["quiz_attempts"]
        self.synopsis_collection = db[settings.SYNOPSIS_COLLECTION]
        self.client = OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1", max_retries=0)

    def validate_quiz_data(self, quiz_data: dict, transcript_text: str, title: str) -> list:
        import re
        raw_questions = quiz_data.get("questions", [])
        validated = []
        seen_questions = set()
        
        transcript_lower = transcript_text.lower()
        title_lower = title.lower()
        
        for q in raw_questions:
            q_text = q.get("question", "").strip()
            if not q_text:
                continue
                
            options = q.get("options", [])
            if not isinstance(options, list) or len(options) != 4:
                logger.warning(f"Validation failed: Question does not have exactly 4 options: '{q_text}'")
                continue
                
            # Meaningful options check (minimum length, no empty strings, reject template placeholders)
            meaningful_options = True
            for opt in options:
                if not isinstance(opt, str) or len(opt.strip()) < 2:
                    meaningful_options = False
                    break
                opt_lower = opt.lower()
                if any(x in opt_lower for x in ["unrelated topic", "option a", "option b", "option c", "option d", "placeholder", "none of the above", "all of the above"]):
                    meaningful_options = False
                    break
            if not meaningful_options:
                logger.warning(f"Validation failed: Options contain generic/invalid placeholders or empty strings for: '{q_text}'")
                continue
                
            correct_ans = q.get("correctAnswer") or q.get("correct_answer")
            if not correct_ans or correct_ans not in options:
                logger.warning(f"Validation failed: Correct answer '{correct_ans}' is not in options: {options}")
                continue
                
            # Reject generic questions
            q_text_lower = q_text.lower()
            if any(x in q_text_lower for x in ["primary topic of the video", "unrelated topic", "template question"]):
                logger.warning(f"Validation failed: Question text is generic/template: '{q_text}'")
                continue
                
            # Question topic must match current video transcript
            words_in_q = [w for w in re.findall(r"\b\w{4,}\b", q_text_lower)]
            topic_lower = q.get("topic", "").lower()
            overlap_found = False
            for word in words_in_q:
                if word in transcript_lower or word in title_lower:
                    overlap_found = True
                    break
            if not overlap_found and topic_lower:
                for word in re.findall(r"\b\w{4,}\b", topic_lower):
                    if word in transcript_lower or word in title_lower:
                        overlap_found = True
                        break
            
            if not overlap_found and len(words_in_q) > 0:
                logger.warning(f"Validation failed: Question words have no overlap with video transcript/title: '{q_text}'")
                continue
                
            # Check for duplicate questions
            norm_text = re.sub(r"[^a-zA-Z0-9]", "", q_text).lower()
            if norm_text not in seen_questions:
                seen_questions.add(norm_text)
                validated.append(q)
            else:
                logger.warning(f"Duplicate question detected and removed: '{q_text}'")
                
        return validated

    def _generate_procedural_fallback_quiz(self, synopsis: dict) -> list[dict]:
        import random
        title = synopsis.get("metadata", {}).get("title", "this video")
        channel = synopsis.get("metadata", {}).get("channelName", "Unknown")
        duration = synopsis.get("metadata", {}).get("duration", "N/A")
        theme = synopsis.get("theme", "General")
        
        minutes = duration_str_to_minutes(duration)
        target_questions, min_questions, max_questions = get_question_bounds(minutes)
        
        # Collect Definitions
        def_map = {}
        for d in synopsis.get("importantDefinitions", []):
            t = d.get("term", "").strip()
            defn = d.get("definition", "").strip()
            if t and defn:
                def_map[t] = defn
        for c in synopsis.get("majorConcepts", []) + synopsis.get("keyConcepts", []):
            for d in c.get("definitions", []):
                t = d.get("term", "").strip()
                defn = d.get("definition", "").strip()
                if t and defn:
                    if t not in def_map:
                        def_map[t] = defn

        # Collect Concepts
        concepts = []
        for c in synopsis.get("majorConcepts", []) + synopsis.get("keyConcepts", []):
            name = c.get("concept", "").strip()
            desc = c.get("explanation", "").strip() or c.get("description", "").strip()
            if name and desc:
                concepts.append((name, desc))

        # Collect QA pairs
        qa_map = {}
        for source in ["faq", "interviewQuestions", "vivaQuestions", "shortAnswerQuestions", "longAnswerQuestions"]:
            for qa in synopsis.get(source, []):
                q = qa.get("question", "").strip()
                a = qa.get("answer", "").strip()
                if q and a:
                    norm_q = "".join(ch for ch in q.lower() if ch.isalnum())
                    if norm_q not in qa_map:
                        qa_map[norm_q] = (q, a)

        # Collect Chapters
        chapters = []
        for ch in synopsis.get("chapters", []):
            ts = ch.get("timestamp", "").strip()
            ch_title = ch.get("title", "").strip()
            summary = ch.get("summary", "").strip()
            if ch_title and summary:
                chapters.append((ts, ch_title, summary))

        # Collect Topics Breakdown
        topics = []
        for t in synopsis.get("topics", []):
            topic_name = t.get("topic", "").strip()
            desc = t.get("description", "").strip()
            if topic_name and desc:
                topics.append((topic_name, desc))

        # Build distractor pools
        long_pool = list(def_map.values()) + [c[1] for c in concepts] + [qa[1] for qa in qa_map.values()] + [ch[2] for ch in chapters] + [t[1] for t in topics]
        short_pool = list(def_map.keys()) + [c[0] for c in concepts] + [ch[1] for ch in chapters] + [t[0] for t in topics]

        # Unique long pool / short pool items
        long_pool = list(set([item for item in long_pool if item]))
        short_pool = list(set([item for item in short_pool if item]))

        def get_distractors(correct: str, pool: list[str], is_short: bool, count: int = 3) -> list[str]:
            correct_lower = correct.lower().strip()
            choices = []
            seen = {correct_lower}
            for item in pool:
                item_strip = item.strip()
                item_lower = item_strip.lower()
                if item_lower not in seen and len(item_strip) > 0:
                    seen.add(item_lower)
                    choices.append(item_strip)
            random.shuffle(choices)
            # Fill with fallback options if not enough
            if is_short:
                fallbacks = [
                    "Alternative Term",
                    "Secondary Topic",
                    "Unrelated Concept",
                    "None of the above"
                ]
            else:
                fallbacks = [
                    f"This perspective is not addressed in the video presentation.",
                    f"Alternative option not supported by the lecture transcript.",
                    f"None of the outlined methods in '{title}' align with this definition.",
                    f"A concept unrelated to the main theme of '{title}'."
                ]
            for fb in fallbacks:
                if len(choices) < count and fb.lower() not in seen:
                    choices.append(fb)
            return choices[:count]

        primary_qs = []
        secondary_qs = []

        # 1. Definitions Questions
        for term, defn in def_map.items():
            distractors = get_distractors(defn, long_pool, is_short=False)
            options = [defn] + distractors
            random.shuffle(options)
            primary_qs.append({
                "question": f"According to the video, what is the definition and significance of '{term}'?",
                "options": options,
                "correctAnswer": defn,
                "explanation": f"The term '{term}' is defined as: {defn}.",
                "difficulty": "medium",
                "topic": "Definitions"
            })
            
            distractors = get_distractors(term, short_pool, is_short=True)
            options = [term] + distractors
            random.shuffle(options)
            secondary_qs.append({
                "question": f"Which term matches the following description: '{defn}'?",
                "options": options,
                "correctAnswer": term,
                "explanation": f"'{term}' matches the description: {defn}.",
                "difficulty": "hard",
                "topic": "Definitions"
            })

        # 2. Concepts Questions
        for name, desc in concepts:
            distractors = get_distractors(desc, long_pool, is_short=False)
            options = [desc] + distractors
            random.shuffle(options)
            primary_qs.append({
                "question": f"Explain the core concept and operational principles of '{name}'.",
                "options": options,
                "correctAnswer": desc,
                "explanation": f"The concept '{name}' refers to: {desc}.",
                "difficulty": "medium",
                "topic": "Key Concepts"
            })
            
            distractors = get_distractors(name, short_pool, is_short=True)
            options = [name] + distractors
            random.shuffle(options)
            secondary_qs.append({
                "question": f"Which concept is defined by: '{desc}'?",
                "options": options,
                "correctAnswer": name,
                "explanation": f"'{name}' is the concept matching: {desc}.",
                "difficulty": "hard",
                "topic": "Key Concepts"
            })

        # 3. QA Questions
        for norm_q, (q, a) in qa_map.items():
            distractors = get_distractors(a, long_pool, is_short=False)
            options = [a] + distractors
            random.shuffle(options)
            primary_qs.append({
                "question": q,
                "options": options,
                "correctAnswer": a,
                "explanation": f"The lecture notes answer this: {a}",
                "difficulty": "easy" if len(a) < 100 else "medium",
                "topic": "Comprehension"
            })

        # 4. Chapters Questions
        for ts, ch_title, summary in chapters:
            distractors = get_distractors(summary, long_pool, is_short=False)
            options = [summary] + distractors
            random.shuffle(options)
            primary_qs.append({
                "question": f"In the chapter '{ch_title}', what is the main focus discussed?",
                "options": options,
                "correctAnswer": summary,
                "explanation": f"The chapter '{ch_title}' at timestamp {ts} covers: {summary}.",
                "difficulty": "easy",
                "topic": "Chapters"
            })
            
            distractors = get_distractors(ch_title, short_pool, is_short=True)
            options = [ch_title] + distractors
            random.shuffle(options)
            secondary_qs.append({
                "question": f"Which chapter discussed in the video covers '{summary}'?",
                "options": options,
                "correctAnswer": ch_title,
                "explanation": f"The chapter '{ch_title}' focuses on: {summary}.",
                "difficulty": "medium",
                "topic": "Chapters"
            })

        # 5. Topics Questions
        for topic_name, desc in topics:
            distractors = get_distractors(desc, long_pool, is_short=False)
            options = [desc] + distractors
            random.shuffle(options)
            primary_qs.append({
                "question": f"Under the topic '{topic_name}', what primary segment is discussed?",
                "options": options,
                "correctAnswer": desc,
                "explanation": f"'{topic_name}' covers: {desc}.",
                "difficulty": "medium",
                "topic": "Topics Breakdown"
            })

        random.shuffle(primary_qs)
        random.shuffle(secondary_qs)

        final_qs = primary_qs + secondary_qs

        if len(final_qs) < target_questions:
            meta_qs = [
                {
                    "question": f"Who is the creator/channel of the video '{title}'?",
                    "options": [channel, "FreeCodeCamp", "Khan Academy", "CrashCourse"],
                    "correctAnswer": channel,
                    "explanation": f"The video was created/published by {channel}.",
                    "difficulty": "easy",
                    "topic": "Metadata"
                },
                {
                    "question": f"What is the exact title of the video analyzed in this study session?",
                    "options": [title, "Introduction to Information Networks", "Advanced Systems Architecture", "A Comprehensive Overview of the Lecture"],
                    "correctAnswer": title,
                    "explanation": f"The title of the video is: {title}.",
                    "difficulty": "easy",
                    "topic": "Metadata"
                },
                {
                    "question": f"What is the duration of the video '{title}'?",
                    "options": [duration, "5:00", "25:30", "1:02:15"],
                    "correctAnswer": duration,
                    "explanation": f"The duration of the video is {duration}.",
                    "difficulty": "easy",
                    "topic": "Metadata"
                },
                {
                    "question": f"What is the primary theme/topic categorized for this video synopsis?",
                    "options": [theme, "Unrelated Subject", "General Review", "History and Culture"],
                    "correctAnswer": theme,
                    "explanation": f"The video category theme is '{theme}'.",
                    "difficulty": "easy",
                    "topic": "Metadata"
                }
            ]
            random.shuffle(meta_qs)
            final_qs += meta_qs

        seen_qs = set()
        deduped_qs = []
        for q in final_qs:
            q_norm = q["question"].strip().lower()
            if q_norm not in seen_qs:
                seen_qs.add(q_norm)
                deduped_qs.append(q)
        
        # Only pad with duplicate questions if we have less than min_questions (5)
        if len(deduped_qs) < min_questions:
            while len(deduped_qs) < min_questions and deduped_qs:
                q_to_copy = random.choice(deduped_qs)
                copied = q_to_copy.copy()
                copied["question"] = copied["question"] + " (Review Question)"
                deduped_qs.append(copied)

        return deduped_qs[:max_questions]

    async def generate_quiz(self, user_id: str, synopsis_id: str) -> dict:
        """
        Retrieves the video synopsis and transcript, pulls all previous questions
        asked for this synopsis to avoid overlap, calls Groq to generate 20
        unique MCQ questions, validates the output strictly, retries once on failure,
        and saves the new quiz. Falls back gracefully on rate-limits (HTTP 429).
        """
        if not ObjectId.is_valid(synopsis_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid synopsis ID format."
            )

        synopsis = await self.synopsis_collection.find_one({"_id": ObjectId(synopsis_id), "user_id": user_id})
        if not synopsis:
            # Fallback: check if the synopsis is cached globally
            synopsis = await self.synopsis_collection.find_one({"_id": ObjectId(synopsis_id)})
            if not synopsis:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Associated video synopsis not found."
                )

        transcript_text = synopsis.get("transcript", "")
        synopsis_text = synopsis.get("executiveSummary", "")
        title = synopsis.get("metadata", {}).get("title", "this video")
        duration_str = synopsis.get("metadata", {}).get("duration", "N/A")
        
        minutes = duration_str_to_minutes(duration_str)
        target_questions, min_questions, max_questions = get_question_bounds(minutes)

        # Fallback to description or notes if transcript is empty
        if not transcript_text:
            transcript_text = synopsis.get("detailedExplanation", "") or synopsis_text
            
        if not transcript_text:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot generate quiz: video transcript and summaries are completely empty."
            )

        # 1. Fetch previous questions to avoid duplicates
        existing_quizzes = await self.quizzes_collection.find({
            "synopsisId": synopsis_id,
            "userId": user_id
        }).to_list(length=100)

        previous_questions = []
        for qz in existing_quizzes:
            for q in qz.get("questions", []):
                previous_questions.append(q.get("question", ""))

        # 2. Setup prompts
        prev_questions_str = json.dumps(previous_questions) if previous_questions else "None"
        system_prompt = (
            "You are an expert Senior Curriculum Architect and Educational Testing specialist. "
            f"Your task is to generate a comprehensive, high-quality, academic quiz "
            f"based ONLY on the video content and transcript of '{title}'.\n\n"
            "Each MCQ must consist of:\n"
            "- A clear question testing conceptual or practical knowledge.\n"
            "- Exactly 4 options.\n"
            "- A correct answer (must match one of the 4 options EXACTLY).\n"
            "- A short, detailed explanation explaining why the answer is correct.\n"
            "- Difficulty rating: 'easy', 'medium', or 'hard'.\n"
            "- Topic/Concept covered in the video.\n\n"
            "STRICT CONSTRAINTS:\n"
            f"1. Automatically determine the optimal number of questions to generate based on content richness, transcript depth, topic complexity, and video duration ({duration_str}).\n"
            f"   - Short videos (1–5 minutes): Generate 5–10 questions.\n"
            f"   - Medium videos (5–20 minutes): Generate 10–20 questions.\n"
            f"   - Long videos (20–60 minutes): Generate 20–40 questions.\n"
            f"   - Very long educational videos (60+ minutes): Generate 20–50 questions if sufficient unique content exists.\n"
            f"   Target around {target_questions} questions for this video duration. If transcript content is limited, generate fewer high-quality questions rather than forcing additional questions. Quality is more important than quantity.\n"
            "2. Do NOT repeat or generate highly similar questions to any of the following previously asked questions:\n"
            f"{prev_questions_str}\n"
            "3. Every option must be meaningful, complete, and relevant. Do not include placeholder or generic options like 'Unrelated Topic', 'Option A/B/C/D', or 'none of the above'.\n"
            "4. Respond ONLY in valid JSON matching this exact schema (no markdown blocks, no formatting wrappers):\n"
            "{\n"
            '  "total_questions": number,\n'
            '  "difficulty_distribution": {\n'
            '    "easy": number,\n'
            '    "medium": number,\n'
            '    "hard": number\n'
            '  },\n'
            '  "questions": [\n'
            '    {\n'
            '      "question": "What is ...?",\n'
            '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
            '      "correctAnswer": "Option A",\n'
            '      "explanation": "Option A is correct because...",\n'
            '      "difficulty": "medium",\n'
            '      "topic": "Topic Name"\n'
            '    }\n'
            '  ]\n'
            "}\n"
            "5. The correct answer must EXACTLY match one of the options in the options array."
        )

        # Build a rich transcript/synopsis context
        context_parts = []
        if transcript_text:
            context_parts.append(f"Video Content/Transcript excerpt:\n{transcript_text[:15000]}")
            
        synopsis_parts = []
        if synopsis_text:
            synopsis_parts.append(f"Executive Summary:\n{synopsis_text}")
        
        # Important definitions
        defs = synopsis.get("importantDefinitions") or synopsis.get("important_definitions") or []
        if defs:
            defs_str = "\n".join([f"- {d.get('term')}: {d.get('definition')}" for d in defs if d.get('term') and d.get('definition')])
            if defs_str:
                synopsis_parts.append(f"Important Definitions:\n{defs_str}")
                
        # Key concepts
        concepts = synopsis.get("keyConcepts") or synopsis.get("key_concepts") or synopsis.get("majorConcepts") or synopsis.get("major_concepts") or []
        if concepts:
            concepts_str = "\n".join([f"- {c.get('concept') or c.get('name') or c.get('title')}: {c.get('explanation') or c.get('description')}" for c in concepts if (c.get('concept') or c.get('name') or c.get('title'))])
            if concepts_str:
                synopsis_parts.append(f"Key Concepts:\n{concepts_str}")
                
        # Chapters
        chapters = synopsis.get("chapters") or []
        if chapters:
            ch_str = "\n".join([f"- {ch.get('timestamp')} {ch.get('title')}: {ch.get('summary')}" for ch in chapters if ch.get('title')])
            if ch_str:
                synopsis_parts.append(f"Chapters Summary:\n{ch_str}")

        if synopsis_parts:
            context_parts.append("Video Synopsis Details:\n" + "\n\n".join(synopsis_parts))

        context_str = "\n\n".join(context_parts)
        user_prompt = f"Video Title: {title}\n\n{context_str}"

        # Build validation text containing both transcript and synopsis details
        synopsis_val_parts = []
        if transcript_text:
            synopsis_val_parts.append(transcript_text)
        if synopsis_text:
            synopsis_val_parts.append(synopsis_text)
        for d in synopsis.get("importantDefinitions", []):
            synopsis_val_parts.append(d.get("term", ""))
            synopsis_val_parts.append(d.get("definition", ""))
        for c in synopsis.get("majorConcepts", []) + synopsis.get("keyConcepts", []):
            synopsis_val_parts.append(c.get("concept", "") or c.get("name", ""))
            synopsis_val_parts.append(c.get("explanation", "") or c.get("description", ""))
        for ch in synopsis.get("chapters", []):
            synopsis_val_parts.append(ch.get("title", ""))
            synopsis_val_parts.append(ch.get("summary", ""))
        for t in synopsis.get("topics", []):
            synopsis_val_parts.append(t.get("topic", ""))
            synopsis_val_parts.append(t.get("description", ""))
            
        validation_text = "\n".join(synopsis_val_parts)

        openai_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"

        # 3. Log generation details before call
        logger.info("=== Quiz Generation Details ===")
        logger.info(f"synopsis_id: {synopsis_id}")
        logger.info(f"video title: {title}")
        logger.info(f"transcript length: {len(transcript_text)}")
        logger.info(f"AI provider being used: Groq (via OpenAI client, model: {openai_model})")

        # 4. Generate and validate (with 1 retry)
        max_attempts = 2
        questions_list = []
        last_error_message = ""
        current_system_prompt = system_prompt
        groq_rate_limited = False
        warning_msg = None

        for attempt_num in range(1, max_attempts + 1):
            logger.info(f"AI Generation Attempt {attempt_num} of {max_attempts}...")
            try:
                response = self.client.chat.completions.create(
                    model=openai_model,
                    messages=[
                        {"role": "system", "content": current_system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=120
                )
                
                response_text = response.choices[0].message.content.strip()
                if response_text.startswith("```"):
                    lines = response_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    response_text = "\n".join(lines).strip()
                    
                quiz_data = json.loads(response_text)
                validated_questions = self.validate_quiz_data(quiz_data, validation_text, title)
                
                if len(validated_questions) < 5:
                    raise ValueError(f"Expected at least 5 unique and valid questions, but validated {len(validated_questions)}.")
                
                questions_list = validated_questions[:max_questions]
                logger.info(f"Successfully generated and validated {len(questions_list)} unique MCQs on attempt {attempt_num}.")
                break
                
            except Exception as e:
                last_error_message = str(e)
                logger.error(f"Generation attempt {attempt_num} failed: {last_error_message}")
                
                # Check for rate-limit keywords: 429, rate_limit_exceeded, quota, tokens per day, rate limit
                err_str = last_error_message.lower()
                status_code = getattr(e, "status_code", None)
                is_rate_limit = (
                    status_code == 429 or
                    any(k in err_str for k in ["429", "rate_limit_exceeded", "quota", "tokens per day", "rate limit"])
                )
                
                if is_rate_limit:
                    logger.warning(f"Groq Rate limit error detected on attempt {attempt_num}: {last_error_message}. Breaking to fallback pipeline.")
                    groq_rate_limited = True
                    break
                
                current_system_prompt = (
                    system_prompt +
                    f"\n\nWARNING: The previous generation failed validation: {last_error_message}. "
                    f"You MUST generate unique, context-specific questions (target around {target_questions} questions). "
                    "Make sure there are absolutely NO placeholders, generic options, or generic questions."
                )

        if not questions_list:
            if groq_rate_limited:
                logger.info("Groq rate limit triggered fallback path.")
                   # Try OpenAI fallback
                if settings.OPENAI_API_KEY:
                    logger.info("OpenAI fallback started")
                    openai_validated = []
                    try:
                        openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, max_retries=0)
                        openai_system_prompt = (
                            "You are an expert Senior Curriculum Architect and Educational Testing specialist. "
                            f"Your task is to generate a comprehensive, high-quality, academic quiz "
                            f"based ONLY on the video content and transcript of '{title}'.\n\n"
                            "Each MCQ must consist of:\n"
                            "- A clear question testing conceptual or practical knowledge.\n"
                            "- Exactly 4 options.\n"
                            "- A correct answer (must match one of the 4 options EXACTLY).\n"
                            "- A short, detailed explanation explaining why the answer is correct.\n"
                            "- Difficulty rating: 'easy', 'medium', or 'hard'.\n"
                            "- Topic/Concept covered in the video.\n\n"
                            "STRICT CONSTRAINTS:\n"
                            f"1. Automatically determine the optimal number of questions to generate based on content richness, transcript depth, topic complexity, and video duration ({duration_str}).\n"
                            f"   - Short videos (1–5 minutes): Generate 5–10 questions.\n"
                            f"   - Medium videos (5–20 minutes): Generate 10–20 questions.\n"
                            f"   - Long videos (20–60 minutes): Generate 20–40 questions.\n"
                            f"   - Very long educational videos (60+ minutes): Generate 20–50 questions if sufficient unique content exists.\n"
                            f"   Target around {target_questions} questions for this video duration. If transcript content is limited, generate fewer high-quality questions rather than forcing additional questions. Quality is more important than quantity.\n"
                            "2. Do NOT repeat or generate highly similar questions to any of the following previously asked questions:\n"
                            f"{prev_questions_str}\n"
                            "3. Every option must be meaningful, complete, and relevant. Do not include placeholder or generic options like 'Unrelated Topic', 'Option A/B/C/D', or 'none of the above'.\n"
                            "4. Respond ONLY in valid JSON matching this exact schema (no markdown blocks, no formatting wrappers):\n"
                            "{\n"
                            '  "total_questions": number,\n'
                            '  "difficulty_distribution": {\n'
                            '    "easy": number,\n'
                            '    "medium": number,\n'
                            '    "hard": number\n'
                            '  },\n'
                            '  "questions": [\n'
                            '    {\n'
                            '      "question": "What is ...?",\n'
                            '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
                            '      "correctAnswer": "Option A",\n'
                            '      "explanation": "Option A is correct because...",\n'
                            '      "difficulty": "medium",\n'
                            '      "topic": "Topic Name"\n'
                            '    }\n'
                            '  ]\n'
                            "}\n"
                            "5. The correct answer must EXACTLY match one of the options in the options array."
                        )

                        logger.info(f"Calling OpenAI to generate around {target_questions} questions...")
                        openai_response = openai_client.chat.completions.create(
                            model=settings.OPENAI_MODEL or "gpt-4o-mini",
                            messages=[
                                {"role": "system", "content": openai_system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            response_format={"type": "json_object"},
                            timeout=120
                        )
                        openai_response_text = openai_response.choices[0].message.content.strip()
                        if openai_response_text.startswith("```"):
                            lines = openai_response_text.splitlines()
                            if lines[0].startswith("```"):
                                lines = lines[1:]
                            if lines[-1].startswith("```"):
                                lines = lines[:-1]
                            openai_response_text = "\n".join(lines).strip()
                            
                        openai_quiz_data = json.loads(openai_response_text)
                        openai_validated = self.validate_quiz_data(openai_quiz_data, validation_text, title)
                        logger.info(f"OpenAI fallback generated {len(openai_quiz_data.get('questions', []))} questions, {len(openai_validated)} valid questions.")
                        
                        if len(openai_validated) >= 5:
                            questions_list = openai_validated[:max_questions]
                            warning_msg = "AI quota temporarily reached. Using backup quiz generation."
                            logger.info("OpenAI fallback success")
                        else:
                            logger.error(f"OpenAI fallback failed to get at least 5 valid questions: only {len(openai_validated)} validated.")
                    except Exception as oai_err:
                        import traceback
                        exact_tb = traceback.format_exc()
                        logger.error(f"OpenAI fallback API call or JSON parsing failed: {str(oai_err)}")
                        logger.error(f"OpenAI fallback stacktrace: {exact_tb}")
                else:
                    logger.warning("Groq rate limited but OPENAI_API_KEY is not configured in settings.")
                
                # Use local procedural generator if OpenAI failed or is not available
                if not questions_list:
                    logger.info("Using local procedural quiz generator fallback.")
                    questions_list = self._generate_procedural_fallback_quiz(synopsis)
                    warning_msg = "AI quota temporarily reached. Using backup quiz generation."
            else:
                logger.error(f"Groq MCQ generation completely failed after {max_attempts} attempts. Last error: {last_error_message}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"AI failed to generate a high-quality quiz of at least 5 unique questions matching the video transcript. Error: {last_error_message}"
                )


        logger.info(f"number of questions generated: {len(questions_list)}")

        # 5. Save to quizzes collection
        mapped_questions = []
        for q in questions_list:
            mapped_questions.append(QuestionModel(
                question=q.get("question"),
                options=q.get("options"),
                correctAnswer=q.get("correctAnswer") or q.get("correct_answer"),
                explanation=q.get("explanation", "No explanation provided."),
                difficulty=q.get("difficulty", "medium"),
                topic=q.get("topic", "General Topic")
            ))

        quiz_db = QuizDBModel(
            synopsisId=synopsis_id,
            userId=user_id,
            questions=mapped_questions
        )

        quiz_dict = quiz_db.model_dump(by_alias=True, exclude={"id"})
        result = await self.quizzes_collection.insert_one(quiz_dict)
        quiz_id_str = str(result.inserted_id)

        # Build public response (answers and explanations hidden)
        public_questions = []
        for q in mapped_questions:
            public_questions.append({
                "question": q.question,
                "options": q.options,
                "difficulty": q.difficulty,
                "topic": q.topic
            })

        total_qs = len(mapped_questions)
        easy_count = sum(1 for q in mapped_questions if q.difficulty == "easy")
        medium_count = sum(1 for q in mapped_questions if q.difficulty == "medium")
        hard_count = sum(1 for q in mapped_questions if q.difficulty == "hard")
        difficulty_distribution = {
            "easy": easy_count,
            "medium": medium_count,
            "hard": hard_count
        }

        return {
            "id": quiz_id_str,
            "synopsisId": synopsis_id,
            "userId": user_id,
            "questions": public_questions,
            "totalQuestions": total_qs,
            "difficultyDistribution": difficulty_distribution,
            "createdAt": quiz_dict.get("createdAt").isoformat() if isinstance(quiz_dict.get("createdAt"), datetime) else quiz_dict.get("createdAt"),
            "warning": warning_msg
        }

    async def submit_quiz(self, user_id: str, quiz_id: str, selected_answers: dict) -> dict:
        """
        Calculates scores, calls OpenAI to generate topic performance and
        encouraging feedback, saves the attempt in MongoDB, and returns graded answers.
        """
        if not ObjectId.is_valid(quiz_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid quiz ID format.")

        quiz = await self.quizzes_collection.find_one({"_id": ObjectId(quiz_id), "userId": user_id})
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz session not found.")

        synopsis_id = quiz.get("synopsisId") or quiz.get("synopsis_id")
        synopsis = await self.synopsis_collection.find_one({"_id": ObjectId(synopsis_id)})
        video_title = synopsis.get("metadata", {}).get("title", "Video") if synopsis else "Video"

        questions = quiz.get("questions", [])
        total_questions = len(questions)

        # Grade the answers
        score = 0
        topic_tally = {} # {topic: {correct: X, total: Y}}
        question_review_details = []

        for idx, q in enumerate(questions):
            correct_answer = q.get("correctAnswer") or q.get("correct_answer")
            selected = selected_answers.get(str(idx)) or selected_answers.get(idx) or ""
            is_correct = (selected == correct_answer)

            if is_correct:
                score += 1

            topic = q.get("topic", "General")
            if topic not in topic_tally:
                topic_tally[topic] = {"correct": 0, "total": 0}
            topic_tally[topic]["total"] += 1
            if is_correct:
                topic_tally[topic]["correct"] += 1

            question_review_details.append({
                "question": q.get("question"),
                "options": q.get("options"),
                "correctAnswer": correct_answer,
                "selectedAnswer": selected,
                "isCorrect": is_correct,
                "topic": topic
            })

        percentage = (score / total_questions * 100) if total_questions > 0 else 0.0

        # Classify learning level
        if percentage < 50:
            learning_level = "Beginner"
        elif percentage <= 80:
            learning_level = "Good"
        else:
            learning_level = "Excellent"

        # 3. Call OpenAI to generate Learning Analytics JSON
        graded_details_str = json.dumps(question_review_details)
        system_prompt = (
            "You are an expert AI Academic Coach and Director of Learning Analytics. "
            "Review the student's quiz attempt performance and generate detailed learning insights and revision advice.\n\n"
            "Format the response ONLY in a valid JSON matching this schema:\n"
            "{\n"
            '  "strongTopics": ["Topic Name A"],\n'
            '  "weakTopics": ["Topic Name B"],\n'
            '  "suggestedRevisionTopics": ["Specific subtopics or concepts from the video to review"],\n'
            '  "improvementSuggestion": "A concrete action plan on how to review and improve.",\n'
            '  "learningFeedback": "A highly personalized, supportive, and encouraging feedback paragraph analyzing their results (around 100 words)."\n'
            "}\n"
        )
        
        user_prompt = (
            f"Video Title: {video_title}\n"
            f"Score: {score} / {total_questions} ({percentage}%)\n"
            f"Learning Level: {learning_level}\n"
            f"Graded Question Breakdown:\n{graded_details_str}"
        )
        
        openai_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
        analytics_data = None
        response_text = None
        
        # 1. Try Groq first
        if settings.GROQ_API_KEY:
            try:
                logger.info("Quiz Submission: attempting Groq completions for analytics...")
                response = self.client.chat.completions.create(
                    model=openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=30
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Quiz Submission: Groq failed to generate analytics: {e}. Trying OpenAI fallback.")

        # 2. Try OpenAI fallback
        if not response_text and settings.OPENAI_API_KEY:
            try:
                logger.info("Quiz Submission: attempting OpenAI completions for analytics (model: gpt-4o-mini)...")
                openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, max_retries=0)
                openai_model_name = settings.OPENAI_MODEL or "gpt-4o-mini"
                response = openai_client.chat.completions.create(
                    model=openai_model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    response_format={"type": "json_object"},
                    timeout=30
                )
                response_text = response.choices[0].message.content.strip()
            except Exception as oai_err:
                logger.error(f"Quiz Submission: OpenAI fallback also failed: {oai_err}")

        # Parse response text if retrieved successfully
        if response_text:
            try:
                if response_text.startswith("```"):
                    lines = response_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines[-1].startswith("```"):
                        lines = lines[:-1]
                    response_text = "\n".join(lines).strip()
                    
                analytics_data = json.loads(response_text)
            except Exception as parse_err:
                logger.error(f"Failed to parse AI analytics JSON: {parse_err}")

        # 3. Fallback to rule-based analytics if both failed or parsing failed
        if not analytics_data:
            logger.warning("Using rule-based fallback for quiz analytics.")
            # Fallback analytics
            strongs = [topic for topic, t in topic_tally.items() if (t["correct"] / t["total"]) >= 0.7]
            weaks = [topic for topic, t in topic_tally.items() if (t["correct"] / t["total"]) < 0.7]
            analytics_data = {
                "strongTopics": strongs or ["None identified"],
                "weakTopics": weaks or ["None identified"],
                "suggestedRevisionTopics": weaks or ["General Video Overview"],
                "improvementSuggestion": "Focus on reviewing concepts related to your incorrect answers in the study handbook.",
                "learningFeedback": f"You finished the quiz with a score of {score}/{total_questions}. Keep practice testing to cement these key ideas!"
            }

        # Build Analytics DB Model
        analytics_model = AnalyticsModel(
            overallScore=f"{score}/{total_questions}",
            strongTopics=analytics_data.get("strongTopics", []),
            weakTopics=analytics_data.get("weakTopics", []),
            suggestedRevisionTopics=analytics_data.get("suggestedRevisionTopics", []),
            learningLevel=learning_level,
            improvementSuggestion=analytics_data.get("improvementSuggestion", "Study the notes in detail."),
            learningFeedback=analytics_data.get("learningFeedback", "Good attempt.")
        )

        attempt_db = QuizAttemptDBModel(
            quizId=quiz_id,
            synopsisId=str(synopsis_id),
            userId=user_id,
            selectedAnswers=selected_answers,
            score=score,
            percentage=percentage,
            analytics=analytics_model
        )

        attempt_dict = attempt_db.model_dump(by_alias=True, exclude={"id"})
        result = await self.attempts_collection.insert_one(attempt_dict)
        attempt_id_str = str(result.inserted_id)

        # Prepare graded response matching response schema
        graded_questions = []
        for q in questions:
            graded_questions.append({
                "question": q.get("question"),
                "options": q.get("options"),
                "correctAnswer": q.get("correctAnswer") or q.get("correct_answer"),
                "explanation": q.get("explanation"),
                "difficulty": q.get("difficulty"),
                "topic": q.get("topic")
            })

        return {
            "id": attempt_id_str,
            "quizId": quiz_id,
            "synopsisId": str(synopsis_id),
            "userId": user_id,
            "selectedAnswers": selected_answers,
            "score": score,
            "percentage": percentage,
            "analytics": {
                "overallScore": analytics_model.overall_score,
                "strongTopics": analytics_model.strong_topics,
                "weakTopics": analytics_model.weak_topics,
                "suggestedRevisionTopics": analytics_model.suggested_revision_topics,
                "learningLevel": analytics_model.learning_level,
                "improvementSuggestion": analytics_model.improvement_suggestion,
                "learningFeedback": analytics_model.learning_feedback
            },
            "createdAt": attempt_dict.get("createdAt").isoformat() if isinstance(attempt_dict.get("createdAt"), datetime) else attempt_dict.get("createdAt"),
            "questions": graded_questions
        }

    async def get_attempts(self, user_id: str, synopsis_id: str) -> list:
        """
        Returns all quiz attempts for the synopsis and user, sorted by date descending.
        """
        cursor = self.attempts_collection.find({
            "synopsisId": synopsis_id,
            "userId": user_id
        }).sort("createdAt", -1)

        history = []
        async for doc in cursor:
            # We also want to map questions back for attempts so they can be viewed
            quiz_id = doc.get("quizId") or doc.get("quiz_id")
            quiz = await self.quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
            questions_list = []
            if quiz:
                for q in quiz.get("questions", []):
                    questions_list.append({
                        "question": q.get("question"),
                        "options": q.get("options"),
                        "correctAnswer": q.get("correctAnswer") or q.get("correct_answer"),
                        "explanation": q.get("explanation"),
                        "difficulty": q.get("difficulty"),
                        "topic": q.get("topic")
                    })

            history.append({
                "id": str(doc["_id"]),
                "quizId": quiz_id,
                "synopsisId": doc.get("synopsisId") or doc.get("synopsis_id"),
                "userId": doc.get("userId") or doc.get("user_id"),
                "selectedAnswers": doc.get("selectedAnswers") or doc.get("selected_answers") or {},
                "score": doc.get("score"),
                "percentage": doc.get("percentage"),
                "analytics": {
                    "overallScore": doc.get("analytics", {}).get("overallScore") or doc.get("analytics", {}).get("overall_score"),
                    "strongTopics": doc.get("analytics", {}).get("strongTopics") or doc.get("analytics", {}).get("strong_topics") or [],
                    "weakTopics": doc.get("analytics", {}).get("weakTopics") or doc.get("analytics", {}).get("weak_topics") or [],
                    "suggestedRevisionTopics": doc.get("analytics", {}).get("suggestedRevisionTopics") or doc.get("analytics", {}).get("suggested_revision_topics") or [],
                    "learningLevel": doc.get("analytics", {}).get("learningLevel") or doc.get("analytics", {}).get("learning_level"),
                    "improvementSuggestion": doc.get("analytics", {}).get("improvementSuggestion") or doc.get("analytics", {}).get("improvement_suggestion"),
                    "learningFeedback": doc.get("analytics", {}).get("learningFeedback") or doc.get("analytics", {}).get("learning_feedback")
                },
                "createdAt": doc.get("createdAt").isoformat() if isinstance(doc.get("createdAt"), datetime) else doc.get("createdAt") or doc.get("created_at"),
                "questions": questions_list
            })
        return history

    def _generate_procedural_fallback_chat(self, synopsis: dict, query: str) -> str:
        query_lower = query.lower()
        title = synopsis.get("metadata", {}).get("title", "this video")
        
        # 1. Unrelated query check (procedural)
        import re
        words_in_q = [w for w in re.findall(r"\b\w{4,}\b", query_lower)]
        
        is_greeting_or_cmd = any(k in query_lower for k in [
            "hello", "hi ", "hey", "explain", "concept", "definition", "glossary", "term",
            "chapter", "timeline", "timestamp", "faq", "interview", "exam", "summary",
            "takeaway", "viva", "question", "formula", "note", "introduction", "help", "guide"
        ])
        
        overlap_found = False
        if is_greeting_or_cmd:
            overlap_found = True
        else:
            context_text = (
                title.lower() + " " + 
                synopsis.get("executiveSummary", "").lower() + " " +
                " ".join(synopsis.get("keywords", []))
            )
            for word in words_in_q:
                if word in context_text:
                    overlap_found = True
                    break
        
        if not overlap_found and len(words_in_q) > 0:
            return "This question is outside the current video context. Please ask something related to this video."

        # 2. Related query routing
        if any(k in query_lower for k in ["interview", "viva", "exam", "question"]):
            q_list = []
            sources = [
                ("interviewQuestions", "Interview Questions"),
                ("vivaQuestions", "Viva Questions"),
                ("shortAnswerQuestions", "Short Answer Questions"),
                ("longAnswerQuestions", "Long Answer Questions"),
                ("faq", "Frequently Asked Questions")
            ]
            for field, label in sources:
                items = synopsis.get(field) or []
                for item in items:
                    q_text = item.get("question") or item.get("term")
                    a_text = item.get("answer") or item.get("definition")
                    if q_text and a_text:
                        q_list.append((q_text, a_text, label))
            
            if q_list:
                import random
                # Sample up to 5 questions
                selected = q_list[:5] if len(q_list) <= 5 else random.sample(q_list, 5)
                response_parts = [f"Here are 5 study questions and answers matching the video topic **{title}**:\n"]
                for idx, (q_t, a_t, lbl) in enumerate(selected):
                    response_parts.append(f"**Q{idx+1} ({lbl})**: {q_t}\n**A**: {a_t}\n")
                return "\n".join(response_parts)
            else:
                return f"No practice questions were found for the video topic: **{title}**."

        if any(k in query_lower for k in ["definition", "glossary", "term"]):
            def_list = []
            defs = synopsis.get("importantDefinitions") or synopsis.get("important_definitions") or []
            for d in defs:
                t = d.get("term")
                defn = d.get("definition")
                if t and defn:
                    def_list.append((t, defn))
            
            concepts = synopsis.get("keyConcepts") or synopsis.get("key_concepts") or synopsis.get("majorConcepts") or synopsis.get("major_concepts") or []
            for c in concepts:
                c_defs = c.get("definitions") or []
                for d in c_defs:
                    t = d.get("term")
                    defn = d.get("definition")
                    if t and defn and (t, defn) not in def_list:
                        def_list.append((t, defn))

            if def_list:
                response_parts = [f"Here are the important terms and definitions for **{title}**:\n"]
                for t, defn in def_list[:8]:
                    response_parts.append(f"- **{t}**: {defn}")
                return "\n".join(response_parts)
            else:
                return f"No terms or definitions glossary found for: **{title}**."

        if any(k in query_lower for k in ["concept", "core ideas", "key ideas"]):
            concepts = synopsis.get("keyConcepts") or synopsis.get("key_concepts") or synopsis.get("majorConcepts") or synopsis.get("major_concepts") or []
            if concepts:
                response_parts = [f"Here are the core concepts covered in **{title}**:\n"]
                for c in concepts[:5]:
                    name = c.get("concept") or c.get("name") or c.get("title")
                    explanation = c.get("explanation") or c.get("description")
                    if name and explanation:
                        response_parts.append(f"### {name}\n{explanation}\n")
                return "\n".join(response_parts)
            else:
                return f"No key concepts list found for: **{title}**."

        if any(k in query_lower for k in ["chapter", "timeline", "timestamp"]):
            chapters = synopsis.get("chapters") or []
            if chapters:
                response_parts = [f"Here is the video timeline and chapters breakdown for **{title}**:\n"]
                for ch in chapters:
                    ts = ch.get("timestamp") or ch.get("time") or "00:00"
                    ch_title = ch.get("title") or "Chapter"
                    summary = ch.get("summary") or ""
                    response_parts.append(f"- **[{ts}] {ch_title}**: {summary}")
                return "\n".join(response_parts)
            else:
                return f"No chapter timeline is available for: **{title}**."

        if any(k in query_lower for k in ["summary", "explain", "introduction", "overview"]):
            summary = synopsis.get("executiveSummary") or synopsis.get("introduction") or synopsis.get("detailedExplanation") or ""
            if summary:
                return f"**Video Executive Summary & Overview for '{title}'**:\n\n{summary}"
            else:
                return f"No summary notes found for: **{title}**."

        if any(k in query_lower for k in ["takeaway", "key takeaways", "lesson"]):
            takeaways = synopsis.get("keyTakeaways") or synopsis.get("key_takeaways") or synopsis.get("actionItems") or synopsis.get("action_items") or []
            if takeaways:
                response_parts = [f"Here are the key takeaways from **{title}**:\n"]
                for t in takeaways:
                    response_parts.append(f"- {t}")
                return "\n".join(response_parts)
            else:
                return f"No key takeaways or action items found for: **{title}**."

        summary = synopsis.get("executiveSummary") or ""
        concepts = synopsis.get("keyConcepts") or synopsis.get("key_concepts") or synopsis.get("majorConcepts") or synopsis.get("major_concepts") or []
        concepts_str = ""
        if concepts:
            concepts_str = "\n".join([f"- **{c.get('concept') or c.get('name') or c.get('title')}**" for c in concepts[:5]])
        
        response = (
            f"Welcome to the study companion guide for **{title}**.\n\n"
            f"Here is an overview of the video content:\n{summary[:500]}...\n\n"
        )
        if concepts_str:
            response += f"**Key Concepts covered**:\n{concepts_str}\n\n"
        response += (
            "You can ask me specific questions like:\n"
            "- *Give 5 interview questions*\n"
            "- *Explain terminology glossary*\n"
            "- *Show video timeline chapters*\n"
            "- *What are the key takeaways?*"
        )
        return response

    async def quiz_chat(self, user_id: str, payload: dict) -> str:
        """
        AI chat assistant grounded in video transcript and quiz results.
        """
        synopsis_id = payload.get("synopsisId")
        quiz_id = payload.get("quizId")
        attempt_id = payload.get("attemptId")
        message = payload.get("message")
        chat_history = payload.get("chatHistory", [])

        if not ObjectId.is_valid(synopsis_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid synopsis ID format.")

        synopsis = await self.synopsis_collection.find_one({"_id": ObjectId(synopsis_id)})
        if not synopsis:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Synopsis not found.")

        title = synopsis.get("metadata", {}).get("title", "Video")
        transcript = synopsis.get("transcript", "") or synopsis.get("detailedExplanation", "") or synopsis.get("executiveSummary", "")

        quiz_context = ""
        if quiz_id and ObjectId.is_valid(quiz_id):
            quiz = await self.quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
            if quiz:
                questions = quiz.get("questions", [])
                quiz_context += "\n=== Quiz Questions Reference ===\n"
                for idx, q in enumerate(questions):
                    quiz_context += (
                        f"Q{idx+1}: {q.get('question')}\n"
                        f"Options: {', '.join(q.get('options', []))}\n"
                        f"Correct Answer: {q.get('correctAnswer') or q.get('correct_answer')}\n"
                        f"Explanation: {q.get('explanation')}\n\n"
                    )

        attempt_context = ""
        if attempt_id and ObjectId.is_valid(attempt_id):
            attempt = await self.attempts_collection.find_one({"_id": ObjectId(attempt_id), "userId": user_id})
            if attempt:
                selected = attempt.get("selectedAnswers") or attempt.get("selected_answers") or {}
                quiz_id = attempt.get("quizId") or attempt.get("quiz_id")
                total_qs = 20
                if quiz_id and ObjectId.is_valid(quiz_id):
                    quiz = await self.quizzes_collection.find_one({"_id": ObjectId(quiz_id)})
                    if quiz:
                        total_qs = len(quiz.get("questions", []))
                attempt_context += "\n=== Student Attempt Details ===\n"
                attempt_context += f"Score: {attempt.get('score')} / {total_qs} ({attempt.get('percentage')}%)\n"
                for q_idx, ans in selected.items():
                    attempt_context += f"Question {int(q_idx)+1} selected option: {ans}\n"

        system_prompt = (
            "You are 'Video Study Coach', an advanced AI Academic Chatbot designed to help students master video content and learn from their quizzes.\n\n"
            f"You are tutoring a student on the video topic: '{title}'.\n"
            "Below is the exact transcript/synopsis content of the video, followed by the quiz questions and what the student answered. "
            "Answer the student's questions clearly, concisely, and educationally using the transcript and quiz details as your ground truth.\n\n"
            "If the student asks why a specific option is correct or incorrect, or asks to explain a concept, break it down step-by-step using "
            "clear student-friendly analogies or descriptions. Keep responses under 200 words where possible to maintain readable chat formats.\n\n"
            "=== Video Content Transcript ===\n"
            f"{transcript[:30000]}\n"
            f"{quiz_context}\n"
            f"{attempt_context}"
        )

        messages = [{"role": "system", "content": system_prompt}]
        for hist in chat_history:
            role = hist.get("role")
            content = hist.get("content")
            if role in ["user", "assistant"]:
                messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": message})

        answer = None
        if settings.GROQ_API_KEY:
            try:
                logger.info("Quiz Chat: attempting Groq completions...")
                groq_model = settings.GROQ_MODEL or "llama-3.3-70b-versatile"
                response = self.client.chat.completions.create(
                    model=groq_model,
                    messages=messages,
                    timeout=45
                )
                answer = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Quiz Chat: Groq failed: {e}")
                
        if not answer and settings.OPENAI_API_KEY:
            try:
                logger.info("Quiz Chat: attempting OpenAI fallback...")
                openai_client = OpenAI(api_key=settings.OPENAI_API_KEY, max_retries=0)
                openai_model = settings.OPENAI_MODEL or "gpt-4o-mini"
                response = openai_client.chat.completions.create(
                    model=openai_model,
                    messages=messages,
                    timeout=45
                )
                answer = response.choices[0].message.content.strip()
            except Exception as oai_err:
                logger.error(f"Quiz Chat: OpenAI fallback failed: {oai_err}")
                
        if answer:
            return answer
        else:
            logger.warning("Both Groq and OpenAI providers failed for Quiz Chat. Falling back to local procedural study coach chat.")
            return self._generate_procedural_fallback_chat(synopsis, message)
