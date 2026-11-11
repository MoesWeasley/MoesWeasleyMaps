from playwright.sync_api import sync_playwright
from harness import App
from PIL import Image
with sync_playwright() as p:
    a=App(p); pg=a.pg
    pg.evaluate("document.querySelector('#moes').style.transform='scale(2.6)';document.querySelector('#moes').style.transformOrigin='0 100%'")
    pg.wait_for_timeout(2500); pg.evaluate("(()=>{var m=window.__mn.moes();m._set=m.set;m.set=function(){};})()")
    fs=[]
    for act,wait in [('eat',900),('eat',3500),('drink',1200),('drink',3000),('game',1200),('game',2600)]:
        if wait<2000 or act=='game' and wait==1200: pg.evaluate("(()=>{var m=window.__mn.moes();m.endAct(true);m.play('%s',true)})()"%act)
        pg.wait_for_timeout(wait if wait<2000 else wait-1200 if act!='game' else 1400)
        r=a.rect('#moes'); f='/tmp/pp%d.png'%len(fs); pg.screenshot(path=f,clip={'x':r[0]-10,'y':r[1]-10,'width':r[2]-r[0]+20,'height':r[3]-r[1]+20}); fs.append(f)
    ims=[Image.open(f) for f in fs]; out=Image.new('RGB',(sum(i.width for i in ims),max(i.height for i in ims)),'white'); x=0
    for i in ims: out.paste(i,(x,0)); x+=i.width
    out.save('/home/claude/tests/moes-props.png'); print(a.errs)
    a.close()
