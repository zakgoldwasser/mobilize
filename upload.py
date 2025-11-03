
import os
import json
import glob
import tempfile
from pathlib import Path
from tqdm import tqdm
from google.colab import userdata

from openai import OpenAI

# ✅ 1) Configure your API key (prefer environment variable in Colab)
#    In Colab: Runtime > Run all, then paste your key below or set it in the env.
OPENAI_API_KEY = userdata.get('openai_api_key')
VECTOR_STORE_ID = userdata.get('vector_store_id')
assert OPENAI_API_KEY and OPENAI_API_KEY != "sk-REPLACE_ME", "Please set OPENAI_API_KEY."

client = OpenAI(api_key=OPENAI_API_KEY)



EVENTS_DIR = Path("events_json")
assert EVENTS_DIR.exists(), f"Folder not found: {EVENTS_DIR.resolve()}"

json_paths = sorted(glob.glob(str(EVENTS_DIR / "*.json")))
assert json_paths, f"No .json files found in {EVENTS_DIR}/"

def to_attr_str(value, max_len=256):
    """
    Convert any value to a safe attribute string (<=256 chars).
    Lists become comma-separated; None -> "".
    """
    if value is None:
        s = ""
    elif isinstance(value, (list, tuple)):
        s = ", ".join(map(str, value))
    else:
        s = str(value)
    return s[:max_len]

ok, failed = 0, 0
failures = []

for jp in tqdm(json_paths, desc="Uploading events"):
    try:
        with open(jp, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Build content (name + description) for the .txt file
        name = data.get("name") or data.get("event_name") or "Untitled Event"
        description = data.get("description") or ""
        
        # Format times as a readable list if available
        times_str = ""
        if data.get("times"):
            times_list = data.get("times")
            times_str = "\n".join([f"• {time}" for time in times_list])
            times_str = f"\nTimes:\n{times_str}"
            
        # Add additional fields to content
        content = f"{name}\n\n"
        
        if data.get("organization_name"):
            content += f"Organization: {data.get('organization_name')}\n"
            
        if data.get("is_virtual") is not None:
            content += f"Virtual Event: {'Yes' if data.get('is_virtual') else 'No'}\n"
            
        if data.get("event_type"):
            content += f"Event Type: {data.get('event_type')}\n"
            
        if data.get("country") or data.get("city"):
            location = f"Location: {data.get('city', '')}, {data.get('state', '')}, {data.get('country', '')}"
            content += f"{location.replace(', ,', ',').rstrip(', ')}\n"
            
        if data.get("accessibility_features") and len(data.get("accessibility_features")) > 0:
            features = ", ".join(data.get("accessibility_features"))
            content += f"Accessibility Features: {features}\n"
            
        content += f"\n{description}"
        
        # Add times at the end if available
        content += times_str
        
        content = content.strip()

        # Write to a temporary .txt file so the file has an extension (important for retrieval)
        # See community thread about requiring an extension. :contentReference[oaicite:2]{index=2}
        txt_filename = Path(jp).stem + ".txt"
        tmp_txt_path = Path(tempfile.gettempdir()) / txt_filename
        with open(tmp_txt_path, "w", encoding="utf-8") as tf:
            tf.write(content)

        # Upload the text file to OpenAI Files
        with open(tmp_txt_path, "rb") as fh:
            uploaded_file = client.files.create(
                file=fh,
                purpose="user_data",  # required for vector stores / retrieval usage. :contentReference[oaicite:3]{index=3}
            )

        # Prepare custom attributes (≤16 keys). We have 14 here.
        attributes = {
            "id": to_attr_str(data.get("id")),
            "name": to_attr_str(name),
            "accessibility_features": to_attr_str(data.get("accessibility_features")),
            "city": to_attr_str(data.get("city")),
            "country": to_attr_str(data.get("country")),
            "is_virtual": to_attr_str(data.get("is_virtual")),
            "state": to_attr_str(data.get("state")),
            "event_type": to_attr_str(data.get("event_type")),
            "zipcode": to_attr_str(data.get("zipcode")),
            "timezone": to_attr_str(data.get("timezone")),
            "organization_name": to_attr_str(data.get("organization_name")),
            "image_url": to_attr_str(data.get("image_url")),
        }

        # Attach the file to the vector store *with attributes*
        vs_file = client.vector_stores.files.create(
            vector_store_id=VECTOR_STORE_ID,
            file_id=uploaded_file.id,
            attributes=attributes,  # metadata/attributes attached to this vector store file. :contentReference[oaicite:4]{index=4}
        )

        # (Optional) Poll until processed; here we just print status that it's queued/processing/completed.
        print(f"Added: {Path(jp).name} → file_id={uploaded_file.id} vs_file_id={vs_file.id} status={getattr(vs_file, 'status', 'unknown')}")
        ok += 1

    except Exception as e:
        failed += 1
        failures.append((jp, repr(e)))

print(f"\nDone. Success: {ok} | Failed: {failed}")
if failures:
    print("Failures:")
    for path, err in failures:
        print(" -", path, "->", err)

