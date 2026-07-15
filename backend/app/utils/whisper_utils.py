import os
import glob
import logging
from openai import OpenAI
import yt_dlp
from app.core.config import settings

logger = logging.getLogger(__name__)

def transcribe_audio_with_whisper(video_id: str) -> list:
    """
    Downloads audio for the YouTube video using yt-dlp, transcribes it using
    OpenAI's Whisper API, and cleans up the temporary audio file.
    Returns a list of transcript segment dicts matching youtube-transcript-api format.
    """
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Download the lowest quality/bitrate audio to keep the file size minimal and speed up downloads
    outtmpl = os.path.join(temp_dir, f"{video_id}.%(ext)s")
    ydl_opts = {
        'format': 'worstaudio/worst',
        'outtmpl': outtmpl,
        'quiet': True,
        'no_warnings': True,
    }
    
    video_url = f"https://www.youtube.com/watch?v={video_id}"
    downloaded_file = None
    
    try:
        logger.info(f"Downloading audio from {video_url} to {temp_dir}...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            # Find the actual downloaded filepath
            candidate_path = ydl.prepare_filename(info)
            if os.path.exists(candidate_path):
                downloaded_file = candidate_path
            else:
                # Fallback: scan temp folder for the video_id prefix
                matches = glob.glob(os.path.join(temp_dir, f"{video_id}.*"))
                if matches:
                    downloaded_file = matches[0]
                    
        if not downloaded_file or not os.path.exists(downloaded_file):
            raise Exception("Failed to download audio file via yt-dlp.")
            
        logger.info(f"Audio downloaded successfully: {downloaded_file}. File size: {os.path.getsize(downloaded_file)} bytes.")
        
        # 2. Call Groq Whisper API
        logger.info("Initializing Groq client and calling Whisper API...")
        client = OpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        
        with open(downloaded_file, "rb") as audio_file:
            response = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=audio_file,
                response_format="verbose_json"
            )
            
        logger.info("Whisper API transcription complete.")
        
        # 3. Format Whisper segments to match youtube-transcript-api format
        # Each segment in verbose_json has 'text', 'start', and 'end'
        transcript = []
        segments = getattr(response, 'segments', []) or response.get('segments', [])
        
        for seg in segments:
            # Handle both object attributes and dict get (depending on openai library version conversion)
            text = seg.get('text') if isinstance(seg, dict) else getattr(seg, 'text', '')
            start = seg.get('start') if isinstance(seg, dict) else getattr(seg, 'start', 0.0)
            end = seg.get('end') if isinstance(seg, dict) else getattr(seg, 'end', 0.0)
            
            transcript.append({
                "text": text.strip(),
                "start": start,
                "duration": max(0.1, end - start)
            })
            
        return transcript
        
    except Exception as e:
        logger.error(f"Whisper fallback failed: {e}")
        raise e
        
    finally:
        # Clean up downloaded file
        if downloaded_file and os.path.exists(downloaded_file):
            try:
                os.remove(downloaded_file)
                logger.info(f"Temporary audio file removed: {downloaded_file}")
            except Exception as cleanup_err:
                logger.warning(f"Failed to remove temporary file {downloaded_file}: {cleanup_err}")
