import os
import json
from PIL import Image
import numpy as np

FLAGS_DIR = 'flags/state_flags_png'
THUMBNAILS_DIR = 'thumbnails'
THUMBNAIL_SIZE = (64, 40)
OUTPUT_JSON = 'flags_rgb.json'

os.makedirs(THUMBNAILS_DIR, exist_ok=True)

flags_data = []

for filename in os.listdir(FLAGS_DIR):
    if filename.lower().endswith('.png'):
        state_name = filename.replace('.png', '').replace('_', ' ')
        img_path = os.path.join(FLAGS_DIR, filename)
        img = Image.open(img_path).convert('RGB')
        arr = (np.array(img) / 255.0).reshape(-1, 3)  # Normalize to [0,1]
        avg_rgb = arr.mean(axis=0)
        # Save thumbnail
        thumb_path = os.path.join(THUMBNAILS_DIR, filename)
        img.thumbnail(THUMBNAIL_SIZE)
        img.save(thumb_path)
        flags_data.append({
            'state': state_name,
            'filename': filename,
            'avg_rgb': avg_rgb.tolist(),
            'thumbnail': thumb_path
        })

with open(OUTPUT_JSON, 'w') as f:
    json.dump(flags_data, f, indent=2)

print(f"Processed {len(flags_data)} flags. Data saved to {OUTPUT_JSON} and thumbnails to {THUMBNAILS_DIR}/")
