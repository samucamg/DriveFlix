import os
import base64
import io
import shutil
from PIL import Image

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_IMG = os.path.join(BASE_DIR, 'DriveFlin.png')

# Working directories
WEBCLIENT_DIR = os.path.join(BASE_DIR, 'src', 'assets', 'img')
ICON_DIR = os.path.join(WEBCLIENT_DIR, 'icon-transparent')
FLAT_DIR = os.path.join(BASE_DIR, 'driveflin-web-assets')

# Crop coordinates (from source analysis)
MARK_BBOX = (706, 184, 1186, 651)       # => 480 x 467 (nearly square)
TEXT_BBOX = (525, 701, 1367, 874)       # => 842 x 173

# ------------------------------------------------------------------
# Load source and prepare crops
# ------------------------------------------------------------------
source = Image.open(SOURCE_IMG).convert('RGBA')
mark_img = source.crop(MARK_BBOX)        # 480 x 467
oc_text_img = source.crop(TEXT_BBOX)     # 842 x 173 (dark blue/purple)

# Create white version of the text for banner-dark (keeps alpha mask)
r_t, g_t, b_t, alpha_t = oc_text_img.split()
white_text = Image.new('RGBA', oc_text_img.size, (255, 255, 255, 255))
white_text.putalpha(alpha_t)

# ------------------------------------------------------------------
# Icon generation (square mark on transparent background)
# ------------------------------------------------------------------
def make_icon(mark, size, fill=0.90):
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    target_w = int(size * fill)
    target_h = int(target_w * mark.height / mark.width)
    mark_scaled = mark.resize((target_w, target_h), Image.Resampling.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    canvas.paste(mark_scaled, (x, y), mark_scaled)
    return canvas

# ------------------------------------------------------------------
# Banner generation (mark left + text right, 800x200)
# ------------------------------------------------------------------
def make_banner(mark, text, width=800, height=200,
                mark_h=150, text_h=78, gap=28, out_margin=None):
    canvas = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    mark_w = int(mark.width * (mark_h / mark.height))
    mark_scaled = mark.resize((mark_w, mark_h), Image.Resampling.LANCZOS)
    text_w = int(text.width * (text_h / text.height))
    text_scaled = text.resize((text_w, text_h), Image.Resampling.LANCZOS)

    total_w = mark_w + gap + text_w
    margin = out_margin if out_margin is not None else max(8, (width - total_w) // 2)
    x = margin
    y_mark = (height - mark_h) // 2
    y_text = (height - text_h) // 2
    canvas.paste(mark_scaled, (x, y_mark), mark_scaled)
    canvas.paste(text_scaled, (x + mark_w + gap, y_text), text_scaled)
    return canvas

# Banner-light: dark text (original), centered
banner_light = make_banner(mark_img, oc_text_img, width=800, height=200,
                           mark_h=150, text_h=78, gap=28)

# Banner-dark: white text, centered
banner_dark = make_banner(mark_img, white_text, width=800, height=200,
                          mark_h=150, text_h=78, gap=28)

# High-res banners for SVG embedding (1600x400)
banner_light_hi = make_banner(mark_img, oc_text_img, width=1600, height=400,
                              mark_h=300, text_h=156, gap=56)
banner_dark_hi = make_banner(mark_img, white_text, width=1600, height=400,
                             mark_h=300, text_h=156, gap=56)

# High-res logo icon for SVG embedding (1024x1024)
logo_hi = make_icon(mark_img, 1024, fill=0.90)

# ------------------------------------------------------------------
# Output helpers
# ------------------------------------------------------------------
def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def save_png(img, path):
    ensure_dir(os.path.dirname(path))
    img.save(path, 'PNG')
    return path

# ------------------------------------------------------------------
# Build webclient tree
# ------------------------------------------------------------------
icon_sizes = {
    'logo.png': 400,
    'icon-transparent.png': 512,
    'icon-transparent-192.png': 192,
    'icon-transparent-144.png': 144,
    'icon-transparent-96.png': 96,
    'icon-transparent-72.png': 72,
    'icon-transparent-48.png': 48,
    'icon-transparent-36.png': 36,
}
for name, size in icon_sizes.items():
    save_png(make_icon(mark_img, size), os.path.join(ICON_DIR, name))
    print('Generated', os.path.join('icon-transparent', name), size)

# src/assets/img/ (touchicons, favicon, banners)
save_png(make_icon(mark_img, 192), os.path.join(WEBCLIENT_DIR, 'touchicon.png'))
save_png(make_icon(mark_img, 72), os.path.join(WEBCLIENT_DIR, 'touchicon72.png'))
save_png(make_icon(mark_img, 114), os.path.join(WEBCLIENT_DIR, 'touchicon114.png'))
save_png(make_icon(mark_img, 144), os.path.join(WEBCLIENT_DIR, 'touchicon144.png'))
save_png(make_icon(mark_img, 32, fill=0.88), os.path.join(WEBCLIENT_DIR, 'favicon.png'))
save_png(banner_light, os.path.join(WEBCLIENT_DIR, 'banner-light.png'))
save_png(banner_dark, os.path.join(WEBCLIENT_DIR, 'banner-dark.png'))
print('Generated touchicon, touchicon72, touchicon114, touchicon144, favicon, banners')

# favicon.ico (multi-resolution: 16x16, 32x32, 48x48)
# Save from a 48px source so Pillow can render all requested sizes.
favicon_base = make_icon(mark_img, 48, fill=0.88)
ico_path = os.path.join(WEBCLIENT_DIR, 'favicon.ico')
favicon_base.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
print('Generated favicon.ico')

# ------------------------------------------------------------------
# SVG generation
# ------------------------------------------------------------------
def img_to_base64(img, fmt='PNG'):
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode('ascii')

def svg_with_image(viewbox_w, viewbox_h, raster_img, title):
    b64 = img_to_base64(raster_img)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="0 0 {viewbox_w} {viewbox_h}" width="{viewbox_w}" height="{viewbox_h}">
  <title>{title}</title>
  <image x="0" y="0" width="{viewbox_w}" height="{viewbox_h}"
         xlink:href="data:image/png;base64,{b64}" />
</svg>
'''

# logo.svg (viewBox 0 0 512 512)
logo_svg = svg_with_image(512, 512, logo_hi, 'logo')
icon_svg_path = os.path.join(ICON_DIR, 'logo.svg')
ensure_dir(ICON_DIR)
open(icon_svg_path, 'w', encoding='utf-8').write(logo_svg)
print('Generated logo.svg')

# banner-light.svg / banner-dark.svg (viewBox 0 0 800 200)
banner_light_svg = svg_with_image(800, 200, banner_light_hi, 'banner-light')
banner_dark_svg = svg_with_image(800, 200, banner_dark_hi, 'banner-dark')
open(os.path.join(WEBCLIENT_DIR, 'banner-light.svg'), 'w', encoding='utf-8').write(banner_light_svg)
open(os.path.join(WEBCLIENT_DIR, 'banner-dark.svg'), 'w', encoding='utf-8').write(banner_dark_svg)
print('Generated banner-light.svg and banner-dark.svg')

# ------------------------------------------------------------------
# Flat folder with all assets at the same level
# ------------------------------------------------------------------
if os.path.exists(FLAT_DIR):
    shutil.rmtree(FLAT_DIR)
ensure_dir(FLAT_DIR)

flat_files = []
for name in list(icon_sizes.keys()) + ['logo.svg']:
    src = os.path.join(ICON_DIR, name)
    if os.path.exists(src):
        flat_files.append(src)
for name in ['touchicon.png', 'touchicon72.png', 'touchicon114.png',
             'touchicon144.png', 'favicon.png', 'favicon.ico',
             'banner-light.png', 'banner-dark.png',
             'banner-light.svg', 'banner-dark.svg']:
    src = os.path.join(WEBCLIENT_DIR, name)
    if os.path.exists(src):
        flat_files.append(src)

for src in flat_files:
    shutil.copy2(src, os.path.join(FLAT_DIR, os.path.basename(src)))

print('Flat folder populated with', len(flat_files), 'files')

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
def png_size(path):
    try:
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None

print()
print('=== FINAL SUMMARY ===')
print('Icon-transparent folder:')
for name in icon_sizes:
    p = os.path.join(ICON_DIR, name)
    print('  ', name, png_size(p))
print('Webclient folder:')
for name in ['touchicon.png', 'touchicon72.png', 'touchicon114.png',
             'touchicon144.png', 'favicon.png', 'favicon.ico',
             'banner-light.png', 'banner-dark.png',
             'banner-light.svg', 'banner-dark.svg']:
    p = os.path.join(WEBCLIENT_DIR, name)
    print('  ', name, png_size(p) if p.endswith('.png') else 'SVG')
print('Flat folder:', sorted(os.listdir(FLAT_DIR)))