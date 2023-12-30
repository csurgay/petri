const canvas=document.getElementById("petrinetCanvas");
const ctx=canvas.getContext("2d");
addEventListener('mousedown',mousedown);
addEventListener('mouseup',mouseup);
addEventListener('mousemove',mousemove);
addEventListener('mousewheel',mousewheel);
addEventListener('contextmenu',evt=>{evt.preventDefault();});

var pn=new Petrinet();

const states=[
     "IDLE","SELECT","DRAG","DRAWARROW","LEFTDOWN","DELETE","MIDDLE","PAN","RUN","DRAGALL"];
const IDLE=0,SELECT=1,DRAG=2,DRAWARROW=3,LEFTDOWN=4,DELETE=5,MIDDLE=6,PAN=7,RUN=8,DRAGALL=9;
var state=IDLE;

animate();

function animate() {
    clearCanvas(canvas);
    ctx.beginPath();
    ctx.strokeStyle="black";
    const ms=(Date.now()%(628*2))/200;
    const z=pn.zoom==1?7:6;
    ctx.arc(20,20,10,ms,ms+z*Math.PI/4)
    ctx.lineTo(20,20)
    ctx.closePath();
    ctx.stroke();
    ctx.font ="16px arial";
    ctx.fillStyle="black";
    ctx.textAlign = "left";
    ctx.textBaseline = 'top';
    ctx.fillText("Petrinet Simulator - 2023 csurgay@gmail.com",40,15);
    ctx.save();
    ctx.translate(pn.cy,pn.cx);
    ctx.scale(pn.zoom,pn.zoom);
    ctx.translate(pn.vpx,pn.vpy);
    pn.draw();
    ctx.restore();
    if (state==RUN) {
        pn.fireOne();
    }
    requestAnimationFrame(animate);
}

function stateChange(newState) {
    state=newState;
}
