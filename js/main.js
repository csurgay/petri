const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
addEventListener('mousedown',mousedown);
addEventListener('mouseup',mouseup);
addEventListener('mousemove',mousemove);
addEventListener('mousewheel',mousewheel);
addEventListener('contextmenu',evt=>{evt.preventDefault();});
addEventListener('keyup', (evt) => {
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
});

var pn=new Petrinet();
pn.animate=true;
setupStatus();
setupButton();

animate();

var ms,msSlowrun=0;
function animate() {
    ms=Date.now();
    clearCanvas(canvas);
    ctx.translate(0.5, 0.5);
/*     // Rotating PacMan
    ctx.beginPath();
    ctx.strokeStyle=COLOR_INK;
    ctx.lineWidth=1;
    const alpha=(ms%(628*1000/628))/(100*1000/628)-Math.PI/2;
    const z=pn.zoom==1?7:6;
    ctx.arc(20,20,10,alpha,alpha+z*Math.PI/4)
    ctx.lineTo(20,20)
    ctx.closePath();
    ctx.stroke();
 */    
    // Title line
    ctx.beginPath();
    ctx.font ="16px arial";
    ctx.fillStyle=COLOR_INK;
    ctx.textAlign = "left";
    ctx.textBaseline = 'top';
//    ctx.fillText("Petrinet Simulator - 2023 csurgay@gmail.com",40,15);
    ctx.textAlign = "right";
    ctx.fillText(getFormattedDate(),canvas.width-20,15);
    // Static Status and Buttons
    pn.s.forEach(item => item.draw());
    pn.b.forEach(item => item.draw());
    // Draw PetriNet
    ctx.save();
    ctx.translate(pn.cx,pn.cy);
    ctx.scale(pn.zoom,pn.zoom);
    ctx.translate(pn.vpx,pn.vpy);
    pn.draw();
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
