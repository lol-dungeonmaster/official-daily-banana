import os
import json
import urllib.request
import urllib.error
import time

TOKEN = os.environ.get("GITHUB_TOKEN")
if not TOKEN:
    print("No GITHUB_TOKEN provided")
    exit(1)

QUERY = """
query {
  repository(owner: "lol-dungeonmaster", name: "official-daily-banana") {
    discussions(first: 100, categoryId: "DIC_kwDOTznXWM4DDBk5") {
      nodes {
        title
        comments {
          totalCount
        }
        reactions {
          totalCount
        }
      }
    }
  }
}
"""

url = "https://api.github.com/graphql"
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}
data = json.dumps({"query": QUERY}).encode("utf-8")

try:
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
except Exception as e:
    print(f"Error fetching data: {e}")
    exit(1)

nodes = result.get("data", {}).get("repository", {}).get("discussions", {}).get("nodes", [])

new_counts = {}
for node in nodes:
    title = node.get("title")
    if not title: continue
    comments_count = node.get("comments", {}).get("totalCount", 0)
    reactions_count = node.get("reactions", {}).get("totalCount", 0)
    new_counts[title] = comments_count + reactions_count

output_path = "assets/data/comments.json"

# Read existing data to preserve caching
existing_data = {}
existing_timestamp = int(time.time() * 1000)
if os.path.exists(output_path):
    try:
        with open(output_path, "r") as f:
            existing_data = json.load(f)
            if "_meta" in existing_data and "lastUpdated" in existing_data["_meta"]:
                existing_timestamp = existing_data["_meta"]["lastUpdated"]
    except Exception:
        pass

# Compare without _meta
old_counts = {k: v for k, v in existing_data.items() if k != "_meta"}
if new_counts != old_counts:
    existing_timestamp = int(time.time() * 1000)

comments_data = {
    "_meta": {
        "lastUpdated": existing_timestamp
    }
}
comments_data.update(new_counts)

with open(output_path, "w") as f:
    json.dump(comments_data, f, indent=2)

print(f"Successfully wrote {len(new_counts)} entries to {output_path}")
