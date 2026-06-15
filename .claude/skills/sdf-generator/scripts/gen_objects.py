#!/usr/bin/env python3
"""
gen_objects.py — Gera arquivos XML de customrecordtype (SuiteCloud/SDF) a partir
de um manifest em Markdown.

Project-agnostic: serve qualquer projeto que siga a convenção do manifest
(seções "### `scriptid` — Nome" seguidas de uma tabela
| Campo | Internal ID | Tipo | Descrição |).

Uso:
    python3 gen_objects.py <manifest.md> [opções]

Opções:
    --out DIR          Pasta de saída (default: ./Objects ao lado do manifest)
    --config FILE      JSON com overrides do projeto (ver exemplo abaixo)
    --only IDS         Gera só estes scriptids (vírgula-separado)
    --skip IDS         Pula estes scriptids (vírgula-separado)
    --include-existing Inclui registros marcados como "existente" (default: pula)
    --no-description   Não preenche <description> (deixa vazio como export cru)

Config JSON (todos os campos são opcionais):
{
  "selectTargetById": {                  // <selectrecordtype> por internal id do campo
    "custrecord_pd_pya_status": "[scriptid=customlist_pd_pya_prop_aloc_status]",
    "custrecord_pd_pya_period": "-105"
  },
  "selectTargetByLabel": [               // fallback por palavra no label (ordem importa)
    ["apropriação imobiliária", "[scriptid=customrecord_pd_pya_property_allocation]"],
    ["empreendimento", "[scriptid=customrecord_cseg_pd_projeto]"]
  ],
  "unsupportedTags": ["aidescription", "enabletextenhance"],
  "skip": ["customrecord_x"],
  "only": []
}
"""
import argparse
import json
import os
import re
import sys
from xml.sax.saxutils import escape

# ---------------------------------------------------------------------------
# DEFAULTS (podem ser sobrescritos pelo --config)
# ---------------------------------------------------------------------------

DEFAULT_UNSUPPORTED_TAGS = ["aidescription", "enabletextenhance"]

# Vazios por padrão: cada projeto fornece os seus via sdf-gen.config.json.
DEFAULT_SELECT_BY_LABEL = []

DEFAULT_SELECT_BY_ID = {}

TYPE_MAP = {
    "List/Record": "SELECT", "List": "SELECT",
    "Currency": "CURRENCY", "Percent": "PERCENT",
    "Long Text": "CLOBTEXT", "Free-Form Text": "TEXT",
    "Text Area": "TEXTAREA", "Checkbox": "CHECKBOX",
    "Date": "DATE", "Integer": "INTEGER",
}

# marcadores que indicam "registro já existe no NetSuite, não gerar"
EXISTING_MARKERS = ("existente no netsuite", "registro existente", "registro de segmento existente")

# ---------------------------------------------------------------------------
# TEMPLATES (schema 1:1 do gabarito real, sem as tags não suportadas)
# ---------------------------------------------------------------------------

RECORD_HEADER = """<customrecordtype scriptid="{scriptid}">
  <accesstype>CUSTRECORDENTRYPERM</accesstype>
  <allowattachments>T</allowattachments>
  <allowinlinedeleting>F</allowinlinedeleting>
  <allowinlinedetaching>T</allowinlinedetaching>
  <allowinlineediting>F</allowinlineediting>
  <allowmobileaccess>F</allowmobileaccess>
  <allownumberingoverride>F</allownumberingoverride>
  <allowquickadd>T</allowquickadd>
  <allowquicksearch>F</allowquicksearch>
  <allowuiaccess>T</allowuiaccess>
  <customsegment></customsegment>
  <description></description>
  <enabledle>T</enabledle>
  <enablekeywords>T</enablekeywords>
  <enablemailmerge>F</enablemailmerge>
  <enablenametranslation>F</enablenametranslation>
  <enablenumbering>F</enablenumbering>
  <enableoptimisticlocking>T</enableoptimisticlocking>
  <enablesystemnotes>T</enablesystemnotes>
  <hierarchical>F</hierarchical>
  <icon></icon>
  <iconbuiltin>T</iconbuiltin>
  <iconindex></iconindex>
  <includeinsearchmenu>T</includeinsearchmenu>
  <includename>F</includename>
  <isinactive>F</isinactive>
  <isordered>F</isordered>
  <numberinginit></numberinginit>
  <numberingmindigits></numberingmindigits>
  <numberingprefix></numberingprefix>
  <numberingsuffix></numberingsuffix>
  <recordname>{recordname}</recordname>
  <showcreationdate>F</showcreationdate>
  <showcreationdateonlist>F</showcreationdateonlist>
  <showid>F</showid>
  <showlastmodified>F</showlastmodified>
  <showlastmodifiedonlist>F</showlastmodifiedonlist>
  <shownotes>T</shownotes>
  <showowner>F</showowner>
  <showownerallowchange>F</showownerallowchange>
  <showowneronlist>F</showowneronlist>
  <customrecordcustomfields>"""

RECORD_FOOTER = """  </customrecordcustomfields>
</customrecordtype>"""

FIELD_TEMPLATE = """    <customrecordcustomfield scriptid="{scriptid}">
      <accesslevel>2</accesslevel>
      <allowquickadd>F</allowquickadd>
      <applyformatting>{applyformatting}</applyformatting>
      <checkspelling>F</checkspelling>
      <defaultchecked>F</defaultchecked>
      <defaultselection></defaultselection>
      <defaultvalue></defaultvalue>
      <description>{description}</description>
      <displayheight></displayheight>
      <displaytype>NORMAL</displaytype>
      <displaywidth></displaywidth>
      <dynamicdefault></dynamicdefault>
      <encryptatrest>F</encryptatrest>
      <fieldtype>{fieldtype}</fieldtype>
      <globalsearch>F</globalsearch>
      <help></help>
      <isformula>F</isformula>
      <ismandatory>F</ismandatory>
      <isparent>F</isparent>
      <label>{label}</label>
      <linktext></linktext>
      <maxlength></maxlength>
      <maxvalue></maxvalue>
      <minvalue></minvalue>
      <onparentdelete>{onparentdelete}</onparentdelete>
      <parentsubtab></parentsubtab>
      <rolerestrict>F</rolerestrict>
      <searchcomparefield></searchcomparefield>
      <searchdefault></searchdefault>
      <searchlevel>2</searchlevel>
      <selectrecordtype>{selectrecordtype}</selectrecordtype>
      <showinlist>F</showinlist>
      <sourcefilterby></sourcefilterby>
      <sourcefrom></sourcefrom>
      <sourcelist></sourcelist>
      <storevalue>T</storevalue>
      <subtab></subtab>
    </customrecordcustomfield>"""

# ---------------------------------------------------------------------------
# PARSER
# ---------------------------------------------------------------------------

def parse_manifest(text):
    records = []
    header_re = re.compile(r"^###\s+`([^`]+)`\s*[—-]+\s*(.+?)\s*$", re.MULTILINE)
    matches = list(header_re.finditer(text))
    for i, m in enumerate(matches):
        scriptid = m.group(1).strip()
        recordname = m.group(2).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[start:end]
        records.append({
            "scriptid": scriptid,
            "recordname": recordname,
            "fields": parse_table(block),
            "is_existing": any(mark in block.lower() for mark in EXISTING_MARKERS),
        })
    return records


def parse_table(block):
    fields = []
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 4:
            continue
        campo, internal_id, tipo = cells[0], cells[1], cells[2]
        desc = "|".join(cells[3:]).strip()
        if campo.lower() == "campo" or internal_id.lower() in ("internal id", ""):
            continue
        if set(internal_id) <= set("-: "):
            continue
        fields.append({"label": campo, "id": internal_id, "tipo": tipo, "desc": desc})
    return fields


def resolve_select(field, cfg):
    if field["id"] in cfg["select_by_id"]:
        return cfg["select_by_id"][field["id"]]
    label_low = field["label"].lower()
    for key, target in cfg["select_by_label"]:
        if key in label_low:
            return target
    return None


def clean_desc(desc):
    return desc.replace("`", "").strip()


def build_field_xml(field, cfg, warnings, rec_id):
    fieldtype = TYPE_MAP.get(field["tipo"])
    if fieldtype is None:
        warnings.append(f"[{rec_id}] tipo desconhecido '{field['tipo']}' em {field['id']} -> TEXT")
        fieldtype = "TEXT"

    selectrecordtype, onparentdelete, applyformatting = "", "", "F"
    if fieldtype == "SELECT":
        onparentdelete = "NO_ACTION"
        target = resolve_select(field, cfg)
        if target is None:
            warnings.append(f"[{rec_id}] SELECT sem alvo: {field['id']} ('{field['label']}') -> <selectrecordtype> vazio")
        else:
            selectrecordtype = target
    elif fieldtype in ("CURRENCY", "PERCENT"):
        applyformatting = "T"

    description = "" if cfg["no_description"] else clean_desc(field["desc"])
    return FIELD_TEMPLATE.format(
        scriptid=field["id"], applyformatting=applyformatting,
        description=escape(description), fieldtype=fieldtype,
        label=escape(field["label"]), onparentdelete=onparentdelete,
        selectrecordtype=escape(selectrecordtype),
    )


def strip_unsupported(xml, tags):
    if not tags:
        return xml
    pat = re.compile(r"^\s*</?(" + "|".join(map(re.escape, tags)) + r")(\s|>|/).*$")
    return "\n".join(ln for ln in xml.splitlines() if not pat.match(ln)) + "\n"


def build_record_xml(record, cfg, warnings):
    parts = [RECORD_HEADER.format(scriptid=record["scriptid"], recordname=escape(record["recordname"]))]
    for field in record["fields"]:
        parts.append(build_field_xml(field, cfg, warnings, record["scriptid"]))
    parts.append(RECORD_FOOTER)
    return strip_unsupported("\n".join(parts) + "\n", cfg["unsupported_tags"])


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def load_config(args):
    cfg = {
        "select_by_id": dict(DEFAULT_SELECT_BY_ID),
        "select_by_label": list(DEFAULT_SELECT_BY_LABEL),
        "unsupported_tags": list(DEFAULT_UNSUPPORTED_TAGS),
        "skip": set(), "only": set(),
        "no_description": args.no_description,
        "config_path": None,
    }
    # --config tem prioridade; senão procura sdf-gen.config.json ao lado do manifest
    config_path = args.config
    if not config_path:
        candidate = os.path.join(os.path.dirname(os.path.abspath(args.manifest)), "sdf-gen.config.json")
        if os.path.exists(candidate):
            config_path = candidate
    if config_path:
        with open(config_path, encoding="utf-8") as f:
            data = json.load(f)
        cfg["config_path"] = config_path
        cfg["select_by_id"].update(data.get("selectTargetById", {}))
        cfg["select_by_label"] = [tuple(x) for x in data.get("selectTargetByLabel", [])] or cfg["select_by_label"]
        if "unsupportedTags" in data:
            cfg["unsupported_tags"] = data["unsupportedTags"]
        cfg["skip"] |= set(data.get("skip", []))
        cfg["only"] |= set(data.get("only", []))
    if args.skip:
        cfg["skip"] |= {s.strip() for s in args.skip.split(",")}
    if args.only:
        cfg["only"] |= {s.strip() for s in args.only.split(",")}
    return cfg


def main():
    ap = argparse.ArgumentParser(description="Gera XML de customrecordtype SDF a partir de um manifest Markdown.")
    ap.add_argument("manifest")
    ap.add_argument("--out")
    ap.add_argument("--config")
    ap.add_argument("--only")
    ap.add_argument("--skip")
    ap.add_argument("--include-existing", action="store_true")
    ap.add_argument("--no-description", action="store_true")
    args = ap.parse_args()

    out_dir = args.out or os.path.join(os.path.dirname(os.path.abspath(args.manifest)), "Objects")
    os.makedirs(out_dir, exist_ok=True)
    cfg = load_config(args)

    with open(args.manifest, encoding="utf-8") as f:
        records = parse_manifest(f.read())

    warnings, generated, skipped = [], [], []
    for rec in records:
        sid = rec["scriptid"]
        if not sid.startswith("customrecord"):
            continue
        if cfg["only"] and sid not in cfg["only"]:
            continue
        if sid in cfg["skip"]:
            skipped.append((sid, "skip explícito")); continue
        if sid.startswith("customrecord_cseg_") and sid not in cfg["only"]:
            skipped.append((sid, "segmento existente")); continue
        if rec["is_existing"] and not args.include_existing and sid not in cfg["only"]:
            skipped.append((sid, "marcado como existente")); continue

        xml = build_record_xml(rec, cfg, warnings)
        path = os.path.join(out_dir, sid + ".xml")
        with open(path, "w", encoding="utf-8") as f:
            f.write(xml)
        generated.append((sid, len(rec["fields"]), path))

    print(f"Saída: {out_dir}")
    if cfg["config_path"]:
        print(f"Config: {cfg['config_path']}")
    print("=== Gerados ===")
    for sid, n, path in generated:
        print(f"  {sid:<44} {n:>2} campos")
    if skipped:
        print("=== Pulados ===")
        for sid, reason in skipped:
            print(f"  {sid:<44} ({reason})")
    if warnings:
        print("=== Avisos (revise antes do deploy) ===")
        for w in warnings:
            print(f"  - {w}")
    else:
        print("Sem avisos.")


if __name__ == "__main__":
    main()
