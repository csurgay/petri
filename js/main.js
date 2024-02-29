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
setupStatus();
setupButton();

var m=16; // margin for help frame
const fh=new Form("Help", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=10; // margin for prefs frame
const fp=new Form("Preferences", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
m=12; // margin for file frame
const ff=new FileForm("Open Files", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m);
const textbox=new Textbox("title",100,0,100,20,'frame',false,"default text");

animate();

var ms,msSlowrun=0;

function animate() {
    events.processEvent();
    ms=Date.now();
    g.clearCanvas(canvas);
    g.translate(0.5, 0.5);
    if (DEBUG) drawRotatingPacman();    
    // Title line
    g.beginPath();
    g.font("16px arial");
    g.fillStyle(COLOR_INK);
    g.textAlign("left");
    g.textBaseline('top');
//    g.fillText("Petrinet Simulator - 2023 csurgay@gmail.com",40,15);
    g.textAlign("right");
    g.fillText(getFormattedDate(),canvas.width-20,15);
    // Static Status and Buttons
    pn.s.forEach(item => item.draw());
    pn.b.forEach(item => item.draw());
    // Draw PetriNet
    g.save();
    g.translate(pn.cx,pn.cy);
    g.scale(pn.zoom,pn.zoom);
    g.translate(pn.vpx,pn.vpy);
    if (pn.visible) pn.draw();
    textbox.render();
    g.restore();
    // File select
    if (isState("FILES")) {
        ff.draw();
    }
    // Help mode
    else if (isState("HELP")) {
        fh.draw();
    }
    // Prefs mode
    else if (isState("PREFS")) {
        fp.draw();
    }
    // Running mode
    else if (isState("FLY")) { pn.fireOne(); }
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
