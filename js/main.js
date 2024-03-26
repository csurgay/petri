const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
const g=new graphics(ctx);
var ww=window.innerWidth, wh=window.innerHeight;
const events=new Events();
addEventListener('mousedown',events.mousedownevent);
addEventListener('mouseup',events.mouseupevent);
addEventListener('mousemove',events.mousemoveevent);
addEventListener('mousewheel',events.mousewheelevent);
addEventListener('keyup', events.keyupevent);
addEventListener('keydown', events.keydownevent);
addEventListener('contextmenu',evt=>{evt.preventDefault();});

const state=new State("IDLE");
const pn=new Petrinet();
const forms=new Forms();
const fb=new BaseForm("notitle",0,40,ww,wh-40);
setupStatus();
const bar=new Buttonbar("noframe",0,0,ww,40);

var m=16; // margin for help frame
const fh=new Form("HELP","Help", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=10; // margin for prefs frame
const fp=new Form("PREFS","Preferences", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=12; // margin for file frame
const ff=new FileForm("Open Files", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
const textbox=new TextboxForm("Textbox",100,0,100,20,'frame',"default text");

new MouseEvent(
    "mousemove",
    {
        clientX: 210,
        clientY: 210,
        bubbles: true
    }
)

animate();

var ms,msSlowrun=0;

function animate() {
    ww=window.innerWidth, wh=window.innerHeight;
    fb.w=ww; fb.h=wh-40; bar.w=ww;
    events.processEvent();
    ms=Date.now();
    g.clearCanvas(canvas);
    g.translate(0.5, 0.5);
    // Forms
    forms.draw();
    drawRotatingPacman();    
    // Running mode
    if (state.is("FLY")) { pn.fireOne(); }
    else if (state.is("RUN")) { 
        if (ms-msSlowrun>100) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    else if (state.is("PLAY")) { 
        if (ms-msSlowrun>1000) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    if (state.RUNNING) requestAnimationFrame(animate);
}
