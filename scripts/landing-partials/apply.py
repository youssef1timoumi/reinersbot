"""Stamps the shared header/footer into every landing page.

Pages mark where a partial goes:
    <!-- partial:topbar active=features -->...<!-- /partial:topbar -->
    <!-- partial:topbar variant=home -->...<!-- /partial:topbar -->
    <!-- partial:footer -->...<!-- /partial:footer -->
Everything between the markers is replaced on each run, so edit the partial
files here, never the stamped copies. Run: python scripts/landing-partials/apply.py
"""
import pathlib, re, sys

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
TARGETS = list((ROOT / "landing").rglob("*.html")) + [ROOT / "scripts/legal-pages/legal.tpl.html"]
MARK = re.compile(r"<!-- partial:(\w+)([^>]*?) -->.*?<!-- /partial:\1 -->", re.S)


def render(name, args):
    html = (HERE / f"{name}.html").read_text(encoding="utf-8")
    opts = dict(a.split("=", 1) for a in args.split())
    if name == "topbar":
        home = opts.get("variant") == "home"
        html = html.replace("{{BAR_CLASS}}", " home-bar" if home else "")
        html = html.replace("{{BAR_ATTRS}}", ' data-show="false"' if home else "")
        for key in ("features", "docs"):
            html = html.replace("{{CUR_%s}}" % key, ' aria-current="page"' if opts.get("active") == key else "")
    return f"<!-- partial:{name}{args} -->\n  {html.rstrip()}\n  <!-- /partial:{name} -->"


changed = 0
for path in TARGETS:
    src = path.read_text(encoding="utf-8")
    out = MARK.sub(lambda m: render(m.group(1), m.group(2)), src)
    if out != src:
        path.write_text(out, encoding="utf-8", newline="\n")
        changed += 1
print(f"partials applied, {changed} file(s) updated")
sys.exit(0)
