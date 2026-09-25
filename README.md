# 🎵 Etsuko

> Spotify-inspired standalone desktop music player for Windows. Stream any song on Earth without paywalls, subscriptions, or ads.

![Etsuko Banner](etsuko.png)

## Features
- **All Music Unlocked**: Instant search across 100M+ official songs, albums, artists, and live performances powered by YouTube Music and yt-dlp.
- **Spotify Dark Aesthetic**: Authentic dark theme (`#121212`), responsive grid, glowing cards, and custom interactive scrubbers.
- **Zero-Buffering Playback**: High-performance HTTP 206 chunked audio streaming for instant seek and response.
- **Karaoke Synced Lyrics**: Auto-scrolling synchronized lyrics with blurred album cover background.
- **Infinite Radio & Autoplay**: Dynamic recommendation engine keeps the music playing seamlessly when your queue finishes.
- **Local Library**: SQLite database for Liked Songs, custom playlists, and listening history stored safely in your user profile.
- **Hardware Integration**: Full Windows Media Keys (Play/Pause, Next, Prev) and lock screen now-playing controls via `MediaSession`.

## How to Run
### Standalone Executable
Run the pre-compiled `.exe`:
```cmd
dist\etsuko.exe
```

### From Source
```cmd
python main.py
```

## Shortcuts
- `Space`: Play / Pause
- `Right / Left`: Seek 5s
- `Up / Down`: Volume adjustment
- `M`: Mute / Unmute
