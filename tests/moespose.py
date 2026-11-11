import sys
from playwright.sync_api import sync_playwright
from harness import App
from PIL import Image
tag=sys.argv[1] if len(sys.argv)>1 else 'voor'
with sync_playwright() as p:
    a=App(p); pg=a.pg
    pg.evaluate("document.querySelector('#moes').style.transform='scale(2.6)';document.querySelector('#moes').style.transformOrigin='0 100%'")
    pg.wait_for_timeout(2500)
    pg.evaluate("(()=>{var m=window.__mn.moes();m._set=m.set;m.set=function(){};})()")
    shots=[]
    for name,js in [('idle',"m.set('idle')"),('rechts',"m.set('point','right')"),('links',"m.set('point','left')"),('schrik',"m.set('shock')"),('blij',"m.set('happy')"),('zwaai',"m.set('idle');m.play('wave',true)"),('krab',"m.set('idle');m.play('scratch',true)"),('slaap',"m.set('sleepy')"),('rek',"m.set('idle');m.play('stretch',true)")]:
        pg.evaluate("(()=>{var m=window.__mn.moes();m.endAct(true);"+js.replace('m.set(','m._set(')+"})()"); pg.wait_for_timeout(1100)
        r=a.rect('#moes'); f='/tmp/mp_%s.png'%name
        pg.screenshot(path=f,animations='allow',clip={'x':r[0]-10,'y':r[1]-10,'width':r[2]-r[0]+20,'height':r[3]-r[1]+20}); shots.append(f)
    ims=[Image.open(f) for f in shots]; w=sum(i.width for i in ims); h=max(i.height for i in ims)
    out=Image.new('RGB',(w,h),'white'); x=0
    for i in ims: out.paste(i,(x,0)); x+=i.width
    out.save('/home/claude/tests/moes-%s.png'%tag); print(out.size, a.errs)
    a.close()
