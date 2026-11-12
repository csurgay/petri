const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
const g=new graphics(ctx);
var ww=window.innerWidth, wh=window.innerHeight;
const events=new Events();
addEventListener('mousedown', events.mousedownevent.bind(events));
addEventListener('mouseup', events.mouseupevent.bind(events));
addEventListener('mousemove', events.mousemoveevent.bind(events));
addEventListener('wheel', events.mousewheelevent.bind(events), {passive:false});
addEventListener('keyup', events.keyupevent.bind(events));
addEventListener('keydown', events.keydownevent.bind(events));
addEventListener('blur', events.blurevent.bind(events));
addEventListener('focus', events.focusevent.bind(events));
addEventListener('contextmenu', sysEvent=>{sysEvent.preventDefault();});

const state=new State("SPLASH");
const pn=new Petrinet();
const forms=new Forms();
const fb=new BaseForm("notitle",0,40,ww,wh-40);
setupStatus();
const bar=new Buttonbar("noframe",0,0,ww,40);

const fh=new Form("HELP","Help", 16);
const fp=new PrefForm("Preferences", 10);
const ff=new FileForm("Open Files", 12);
// BFS Form
const fbfs =new BFSForm("BFS", 20);

const textbox=new TextboxForm("Textbox",100,0,100,20,'frame',"default text");
const splash = new SplashForm("PetriNet Simulator", 3);
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
else restoreAutosave();
// index.html?selftest=1 runs the self-test right after start
if (urlParams.has('selftest')) setTimeout(()=>runSelfTest(urlParams.get('selftest')!="1"?urlParams.get('selftest'):null), 1200);
buildPalette();
fb.active=bar.active=true;
state.set("IDLE");
animate();

var ms,msSlowrun=0;

function animate() {
    ww=window.innerWidth, wh=window.innerHeight;
    if (bar.layoutW!==ww) bar.layout(ww);
    fb.y=bar.h; fb.w=ww; fb.h=wh-bar.h; bar.w=ww;
    ff.initSize();
    fp.initSize();
    // Taken from the live site, this wasn't pushed to git yet
    fbfs.initSize();
    splash.initSize();
    grid=fp.gridSize.value;
    events.processEvent();
    ms=Date.now();
    g.clearCanvas(canvas);
    g.translate(0.5/g.dpr, 0.5/g.dpr);
    // Forms
    forms.draw();
    drawRotatingPacman();
    bar.drawTooltip();
    drawToast();
    drawHintBar();
    updateFileTitle();
    updatePalette();
    updateCursor();
    // Running mode
    const delays= { "PLAY":1000, "RUN":100, "FLY":0 };
    if (state.s in delays) {
        if (ms-msSlowrun>delays[state.s]) {
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
