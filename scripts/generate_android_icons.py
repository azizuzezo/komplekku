import os
from PIL import Image

src_path = 'assets/brand/komplekku-mark.png'
src = Image.open(src_path)
bbox = src.getbbox()
cropped = src.crop(bbox)

legacy_densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

adaptive_densities = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}

launch_sizes = {
    'mipmap-mdpi': 96,
    'mipmap-hdpi': 144,
    'mipmap-xhdpi': 192,
    'mipmap-xxhdpi': 288,
    'mipmap-xxxhdpi': 384,
}

base_res = 'apps/mobile/android/app/src/main/res'

for folder, size in legacy_densities.items():
    target_dir = os.path.join(base_res, folder)
    os.makedirs(target_dir, exist_ok=True)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    fit_size = int(size * 0.85)
    mark_resized = cropped.copy()
    mark_resized.thumbnail((fit_size, fit_size), Image.Resampling.LANCZOS)
    offset_x = (size - mark_resized.width) // 2
    offset_y = (size - mark_resized.height) // 2
    canvas.paste(mark_resized, (offset_x, offset_y), mark_resized)
    canvas.save(os.path.join(target_dir, 'ic_launcher.png'))
    canvas.save(os.path.join(target_dir, 'ic_launcher_round.png'))

for folder, size in adaptive_densities.items():
    target_dir = os.path.join(base_res, folder)
    os.makedirs(target_dir, exist_ok=True)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    fit_size = int(size * 0.56)
    mark_resized = cropped.copy()
    mark_resized.thumbnail((fit_size, fit_size), Image.Resampling.LANCZOS)
    offset_x = (size - mark_resized.width) // 2
    offset_y = (size - mark_resized.height) // 2
    canvas.paste(mark_resized, (offset_x, offset_y), mark_resized)
    canvas.save(os.path.join(target_dir, 'ic_launcher_foreground.png'))

for folder, size in launch_sizes.items():
    target_dir = os.path.join(base_res, folder)
    mark_resized = cropped.copy()
    mark_resized.thumbnail((size, size), Image.Resampling.LANCZOS)
    mark_resized.save(os.path.join(target_dir, 'launch_image.png'))

print('App icons and launch images generated successfully.')
