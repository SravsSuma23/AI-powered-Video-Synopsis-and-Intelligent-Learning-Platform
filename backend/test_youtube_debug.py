import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
print("YouTube API Key:", settings.YOUTUBE_API_KEY)
print("OpenAI API Key exists:", bool(settings.OPENAI_API_KEY))

from app.utils.youtube_utils import get_youtube_metadata, get_youtube_transcript, get_youtube_transcript_via_yt_dlp

video_id = "YAdLFsTG70w"

try:
    print("1. Fetching metadata...")
    meta = get_youtube_metadata(video_id)
    print("Metadata:", meta)
except Exception as e:
    print("Metadata failed:", e)

try:
    print("2. Fetching transcript via native API...")
    trans = get_youtube_transcript(video_id)
    print("Native transcript length:", len(trans))
except Exception as e:
    print("Native transcript failed:", e)

try:
    print("3. Fetching transcript via yt-dlp...")
    trans_dlp = get_youtube_transcript_via_yt_dlp(video_id)
    print("yt-dlp transcript length:", len(trans_dlp))
except Exception as e:
    print("yt-dlp transcript failed:", e)
