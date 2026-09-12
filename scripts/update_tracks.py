import os
import json

AUDIO_DIR = "assets/audio"
JSON_FILE = "assets/data/tracks.json"

supported_exts = {".mp3", ".wav", ".flac", ".ogg", ".m4a"}

tracks = []
if os.path.exists(AUDIO_DIR):
    for filename in sorted(os.listdir(AUDIO_DIR)):
        ext = os.path.splitext(filename)[1].lower()
        if ext in supported_exts:
            # Generate a nice title from the filename
            title = os.path.splitext(filename)[0].replace("-", " ").replace("_", " ").title()
            tracks.append({
                "title": title,
                "file": f"assets/audio/{filename}",
                "space_url": "https://example.com/flow-music-space-link"
            })

if not tracks:
    print(f"Warning: No supported audio files found in {AUDIO_DIR}")

with open(JSON_FILE, "w") as f:
    json.dump(tracks, f, indent=2)

print(f"Successfully updated {JSON_FILE} with {len(tracks)} tracks.")
