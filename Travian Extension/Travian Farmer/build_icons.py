"""Resize icons/image.jpg to 48.png and 128.png. Requires: pip install Pillow"""
import os

try:
    from PIL import Image
except ImportError:
    print("Install Pillow: pip install Pillow")
    raise

base = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(base, "icons", "image.jpg")
if not os.path.isfile(src):
    print("icons/image.jpg not found")
    exit(1)
img = Image.open(src).convert("RGBA")
for size, name in [(48, "48.png"), (128, "128.png")]:
    out = os.path.join(base, "icons", name)
    img.resize((size, size), Image.Resampling.LANCZOS).save(out)
    print("Wrote", out)
