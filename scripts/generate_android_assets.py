import os
from PIL import Image, ImageDraw

def create_android_assets():
    source_logo_path = 'public/logo.png'
    if not os.path.exists(source_logo_path):
        print(f"Error: {source_logo_path} not found!")
        return

    logo = Image.open(source_logo_path).convert('RGBA')

    # Color definitions
    BG_COLOR_HEX = "#1c1917"
    BG_COLOR_RGB = (28, 25, 23, 255)
    BG_COLOR_RGB_OPAQUE = (28, 25, 23)

    # 1. Update colors and vector background
    with open('android/app/src/main/res/values/ic_launcher_background.xml', 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#1c1917</color>
</resources>
''')

    with open('android/app/src/main/res/drawable/ic_launcher_background.xml', 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportHeight="108"
    android:viewportWidth="108">
    <path
        android:fillColor="#1c1917"
        android:pathData="M0,0h108v108h-108z" />
</vector>
''')

    # Dimensions for mipmaps
    # format: (folder_name, launcher_size, foreground_size)
    densities = [
        ('mipmap-mdpi', 48, 108),
        ('mipmap-hdpi', 72, 162),
        ('mipmap-xhdpi', 96, 216),
        ('mipmap-xxhdpi', 144, 324),
        ('mipmap-xxxhdpi', 192, 432),
    ]

    for folder, l_size, fg_size in densities:
        out_dir = os.path.join('android/app/src/main/res', folder)
        os.makedirs(out_dir, exist_ok=True)

        # A. Foreground icon (Adaptive icon foreground)
        # Foreground canvas is fg_size x fg_size with transparent background.
        # Safe zone is the central 66% area (inner 72dp of 108dp).
        # We scale logo to ~68% of fg_size.
        fg_canvas = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        target_logo_size = int(fg_size * 0.68)
        scaled_logo = logo.resize((target_logo_size, target_logo_size), Image.Resampling.LANCZOS)
        offset_fg = ((fg_size - target_logo_size) // 2, (fg_size - target_logo_size) // 2)
        fg_canvas.paste(scaled_logo, offset_fg, scaled_logo)
        fg_canvas.save(os.path.join(out_dir, 'ic_launcher_foreground.png'), 'PNG')

        # B. Legacy ic_launcher.png (Rounded square background with logo)
        legacy_canvas = Image.new('RGBA', (l_size, l_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(legacy_canvas)
        # Rounded rectangle background
        radius = int(l_size * 0.22)
        draw.rounded_rectangle([(0, 0), (l_size - 1, l_size - 1)], radius=radius, fill=BG_COLOR_RGB)
        # Paste logo in center (~84% size)
        target_l_logo_size = int(l_size * 0.84)
        scaled_l_logo = logo.resize((target_l_logo_size, target_l_logo_size), Image.Resampling.LANCZOS)
        offset_l = ((l_size - target_l_logo_size) // 2, (l_size - target_l_logo_size) // 2)
        legacy_canvas.paste(scaled_l_logo, offset_l, scaled_l_logo)
        legacy_canvas.save(os.path.join(out_dir, 'ic_launcher.png'), 'PNG')

        # C. Round ic_launcher_round.png (Circular background with logo)
        round_canvas = Image.new('RGBA', (l_size, l_size), (0, 0, 0, 0))
        draw_round = ImageDraw.Draw(round_canvas)
        draw_round.ellipse([(0, 0), (l_size - 1, l_size - 1)], fill=BG_COLOR_RGB)
        target_r_logo_size = int(l_size * 0.86)
        scaled_r_logo = logo.resize((target_r_logo_size, target_r_logo_size), Image.Resampling.LANCZOS)
        offset_r = ((l_size - target_r_logo_size) // 2, (l_size - target_r_logo_size) // 2)
        round_canvas.paste(scaled_r_logo, offset_r, scaled_r_logo)
        round_canvas.save(os.path.join(out_dir, 'ic_launcher_round.png'), 'PNG')

        print(f"Generated icons for {folder}: launcher={l_size}x{l_size}, foreground={fg_size}x{fg_size}")

    # 3. Splash screens in drawable* folders
    # List of all splash target files and sizes:
    splashes = [
        ('drawable/splash.png', 480, 320),
        ('drawable-land-mdpi/splash.png', 480, 320),
        ('drawable-land-hdpi/splash.png', 800, 480),
        ('drawable-land-xhdpi/splash.png', 1280, 720),
        ('drawable-land-xxhdpi/splash.png', 1600, 960),
        ('drawable-land-xxxhdpi/splash.png', 1920, 1280),
        ('drawable-port-mdpi/splash.png', 320, 480),
        ('drawable-port-hdpi/splash.png', 480, 800),
        ('drawable-port-xhdpi/splash.png', 720, 1280),
        ('drawable-port-xxhdpi/splash.png', 960, 1600),
        ('drawable-port-xxxhdpi/splash.png', 1280, 1920),
    ]

    for rel_path, w, h in splashes:
        target_path = os.path.join('android/app/src/main/res', rel_path)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        splash_img = Image.new('RGB', (w, h), BG_COLOR_RGB_OPAQUE)
        
        # Center logo: height around 35-40% of shorter dimension
        short_dim = min(w, h)
        logo_splash_size = max(64, int(short_dim * 0.38))
        scaled_splash_logo = logo.resize((logo_splash_size, logo_splash_size), Image.Resampling.LANCZOS)
        offset_sp = ((w - logo_splash_size) // 2, (h - logo_splash_size) // 2)
        splash_img.paste(scaled_splash_logo, offset_sp, scaled_splash_logo)
        splash_img.save(target_path, 'PNG')
        print(f"Generated splash for {rel_path}: {w}x{h}")

    # 4. Generate high-res PWA 512x512
    pwa512 = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    # Fill maskable background
    draw_pwa = ImageDraw.Draw(pwa512)
    draw_pwa.rectangle([(0, 0), (511, 511)], fill=BG_COLOR_RGB)
    # Maskable safe zone is central 80%
    pwa_logo_size = int(512 * 0.75)
    scaled_pwa_logo = logo.resize((pwa_logo_size, pwa_logo_size), Image.Resampling.LANCZOS)
    pwa512.paste(scaled_pwa_logo, ((512 - pwa_logo_size) // 2, (512 - pwa_logo_size) // 2), scaled_pwa_logo)
    pwa512.save('public/pwa-512.png', 'PNG')
    print("Generated public/pwa-512.png (512x512 maskable)")

if __name__ == '__main__':
    create_android_assets()
