const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
const g=new graphics(ctx);
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

const textbox=new Textbox("title",100,0,100,20,'frame',false,"default text");

animate();

var ms,msSlowrun=0;

function animate() {
    events.processEvent();
    ms=Date.now();
    g.clearCanvas(canvas);
    ctx.translate(0.5, 0.5);
    if (DEBUG) drawRotatingPacman();    
    // Title line
    g.beginPath();
    ctx.font ="16px arial";
    ctx.fillStyle=COLOR_INK;
    ctx.textAlign = "left";
    ctx.textBaseline = 'top';
//    g.fillText("Petrinet Simulator - 2023 csurgay@gmail.com",40,15);
    ctx.textAlign = "right";
    g.fillText(getFormattedDate(),canvas.width-20,15);
    // Static Status and Buttons
    pn.s.forEach(item => item.draw());
    pn.b.forEach(item => item.draw());
    // Draw PetriNet
    ctx.save();
    ctx.translate(pn.cx,pn.cy);
    ctx.scale(pn.zoom,pn.zoom);
    ctx.translate(pn.vpx,pn.vpy);
    if (pn.visible) pn.draw();
    textbox.render();
    ctx.restore();
    // File select
    if (state==FILES) {
        selectedFile=-1;
        for (var i=0; i<files.length; i++) {
            ctx.textAlign = "left";
            ctx.textBaseline = 'top';
            ctx.font="16px arial";
            ctx.fillStyle=COLOR_INK;
            var width=ctx.measureText(files[i]).width;
            if (ccursor.x>200 && ccursor.x<200+width && ccursor.y>100+20*i && ccursor.y<119+20*i) {
                ctx.font="bold 16px arial";
                selectedFile=i;
            }
            g.fillText(files[i],200,100+20*i);
        }
    }
    // Running mode
    if (state==FLY) { pn.fireOne(); }
    if (state==RUN) { 
        if (ms-msSlowrun>100) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    if (state==SLOWRUN) { 
        if (ms-msSlowrun>1000) {
            pn.fireOne();
            msSlowrun=ms;
        } 
    }
    requestAnimationFrame(animate);
}
