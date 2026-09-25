import os
from PIL import Image, ImageDraw, ImageFont

SRC_PATH = r"C:/Users/khali/.gemini/antigravity/brain/dfb43046-ef90-46bd-967f-e24fe7a520bc/.user_uploaded/media_1790368270795.jpg"
SPLASH_PATH = r"c:\music\splash.png"

def create_splash():
    # 600 x 380 splash window
    W, H = 600, 380
    # PyInstaller on Windows uses magenta (#ff00ff) as the transparent colorkey
    MAGENTA = (255, 0, 255, 255)
    img = Image.new("RGBA", (W, H), MAGENTA)
    draw = ImageDraw.Draw(img)

    # Rounded card backdrop
    draw.rounded_rectangle([2, 2, W - 3, H - 3], radius=16, fill=(13, 13, 20, 255))

    # Outer subtle rounded frame with glowing neon cyan/violet border
    for i in range(2):
        draw.rounded_rectangle([i, i, W - 1 - i, H - 1 - i], radius=16, outline=(0, 240, 255, 180), width=1)

    # 2. Add circular avatar in the center
    # Zoom in on character face: x=270, y=240, box=470
    avatar_src = Image.open(SRC_PATH).convert("RGBA")
    box_size = 470
    cx, cy = 270, 240
    left = max(0, int(cx - box_size / 2))
    top = max(0, int(cy - box_size / 2))
    cropped = avatar_src.crop((left, top, left + box_size, top + box_size))
    
    avatar_dim = 130
    cropped = cropped.resize((avatar_dim, avatar_dim), Image.Resampling.LANCZOS)

    # Circular mask with 2x supersampling
    mask = Image.new("L", (avatar_dim * 2, avatar_dim * 2), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.ellipse((2, 2, avatar_dim * 2 - 3, avatar_dim * 2 - 3), fill=255)
    mask = mask.resize((avatar_dim, avatar_dim), Image.Resampling.LANCZOS)

    # Centered avatar position
    av_x = (W - avatar_dim) // 2
    av_y = 42

    # Glowing outer ring
    ring_pad = 12
    draw.ellipse(
        [av_x - ring_pad, av_y - ring_pad, av_x + avatar_dim + ring_pad, av_y + avatar_dim + ring_pad],
        outline=(0, 240, 255, 120),
        width=2
    )
    # Inner pink/violet ring
    draw.ellipse(
        [av_x - 4, av_y - 4, av_x + avatar_dim + 4, av_y + avatar_dim + 4],
        outline=(168, 85, 247, 200),
        width=2
    )

    # Paste avatar
    img.paste(cropped, (av_x, av_y), mask)

    # 3. Typography
    font_dir = "C:/Windows/Fonts"
    try:
        font_title = ImageFont.truetype(os.path.join(font_dir, "segoeuib.ttf"), 32)
        font_sub = ImageFont.truetype(os.path.join(font_dir, "segoeui.ttf"), 11)
        font_status = ImageFont.truetype(os.path.join(font_dir, "consolab.ttf"), 11)
    except Exception:
        font_title = font_sub = font_status = ImageFont.load_default()

    # "ETSUKO" Title
    title_text = "E T S U K O"
    tb = draw.textbbox((0, 0), title_text, font=font_title)
    tw = tb[2] - tb[0]
    draw.text(((W - tw) // 2, 202), title_text, font=font_title, fill=(240, 250, 255, 255))

    # Subtitle
    sub_text = "NEURAL AUDIO ENGINE  •  V68 STUDIO"
    tb_sub = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = tb_sub[2] - tb_sub[0]
    draw.text(((W - sw) // 2, 248), sub_text, font=font_sub, fill=(148, 163, 184, 255))

    # 4. High-tech Cyber Progress Track
    bar_w, bar_h = 320, 5
    bar_x = (W - bar_w) // 2
    bar_y = 286

    # Track background
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], radius=3, fill=(30, 30, 45, 255))

    # Gradient progress fill (75% full)
    fill_w = int(bar_w * 0.72)
    for x in range(fill_w):
        ratio = x / fill_w
        r = int(0 * (1 - ratio) + 168 * ratio)
        g = int(240 * (1 - ratio) + 85 * ratio)
        b = int(255 * (1 - ratio) + 247 * ratio)
        draw.line([(bar_x + x, bar_y), (bar_x + x, bar_y + bar_h)], fill=(r, g, b, 255), width=1)

    # 5. Status Text
    status_text = "INITIALIZING FREQUENCY MATRIX..."
    tb_st = draw.textbbox((0, 0), status_text, font=font_status)
    stw = tb_st[2] - tb_st[0]
    draw.text(((W - stw) // 2, 314), status_text, font=font_status, fill=(0, 240, 255, 220))

    img.save(SPLASH_PATH, format="PNG")
    print(f"[Etsuko] Created splash image at {SPLASH_PATH} ({W}x{H})")

if __name__ == "__main__":
    create_splash()
