import re
import urllib.request
import json
import logging
from datetime import datetime
from typing import List, Dict
from app.core.config import settings

logger = logging.getLogger(__name__)

def extract_youtube_id(url: str) -> str:
    """
    Extracts the 11-character YouTube video ID from a variety of URL formats.
    Supported formats:
    - https://www.youtube.com/watch?v=dQw4w9WgXcQ
    - https://youtu.be/dQw4w9WgXcQ
    - https://www.youtube.com/shorts/dQw4w9WgXcQ
    - https://m.youtube.com/watch?v=dQw4w9WgXcQ
    """
    if not url:
        return ""
    
    clean_url = url.strip()
    
    # Matches /shorts/ID, /watch?v=ID, youtu.be/ID, etc.
    patterns = [
        r"(?:v=|\/shorts\/|\/embed\/|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})",
        r"(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})"
    ]
    
    for pattern in patterns:
        match = re.search(pattern, clean_url)
        if match:
            return match.group(1)
            
    # Generic fallback regex
    fallback_pattern = r"([a-zA-Z0-9_-]{11})"
    matches = re.findall(fallback_pattern, clean_url)
    for m in matches:
        if len(m) == 11:
            return m
            
    return ""

def parse_iso8601_duration(duration_str: str) -> str:
    """
    Converts ISO 8601 duration (e.g. PT18M45S, PT1H2M30S) into HH:MM:SS or MM:SS format.
    """
    pattern = re.compile(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?')
    match = pattern.match(duration_str)
    if not match:
        return "00:00"
    
    hours, minutes, seconds = match.groups()
    hours = int(hours) if hours else 0
    minutes = int(minutes) if minutes else 0
    seconds = int(seconds) if seconds else 0
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes:02d}:{seconds:02d}"

def format_view_count(views_val) -> str:
    if not views_val:
        return "N/A"
    try:
        raw_views = int(views_val)
        if raw_views >= 1000000:
            return f"{raw_views / 1000000:.1f}M views"
        elif raw_views >= 1000:
            return f"{raw_views / 1000:.1f}k views"
        else:
            return f"{raw_views} views"
    except (ValueError, TypeError):
        return str(views_val)

def get_youtube_metadata(video_id: str) -> dict:
    """
    Fetches video metadata using the YouTube Data API v3.
    Falls back to yt-dlp if the API call fails.
    """
    # 1. Attempt using YouTube Data API v3
    if settings.YOUTUBE_API_KEY and settings.YOUTUBE_API_KEY != "PUT_NEW_YOUTUBE_API_KEY_HERE":
        api_url = f"https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id={video_id}&key={settings.YOUTUBE_API_KEY}"
        try:
            logger.info("Attempting to fetch YouTube metadata using YouTube Data API v3...")
            req = urllib.request.Request(api_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                if data.get("items"):
                    item = data["items"][0]
                    snippet = item["snippet"]
                    content_details = item["contentDetails"]
                    statistics = item.get("statistics", {})
                    
                    title = snippet.get("title", "Unknown Title")
                    channel_name = snippet.get("channelTitle", "Unknown Channel")
                    
                    # Parse Publish Date (YYYY-MM-DD)
                    published_at = snippet.get("publishedAt", "")
                    publish_date = published_at[:10] if published_at else datetime.utcnow().strftime("%Y-%m-%d")
                    
                    # Duration
                    duration_raw = content_details.get("duration", "PT0S")
                    duration = parse_iso8601_duration(duration_raw)
                    
                    # Views
                    views_raw = statistics.get("viewCount", "0")
                    views = format_view_count(views_raw)
                    
                    # Thumbnail
                    thumbnails = snippet.get("thumbnails", {})
                    thumbnail = (
                        thumbnails.get("maxres", {}).get("url") or 
                        thumbnails.get("high", {}).get("url") or 
                        thumbnails.get("medium", {}).get("url") or 
                        thumbnails.get("default", {}).get("url") or 
                        ""
                    )
                    
                    return {
                        "id": f"vid_{video_id}",
                        "youtubeId": video_id,
                        "title": title,
                        "channelName": channel_name,
                        "duration": duration,
                        "publishDate": publish_date,
                        "thumbnail": thumbnail,
                        "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
                        "views": views
                    }
        except Exception as e:
            logger.warning(f"YouTube Data API metadata fetch failed: {e}. Falling back to yt-dlp...")
            
    # 2. Fallback to yt-dlp
    try:
        logger.info("Fetching YouTube metadata using yt-dlp...")
        import yt_dlp
        ydl_opts = {'skip_download': True, 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            info = ydl.extract_info(video_url, download=False)
            
            title = info.get("title", "Unknown Title")
            channel_name = info.get("uploader", "Unknown Channel")
            
            # Parse Duration
            duration_sec = info.get("duration", 0)
            minutes = duration_sec // 60
            seconds = duration_sec % 60
            hours = minutes // 60
            minutes = minutes % 60
            if hours > 0:
                duration = f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                duration = f"{minutes:02d}:{seconds:02d}"
                
            # Parse Publish Date
            upload_date = info.get("upload_date", "") # YYYYMMDD
            if upload_date and len(upload_date) == 8:
                publish_date = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"
            else:
                publish_date = datetime.utcnow().strftime("%Y-%m-%d")
                
            thumbnail = info.get("thumbnail", "")
            views_raw = info.get("view_count", 0)
            views = format_view_count(views_raw)
            
            return {
                "id": f"vid_{video_id}",
                "youtubeId": video_id,
                "title": title,
                "channelName": channel_name,
                "duration": duration,
                "publishDate": publish_date,
                "thumbnail": thumbnail,
                "youtubeUrl": video_url,
                "views": views
            }
    except Exception as e:
        logger.error(f"yt-dlp metadata extraction failed: {e}")
        err_msg = str(e).lower()
        if "unavailable" in err_msg or "private" in err_msg or "restricted" in err_msg:
            raise ValueError("The requested YouTube video is unavailable, private, or restricted.")
        # Return fallback mock structure to prevent application crash
        return {
            "id": f"vid_{video_id}",
            "youtubeId": video_id,
            "title": f"YouTube Video ({video_id})",
            "channelName": "YouTube Channel",
            "duration": "00:00",
            "publishDate": datetime.utcnow().strftime("%Y-%m-%d"),
            "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
            "youtubeUrl": f"https://www.youtube.com/watch?v={video_id}",
            "views": "N/A"
        }

def get_youtube_transcript(video_id: str) -> list:
    """
    Fetches the transcript for a YouTube video in list format using youtube-transcript-api.
    Each item contains 'text', 'start', and 'duration'.
    """
    from youtube_transcript_api import YouTubeTranscriptApi
    
    logger.info(f"Attempting to fetch transcript for YouTube video {video_id}...")
    transcript_list = YouTubeTranscriptApi().list(video_id)
    
    try:
        # Try manually created English transcript
        transcript = transcript_list.find_transcript(['en'])
        logger.info("Found manually created English transcript.")
    except Exception:
        try:
            # Try auto-generated English transcript
            transcript = transcript_list.find_generated_transcript(['en'])
            logger.info("Found auto-generated English transcript.")
        except Exception:
            # Translate any available transcript to English
            all_transcripts = list(transcript_list._manually_created_transcripts.keys()) + list(transcript_list._generated_transcripts.keys())
            if all_transcripts:
                logger.info(f"Translating transcript from {all_transcripts[0]} to English...")
                try:
                    transcript = transcript_list.find_transcript([all_transcripts[0]]).translate('en')
                except Exception as translate_err:
                    logger.warning(
                        f"Translation to English failed: {translate_err}. "
                        f"Fetching original transcript in '{all_transcripts[0]}' without translation."
                    )
                    transcript = transcript_list.find_transcript([all_transcripts[0]])
            else:
                raise Exception("No transcripts available in any language for this video.")
                
    raw_data = transcript.fetch()
    formatted = []
    for item in raw_data:
        text = getattr(item, 'text', '') if not isinstance(item, dict) else item.get('text', '')
        start = getattr(item, 'start', 0.0) if not isinstance(item, dict) else item.get('start', 0.0)
        duration = getattr(item, 'duration', 0.0) if not isinstance(item, dict) else item.get('duration', 0.0)
        formatted.append({
            "text": text,
            "start": start,
            "duration": duration
        })
    return formatted

def _parse_caption_json3(raw: dict) -> List[Dict]:
    """
    Parse YouTube json3 caption payload into transcript segment format.
    """
    segments = []
    for event in raw.get("events", []):
        segs = event.get("segs", [])
        if not segs:
            continue
        text = "".join([s.get("utf8", "") for s in segs]).strip()
        if not text:
            continue
        start = float(event.get("tStartMs", 0)) / 1000.0
        duration = float(event.get("dDurationMs", 0)) / 1000.0
        if duration <= 0:
            duration = 2.0
        segments.append({
            "text": text,
            "start": start,
            "duration": duration
        })
    return segments

def _parse_caption_vtt(vtt_text: str) -> List[Dict]:
    """
    Parse VTT caption text into transcript segment format.
    """
    segments = []
    blocks = re.split(r"\n\s*\n", vtt_text.strip())
    timestamp_re = re.compile(r"(?P<start>\d{2}:?\d{2}:\d{2}\.\d{3})\s+-->\s+(?P<end>\d{2}:?\d{2}:\d{2}\.\d{3})")

    def to_seconds(ts: str) -> float:
        ts = ts.strip()
        parts = ts.split(":")
        if len(parts) == 3:
            h = int(parts[0])
            m = int(parts[1])
            s = float(parts[2])
            return h * 3600 + m * 60 + s
        if len(parts) == 2:
            m = int(parts[0])
            s = float(parts[1])
            return m * 60 + s
        return 0.0

    for block in blocks:
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        ts_line = None
        ts_index = -1
        for i, ln in enumerate(lines):
            if "-->" in ln:
                ts_line = ln
                ts_index = i
                break
        if ts_line is None:
            continue

        match = timestamp_re.search(ts_line)
        if not match:
            continue
        start = to_seconds(match.group("start"))
        end = to_seconds(match.group("end"))
        duration = max(0.1, end - start)

        text_lines = lines[ts_index + 1:]
        text = " ".join(text_lines).strip()
        text = re.sub(r"<[^>]+>", "", text).strip()
        if not text:
            continue
        segments.append({
            "text": text,
            "start": start,
            "duration": duration
        })
    return segments

def get_youtube_transcript_via_yt_dlp(video_id: str) -> list:
    """
    Fallback transcript retrieval via yt-dlp caption tracks.
    Attempts manual subtitles first, then automatic captions.
    """
    import yt_dlp

    video_url = f"https://www.youtube.com/watch?v={video_id}"
    logger.info(f"Attempting yt-dlp caption fallback for YouTube video {video_id}...")

    with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True, "no_warnings": True}) as ydl:
        info = ydl.extract_info(video_url, download=False)

    subtitles = info.get("subtitles", {}) or {}
    auto_captions = info.get("automatic_captions", {}) or {}

    candidate_langs = ["en", "en-US", "en-GB", "a.en"]
    track_list = []
    for lang in candidate_langs:
        if lang in subtitles and subtitles[lang]:
            track_list.extend(subtitles[lang])
    if not track_list:
        for lang in candidate_langs:
            if lang in auto_captions and auto_captions[lang]:
                track_list.extend(auto_captions[lang])
    if not track_list:
        for tracks in subtitles.values():
            track_list.extend(tracks or [])
        if not track_list:
            for tracks in auto_captions.values():
                track_list.extend(tracks or [])

    if not track_list:
        raise Exception("No subtitle or automatic caption tracks available via yt-dlp.")

    json3_track = next((t for t in track_list if t.get("ext") == "json3" and t.get("url")), None)
    vtt_track = next((t for t in track_list if t.get("ext") in ("vtt", "srv3", "ttml") and t.get("url")), None)
    chosen_track = json3_track or vtt_track or next((t for t in track_list if t.get("url")), None)
    if not chosen_track:
        raise Exception("Caption tracks were found but no downloadable caption URL was available.")

    req = urllib.request.Request(chosen_track["url"], headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw_body = resp.read()

    ext = chosen_track.get("ext", "")
    if ext == "json3":
        parsed = _parse_caption_json3(json.loads(raw_body.decode("utf-8", errors="ignore")))
    else:
        parsed = _parse_caption_vtt(raw_body.decode("utf-8", errors="ignore"))

    if not parsed:
        raise Exception("yt-dlp caption parsing returned empty transcript.")
    return parsed
