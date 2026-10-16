#!/usr/bin/env bash
# Regenerates landing/privacy and landing/terms from the repo's markdown docs.
# Usage (repo root): bash scripts/legal-pages/build.sh
set -euo pipefail
dir="$(dirname "$0")"
python "$dir/md2html.py" PRIVACY_POLICY.md "$dir/legal.tpl.html" landing/privacy/index.html privacy
python "$dir/md2html.py" TERMS_OF_SERVICE.md "$dir/legal.tpl.html" landing/terms/index.html terms
