const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
const g=new graphics(ctx);
addEventListener('mousedown',mousedown);
addEventListener('mouseup',mouseup);
addEventListener('mousemove',mousemove);
addEventListener('mousewheel',mousewheel);
addEventListener('contextmenu',evt=>{evt.preventDefault();});
addEventListener('keyup', (evt) => {
    storedEvt=evt;
    if (state==TEXTBOX) {
        textbox.keypressed(evt);
    }
    else {
        if (evt.key=='d') DEBUG=1-DEBUG;
        if (evt.key=='s') {
            // Toggle sticky Flow heads of this Transition
            var o=pn.getCursoredObject(cursor,"VIEWPORT");
            if (o && o.type==TRANSITION) {
                pn.f.forEach(f=>{
                    if (f.o2==o) {
                        f.stickyHead=!f.stickyHead;
                    }
                })
            }
        }
    }
});

var pn=new Petrinet();
pn.animate=true;
setupStatus();
setupButton();

const textbox=new Textbox("title",100,0,100,20,'frame',false,"default text");

animate();

var ms,msSlowrun=0;
function animate() {
    ms=Date.now();
    clearCanvas(canvas);
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
    pn.draw();
    textbox.render();
    ctx.restore();
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
    if (pn.animate) requestAnimationFrame(animate);
}
