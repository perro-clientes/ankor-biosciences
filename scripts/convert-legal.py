"""Convierte .legal-bd de legal-N.html en bloques estructurados (TS). No reescribe texto."""
import html, json, re, sys

src_dir, out_dir = sys.argv[1], sys.argv[2]
targets = {1: "terms-of-use", 2: "privacy", 3: "terms-of-sale"}

def clean(t):
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()

def slug(t):
    t = t.lower().replace("’", "").replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")

for n, name in targets.items():
    s = open(f"{src_dir}/legal-{n}.html", encoding="utf-8").read()
    bd = re.search(r'<div class="legal-bd">(.*?)</div>\s*</section>', s, re.S).group(1)
    blocks = []
    def push_line(line):
        m_num = re.match(r"^\d+\.\s+(.*)$", line)
        m_bul = re.match(r"^\*\s+(.*)$", line)
        kind, text = ("ol", m_num.group(1)) if m_num else ("ul", m_bul.group(1)) if m_bul else (None, line)
        if kind:
            if blocks and blocks[-1]["type"] == kind:
                blocks[-1]["items"].append(text)
            else:
                blocks.append({"type": kind, "items": [text]})
        else:
            blocks.append({"type": "p", "text": text})
    for tag, inner in re.findall(r"<(h3|p)[^>]*>(.*?)</\1>", bd, re.S):
        if tag == "h3":
            text = clean(inner).rstrip(":").strip()
            blocks.append({"type": "h2", "id": slug(text), "text": text})
        else:
            for part in re.split(r"<br\s*/?>", inner):
                line = clean(part)
                if line:
                    push_line(line)
    body = json.dumps(blocks, ensure_ascii=False, indent=2)
    with open(f"{out_dir}/{name}.ts", "w", encoding="utf-8") as f:
        f.write(f"// Migrado sin reescribir desde https://ankor-bio.com/sections/legal-{n}.html\n")
        f.write("// (scripts de conversión: encabezados → h2 con id, líneas \"1.\" → ol, \"* \" → ul).\n")
        f.write('import type { LegalBlock } from "./types";\n\n')
        f.write(f"export const blocks: LegalBlock[] = {body};\n")
    print(name, len(blocks), "bloques,", sum(b["type"]=="h2" for b in blocks), "h2")
