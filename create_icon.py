import os
from PIL import Image, ImageDraw

def create_etsuko_icon():
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Draw rounded squircle background
    padding = 12
    draw.rounded_rectangle(
        [(padding, padding), (size - padding, size - padding)],
        radius=48,
        fill="#121212",
        outline="#1db954",
        width=6
    )

    # Inner glow disc
    draw.ellipse([(40, 40), (size - 40, size - 40)], fill="#181818")

    # Soundwave bars in Spotify emerald green
    bars = [
        (65, 115, 80, 140, "#1db954"),
        (90, 85, 105, 170, "#1db954"),
        (115, 60, 130, 195, "#1ed760"),
        (140, 75, 155, 180, "#1db954"),
        (165, 100, 180, 155, "#1db954"),
        (190, 120, 205, 135, "#1db954"),
    ]

    for x1, y1, x2, y2, color in bars:
        draw.rounded_rectangle([(x1, y1), (x2, y2)], radius=7, fill=color)

    # Save PNG and multi-size ICO
    img.save("etsuko.png", format="PNG")
    img.save(
        "etsuko.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    )
    print("[Etsuko] Created etsuko.png and etsuko.ico successfully.")

if __name__ == "__main__":
    create_etsuko_icon()
