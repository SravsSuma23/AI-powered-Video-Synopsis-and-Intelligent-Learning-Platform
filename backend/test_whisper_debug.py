import sys
import os
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.whisper_utils import transcribe_audio_with_whisper

video_id = "YAdLFsTG70w"

print("Starting Whisper transcription fallback test...")
start_time = time.time()
try:
    transcript = transcribe_audio_with_whisper(video_id)
    duration = time.time() - start_time
    print(f"Whisper transcription succeeded in {duration:.2f} seconds!")
    print("Transcript length (segments):", len(transcript))
    if transcript:
        print("First segment:", transcript[0])
except Exception as e:
    duration = time.time() - start_time
    print(f"Whisper transcription failed after {duration:.2f} seconds with error: {e}")
