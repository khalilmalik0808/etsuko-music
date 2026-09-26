import os
import sys
import subprocess
import shutil

def build_exe():
    print("=" * 60)
    print("Compiling Etsuko Standalone Executable (etsuko.exe)...")
    print("=" * 60)

    # Ensure icons and splash screen exist
    if not os.path.exists("etsuko.ico"):
        import update_icon
        update_icon.generate_icons()
    if not os.path.exists("splash.png"):
        import create_splash
        create_splash.create_splash()

    # Compile Standalone OneFile Version (Portable single file)
    print("\nCompiling Standalone OneFile Version (dist/etsuko.exe)...")
    cmd_file = [
        sys.executable,
        "-m", "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--noconsole",
        "--name", "etsuko",
        "--icon", "etsuko.ico",
        "--add-data", "frontend;frontend",
        "--add-data", "etsuko.ico;.",
        "--hidden-import", "bottle",
        "--hidden-import", "requests",
        "--hidden-import", "ytmusicapi",
        "--hidden-import", "yt_dlp",
        "--hidden-import", "webview",
        "--hidden-import", "sqlite3",
        "main.py"
    ]
    res = subprocess.run(cmd_file)

    # Create Windows Desktop Shortcut pointing to etsuko.exe
    try:
        exe_path = os.path.abspath(os.path.join("dist", "etsuko.exe"))
        ico_file = os.path.abspath("etsuko.ico")
        ps_cmd = f'$desktop = [Environment]::GetFolderPath("Desktop"); $WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut("$desktop\\Etsuko.lnk"); $Shortcut.TargetPath = "{exe_path}"; $Shortcut.WorkingDirectory = "{os.path.dirname(exe_path)}"; $Shortcut.IconLocation = "{ico_file}"; $Shortcut.Save()'
        subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True)
        print(f"\n[Etsuko] Updated Desktop Shortcut to point to {exe_path}")
    except Exception as e:
        print(f"[Etsuko] Shortcut note: {e}")

    if res.returncode == 0:
        onefile_path = os.path.abspath(os.path.join("dist", "etsuko.exe"))
        size_mb = os.path.getsize(onefile_path) / (1024 * 1024)

        # Compile Inno Setup Windows Installer if available
        setup_exe = None
        iscc_candidates = [
            os.path.expandvars(r"%LOCALAPPDATA%\Programs\Inno Setup 6\ISCC.exe"),
            r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
            r"C:\Program Files\Inno Setup 6\ISCC.exe",
            shutil.which("iscc")
        ]
        iscc_path = next((p for p in iscc_candidates if p and os.path.exists(p)), None)
        if iscc_path and os.path.exists("installer.iss"):
            print("\n" + "=" * 60)
            print("Compiling Windows Setup Installer (Etsuko_Setup.exe)...")
            print("=" * 60)
            setup_res = subprocess.run([iscc_path, "installer.iss"])
            if setup_res.returncode == 0:
                setup_exe = os.path.abspath(os.path.join("dist", "Etsuko_Setup.exe"))

        print("\n" + "=" * 60)
        print("BUILD SUCCESSFUL!")
        print(f"Standalone EXE:   {onefile_path} ({size_mb:.2f} MB)")
        if setup_exe and os.path.exists(setup_exe):
            setup_mb = os.path.getsize(setup_exe) / (1024 * 1024)
            print(f"Windows Setup:    {setup_exe} ({setup_mb:.2f} MB)")
        print(f"Desktop Shortcut: [Desktop]\\Etsuko.lnk")
        print("=" * 60)
        return True
    
    print("\n[Etsuko] Build failed!")
    return False

if __name__ == "__main__":
    success = build_exe()
    sys.exit(0 if success else 1)
