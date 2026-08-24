import os
import re
import json
import urllib.request
import urllib.error
import time

TOKEN = os.environ.get("GITHUB_TOKEN")
if not TOKEN:
    print("No GITHUB_TOKEN provided")
    exit(1)

REPO_ID = "R_kgDOTznXWA"
CATEGORY_ID = "DIC_kwDOTznXWM4DDBk5"

def graphql_request(query, variables=None):
    url = "https://api.github.com/graphql"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

# 1. Parse index.md for all post IDs
post_ids = set()
try:
    with open("index.md", "r", encoding="utf-8") as f:
        content = f.read()
        # Find all openDiscussion('...') occurrences
        matches = re.findall(r"openDiscussion\('([^']+)'\)", content)
        for m in matches:
            if "${" not in m: # Ignore Javascript template literals
                post_ids.add(m)
except Exception as e:
    print(f"Warning: Could not parse index.md: {e}")

# 2. Fetch all existing discussions from GitHub
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
result = graphql_request(QUERY)
nodes = result.get("data", {}).get("repository", {}).get("discussions", {}).get("nodes", [])

new_counts = {}
existing_titles = set()
for node in nodes:
    title = node.get("title")
    if not title: continue
    existing_titles.add(title)
    comments_count = node.get("comments", {}).get("totalCount", 0)
    reactions_count = node.get("reactions", {}).get("totalCount", 0)
    new_counts[title] = comments_count + reactions_count

# 3. Create missing discussions via GraphQL mutation
CREATE_MUTATION = """
mutation CreateDiscussion($repoId: ID!, $catId: ID!, $title: String!, $body: String!) {
  createDiscussion(input: {repositoryId: $repoId, categoryId: $catId, title: $title, body: $body}) {
    discussion {
      id
    }
  }
}
"""
created_count = 0
for pid in post_ids:
    if pid not in existing_titles:
        print(f"Creating missing discussion for {pid}...")
        variables = {
            "repoId": REPO_ID,
            "catId": CATEGORY_ID,
            "title": pid,
            "body": f"Automated discussion thread for blog post: {pid}"
        }
        try:
            graphql_request(CREATE_MUTATION, variables)
            new_counts[pid] = 0
            created_count += 1
            # Sleep slightly to avoid GraphQL abuse rate limits
            time.sleep(1)
        except Exception as e:
            print(f"Failed to create {pid}: {e}")

output_path = "assets/data/comments.json"

# 4. Read existing data to preserve caching
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
    json.dump(comments_data, f, indent=2, sort_keys=True)
    f.write("\n")

print(f"Successfully wrote {len(new_counts)} entries to {output_path} ({created_count} newly created)")
