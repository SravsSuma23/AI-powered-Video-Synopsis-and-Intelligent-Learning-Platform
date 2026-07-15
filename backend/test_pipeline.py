import asyncio
import logging
from dotenv import load_dotenv
load_dotenv() # Load environment variables from .env

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("test_pipeline")

from app.utils.youtube_utils import extract_youtube_id, get_youtube_metadata, get_youtube_transcript
from app.utils.whisper_utils import transcribe_audio_with_whisper
from openai import OpenAI
from app.core.config import settings

async def test_all():
    video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    logger.info(f"Extracting ID for URL: {video_url}")
    video_id = extract_youtube_id(video_url)
    logger.info(f"Extracted Video ID: {video_id}")
    
    assert video_id == "dQw4w9WgXcQ", f"Incorrect ID extraction: {video_id}"
    
    logger.info("Fetching Metadata...")
    metadata = get_youtube_metadata(video_id)
    logger.info(f"Metadata result: {metadata}")
    
    assert metadata["title"] != "Unknown Title", "Failed to retrieve real metadata"
    
    logger.info("Fetching transcript...")
    transcript_segments = []
    try:
        transcript_segments = get_youtube_transcript(video_id)
        logger.info(f"Successfully fetched native transcript. Length: {len(transcript_segments)} segments.")
    except Exception as e:
        logger.warning(f"Native transcript fetching failed: {e}. Trying Whisper fallback...")
        try:
            transcript_segments = transcribe_audio_with_whisper(video_id)
            logger.info(f"Successfully transcribed via Whisper fallback. Length: {len(transcript_segments)} segments.")
        except Exception as whisper_err:
            logger.error(f"Whisper fallback failed as well: {whisper_err}")
            return
            
    if transcript_segments:
        logger.info(f"First segment text: '{transcript_segments[0]['text']}'")
        
        # Test Groq connection with a tiny query
        logger.info("Testing Groq Connection with llama-3.3-70b-versatile...")
        client = OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL or "llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": "Hello! Say 'OK' and nothing else."}
            ],
            max_tokens=10
        )
        logger.info(f"Groq response: '{response.choices[0].message.content.strip()}'")

if __name__ == "__main__":
    asyncio.run(test_all())
