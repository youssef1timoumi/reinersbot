#!/usr/bin/env bash
# Tells IndexNow search engines (Bing, Yandex, Seznam, Naver…) that the
# landing pages changed. Run after deploy/deploy-landing.sh.
# The key is the name of the landing/<key>.txt file served at the site root.
set -euo pipefail
KEY="$(basename "$(ls landing/*.txt | grep -E '/[0-9a-f]{32}\.txt$' | head -1)" .txt)"
curl -sS -o /dev/null -w "IndexNow: HTTP %{http_code}\n" -X POST https://api.indexnow.org/indexnow \
	-H 'Content-Type: application/json; charset=utf-8' \
	--data @- <<JSON
{"host":"reinersbot.space","key":"$KEY","keyLocation":"https://reinersbot.space/$KEY.txt",
 "urlList":["https://reinersbot.space/","https://reinersbot.space/features/","https://reinersbot.space/privacy/","https://reinersbot.space/terms/"]}
JSON
