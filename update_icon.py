import os
from PIL import Image, ImageDraw

SRC_PATH = r"C:/Users/khali/.gemini/antigravity/brain/dfb43046-ef90-46bd-967f-e24fe7a520bc/.user_uploaded/media_1790368270795.jpg"
ASSETS_DIR = r"c:\music\frontend\assets"
os.makedirs(ASSETS_DIR, exist_ok=True)

def generate_icons():
    im = Image.open(SRC_PATH).convert("RGBA")
    
    # 1. Zoom into the face & star so it doesn't look tiny
    # Center on star and eye: x=270, y=240, box_size=470
    box_size = 470
    cx, cy = 270, 240
    left = max(0, int(cx - box_size / 2))
    top = max(0, int(cy - box_size / 2))
    right = left + box_size
    bottom = top + box_size

    size = 512
    cropped = im.crop((left, top, right, bottom))
    cropped = cropped.resize((size, size), Image.Resampling.LANCZOS)

    # 2. Anti-aliased circular mask (2x supersampling)
    mask_size = size * 2
    mask = Image.new("L", (mask_size, mask_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((4, 4, mask_size - 5, mask_size - 5), fill=255)
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)

    # Output with transparent outer background (NO harsh square borders)
    circular_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular_img.paste(cropped, (0, 0), mask)

    # 3. Add clean sleek neon-cyan rim so it stands out beautifully on Windows taskbar
    ring_mask = Image.new("L", (mask_size, mask_size), 0)
    ring_draw = ImageDraw.Draw(ring_mask)
    ring_draw.ellipse((4, 4, mask_size - 5, mask_size - 5), outline=255, width=6)
    ring_mask = ring_mask.resize((size, size), Image.Resampling.LANCZOS)

    ring_layer = Image.new("RGBA", (size, size), (0, 240, 255, 190))
    circular_img.paste(ring_layer, (0, 0), ring_mask)

    # Save PNG files
    logo_path = os.path.join(ASSETS_DIR, "logo.png")
    circular_img.save(logo_path, format="PNG")
    circular_img.save(r"c:\music\etsuko.png", format="PNG")
    
    default_cover_path = os.path.join(ASSETS_DIR, "default_cover.png")
    circular_img.save(default_cover_path, format="PNG")
    print(f"[Etsuko] Saved circular transparent logo.png, etsuko.png, default_cover.png")

    # 4. Generate multi-resolution .ico with high quality Lanczos resampled layers
    ico_path = r"c:\music\etsuko.ico"
    sizes = [(16, 16), (20, 20), (24, 24), (32, 32), (40, 40), (48, 48), (64, 64), (96, 96), (128, 128), (256, 256)]
    
    # Save with all sizes
    circular_img.save(
        ico_path,
        format="ICO",
        sizes=sizes
    )
    print(f"[Etsuko] Generated multi-resolution circular taskbar icon at {ico_path}")

if __name__ == "__main__":
    generate_icons()
