#!/usr/bin/env bash
# Deploys the static landing site (landing/) to the domain root of
# reinersbot.space. Replaces only the entries that exist in landing/ — the
# dashboard build in /var/www/reinersbot/dashboard is never touched.
#
# Every /css/*.css and /js/*.js reference in the HTML gets ?v=<content hash>,
# which is what lets nginx cache those files as immutable for a year.
#
# Usage (repo root): bash deploy/deploy-landing.sh

set -euo pipefail

HOST="ReinerAI"
WEB_ROOT="/var/www/reinersbot"
STAGE="$(mktemp -d)"
TARBALL="$STAGE.tar.gz"
trap 'rm -rf "$STAGE" "$TARBALL"' EXIT

if [ -e landing/dashboard ]; then
	echo "landing/dashboard exists — refusing, it would clobber the dashboard build." >&2
	exit 1
fi

echo "==> Staging landing/ with cache-busted asset URLs..."
cp -R landing/. "$STAGE/"
VERSION="$(cat landing/css/*.css landing/js/*.js | md5sum | cut -c1-10)"
find "$STAGE" -name '*.html' -print0 | xargs -0 sed -i -E \
	"s#(href|src)=\"(/(css|js)/[A-Za-z0-9._-]+\.(css|js))\"#\1=\"\2?v=$VERSION\"#g"
echo "    version $VERSION"

tar -czf "$TARBALL" -C "$STAGE" .

echo "==> Uploading to $HOST..."
scp -q "$TARBALL" "$HOST:/tmp/reiner-landing.tar.gz"

ssh "$HOST" bash -s <<EOF
set -euo pipefail
NEW="\$(mktemp -d)"
tar -xzf /tmp/reiner-landing.tar.gz -C "\$NEW" --no-same-owner
rm /tmp/reiner-landing.tar.gz
cd "\$NEW"
for entry in * .[!.]*; do
	[ -e "\$entry" ] || continue
	[ "\$entry" = dashboard ] && continue
	rm -rf "$WEB_ROOT/\$entry"
	mv "\$entry" "$WEB_ROOT/\$entry"
done
rmdir "\$NEW" 2>/dev/null || rm -rf "\$NEW"
chmod -R a+rX "$WEB_ROOT"
EOF

echo "==> Done: https://reinersbot.space/"
