#!/usr/bin/env python3

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent

AUDITS = [
    "audit_suspicious_patterns.py",
    "audit_footnote_markers.py",
    "audit_surah_structure.py",
    "audit_verse_references.py",
    "audit_note_files.py",
    "audit_search_index.py",
    "audit_search_quality.py",
    "audit_dataset_summary.py",
]
failed = False

for audit in AUDITS:
    print()
    print("=" * 80)
    print(audit)
    print("=" * 80)

    result = subprocess.run(
        [sys.executable, str(ROOT / audit)]
    )

    if result.returncode != 0:
        failed = True

print()
print("=" * 80)

if failed:
    print("❌ DATASET AUDIT FAILED")
    sys.exit(1)

print("✅ DATASET VERIFIED")