#!/usr/bin/env python3
"""Haalt alle vaste flitsers, roodlichtcamera's en trajectcontroles in Nederland op uit
OpenStreetMap (via Overpass) en schrijft ze naar data/flitsers.json voor de app.

- flitspalen:        node highway=speed_camera en apparaten in enforcement=maxspeed-relaties
- roodlichtcamera's: apparaten in enforcement=traffic_signals-relaties
- trajectcontroles:  enforcement=average_speed-relaties met rollen from/to

Alleen de standaardbibliotheek, zodat het zonder installatie in GitHub Actions draait.
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
OUT = os.path.join("data", "flitsers.json")
# rechthoek om Nederland heen (zuid, west, noord, oost); lichter dan een landsgrens-zoekopdracht
BBOX = "50.70,3.30,53.60,7.30"
QUERY = """
[out:json][timeout:180][bbox:%s];
(
  node["highway"="speed_camera"];
  relation["type"="enforcement"];
);
out body;
>;
out skel qt;
""" % BBOX


LOG = []


def fetch():
    body = urllib.parse.urlencode({"data": QUERY}).encode()
    for url in ENDPOINTS:
        for attempt in range(2):
            t0 = time.time()
            try:
                req = urllib.request.Request(url, data=body, headers={"User-Agent": "MoesWeasley-Sprintje/1.0 (demo)"})
                with urllib.request.urlopen(req, timeout=240) as r:
                    data = json.loads(r.read().decode("utf-8"))
                LOG.append(f"{url}: ok in {time.time() - t0:.0f}s, {len(data.get('elements', []))} elementen")
                if data.get("remark"):
                    LOG.append("opmerking server: " + str(data["remark"])[:300])
                return data
            except Exception as e:  # volgende poging of volgende server
                LOG.append(f"{url} poging {attempt + 1}: {type(e).__name__}: {str(e)[:200]} ({time.time() - t0:.0f}s)")
                time.sleep(15)
    return None


def speed(v):
    try:
        return int(str(v).split(";")[0].split()[0])
    except (TypeError, ValueError, IndexError):
        return None


def build(data):
    nodes, ways, rels = {}, {}, []
    for e in data.get("elements", []):
        if e["type"] == "node":
            n = nodes.setdefault(e["id"], {})
            n["lat"], n["lon"] = e["lat"], e["lon"]
            if e.get("tags"):
                n["tags"] = e["tags"]
        elif e["type"] == "way":
            ways[e["id"]] = e.get("nodes", [])
        elif e["type"] == "relation":
            rels.append(e)

    def point(member):
        if member["type"] == "node" and member["ref"] in nodes:
            n = nodes[member["ref"]]
            return round(n["lat"], 6), round(n["lon"], 6)
        if member["type"] == "way" and ways.get(member["ref"]):
            ids = ways[member["ref"]]
            n = nodes.get(ids[len(ids) // 2])
            if n:
                return round(n["lat"], 6), round(n["lon"], 6)
        return None

    cams = {}
    for nid, n in nodes.items():
        t = n.get("tags", {})
        if t.get("highway") == "speed_camera":
            cams[nid] = {"id": f"osm{nid}", "lat": round(n["lat"], 6), "lon": round(n["lon"], 6), "type": "vast", "max": speed(t.get("maxspeed"))}

    trajects = []
    for r in rels:
        t = r.get("tags", {})
        kind = t.get("enforcement", "")
        mx = speed(t.get("maxspeed"))
        if kind == "average_speed":
            frm = [point(m) for m in r.get("members", []) if m.get("role") == "from"]
            to = [point(m) for m in r.get("members", []) if m.get("role") == "to"]
            frm, to = [p for p in frm if p], [p for p in to if p]
            if frm and to:
                trajects.append({"id": f"tr{r['id']}", "from": list(frm[0]), "to": list(to[-1]), "max": mx, "name": t.get("name")})
            continue
        typ = "roodlicht" if kind == "traffic_signals" else "vast" if kind in ("maxspeed", "") else None
        if not typ:
            continue
        for m in r.get("members", []):
            if m.get("role") != "device" or m["type"] != "node" or m["ref"] not in nodes:
                continue
            n = nodes[m["ref"]]
            c = cams.get(m["ref"]) or {"id": f"osm{m['ref']}", "lat": round(n["lat"], 6), "lon": round(n["lon"], 6), "type": typ, "max": None}
            if typ == "roodlicht":
                c["type"] = "roodlicht"
            if mx and not c.get("max"):
                c["max"] = mx
            cams[m["ref"]] = c

    cams = [{k: v for k, v in c.items() if v is not None} for c in cams.values()]
    for tr in trajects:
        if tr.get("max") is None:
            tr.pop("max")
        if not tr.get("name"):
            tr.pop("name", None)
    return cams, trajects


def diagnose(extra):
    os.makedirs("data", exist_ok=True)
    with open(os.path.join("data", "flitsers-diagnose.json"), "w", encoding="utf-8") as f:
        json.dump({"updated": int(time.time()), "log": LOG, **extra}, f, ensure_ascii=False, indent=1)
    print("\n".join(LOG))


def main():
    data = fetch()
    if data is None:
        diagnose({"resultaat": "Overpass niet bereikbaar; oude data blijft staan."})
        return
    cams, trajects = build(data)
    if not cams and not trajects:
        diagnose({"resultaat": "Niets gevonden; oude data blijft staan."})
        return
    os.makedirs("data", exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": int(time.time()), "cams": cams, "trajects": trajects}, f, ensure_ascii=False, separators=(",", ":"))
    by = {}
    for c in cams:
        by[c["type"]] = by.get(c["type"], 0) + 1
    print("Flitsers:", len(cams), by, "Trajectcontroles:", len(trajects))
    diagnose({"resultaat": "ok", "flitsers": len(cams), "per_soort": by, "trajectcontroles": len(trajects)})


if __name__ == "__main__":
    main()
