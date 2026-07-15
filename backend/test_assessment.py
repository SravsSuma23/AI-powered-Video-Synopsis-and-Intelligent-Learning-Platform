import asyncio
import os
import sys
from dotenv import load_dotenv

# Add app folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.assessment_service import AssessmentService

async def run_tests():
    load_dotenv()
    print("Connecting to MongoDB...")
    await connect_to_mongo()
    
    db = get_database()
    
    # 1. Fetch a sample synopsis
    print("Finding a sample synopsis in database...")
    synopsis = await db["synopses"].find_one({})
    if not synopsis:
        print("ERROR: No synopses found. Please generate a synopsis first.")
        await close_mongo_connection()
        return

    synopsis_id = str(synopsis["_id"])
    user_id = synopsis["user_id"]
    print(f"Testing synopsis: ID={synopsis_id}, Title='{synopsis.get('metadata', {}).get('title')}' for user={user_id}")
    
    service = AssessmentService(db)
    
    # 2. Test generation (re-generation)
    print("\n--- Testing Assessment Generation ---")
    assessment = await service.generate_assessment(user_id, synopsis_id)
    print(f"Generated Assessment ID: {assessment.get('id')}")
    print(f"Flashcards count: {len(assessment.get('flashcards', []))}")
    print(f"MCQs count: {len(assessment.get('mcqs', []))}")
    print(f"Scenario questions count: {len(assessment.get('scenarioQuestions', []))}")
    print(f"Case studies count: {len(assessment.get('caseStudies', []))}")
    print(f"Short answers count: {len(assessment.get('shortAnswers', []))}")
    print(f"Fill-in-the-blanks count: {len(assessment.get('fillBlanks', []))}")
    print(f"True/False count: {len(assessment.get('trueFalse', []))}")
    print(f"Coding questions count: {len(assessment.get('codingQuestions', []))}")
    print(f"Assignments count: {len(assessment.get('assignments', []))}")
    
    # 3. Test submitting MCQ answers (Practice & Test)
    print("\n--- Testing MCQ Submission ---")
    mcq_answers = {
        "0": assessment.get("mcqs")[0]["correctAnswer"] if assessment.get("mcqs") else "React Forget",
        "1": "Incorrect Answer Placeholder"
    }
    
    # Practice MCQ submit (should record scores in sections but not add to overall score/accuracy)
    attempt_prac = await service.submit_section(user_id, assessment["id"], "mcq", mcq_answers, time_taken=15)
    print(f"Practice MCQ Graded score: {attempt_prac['sections']['mcq']['score']} / {attempt_prac['sections']['mcq']['maxScore']}")
    
    # Test MCQ submit (should update overall score/accuracy)
    attempt = await service.submit_section(user_id, assessment["id"], "test_mcq", mcq_answers, time_taken=30)
    print(f"Test MCQ Graded score: {attempt['sections']['test_mcq']['score']} / {attempt['sections']['test_mcq']['maxScore']}")
    print(f"Overall Score (After Test MCQ): {attempt['overallScore']} / {attempt['maxScore']} ({attempt['accuracy']}% accuracy)")
    
    # 4. Test submitting Short Answer answers (Test)
    print("\n--- Testing Short Answer Submission (AI Grader) ---")
    sa_answers = {
        "0": "A state transitions controller is used to handle pending states in React forms."
    }
    attempt = await service.submit_section(user_id, assessment["id"], "test_short_answer", sa_answers, time_taken=45)
    print(f"Test Short Answer Graded score: {attempt['sections']['test_short_answer']['score']} / {attempt['sections']['test_short_answer']['maxScore']}")
    print(f"Overall Score (After Test SA): {attempt['overallScore']} / {attempt['maxScore']} ({attempt['accuracy']}% accuracy)")
    print(f"Strong Topics: {attempt['strongTopics']}")
    print(f"Weak Topics: {attempt['weakTopics']}")
    print(f"Study Plan Suggestion: {attempt['studyPlan'][:150]}...")
    
    # 5. Test Performance directly
    print("\n--- Testing Performance Report Fetching ---")
    perf = await service.get_latest_performance(user_id, synopsis_id)
    print(f"Latest Performance Accuracy: {perf['accuracy']}%")
    print(f"Study Plan: {perf['studyPlan'][:150]}...")
    print(f"Extra Practice questions generated: {len(perf.get('extraPracticeQuestions', []))}")
    
    await close_mongo_connection()
    print("\nAll backend integration tests completed successfully!")

if __name__ == "__main__":
    asyncio.run(run_tests())
