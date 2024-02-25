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

const pn=new Petrinet();
setupStatus();
setupButton();

var m=16; // margin for help frame
const fh=new Frame("Help", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m, ww/2);
m=10; // margin for prefs frame
const fp=new Frame("Preferences", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m, ww/2);
m=12; // margin for file frame
const ff=new Frame("Open Nets File", ww/m, 20+wh/m, (m-2)*ww/m, (m-2)*wh/m, ww/2);
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
        selectedFile=-1;
        for (var i=0; i<files.length; i++) {
            g.textAlign("left");
            g.textBaseline('top');
            g.font("16px arial");
            g.fillStyle(COLOR_INK);
            var width=g.measureText(files[i]).width;
            if (ccursor.x>200 && ccursor.x<200+width && ccursor.y>100+20*i && ccursor.y<119+20*i) {
                g.font("bold 16px arial");
                selectedFile=i;
            }
            g.fillText(files[i],200,100+20*i);
        }
    }
    // Help mode
    if (isState("HELP")) {
        fh.draw();
    }
    // Prefs mode
    if (isState("PREFS")) {
        fp.draw();
    }
    // Running mode
    if (isState("FLY")) { pn.fireOne(); }
    if (isState("RUN")) { 
        if (ms-msSlowrun>100) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    if (isState("SLOWRUN")) { 
        if (ms-msSlowrun>1000) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    requestAnimationFrame(animate);
}
