var grid=10;

const LINEWIDTH=2;
const DASHED=[5,3];
const PLACE_R=20;

const COLOR_CANVAS="rgb(255, 245, 235)";
const COLOR_ENABLED="black";
const COLOR_WILLFIRE="rgb(110, 110, 110)";
const COLOR_INK="black";
const COLOR_HIGHLIGHT="blue";

const COLORS=["black","red","green","blue","#dddd00","purple", "brown", "Chartreuse", "DeepPink"];

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
        ctx.lineDashOffset=7-Math.floor(ms/49)%8;
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
    fillRect(x,y,w,h) {
        if (snap=="SNAP") this.ctx.fillRect(snap(x),snap(y),w,h);
        else this.ctx.fillRect(x,y,w,h);
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
    closePath() { this.ctx.closePath() }
    fill(mode) { this.ctx.fill(mode) }
    stroke() { this.ctx.stroke() }
    save() { this.ctx.save() }
    restore() { this.ctx.restore() }
    fillStyle(style) { this.ctx.fillStyle=style; }
    strokeStyle(style) { this.ctx.strokeStyle=style; }
    getStrokeStyle() { return this.ctx.strokeStyle; }
    font(style) { this.ctx.font=style; }
    textAlign(style) { this.ctx.textAlign=style; }
    textBaseline(style) { this.ctx.textBaseline=style; }
    setupText(style,textAlign,baseline) {
        this.ctx.font=style;
        this.ctx.textAlign=textAlign;
        this.ctx.textBaseline=baseline;
    }
    translate(dx, dy) { this.ctx.translate(dx, dy); }
    scale(qx, qy) { this.ctx.scale(qx, qy); }
    rotate(angle) { this.ctx.rotate(angle); }
    measureText(text) { return this.ctx.measureText(text); }
    clip() { this.ctx.clip(); }
}
function snap(v) {
    if (grid==0||SCA(storedEvt,".cA")) return v // ALT or SHIFTALT
    else return Math.round(v/grid)*grid;
}
var alpha=0.0;
function drawRotatingPacman() {
    var speed=0;
    if (state.is("PLAY")) speed=1;
    else if (state.is("RUN")) speed=4;
    else if (state.is("FLY")) speed=20;
    g.beginPath();
    g.standard(1);
    alpha += speed*2*Math.PI/60/4;
    const z=pn.zoom==1?7:6;
    g.arc(25,20,15,alpha,alpha+z*Math.PI/4)
    g.lineTo(25,20)
    ctx.closePath();
    g.stroke();
}
function drawArrow(fromx,fromy,tox,toy,lineWidth=1,color=COLOR_INK,subtype="ENABLER") {
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
