#!/usr/bin/env python3
"""Haalt open verkeersdata op bij het NDW en zet die om naar data/verkeer.json voor de app.

Bronnen (opendata.ndw.nu, DATEX II):
  - actueel_beeld.xml.gz                               actuele situaties (o.a. files, werk, afsluitingen)
  - veiligheidsgerelateerde_informatie_srti.xml.gz     veiligheidsmeldingen (ongevallen, pech, obstakels)
  - tijdelijke_verkeersmaatregelen_afsluitingen.xml.gz tijdelijke afsluitingen

Alleen de standaardbibliotheek, zodat het zonder installatie in GitHub Actions draait.
"""
import gzip
import io
import json
import os
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

BASE = "https://opendata.ndw.nu/"
FEEDS = [
    "veiligheidsgerelateerde_informatie_srti.xml.gz",
    "actueel_beeld.xml.gz",
    "tijdelijke_verkeersmaatregelen_afsluitingen.xml.gz",
]
OUT = os.path.join("data", "verkeer.json")
XSI_TYPE = "{http://www.w3.org/2001/XMLSchema-instance}type"
MAX_ITEMS = 4000

# DATEX II-recordtype -> soort in de app
TYPES = {
    "accident": "ongeval",
    "vehicleobstruction": "pech",
    "abnormaltraffic": "file",
    "generalobstruction": "obstakel",
    "animalpresenceobstruction": "obstakel",
    "environmentalobstruction": "obstakel",
    "infrastructuredamageobstruction": "obstakel",
    "maintenanceworks": "werk",
    "constructionworks": "werk",
    "roadorcarriagewayorlanemanagement": "afsluiting",
    "roadorcarriagewayorlanemanagementextended": "afsluiting",
    "networkmanagement": "afsluiting",
    "generalnetworkmanagement": "afsluiting",
    "rerouting": "afsluiting",
    "reroutingmanagement": "afsluiting",
    "speedmanagement": "snelheid",
    "poorenvironmentconditions": "weer",
    "weatherrelatedroadconditions": "weer",
    "nonweatherrelatedroadconditions": "weer",
    "publicevent": "evenement",
    "disturbanceactivity": "evenement",
}
# Hoe belangrijk een soort is als dezelfde plek meerdere records heeft
RANK = ["ongeval", "pech", "obstakel", "file", "afsluiting", "werk", "snelheid", "weer", "evenement", "overig"]


def local(tag):
    return tag.rsplit("}", 1)[-1] if isinstance(tag, str) else ""


def kind_of(rec):
    t = rec.get(XSI_TYPE) or ""
    t = t.split(":")[-1].lower()
    return TYPES.get(t, "overig")


def first_text(el, names):
    for d in el.iter():
        if local(d.tag) in names and d.text and d.text.strip():
            return d.text.strip()
    return None


def coords(rec):
    lat = lon = None
    for d in rec.iter():
        n = local(d.tag)
        if n == "latitude" and lat is None and d.text:
            lat = d.text
        elif n == "longitude" and lon is None and d.text:
            lon = d.text
        if lat is not None and lon is not None:
            break
    try:
        lat, lon = float(lat), float(lon)
    except (TypeError, ValueError):
        lat = lon = None
    if lat is None:
        # lijnlocaties (GML posList/pos): neem het middelste punt
        for d in rec.iter():
            if local(d.tag) in ("posList", "pos") and d.text and d.text.strip():
                try:
                    nums = [float(x) for x in d.text.replace(",", " ").split()]
                except ValueError:
                    continue
                pairs = [(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
                if not pairs:
                    continue
                a, b = pairs[len(pairs) // 2]
                if 50.0 < a < 54.5 and 2.0 < b < 8.0:
                    lat, lon = a, b
                elif 50.0 < b < 54.5 and 2.0 < a < 8.0:
                    lat, lon = b, a
                if lat is not None:
                    break
    if lat is None:
        return None
    if not (50.0 < lat < 54.5 and 2.0 < lon < 8.0):  # buiten NL/BE: overslaan
        return None
    return round(lat, 5), round(lon, 5)


def comment(rec):
    # Nederlandse tekst uit een (generalPublic)comment, anders de eerste tekstwaarde daarin
    best = None
    for d in rec.iter():
        if "comment" in local(d.tag).lower():
            for v in d.iter():
                if local(v.tag) == "value" and v.text and v.text.strip():
                    lang = (v.get("lang") or v.get("{http://www.w3.org/XML/1998/namespace}lang") or "").lower()
                    if lang.startswith("nl"):
                        return v.text.strip()[:240]
                    best = best or v.text.strip()[:240]
    return best


STATS = {}


def parse(data, src):
    items = []
    st = STATS.setdefault(src, {"records": 0, "met_locatie": 0, "types": {}, "bytes": len(data)})
    for _, el in ET.iterparse(io.BytesIO(data), events=("end",)):
        if local(el.tag) != "situationRecord":
            continue
        st["records"] += 1
        raw = (el.get(XSI_TYPE) or "?").split(":")[-1]
        st["types"][raw] = st["types"].get(raw, 0) + 1
        c = coords(el)
        if not c and raw not in st.setdefault("voorbeeld_zonder_locatie", {}) and len(st["voorbeeld_zonder_locatie"]) < 4:
            # een kort stukje XML bewaren om te zien hoe de locatie wordt beschreven
            names = []
            for d in el.iter():
                n = local(d.tag)
                if n not in names:
                    names.append(n)
            st["voorbeeld_zonder_locatie"][raw] = names[:60]
        if c:
            st["met_locatie"] += 1
            lt = st.setdefault("met_locatie_per_type", {})
            lt[raw] = lt.get(raw, 0) + 1
        if c:
            items.append({
                "id": el.get("id") or "",
                "t": kind_of(el),
                "lat": c[0],
                "lon": c[1],
                "road": first_text(el, {"roadNumber", "roadName"}),
                "txt": comment(el),
                "until": first_text(el, {"overallEndTime", "endTime"}),
                "src": src,
            })
        el.clear()
    return items


def fetch(name):
    req = urllib.request.Request(BASE + name, headers={"User-Agent": "MoesWeasley-Sprintje/1.0 (demo)"})
    with urllib.request.urlopen(req, timeout=90) as r:
        raw = r.read()
    return gzip.decompress(raw) if name.endswith(".gz") else raw


def main():
    all_items, counts, errors = {}, {}, []
    for name in FEEDS:
        try:
            items = parse(fetch(name), name.split(".")[0])
        except Exception as e:  # een bron die faalt mag de rest niet tegenhouden
            errors.append(f"{name}: {e}")
            continue
        counts[name] = len(items)
        for it in items:
            key = it["id"] or f'{it["lat"]},{it["lon"]},{it["t"]}'
            old = all_items.get(key)
            if not old or RANK.index(it["t"]) < RANK.index(old["t"]):
                all_items[key] = it
    # zelfde plek + soort maar één keer tonen
    seen, out = set(), []
    for it in sorted(all_items.values(), key=lambda x: RANK.index(x["t"])):
        k = (it["t"], round(it["lat"], 3), round(it["lon"], 3))
        if k in seen:
            continue
        seen.add(k)
        out.append({k2: v for k2, v in it.items() if v not in (None, "")})
        if len(out) >= MAX_ITEMS:
            break
    os.makedirs("data", exist_ok=True)
    payload = {"updated": int(time.time()), "count": len(out), "items": out}
    if not out and os.path.exists(OUT) and errors:
        print("Geen nieuwe data en fouten opgetreden; oude data blijft staan.")
    else:
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    for k, v in counts.items():
        print(f"{k}: {v} meldingen met locatie")
    by = {}
    for it in out:
        by[it["t"]] = by.get(it["t"], 0) + 1
    print("Totaal na samenvoegen:", len(out), by)
    for e in errors:
        print("FOUT:", e, file=sys.stderr)
    # korte diagnose, zodat te zien is wat elke bron oplevert
    with open(os.path.join("data", "ndw-diagnose.json"), "w", encoding="utf-8") as f:
        json.dump({"updated": int(time.time()), "bronnen": STATS, "fouten": errors}, f, ensure_ascii=False, indent=1)
    if len(errors) == len(FEEDS):
        sys.exit(1)


if __name__ == "__main__":
    main()
