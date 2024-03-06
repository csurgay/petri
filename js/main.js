const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
const g=new graphics(ctx);
const ww=window.innerWidth, wh=window.innerHeight;
const events=new Events();
addEventListener('mousedown',events.mousedownevent);
addEventListener('mouseup',events.mouseupevent);
addEventListener('mousemove',events.mousemoveevent);
addEventListener('mousewheel',events.mousewheelevent);
addEventListener('keyup', events.keyupevent);
addEventListener('keydown', events.keydownevent);
addEventListener('contextmenu',evt=>{evt.preventDefault();});
var RUNNING=true;

const pn=new Petrinet();
const fb=new BaseForm("PetriNet (c) 2024 csurgay@gmail.com",0,0,ww,wh);
setupStatus();
setupButton();

var m=16; // margin for help frame
const fh=new Form("HELP","Help", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=10; // margin for prefs frame
const fp=new Form("PREFS","Preferences", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=12; // margin for file frame
const ff=new FileForm("Open Files", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
const textbox=new TextboxForm("Textbox",100,0,100,20,'frame',"default text");

animate();

var ms,msSlowrun=0;

function animate() {
    events.processEvent();
    ms=Date.now();
    g.clearCanvas(canvas);
    g.translate(0.5, 0.5);
    // Forms
    forms.forEach(f=>{if (f.visible) f.draw();})
    if (DEBUG || true) drawRotatingPacman();    
    // Running mode
    if (isState("FLY")) { pn.fireOne(); }
    else if (isState("RUN")) { 
        if (ms-msSlowrun>100) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    else if (isState("PLAY")) { 
        if (ms-msSlowrun>1000) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    if (RUNNING) requestAnimationFrame(animate);
}
