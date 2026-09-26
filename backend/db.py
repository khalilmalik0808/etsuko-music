import sqlite3
import os
import time

DB_PATH = os.path.join(os.path.expanduser("~"), ".etsuko", "etsuko.db")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS liked_songs (
        video_id TEXT PRIMARY KEY,
        title TEXT,
        artist TEXT,
        album TEXT,
        duration TEXT,
        thumbnail TEXT,
        added_at INTEGER
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        description TEXT,
        cover TEXT,
        created_at INTEGER
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS playlist_tracks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER,
        video_id TEXT,
        title TEXT,
        artist TEXT,
        album TEXT,
        duration TEXT,
        thumbnail TEXT,
        added_at INTEGER,
        FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    )
    """)

    # Safe column migration for existing user databases
    try:
        cursor.execute("ALTER TABLE playlists ADD COLUMN cover TEXT")
    except Exception:
        pass
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT,
        title TEXT,
        artist TEXT,
        album TEXT,
        duration TEXT,
        thumbnail TEXT,
        played_at INTEGER
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT,
        bio TEXT,
        avatar TEXT
    )
    """)

    # Seed default user profile if empty
    cursor.execute("SELECT id FROM user_profile WHERE id = 1")
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO user_profile (id, name, bio, avatar)
        VALUES (1, '', '', 'assets/default_user.png')
        """)
    
    conn.commit()
    conn.close()

def get_connection():
    return sqlite3.connect(DB_PATH)

def toggle_like(track):
    conn = get_connection()
    c = conn.cursor()
    video_id = track.get("videoId") or track.get("video_id")
    c.execute("SELECT video_id FROM liked_songs WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    if row:
        c.execute("DELETE FROM liked_songs WHERE video_id = ?", (video_id,))
        liked = False
    else:
        c.execute("""
        INSERT INTO liked_songs (video_id, title, artist, album, duration, thumbnail, added_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            video_id,
            track.get("title", "Unknown"),
            track.get("artist", "Unknown"),
            track.get("album", ""),
            track.get("duration", "0:00"),
            track.get("thumbnail", ""),
            int(time.time())
        ))
        liked = True
    conn.commit()
    conn.close()
    return liked

def remove_like(video_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM liked_songs WHERE video_id = ?", (video_id,))
    conn.commit()
    conn.close()
    return True

def clear_liked_songs():
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM liked_songs")
    conn.commit()
    conn.close()
    return True

def clear_playlist_tracks(playlist_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM playlist_tracks WHERE playlist_id = ?", (playlist_id,))
    conn.commit()
    conn.close()
    return True

def get_liked_songs():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT video_id, title, artist, album, duration, thumbnail, added_at FROM liked_songs ORDER BY added_at DESC")
    rows = c.fetchall()
    conn.close()
    return [{
        "videoId": r[0],
        "title": r[1],
        "artist": r[2],
        "album": r[3],
        "duration": r[4],
        "thumbnail": r[5],
        "addedAt": r[6],
        "isLiked": True
    } for r in rows]

def is_liked(video_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT 1 FROM liked_songs WHERE video_id = ?", (video_id,))
    row = c.fetchone()
    conn.close()
    return bool(row)

def create_playlist(name, description="", cover=""):
    conn = get_connection()
    c = conn.cursor()
    try:
        c.execute("INSERT INTO playlists (name, description, cover, created_at) VALUES (?, ?, ?, ?)", (name, description, cover, int(time.time())))
        pid = c.lastrowid
        conn.commit()
        return pid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def delete_playlist(playlist_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM playlist_tracks WHERE playlist_id = ?", (playlist_id,))
    c.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
    conn.commit()
    conn.close()
    return True

def get_playlists():
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    SELECT p.id, p.name, p.description, p.cover, COUNT(pt.id) as track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
    """)
    rows = c.fetchall()
    conn.close()
    return [{
        "id": r[0],
        "name": r[1],
        "description": r[2],
        "cover": r[3] or "",
        "trackCount": r[4]
    } for r in rows]

def add_track_to_playlist(playlist_id, track):
    conn = get_connection()
    c = conn.cursor()
    video_id = track.get("videoId") or track.get("video_id")
    # Check if already in playlist
    c.execute("SELECT id FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?", (playlist_id, video_id))
    if c.fetchone():
        conn.close()
        return False
    c.execute("""
    INSERT INTO playlist_tracks (playlist_id, video_id, title, artist, album, duration, thumbnail, added_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        playlist_id,
        video_id,
        track.get("title", "Unknown"),
        track.get("artist", "Unknown"),
        track.get("album", ""),
        track.get("duration", "0:00"),
        track.get("thumbnail", ""),
        int(time.time())
    ))
    conn.commit()
    conn.close()
    return True

def remove_track_from_playlist(playlist_id, video_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("DELETE FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?", (playlist_id, video_id))
    conn.commit()
    conn.close()
    return True

def get_playlist_tracks(playlist_id):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT video_id, title, artist, album, duration, thumbnail, added_at FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at ASC", (playlist_id,))
    rows = c.fetchall()
    conn.close()
    return [{
        "videoId": r[0],
        "title": r[1],
        "artist": r[2],
        "album": r[3],
        "duration": r[4],
        "thumbnail": r[5],
        "addedAt": r[6],
        "isLiked": is_liked(r[0])
    } for r in rows]

def get_profile():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT name, bio, avatar FROM user_profile WHERE id = 1")
    row = c.fetchone()
    conn.close()
    if row:
        return {"name": row[0] or "", "bio": row[1] or "", "avatar": row[2] or "assets/default_user.png"}
    return {"name": "", "bio": "", "avatar": "assets/default_user.png"}

def update_profile(name, bio, avatar):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
    INSERT INTO user_profile (id, name, bio, avatar)
    VALUES (1, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name, bio = excluded.bio, avatar = excluded.avatar
    """, (name, bio, avatar))
    conn.commit()
    conn.close()
    return True

def record_history(track):
    conn = get_connection()
    c = conn.cursor()
    video_id = track.get("videoId") or track.get("video_id")
    c.execute("""
    INSERT INTO history (video_id, title, artist, album, duration, thumbnail, played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        video_id,
        track.get("title", "Unknown"),
        track.get("artist", "Unknown"),
        track.get("album", ""),
        track.get("duration", "0:00"),
        track.get("thumbnail", ""),
        int(time.time())
    ))
    conn.commit()
    conn.close()

def get_history(limit=50):
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT video_id, title, artist, album, duration, thumbnail, played_at FROM history ORDER BY played_at DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return [{
        "videoId": r[0],
        "title": r[1],
        "artist": r[2],
        "album": r[3],
        "duration": r[4],
        "thumbnail": r[5],
        "playedAt": r[6],
        "isLiked": is_liked(r[0])
    } for r in rows]

init_db()
