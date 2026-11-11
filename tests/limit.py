"""Snelheidslimiet: altijd zichtbaar, ook zonder route en zonder Mapbox-sleutel."""
import math
from playwright.sync_api import sync_playwright
from harness import App, CTL, A, B, C, D
F=[]
def check(ok,w):
    print(('  ok   ' if ok else '  FOUT ')+w)
    if not ok: F.append(w)
def path(pts, step=8):
    out=[]
    for (x1,y1),(x2,y2) in zip(pts,pts[1:]):
        L=math.hypot((x2-x1)*67900,(y2-y1)*111200); n=max(1,int(L/step))
        out+= [(x1+(x2-x1)*i/n, y1+(y2-y1)*i/n) for i in range(n)]
    return out+[pts[-1]]
with sync_playwright() as p:
    a=App(p); pg=a.pg
    def gps(lon,lat): a.ctx.set_geolocation({'latitude':lat,'longitude':lon,'accuracy':6}); pg.wait_for_timeout(500)
    def lim(): return pg.inner_text('#limit') if a.vis('#limit') else '-'
    print('1. stilstaan zonder route'); pg.wait_for_timeout(1500)
    check(lim()=='50','limiet zichtbaar zonder route: %s'%lim())
    print('2. rijden zonder route, afslaan naar 30-weg')
    seen=[]
    for (lon,lat) in path([A,B,C])[::2]:
        gps(lon,lat); seen.append(lim())
    print('   ',''.join(x+' ' for i,x in enumerate(seen) if i==0 or x!=seen[i-1]))
    check('50' in seen and seen[-1]=='30','limiet volgt de weg: 50 -> 30')
    check(CTL.get('overpass',0)<=5,'weinig verzoeken naar OpenStreetMap (%d)'%CTL.get('overpass',0))
    print('3. route met gratis routeplanner (geen Mapbox)')
    for k in range(3): gps(*A)
    a.search('centraal'); a.pick(0); pg.click('#startnav'); pg.wait_for_timeout(800)
    seen=[]
    for (lon,lat) in path([A,[4.9,52.3745],B,C,D])[::3]:
        gps(lon,lat); seen.append(lim())
    print('   ',''.join(x+' ' for i,x in enumerate(seen) if i==0 or x!=seen[i-1]))
    check('50' in seen and '30' in seen,'limiet tijdens navigeren zonder Mapbox')
    check(seen.count('-')<=2,'bijna altijd een limiet zichtbaar (%d keer niet)'%seen.count('-'))
    check(not a.errs,'geen fouten: %s'%a.errs)
    a.close()
    print('4. OpenStreetMap niet bereikbaar')
    CTL['osm']='fail'; a=App(p); pg=a.pg; pg.wait_for_timeout(2500)
    check(not a.vis('#limit') and not a.errs,'geen limiet en geen fouten')
    a.close()
print('BEVINDINGEN',F)
