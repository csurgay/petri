const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
const g=new graphics(ctx);
var ww=window.innerWidth, wh=window.innerHeight;
const events=new Events();
addEventListener('mousedown', events.mousedownevent.bind(events));
addEventListener('mouseup', events.mouseupevent.bind(events));
addEventListener('mousemove', events.mousemoveevent.bind(events));
addEventListener('mousewheel', events.mousewheelevent.bind(events));
addEventListener('keyup', events.keyupevent.bind(events));
addEventListener('keydown', events.keydownevent.bind(events));
addEventListener('contextmenu', sysEvent=>{sysEvent.preventDefault();});

const state=new State("SPLASH");
const pn=new Petrinet();
const forms=new Forms();
const fb=new BaseForm("notitle",0,40,ww,wh-40);
setupStatus();
const bar=new Buttonbar("noframe",0,0,ww,40);

var m=16; // margin for help frame
const fh=new Form("HELP","Help", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=10; // margin for prefs frame
const fp=new PrefForm("Preferences", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
//fp.addChild();
m=12; // margin for file frame
const ff=new FileForm("Open Files", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
const textbox=new TextboxForm("Textbox",100,0,100,20,'frame',"default text");
m=3;
const splash = new SplashForm("PetriNet Simulator", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
new MouseEvent(
    "mousemove",
    {
        clientX: 210,
        clientY: 210,
        bubbles: true
    }
)
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if (urlParams.has('net')) {
    const net=urlParams.get('net');
    log(here(),net);
    pn.load('nets/'+net);
}
fb.active=bar.active=true;
state.set("IDLE");
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
    // Running mode
    drawRotatingPacman();
    if (state.is("FLY")) { 
        pn.fireOne(); 
    }
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
    if (state.is("PLAY")||state.is("RUN")||state.is("FLY")) {
        if (fp.assertOnOff.value) {
            const assertion=convertAssert(fp.assertString.value);
            if (eval(assertion)) {
                state.set("IDLE");
                log(here(), "Assertion fired: "+assertion);
            }
        }
    }
    if (state.RUNNING) requestAnimationFrame(animate);
}
