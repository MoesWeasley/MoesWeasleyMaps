"""Eindgebruiker-test: loopt de app door zoals een bestuurder dat doet en meldt wat er mis gaat."""
import sys
from playwright.sync_api import sync_playwright
from harness import App, CTL, A, D
F = []
def check(ok, what):
    print(('  ok   ' if ok else '  FOUT ') + what)
    if not ok: F.append(what)

only = sys.argv[1:]
def want(n): return not only or n in only

with sync_playwright() as p:
    if want('launch'):
        print('1. Eerste keer openen, met GPS')
        a = App(p)
        a.pg.wait_for_timeout(1500)
        check(a.vis('#q'), 'zoekbalk zichtbaar')
        check(a.vis('#speed'), 'snelheidsmeter zichtbaar')
        check(a.ev("!!window.__mn.st.pos"), 'GPS-positie ontvangen')
        check(a.vis('#moes'), 'Moes zichtbaar')
        a.shot('1-home')
        print('   lege zoekbalk aantikken (nog geen geschiedenis)')
        a.pg.click('#q'); a.pg.wait_for_timeout(300)
        check(not a.vis('#results'), 'geen lege lijst')
        print('   zoeken')
        a.search('centraal')
        check(a.vis('#results'), 'resultaten zichtbaar')
        txt = a.pg.inner_text('#results'); check('Centraal Station' in txt, 'Centraal Station gevonden'); check(' m' in txt or 'km' in txt, 'afstand bij resultaat: ' + txt.replace('\n', ' | '))
        a.search('xyzxyz'); check('Niets gevonden' in a.pg.inner_text('#results'), 'melding bij niets gevonden')
        a.search('a'); check(not a.vis('#results') or 'Recent' in a.pg.inner_text('#results'), 'één letter: geen zoekactie')
        print('   kiezen en route')
        a.search('centraal'); a.pick(0)
        check(a.vis('#routesheet'), 'routescherm open')
        check(a.pg.locator('#alts .alt').count() == 2, 'twee routes')
        check('aankomst' in a.pg.inner_text('#alts'), 'aankomsttijd in route')
        a.shot('2-routesheet')
        rs = a.rect('#routesheet'); check(rs[3] <= 820 + 1 and rs[1] > 100, 'routescherm past op het scherm %s' % rs)
        print('   andere route kiezen')
        a.pg.locator('#alts .alt').nth(1).click(); a.pg.wait_for_timeout(200)
        check(a.ev("window.__mn.st.sel") == 1, 'tweede route gekozen')
        print('   bewaren als Thuis')
        a.pg.click('#favbtn'); a.pg.click('#favpick [data-fav=home]'); a.pg.wait_for_timeout(200)
        check('Thuis' in a.toast(), 'melding opgeslagen als thuis')
        print('   annuleren')
        a.pg.click('#cancelroute'); a.pg.wait_for_timeout(400)
        check(not a.vis('#routesheet'), 'routescherm dicht')
        check(a.ev("window.__mn.st.routes.length") == 0, 'routes weg')
        check(a.pg.input_value('#q') == '', 'zoekveld leeg')
        a.pg.click('#q'); a.pg.wait_for_timeout(300)
        r = a.pg.inner_text('#results') if a.vis('#results') else ''
        check('Thuis' in r and 'Recent' not in r.split('\n')[0] or 'Favorieten' in r, 'Thuis en recent in de lijst: ' + r.replace('\n', ' | '))
        a.pg.keyboard.press('Escape')
        print('   errors:', a.errs); check(not a.errs, 'geen fouten in de console')
        a.close()

    if want('nogps'):
        print('2. Geen toestemming voor locatie')
        a = App(p, geo=False)
        a.pg.wait_for_timeout(1500)
        t = a.toast(); check('locatie' in t.lower(), 'uitleg als locatie geweigerd is: "%s"' % t)
        a.pg.wait_for_timeout(3500)
        a.pg.click('#locate'); a.pg.wait_for_timeout(400)
        t = a.toast(); check('toegang' in t.lower() or 'locatie aan' in t.lower(), 'locatieknop legt uit dat locatie uit staat: "%s"' % t)
        a.search('centraal'); a.pick(0); a.pg.wait_for_timeout(500)
        check('midden van de kaart' in a.toast() or a.pg.locator('#alts .alt').count() >= 1, 'route zonder GPS: vanaf kaartmidden')
        a.close()

    if want('slow'):
        print('3. Trage routeplanner: op Start drukken voordat de route er is')
        a = App(p, init="window.__slow=/route\\/v1/;window.__slowMs=2500;")
        a.search('centraal'); a.pick(0)
        a.pg.wait_for_timeout(200)
        dis = a.ev("document.getElementById('startnav').disabled")
        a.pg.click('#startnav', force=True); a.pg.wait_for_timeout(300)
        check(dis or a.toast() != '', 'Start geeft reactie of is uitgeschakeld tijdens berekenen (disabled=%s, toast="%s")' % (dis, a.toast()))
        a.pg.wait_for_timeout(3000)
        check(not a.ev("document.getElementById('startnav').disabled"), 'Start weer bruikbaar als route er is')
        a.close()

    if want('fail'):
        print('4. Routeplanner faalt / geen route')
        CTL['route'] = 'fail'
        a = App(p)
        a.search('centraal'); a.pick(0); a.pg.wait_for_timeout(800)
        txt = a.pg.inner_text('#alts'); check('Geen route' in txt, 'melding geen route: ' + txt.replace('\n', ' '))
        dis = a.ev("document.getElementById('startnav').disabled")
        check(dis, 'Start uitgeschakeld als er geen route is')
        check(a.pg.locator('#alts button, #retry').count() > 0 or 'opnieuw' in txt.lower(), 'manier om opnieuw te proberen')
        CTL['route'] = 'ok'
        a.close()

    if want('search_off'):
        print('5. Zoeken zonder internet')
        CTL['search'] = 'fail'
        a = App(p)
        a.search('centraal'); a.pg.wait_for_timeout(1500)
        r = a.pg.inner_text('#results') if a.vis('#results') else ''
        t = a.toast()
        check('internet' in (r + t).lower(), 'zoeken zonder internet zegt dat: results="%s" toast="%s"' % (r, t))
        CTL['search'] = 'ok'
        a.close()

    if want('stop'):
        print('6. Tussenstop toevoegen en dan toch niet')
        a = App(p)
        a.search('centraal'); a.pick(0)
        a.pg.click('#addstop'); a.pg.wait_for_timeout(300)
        check(a.ev("document.getElementById('q').placeholder").startswith('Tussenstop'), 'zoekveld vraagt om tussenstop')
        a.pg.mouse.click(200, 500); a.pg.wait_for_timeout(400)  # gebruiker tikt ernaast
        check(a.vis('#routesheet') or a.vis('#results'), 'na ernaast tikken is het routescherm terug (niet vast)')
        a.close()
        a = App(p)
        a.search('centraal'); a.pick(0)
        a.pg.click('#addstop'); a.pg.wait_for_timeout(200)
        a.search('centrale'); a.pick(0)
        check(a.vis('#routesheet'), 'routescherm na kiezen tussenstop')
        check(a.pg.locator('#stops .stop').count() == 1, 'tussenstop in lijst')
        check(a.ev("document.getElementById('q').placeholder") == 'Waar wil je heen?', 'zoekveld weer normaal')
        a.pg.click('#stops .stop button'); a.pg.wait_for_timeout(500)
        check(a.pg.locator('#stops .stop').count() == 0, 'tussenstop weghalen')
        a.close()

    if want('nav'):
        print('7. Navigeren: instellingen bereikbaar, van de route af, terug')
        a = App(p)
        a.search('centraal'); a.pick(0)
        a.pg.click('#startnav'); a.pg.wait_for_timeout(1200)
        check(a.vis('#banner') and a.vis('#navbar'), 'balk en onderbalk zichtbaar')
        check(not a.vis('#top'), 'zoekbalk weg tijdens navigeren')
        can = a.pg.locator('#navbar button').count() > 1 or a.vis('#opensettings')
        check(can, 'tijdens navigeren kun je bij instellingen (stem uit)')
        a.shot('3-nav')
        # overlap: banner, snelheid, Moes, limiet
        def ov(x, y):
            r1, r2 = a.rect(x), a.rect(y)
            if not (a.vis(x) and a.vis(y)): return False
            return not (r1[2] <= r2[0] or r2[2] <= r1[0] or r1[3] <= r2[1] or r2[3] <= r1[1])
        for x, y in [('#banner', '#speed'), ('#banner', '#moes'), ('#navbar', '#speed'), ('#navbar', '#moes'), ('#speed', '#moes'), ('#limit', '#moes')]:
            check(not ov(x, y), 'geen overlap %s / %s' % (x, y))
        print('   van de route af rijden')
        CTL['calls'].clear()
        for i in range(5):
            a.ev("window.__mn.onPos({lat:52.372,lon:4.906+%f,acc:5,speed:12,heading:90,t:Date.now()})" % (i * 0.0002)); a.pg.wait_for_timeout(1000)
        a.pg.wait_for_timeout(800)
        check(len(CTL['calls']) >= 1, 'nieuwe route berekend (%d keer)' % len(CTL['calls']))
        check('berekenen' not in a.pg.inner_text('#btext'), 'balk niet blijven hangen op "berekenen": ' + a.pg.inner_text('#btext'))
        print('   herberekenen mislukt')
        CTL['route'] = 'fail'
        a.ev("window.__mn.st.lastReroute=0")
        for i in range(5):
            a.ev("window.__mn.onPos({lat:52.365,lon:4.89+%f,acc:5,speed:12,heading:90,t:Date.now()})" % (i * 0.0002)); a.pg.wait_for_timeout(700)
        a.pg.wait_for_timeout(800)
        bt = a.pg.inner_text('#btext'); print('   balk na mislukken:', bt, '| toast:', a.toast())
        check('berekenen' not in bt.lower() or a.toast(), 'na mislukte herberekening krijgt de bestuurder uitleg')
        CTL['route'] = 'ok'
        print('   kaart verschuiven en hercentreren')
        a.ev("window.__mn.st.follow=false;document.getElementById('recenter').hidden=false")
        a.pg.click('#recenter'); a.pg.wait_for_timeout(300)
        check(a.ev("window.__mn.st.follow"), 'hercentreren volgt weer')
        check(not a.errs, 'geen fouten: %s' % a.errs)
        a.close()

    if want('persist'):
        print('8. Instellingen blijven bewaard')
        a = App(p)
        a.pg.click('#opensettings'); a.pg.wait_for_timeout(300)
        a.pg.click('#seg-theme [data-v=dark]'); a.pg.click('label:has(#s-voice)'); a.pg.click('label:has(#s-moes)')
        a.pg.click('#seg-saver [data-v=on]'); a.pg.wait_for_timeout(300)
        a.shot('4-settings-dark')
        a.pg.click('#closesettings')
        a.pg.reload(); a.pg.wait_for_timeout(1500)
        check(a.ev("document.body.classList.contains('dark')"), 'donker blijft na herstart')
        check(not a.ev("document.getElementById('s-voice').checked"), 'stem uit blijft na herstart')
        check(not a.vis('#moes'), 'Moes uit blijft na herstart')
        check(a.ev("document.body.classList.contains('saver')"), 'spaarstand blijft na herstart')
        a.shot('5-home-dark')
        sh = a.rect('#settings')
        a.pg.click('#opensettings'); a.pg.wait_for_timeout(300)
        sc = a.ev("(function(){var s=document.getElementById('settings');return [s.scrollHeight,s.clientHeight,getComputedStyle(s).overflowY]})()")
        check(sc[0] <= sc[1] or sc[2] in ('auto', 'scroll'), 'instellingen scrollbaar als ze niet passen %s' % sc)
        a.close()

    if want('small'):
        print('9. Klein scherm (360x640) en liggend (800x380)')
        for (w, h) in [(360, 640), (800, 380)]:
            a = App(p, w=w, h=h)
            a.search('centraal'); a.pick(0); a.pg.wait_for_timeout(300)
            a.shot('6-route-%dx%d' % (w, h))
            r = a.rect('#startnav'); check(r and r[3] <= h and r[1] >= 0, 'Start-knop in beeld bij %dx%d: %s' % (w, h, r))
            a.pg.click('#startnav'); a.pg.wait_for_timeout(1500)
            a.shot('7-nav-%dx%d' % (w, h))
            for sel in ['#banner', '#navbar', '#speed', '#stopnav']:
                r = a.rect(sel); check(r and r[0] >= -1 and r[2] <= w + 1 and r[3] <= h + 1, '%s in beeld bij %dx%d: %s' % (sel, w, h, r))
            a.close()

    if want('det'):
        print('10. Detector testen in de browser')
        a = App(p)
        a.pg.click('#opensettings'); a.pg.wait_for_timeout(200)
        a.pg.click('#detpair'); a.pg.wait_for_timeout(200)
        check('telefoon' in a.toast(), 'koppelen in browser legt uit: ' + a.toast())
        a.pg.click('#dettest'); a.pg.wait_for_timeout(4000)
        check(a.vis('#alert'), 'testmelding zichtbaar')
        a.close()

print('\nBEVINDINGEN (%d):' % len(F))
for f in F: print(' -', f)
