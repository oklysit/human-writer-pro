#!/usr/bin/env python3
"""
Minimal API caller for MoJo cross-model review. Takes a provider
(openai-compat or anthropic-compat), reads the bundled prompt from
stdin or a file path, POSTs it, writes the response to stdout.

Usage:
  python call-api.py --provider openai-compat \
      --endpoint "$GLM_API_ENDPOINT" --key "$GLM_API_KEY" \
      --model glm-5.1 --input bundle.md > out.md

  python call-api.py --provider anthropic-compat \
      --endpoint "$KIMI_API_ENDPOINT" --key "$KIMI_API_KEY" \
      --model kimi-for-coding --input bundle.md > out.md
"""
from __future__ import annotations
import argparse
import json
import sys
import urllib.request
import urllib.error


def call_openai_compat(endpoint: str, key: str, model: str, prompt: str) -> str:
    url = endpoint.rstrip("/") + "/chat/completions"
    payload = {
        "model": model,
        "max_tokens": 8000,
        "messages": [{"role": "user", "content": prompt}],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    choices = body.get("choices", [])
    if not choices:
        return json.dumps(body, indent=2)
    msg = choices[0].get("message", {})
    # GLM reasoning models include `reasoning_content`; prefer the final
    # `content`, but show reasoning if content is empty.
    content = msg.get("content") or ""
    reasoning = msg.get("reasoning_content") or ""
    if not content and reasoning:
        return "[reasoning_content only — no final content]\n\n" + reasoning
    if reasoning:
        return content + "\n\n---\n## reasoning_content\n\n" + reasoning
    return content


def call_anthropic_compat(endpoint: str, key: str, model: str, prompt: str) -> str:
    url = endpoint.rstrip("/") + "/messages"
    payload = {
        "model": model,
        "max_tokens": 8000,
        "messages": [{"role": "user", "content": prompt}],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        body = json.loads(resp.read().decode("utf-8"))
    content_blocks = body.get("content", [])
    parts = []
    for block in content_blocks:
        if block.get("type") == "text":
            parts.append(block.get("text", ""))
    if parts:
        return "\n".join(parts)
    return json.dumps(body, indent=2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--provider", required=True, choices=["openai-compat", "anthropic-compat"])
    ap.add_argument("--endpoint", required=True)
    ap.add_argument("--key", required=True)
    ap.add_argument("--model", required=True)
    ap.add_argument("--input", required=True, help="path to bundled prompt file")
    args = ap.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        prompt = f.read()

    try:
        if args.provider == "openai-compat":
            out = call_openai_compat(args.endpoint, args.key, args.model, prompt)
        else:
            out = call_anthropic_compat(args.endpoint, args.key, args.model, prompt)
        sys.stdout.write(out)
        return 0
    except urllib.error.HTTPError as e:
        sys.stderr.write(f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')}\n")
        return 2
    except Exception as e:
        sys.stderr.write(f"ERR: {type(e).__name__}: {e}\n")
        return 3


if __name__ == "__main__":
    sys.exit(main())
