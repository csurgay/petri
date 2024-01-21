var grid=10;

const LINEWIDTH=2;
const DASHED=[5,3];
const PLACE_R=20;

const COLOR_CANVAS="rgb(250, 240, 230)";
const COLOR_ENABLED="yellow";
const COLOR_INK="black";
const COLOR_HIGHLIGHT="black";

const COLORS=["black","red","green","blue"];

class graphics {
    constructor(ctx) {
        this.ctx=ctx;
    }
    clearCanvas(canvas) {
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight;
        this.ctx.fillStyle = COLOR_CANVAS;
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    standard(lineWidth) {
        this.solid();
        this.ctx.fillStyle=COLOR_CANVAS;
        this.ctx.strokeStyle=COLOR_INK;
        this.ctx.lineWidth=lineWidth;
    }
    lineWidth(lineWidth) {
        this.ctx.lineWidth=lineWidth;
    }
    dashed() {
        ctx.setLineDash(DASHED);
    }
    solid() {
        ctx.setLineDash([]);
    }
    moveTo(x,y) {
        if (snap=="SNAP") this.ctx.moveTo(snap(x),snap(y));
        else this.ctx.moveTo(x,y);
    }
    lineTo(x,y) {
        if (snap=="SNAP") this.ctx.lineTo(snap(x),snap(y));
        else this.ctx.lineTo(x,y);
    } 
    rect(x,y,w,h) {
        if (snap=="SNAP") this.ctx.rect(snap(x),snap(y),w,h);
        else this.ctx.rect(x,y,w,h);
    }
    arc(x,y,r,a1,a2) {
        if (snap=="SNAP") this.ctx.arc(snap(x),snap(y),r,a1,a2);
        else this.ctx.arc(x,y,r,a1,a2);
    }
    fillText(t,x,y) {
        if (snap=="SNAP") this.ctx.fillText(t,snap(x),snap(y));
        else this.ctx.fillText(t,x,y);
    }
    beginPath() { this.ctx.beginPath() }
    fill(mode) { this.ctx.fill(mode) }
    stroke() { this.ctx.stroke() }
}

function snap(v) {
    if (grid==0||shiftKeys(storedEvt,"ALT")||shiftKeys(storedEvt,"ALTSHIFT")||state==PAN) return v
    else return Math.round(v/grid)*grid;
}

function drawRotatingPacman() {
    g.beginPath();
    g.standard(1);
    const alpha=(ms%(628*1000/628))/(100*1000/628)-Math.PI/2;
    const z=pn.zoom==1?7:6;
    g.arc(12,20,10,alpha,alpha+z*Math.PI/4)
    g.lineTo(12,20)
    ctx.closePath();
    g.stroke();
}

function drawArrow(fromx,fromy,tox,toy,lineWidth=1,color,subtype="ENABLER") {
    const headlen=20;
    const alpha=17;
    var dx=tox-fromx;
    var dy=toy-fromy;
    var angle=Math.atan2(dy,dx);
    g.beginPath();
    ctx.strokeStyle=color;
    ctx.fillStyle=color;
    g.lineWidth(lineWidth);
    g.moveTo(fromx,fromy);
    g.lineTo(tox,toy);
    g.stroke();
    g.beginPath();
    if (subtype=="ENABLER") {
        g.lineWidth(1);
        g.moveTo(tox,toy);
        g.lineTo(tox-headlen*Math.cos(angle-alpha*Math.PI/180),toy-headlen*Math.sin(angle-alpha*Math.PI/180));
        g.lineTo(tox-headlen*Math.cos(angle+alpha*Math.PI/180),toy-headlen*Math.sin(angle+alpha*Math.PI/180));
        ctx.closePath();
        g.fill();
    } 
    else if (subtype=="INHIBITOR") {
        ctx.fillStyle=COLOR_CANVAS;
        g.arc(tox,toy,7,0,2*Math.PI);
        g.fill();
        g.stroke();
    }
  }
