"""Tiny converter for the two legal docs (headings, bold, bullet lists, paragraphs)."""
import html, re, sys

def inline(s):
    s = html.escape(s, quote=False)
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)

def convert(md):
    out, in_list, title, meta = [], False, "", ""
    for line in md.splitlines():
        line = line.rstrip()
        if line.startswith("# "):
            title = line[2:].strip(); continue
        if line.startswith("**Effective Date:**"):
            meta = inline(line); continue
        if line.startswith("- "):
            if not in_list: out.append("<ul>"); in_list = True
            out.append(f"  <li>{inline(line[2:])}</li>"); continue
        if in_list: out.append("</ul>"); in_list = False
        if line.startswith("## "):
            out.append(f"<h2>{inline(line[3:])}</h2>")
        elif line:
            out.append(f"<p>{inline(line)}</p>")
    if in_list: out.append("</ul>")
    return title, meta, "\n        ".join(out)

src, tpl, dst, slug = sys.argv[1:5]
title, meta, body = convert(open(src, encoding="utf-8").read())
page = open(tpl, encoding="utf-8").read()
page = page.replace("{{TITLE}}", title).replace("{{META}}", meta).replace("{{BODY}}", body).replace("{{SLUG}}", slug)
open(dst, "w", encoding="utf-8", newline="\n").write(page)
print(dst, len(page))
