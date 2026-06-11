#!/usr/bin/env python3
"""data.json に新しいニュース要約エントリを安全に追加するヘルパー。

使い方:
    python scripts/add_entry.py path/to/new_entry.json

new_entry.json は 1 エントリ分のオブジェクト:
    {
      "date": "2026-06-12",
      "runLabel": "朝(10:00)",
      "generatedAt": "2026-06-12T10:00:00+09:00",
      "themes": [ {"title": "...", "points": ["...", "..."]} ],
      "impact": ["...", "...", "..."],
      "sources": [ {"title": "...", "url": "..."} ],
      "notes": "..."
    }

挙動:
  - id を date + runLabel から自動生成（衝突する既存エントリは置き換え）
  - 先頭(新しい順)に追加
  - 直近 MAX_ENTRIES 件のみ保持
  - meta.updatedAt を更新
  - UTF-8 / 日本語そのまま で data.json を書き戻す
"""
import json
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data.json"
MAX_ENTRIES = 60
JST = timezone(timedelta(hours=9))


def slugify(text: str) -> str:
    text = re.sub(r"[^0-9A-Za-z぀-ヿ一-鿿]+", "-", text).strip("-")
    return text or "run"


def load_data() -> dict:
    if DATA.exists():
        with DATA.open("r", encoding="utf-8") as f:
            return json.load(f)
    return {"meta": {"title": "毎日ニュースまとめ", "timezone": "Asia/Tokyo"}, "entries": []}


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: python scripts/add_entry.py <new_entry.json>", file=sys.stderr)
        return 2

    entry_path = Path(sys.argv[1])
    with entry_path.open("r", encoding="utf-8") as f:
        entry = json.load(f)

    # 必須フィールドの簡易チェック
    for key in ("date", "themes"):
        if key not in entry:
            print(f"error: 必須フィールド '{key}' がありません", file=sys.stderr)
            return 1

    entry.setdefault("runLabel", "")
    entry.setdefault("generatedAt", datetime.now(JST).isoformat(timespec="seconds"))
    entry.setdefault("impact", [])
    entry.setdefault("sources", [])
    entry.setdefault("notes", "")
    entry["id"] = f"{entry['date']}-{slugify(entry['runLabel'])}" if entry["runLabel"] else f"{entry['date']}-{slugify(entry['generatedAt'])}"

    data = load_data()
    entries = [e for e in data.get("entries", []) if e.get("id") != entry["id"]]
    entries.insert(0, entry)
    data["entries"] = entries[:MAX_ENTRIES]

    data.setdefault("meta", {})
    data["meta"]["updatedAt"] = datetime.now(JST).isoformat(timespec="seconds")

    tmp = DATA.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    tmp.replace(DATA)

    print(f"OK: '{entry['id']}' を追加 / 合計 {len(data['entries'])} 件")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
