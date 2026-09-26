import threading
import time
import urllib.request
import json
import sys

# Ensure UTF-8 console output
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from backend.server import start_server
from backend import db

TEST_PORT = 52339

def run_tests():
    print("[TEST] Starting backend thread on port", TEST_PORT)
    t = threading.Thread(target=start_server, args=('127.0.0.1', TEST_PORT), daemon=True)
    t.start()
    time.sleep(1.5)

    base = f"http://127.0.0.1:{TEST_PORT}"

    # 1. Test Static Index
    print("[TEST] Checking index.html...")
    with urllib.request.urlopen(f"{base}/", timeout=5) as r:
        assert r.status == 200
        html = r.read().decode('utf-8')
        assert "Etsuko" in html
    print("[TEST] PASS: index.html served")

    # 2. Test Home Feed
    print("[TEST] Checking /api/home...")
    with urllib.request.urlopen(f"{base}/api/home", timeout=10) as r:
        assert r.status == 200
        data = json.loads(r.read().decode('utf-8'))
        assert "trending" in data
        assert "categories" in data
        print(f"[TEST] PASS: Home feed returned {len(data['trending'])} trending tracks and {len(data['categories'])} categories")

    # 3. Test Search
    print("[TEST] Checking /api/search...")
    with urllib.request.urlopen(f"{base}/api/search?q=The+Weeknd&filter=songs", timeout=10) as r:
        assert r.status == 200
        data = json.loads(r.read().decode('utf-8'))
        assert "results" in data
        assert len(data['results']) > 0
        first = data['results'][0]
        print(f"[TEST] PASS: Search returned '{first['title']}' by '{first['artist']}' (id: {first['videoId']})")

    # 4. Test Stream URL Resolution
    vid = first['videoId']
    print(f"[TEST] Checking /api/stream_url/{vid}...")
    with urllib.request.urlopen(f"{base}/api/stream_url/{vid}", timeout=15) as r:
        assert r.status == 200
        data = json.loads(r.read().decode('utf-8'))
        assert "url" in data and len(data['url']) > 10
        print(f"[TEST] PASS: Stream URL resolved successfully! ({data['url'][:50]}...)")

    # 5. Test DB Liked Songs
    print("[TEST] Testing database like toggle...")
    req = urllib.request.Request(
        f"{base}/api/library/like",
        data=json.dumps(first).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=5) as r:
        data = json.loads(r.read().decode('utf-8'))
        liked_state = data['liked']
    
    if not liked_state:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode('utf-8'))
            assert data['liked'] == True

    print("[TEST] PASS: Like toggle works properly")

    # 6. Test DB Get Likes
    with urllib.request.urlopen(f"{base}/api/library/likes", timeout=5) as r:
        data = json.loads(r.read().decode('utf-8'))
        assert "tracks" in data
        assert any(t['videoId'] == vid for t in data['tracks'])
        print(f"[TEST] PASS: Track verified in SQLite liked_songs table")

    # 7. Test DB Unlike endpoint
    print("[TEST] Testing /api/library/unlike...")
    req_unlike = urllib.request.Request(
        f"{base}/api/library/unlike",
        data=json.dumps({"videoId": vid}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_unlike, timeout=5) as r:
        data = json.loads(r.read().decode('utf-8'))
        assert data.get('success') == True
    print("[TEST] PASS: /api/library/unlike works properly")

    # 8. Test Profile GET & POST
    print("[TEST] Testing /api/profile...")
    with urllib.request.urlopen(f"{base}/api/profile", timeout=5) as r:
        data = json.loads(r.read().decode('utf-8'))
        assert "profile" in data
        print(f"[TEST] PASS: Profile retrieved: {data['profile']}")

    # Test large base64 avatar payload (>300KB) and empty default name
    large_base64_avatar = "data:image/jpeg;base64," + ("A" * (300 * 1024))
    req_profile = urllib.request.Request(
        f"{base}/api/profile",
        data=json.dumps({"name": "", "bio": "Master of sound", "avatar": large_base64_avatar}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_profile, timeout=5) as r:
        data = json.loads(r.read().decode('utf-8'))
        assert data.get('success') == True
        assert data['profile']['name'] == ""
        assert len(data['profile']['avatar']) > 300000
    print("[TEST] PASS: Profile updated with large base64 avatar and empty default name (No 413!)")

    # 9. Test Multiple Playlists (Crates)
    print("[TEST] Testing /api/library/playlists...")
    req_pl = urllib.request.Request(
        f"{base}/api/library/playlists",
        data=json.dumps({"name": "Test Night Vibes", "description": "Lofi & chill"}).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_pl, timeout=5) as r:
        pl_data = json.loads(r.read().decode('utf-8'))
        assert pl_data.get('success') == True
        pl_id = pl_data['id']
        print(f"[TEST] PASS: Created test crate with ID {pl_id}")

    # Add track to playlist
    req_add_track = urllib.request.Request(
        f"{base}/api/library/playlist/{pl_id}/add",
        data=json.dumps(first).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_add_track, timeout=5) as r:
        assert json.loads(r.read().decode('utf-8')).get('success') == True
        print(f"[TEST] PASS: Added track to crate {pl_id}")

    # Verify playlist content
    with urllib.request.urlopen(f"{base}/api/library/playlist/{pl_id}", timeout=5) as r:
        tracks = json.loads(r.read().decode('utf-8')).get('tracks', [])
        assert len(tracks) == 1
        assert tracks[0]['videoId'] == vid
        print(f"[TEST] PASS: Track verified in crate {pl_id}")

    # Remove track from playlist
    req_rm_track = urllib.request.Request(
        f"{base}/api/library/playlist/{pl_id}/track/{vid}",
        headers={'Content-Type': 'application/json'},
        method='DELETE'
    )
    with urllib.request.urlopen(req_rm_track, timeout=5) as r:
        assert json.loads(r.read().decode('utf-8')).get('success') == True
        print(f"[TEST] PASS: Removed track from crate {pl_id}")

    # Delete playlist
    req_del_pl = urllib.request.Request(
        f"{base}/api/library/playlist/{pl_id}",
        headers={'Content-Type': 'application/json'},
        method='DELETE'
    )
    with urllib.request.urlopen(req_del_pl, timeout=5) as r:
        assert json.loads(r.read().decode('utf-8')).get('success') == True
        print(f"[TEST] PASS: Deleted playlist {pl_id}")

    # 10. Test Proxy Audio Streaming with Range Request (206)
    print(f"[TEST] Checking /api/proxy_stream/{vid} with Range header...")
    req_proxy = urllib.request.Request(
        f"{base}/api/proxy_stream/{vid}",
        headers={'Range': 'bytes=0-1024'}
    )
    with urllib.request.urlopen(req_proxy, timeout=15) as r:
        assert r.status == 206
        chunk = r.read(1025)
        assert len(chunk) > 0
        content_range = r.headers.get('Content-Range')
        assert content_range and 'bytes' in content_range
        print(f"[TEST] PASS: Proxy stream delivered 206 Partial Content ({content_range}, read {len(chunk)} bytes)")

    # 11. Test Album Details Endpoint
    print("[TEST] Checking /api/search for default album results...")
    with urllib.request.urlopen(f"{base}/api/search?q=Starboy&filter=albums", timeout=10) as r:
        search_data = json.loads(r.read().decode('utf-8'))
        assert "results" in search_data and len(search_data['results']) > 0
        album_item = search_data['results'][0]
        assert "browseId" in album_item
        album_bid = album_item['browseId']
        print(f"[TEST] PASS: Found album '{album_item['title']}' (browseId: {album_bid})")

    print(f"[TEST] Checking /api/album/{album_bid}...")
    with urllib.request.urlopen(f"{base}/api/album/{album_bid}", timeout=10) as r:
        assert r.status == 200
        album_data = json.loads(r.read().decode('utf-8'))
        assert "tracks" in album_data
        assert len(album_data['tracks']) > 0
        print(f"[TEST] PASS: Album endpoint returned '{album_data['title']}' with {len(album_data['tracks'])} tracks")

    print("\n==========================================")
    print("ALL 11 BACKEND, STREAMING & ALBUM VERIFICATION TESTS PASSED 100%!")
    print("==========================================")

if __name__ == '__main__':
    run_tests()
