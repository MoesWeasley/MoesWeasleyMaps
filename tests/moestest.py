"""Moes volledig testen: begroeting, voetjes, kietelen, meekijken, slapen/wakker, hartje, rit (wijzen, schrikken, blij), uit/aan, spaarstand, spam-tikken, ballon in beeld."""
from playwright.sync_api import sync_playwright
from harness import App
F=[]
def check(ok,w):
    print(('  ok   ' if ok else '  FOUT ')+w)
    if not ok: F.append(w)
with sync_playwright() as p:
    a=App(p,w=360,h=740); pg=a.pg
    M="window.__mn.moes()"
    pg.wait_for_timeout(1500)
    b=pg.inner_text('.moes-say') if a.vis('.moes-say') else ''
    check(any(x in b for x in ['Goedemorgen','Goedemiddag','Goedenavond','vroeg']),'begroeting past bij de tijd: "%s"'%b)
    r=a.rect('.moes-say'); check(r is None or r[2]<=361,'ballon past op 360 breed: %s'%r)
    print('voetjes (20 s rustig)')
    feet=pg.evaluate("""()=>new Promise(res=>{var m=window.__mn.moes(),mx=0,t0=performance.now();(function f(){var v=Math.abs(m.cur.fL)+Math.abs(m.cur.fR)+Math.abs(m.cur.rL)/4+Math.abs(m.cur.rR)/4;mx=Math.max(mx,v);if(performance.now()-t0<20000)requestAnimationFrame(f);else res(mx)})()})""")
    check(feet>1,'voetjes bewegen af en toe (max %.1f)'%feet)
    print('meekijken als je op de kaart tikt')
    pg.mouse.click(340,300); pg.wait_for_timeout(120)
    g=pg.evaluate(M+".gaze"); check(g and g['x']>0.5,'ogen kijken naar de tik rechtsboven: %s'%g)
    print('kietelen (lang drukken)')
    mr=a.rect('#moes'); cx,cy=(mr[0]+mr[2])/2,(mr[1]+mr[3])/2
    pg.mouse.move(cx,cy); pg.mouse.down(); pg.wait_for_timeout(800)
    check('a-giggle' in pg.get_attribute('#moes','class'),'kietelen: giechelen')
    check(any(x in pg.inner_text('.moes-say') for x in ['kietel','Haha','kriebelt']),'kietelen: zegt iets: '+pg.inner_text('.moes-say'))
    pg.mouse.up(); pg.wait_for_timeout(200)
    check('kietel' in pg.inner_text('.moes-say') or 'Haha' in pg.inner_text('.moes-say') or 'kriebelt' in pg.inner_text('.moes-say'),'loslaten na kietelen telt niet als gewone tik')
    pg.wait_for_timeout(2500)
    print('drie keer tikken = hartje')
    for i in range(3): pg.click('#moes'); pg.wait_for_timeout(120)
    pg.wait_for_timeout(100); check('a-heart' in pg.get_attribute('#moes','class'),'hartje na 3 tikken')
    pg.wait_for_timeout(2500)
    print('spam-tikken')
    for i in range(20): pg.click('#moes'); pg.wait_for_timeout(40)
    pg.wait_for_timeout(3000); check(pg.evaluate(M+".state")=='idle','na spammen weer rustig: '+str(pg.evaluate(M+".state")))
    print('alle acties spelen zonder fout')
    for act in ['wave','scratch','yawn','look','giggle','wake','stretch','sneeze','hop','tickle','heart','eat','drink','game']:
        ok=pg.evaluate(M+".play('%s',true)"%act); pg.wait_for_timeout(500)
        check(ok,'actie '+act)
    pg.wait_for_timeout(2500)
    print('rit: wijzen, schrikken bij flitser, blij bij aankomst')
    a.search('centraal'); a.pick(0); pg.click('#startnav'); pg.wait_for_timeout(300)
    check('Op pad' in pg.inner_text('.moes-say'),'"Op pad!" bij vertrek: '+pg.inner_text('.moes-say'))
    a.ev("window.__mn.startSim()")
    seen=set(); lines=set()
    for i in range(440):
        pg.wait_for_timeout(500)
        s=pg.get_attribute('#moes','data-s'); seen.add(s+('@aankomst' if a.ev('window.__mn.st.arrived') else ''))
        if a.vis('.moes-say'): lines.add(pg.inner_text('.moes-say'))
        if a.ev("window.__mn.st.drive"): break
    print('   standen:',seen,'\n   zinnetjes:',lines)
    check('point' in seen,'wijst de afslag aan'); check('shock' in seen,'schrikt bij flitser'); check('happy@aankomst' in seen,'blij bij aankomst')
    check(any('rechts' in l.lower() for l in lines),'zegt "Hier rechts!"'); check(any('Flitser' in l for l in lines),'zegt "Flitser!"')
    print('   toestand:',a.ev("({nav:window.__mn.st.nav,drive:window.__mn.st.drive,top:document.getElementById('top').hidden,cls:document.getElementById('top').className,sheet:document.body.className})"))
    print('uit en aan')
    pg.click('#opensettings'); pg.click('label:has(#s-moes)'); pg.wait_for_timeout(400)
    check(not a.vis('#moes'),'Moes uit = weg')
    pg.click('label:has(#s-moes)'); pg.click('#closesettings'); pg.wait_for_timeout(400)
    check(a.vis('#moes'),'Moes aan = terug')
    print('spaarstand')
    pg.click('#opensettings'); pg.click('#seg-saver [data-v=on]'); pg.click('#closesettings')
    pg.click('#moes'); pg.wait_for_timeout(600); check(a.vis('.moes-say'),'reageert ook in spaarstand')
    print('donker')
    pg.click('#opensettings'); pg.click('#seg-theme [data-v=dark]'); pg.click('#closesettings')
    pg.click('#moes'); pg.wait_for_timeout(500)
    pg.screenshot(path='/home/claude/tests/moes-dark.png',clip={'x':0,'y':400,'width':360,'height':340})
    print('ERR',a.errs); check(not a.errs,'geen fouten')
    a.close()
print('BEVINDINGEN',F)
