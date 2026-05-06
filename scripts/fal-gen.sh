#!/usr/bin/env bash
# fal-gen.sh — submit a fal queue job, poll, download outputs to /media
# Usage: ./fal-gen.sh <model_path> <out_basename> <prompt_json_file>
set -euo pipefail

MODEL="${1:?model path required (e.g. fal-ai/flux-pro/v1.1-ultra)}"
OUT="${2:?out basename required}"
PAYLOAD_FILE="${3:?payload json file required}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MEDIA="$ROOT/media"
mkdir -p "$MEDIA"

# Load FAL_KEY
if [[ -z "${FAL_KEY:-}" ]]; then
  if [[ -f "$ROOT/.env.local" ]]; then
    export $(grep -E '^FAL_KEY=' "$ROOT/.env.local" | xargs)
  fi
fi
: "${FAL_KEY:?FAL_KEY not set}"

echo "→ Submitting to $MODEL"
SUBMIT=$(curl -s -X POST "https://queue.fal.run/$MODEL" \
  -H "Authorization: Key $FAL_KEY" \
  -H "Content-Type: application/json" \
  --data @"$PAYLOAD_FILE")

REQUEST_ID=$(echo "$SUBMIT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('request_id',''))")
if [[ -z "$REQUEST_ID" ]]; then
  echo "FAIL: $SUBMIT"
  exit 1
fi

# Determine the base path for status / response
BASE_PATH=$(echo "$MODEL" | awk -F/ '{print $1"-"$2"/"$2}' )
# Use returned URLs from submit when present
STATUS_URL=$(echo "$SUBMIT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status_url',''))")
RESPONSE_URL=$(echo "$SUBMIT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response_url',''))")

echo "  request_id=$REQUEST_ID"
echo "  status_url=$STATUS_URL"

# Poll
ATTEMPTS=0
while true; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [[ $ATTEMPTS -gt 240 ]]; then
    echo "TIMEOUT after $ATTEMPTS polls"
    exit 1
  fi
  STATUS_JSON=$(curl -s "$STATUS_URL" -H "Authorization: Key $FAL_KEY")
  STATUS=$(echo "$STATUS_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))")
  echo "  [$ATTEMPTS] $STATUS"
  case "$STATUS" in
    COMPLETED) break ;;
    FAILED|ERROR) echo "FAIL: $STATUS_JSON"; exit 1 ;;
    *) sleep 3 ;;
  esac
done

RESULT=$(curl -s "$RESPONSE_URL" -H "Authorization: Key $FAL_KEY")
echo "$RESULT" > "$MEDIA/$OUT.json"

# Extract first image url OR video url
URL=$(echo "$RESULT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for k in ('images','image'):
  v=d.get(k)
  if isinstance(v,list) and v:
    print(v[0].get('url','')); sys.exit(0)
  if isinstance(v,dict):
    print(v.get('url','')); sys.exit(0)
v=d.get('video')
if isinstance(v,dict): print(v.get('url','')); sys.exit(0)
print('')
")

if [[ -z "$URL" ]]; then
  echo "FAIL: no url in result"
  echo "$RESULT" | head -c 500
  exit 1
fi

EXT="${URL##*.}"
EXT="${EXT%%\?*}"
[[ "$EXT" == "$URL" ]] && EXT="bin"
[[ ${#EXT} -gt 4 ]] && EXT="bin"

OUT_FILE="$MEDIA/$OUT.$EXT"
echo "→ Downloading $URL"
curl -sL "$URL" -o "$OUT_FILE"
ls -lh "$OUT_FILE"
echo "OK $OUT_FILE"
