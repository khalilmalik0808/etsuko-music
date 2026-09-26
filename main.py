import os
import sys
import time
import socket
import threading
import urllib.request

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
    # Prevent Windows/WebView2 from throttling or suspending background playback while gaming
    existing_args = os.environ.get('WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS', '')
    gamer_args = (
        '--disable-background-timer-throttling '
        '--disable-backgrounding-occluded-windows '
        '--disable-renderer-backgrounding '
        '--disable-features=CalculateNativeWinOcclusion '
        '--autoplay-policy=no-user-gesture-required'
    )
    os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS'] = f"{existing_args} {gamer_args}".strip()

import webview
from backend.server import start_server


PORT = 52331

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def find_free_port():
    if not is_port_in_use(PORT):
        return PORT
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def wait_for_server(url, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            with urllib.request.urlopen(url, timeout=1) as resp:
                if resp.status == 200:
                    return True
        except Exception:
            time.sleep(0.15)
    return False

def run_server_supervised(host, port):
    while True:
        try:
            start_server(host, port)
        except Exception as e:
            print(f"[Etsuko] Server supervisor caught error: {e}. Restarting in 1s...")
            time.sleep(1.0)

def main():
    port = find_free_port()
    server_thread = threading.Thread(target=run_server_supervised, args=('127.0.0.1', port), daemon=True)
    server_thread.start()

    url = f"http://127.0.0.1:{port}/"
    if not wait_for_server(url, timeout=12):
        print(f"[Etsuko] Failed to connect to internal server at {url}")
        sys.exit(1)

    # Locate window & taskbar icon
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        icon_path = os.path.join(sys._MEIPASS, "etsuko.ico")
        if not os.path.exists(icon_path):
            icon_path = os.path.join(sys._MEIPASS, "frontend", "assets", "logo.png")
    else:
        icon_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "etsuko.ico"))

    # Set explicit AppUserModelID on Windows for dedicated taskbar icon grouping
    if sys.platform == 'win32':
        try:
            import ctypes
            ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID('etsuko.audio.engine.v68')
        except Exception:
            pass

    # Launch desktop UI without blank flash
    window = webview.create_window(
        title='Etsuko',
        url=url,
        width=1280,
        height=820,
        min_size=(960, 600),
        background_color='#09090d',
        hidden=True,
        focus=True
    )

    def reveal_and_focus():
        try:
            window.show()
            if sys.platform == 'win32':
                import ctypes
                time.sleep(0.05)
                hwnd = ctypes.windll.user32.FindWindowW(None, "Etsuko")
                if hwnd:
                    ctypes.windll.user32.ShowWindow(hwnd, 9)  # SW_RESTORE
                    ctypes.windll.user32.SetForegroundWindow(hwnd)
        except Exception:
            pass

    window.events.loaded += reveal_and_focus

    def fallback_watcher():
        # Fallback to ensure window is shown even if loaded event was missed
        time.sleep(1.2)
        reveal_and_focus()

    webview.start(fallback_watcher, debug=False, icon=icon_path if os.path.exists(icon_path) else None)

if __name__ == '__main__':
    main()
