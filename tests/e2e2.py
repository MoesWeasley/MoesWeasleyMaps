from playwright.sync_api import sync_playwright
from harness import App, CTL, PLACES, D
import harness
F=[]
def check(ok,w):
    print(('  ok   ' if ok else '  FOUT ')+w)
    if not ok: F.append(w)
PLACES.append({"geometry":{"coordinates":D},"properties":{"name":"Cent Heel Erg Lange Naam Van Een Winkelcentrum Met Parkeergarage En Nog Meer Woorden","street":"Burgemeester van Walsum Ruimhartigheidslaan","housenumber":"1234","city":"Sint-Michielsgestel-Noord","countrycode":"NL"}})
with sync_playwright() as p:
    a=App(p,w=360,h=640)
    print('lange namen'); a.search('cent'); a.shot('8-long-results')
    ov=a.ev("Array.from(document.querySelectorAll('#results .res')).some(e=>e.scrollWidth>e.clientWidth+2)")
    check(not ov,'resultaten lopen niet uit het vak')
    a.pick(2); a.pg.wait_for_timeout(400); a.shot('9-long-sheet')
    check(a.ev("(e=>e.scrollWidth<=e.clientWidth+2)(document.getElementById('routesheet'))"),'routescherm niet breder dan scherm')
    a.pg.click('#startnav'); a.pg.wait_for_timeout(1200)
    a.ev("document.getElementById('broad').textContent='Burgemeester van Walsum Ruimhartigheidslaan richting Sint-Michielsgestel'; document.getElementById('btext').textContent='Houd links aan richting Rotterdam Centrum'")
    a.pg.wait_for_timeout(200); a.shot('10-long-banner')
    r=a.rect('#banner'); check(r[3]-r[1]<140,'balk blijft compact met lange tekst (hoogte %d)'%(r[3]-r[1]))
    nb=[a.rect(s) for s in ['#eta','#remd','#navset','#stopnav']]
    check(nb[1][2]<=nb[2][0]+1,'onderbalk past op 360 breed %s'%nb)
    print('instellingen tijdens navigeren')
    a.pg.click('#navset'); a.pg.wait_for_timeout(300); check(a.vis('#settings'),'instellingen open')
    a.pg.click('label:has(#s-voice)'); a.pg.click('#closesettings'); a.pg.wait_for_timeout(300)
    check(a.ev("window.__mn.st.nav") and a.vis('#banner') and not a.vis('#settings'),'terug in navigatie')
    a.pg.click('#stopnav'); a.pg.wait_for_timeout(800)
    print('lang drukken op de kaart'); 
    a.ev("window.__mn.map().h.contextmenu.forEach(f=>f({lngLat:{lat:52.375,lng:4.905}}))"); a.pg.wait_for_timeout(800)
    check(a.vis('#routesheet') and 'Nieuwendijk' in a.pg.inner_text('#destname'),'gekozen punt krijgt een straatnaam: '+a.pg.inner_text('#destname'))
    check(a.pg.input_value('#q')!='' ,'zoekveld toont bestemming: "%s"'%a.pg.input_value('#q'))
    print('ERR',a.errs); check(not a.errs,'geen fouten')
    a.close()
print('BEVINDINGEN',F)
