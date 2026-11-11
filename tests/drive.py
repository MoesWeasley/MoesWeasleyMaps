"""Hele rit met nep-GPS via de gewone locatie van de telefoon (geen simulatie)."""
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
X=[4.9,52.3812]  # verkeerd: rechtdoor i.p.v. rechtsaf
with sync_playwright() as p:
    a=App(p); pg=a.pg
    def gps(lon,lat): a.ctx.set_geolocation({'latitude':lat,'longitude':lon,'accuracy':6}); pg.wait_for_timeout(500)
    check(a.ev("!!window.__mn.st.pos"),'echte (nep)GPS-positie ontvangen')
    a.search('centraal'); a.pick(0); pg.click('#startnav'); pg.wait_for_timeout(800)
    check(not a.toast().startswith('Nog geen GPS'),'geen "geen GPS"-melding bij start')
    seen=set(); log=[]
    leg1=path([A,[4.9,52.3745],B,X])
    for i,(lon,lat) in enumerate(leg1):
        gps(lon,lat)
        bd=pg.inner_text('#bdist'); bt=pg.inner_text('#btext')
        if i%15==0: log.append((i,bd,bt,pg.inner_text('#spd'),pg.inner_text('#remd')))
        if a.vis('#balert'): seen.add('alert:'+pg.inner_text('#batitle'))
        if i==40: a.shot('d1-onderweg')
    for l in log: print('  ',l)
    print('   gezegd:',a.ev("window.__said"))
    said=' | '.join(a.ev("window.__said"))
    check('rechtsaf' in said.lower(),'stem kondigt "rechtsaf" aan')
    check(int(pg.inner_text('#spd'))>30,'snelheid uit GPS berekend: %s km/u'%pg.inner_text('#spd'))
    check(a.ev("!document.getElementById('navarrow').hidden"),'vaste pijl tijdens rijden')
    print('   van de route af (rechtdoor in plaats van rechtsaf)')
    pg.wait_for_timeout(1500)
    check(len(CTL['calls'])>=2,'nieuwe route aangevraagd (%d routeverzoeken)'%len(CTL['calls']))
    check('herberekend' in said.lower() or 'herberekend' in ' '.join(a.ev("window.__said")).lower(),'stem zegt dat de route wordt herberekend')
    print('   balk:',pg.inner_text('#bdist'),pg.inner_text('#btext'))
    check('berekenen' not in pg.inner_text('#btext'),'balk toont nieuwe aanwijzing')
    a.shot('d2-herberekend')
    leg2=path([X,B,C,D])
    for i,(lon,lat) in enumerate(leg2):
        gps(lon,lat)
        if a.vis('#balert'): seen.add('alert:'+pg.inner_text('#batitle'))
        if a.ev("window.__mn.st.arrived"): break
    for k in range(6): gps(*D)
    print('   meldingen gezien:',seen)
    check(any('flitser' in s.lower() for s in seen),'flitser-waarschuwing onderweg')
    said=a.ev("window.__said"); print('   gezegd:',said[-6:])
    check(any('flits' in x.lower() for x in said),'stem waarschuwt voor flitser')
    check(any('bestemming' in x.lower() or 'je bent er' in x.lower() for x in said),'stem meldt aankomst')
    pg.wait_for_timeout(5500)
    check(a.ev("window.__mn.st.drive") and not a.ev("window.__mn.st.nav"),'na aankomst door in rijmodus')
    check(a.vis('#top') and not a.vis('#banner'),'zoekbalk terug, balk weg')
    a.shot('d3-rijmodus')
    print('   verder rijden zonder route')
    for (lon,lat) in path([D,[4.918,52.379]]): gps(lon,lat)
    check(a.ev("window.__mn.st.follow") and a.vis('#navarrow'),'kaart volgt in rijmodus')
    check(a.vis('#street'),'straatnaam in rijmodus')
    print('   stilstaan')
    for k in range(5): gps(4.918,52.379)
    pg.wait_for_timeout(2500)
    check(pg.inner_text('#spd')=='0','snelheid 0 bij stilstaan: %s'%pg.inner_text('#spd'))
    print('ERR',a.errs); check(not a.errs,'geen fouten')
    a.close()
print('BEVINDINGEN',F)
