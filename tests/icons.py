from playwright.sync_api import sync_playwright
from harness import App, CTL
with sync_playwright() as p:
    a=App(p); pg=a.pg; pg.wait_for_timeout(2500)
    html=pg.evaluate("""()=>{var I=window.__mn.icons(),t=['vast','mobiel','traject','roodlicht'].map(k=>I.cam(k)).concat(['werk','ongeval','file','afsluiting','pech','obstakel','rijstrook','weer','evenement','overig','brug','milieu','ev'].map(k=>I.sign(k))).concat([I.tl]);
      var d=document.createElement('div');d.id='gal';d.style.cssText='position:fixed;inset:0;z-index:99;background:#efe8ff;display:grid;grid-template-columns:repeat(4,80px);grid-auto-rows:80px;gap:10px;padding:20px;align-content:start';d.innerHTML=t.map(s=>'<div style="width:72px;height:72px">'+s.replace('<svg ','<svg width=72 height=72 ')+'</div>').join('');document.body.appendChild(d);return t.length}""")
    pg.screenshot(path='/home/claude/tests/icons.png',clip={'x':0,'y':0,'width':400,'height':820})
    pg.evaluate("document.getElementById('gal').remove()")
    print('verkeerslichten geladen:',a.ev("Object.keys(window.__mn.icons().signals.nodes).length"),'vragen:',CTL.get('sigq'))
    print('kaart-afbeeldingen:',sorted(a.ev("Object.keys(window.__imgs||{})")))
    print('ERR',a.errs); a.close()
