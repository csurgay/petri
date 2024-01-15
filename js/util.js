var DEBUG=0;

const           PLACE=0,TRANSITION=1,FLOW=2,MIDPOINT=3,LABEL=4,BUTTON=5;
const objects=["PLACE","TRANSITION","FLOW","MIDPOINT","LABEL","BUTTON"];

const states=[
     "IDLE","SELECT","DRAG","DRAWARROW","LEFTDOWN","DELETE","MIDDLE","PAN","RUN","SHIFTCLICK","ZOOM", "MULTISEGMENT", "SLOWRUN", "FILES", "FLY", "TEXTBOX", "DRAGALL"];
const IDLE=0,SELECT=1,DRAG=2,DRAWARROW=3,LEFTDOWN=4,DELETE=5,MIDDLE=6,PAN=7,RUN=8,SHIFTCLICK=9,ZOOM=10,MULTISEGMENT=11,SLOWRUN=12,FILES=13,FLY=14,TEXTBOX=15,DRAGALL=16;
var state=IDLE;

const LINEWIDTH=2;
const DASHED=[5,3];
const PLACE_R=20;

const COLOR_CANVAS="rgb(250, 240, 230)";
const COLOR_ENABLED="yellow";
const COLOR_INK="black";
const COLOR_HIGHLIGHT="black";

const COLORS=["black","red","green","blue"];

function clearCanvas(canvas) {
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
    ctx.fillStyle = COLOR_CANVAS;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function log(str) {
    console.log(str);
}

var idPlace=0, idTrans=0, idFlow=0, idLabel=0;
function nextId(type) {
    if (type==PLACE) return ++idPlace;
    else if (type==TRANSITION) return ++idTrans;
    else if (type==FLOW) return ++idFlow;
    else if (type==LABEL) return ++idLabel;
}

function dashed() {
    ctx.setLineDash(DASHED);
}

function solid() {
    ctx.setLineDash([]);
}

function rotate(cx,cy,x,y,alpha) {
    var tx=x-cx,ty=y-cy;
    return [tx*Math.cos(alpha)-ty*Math.sin(alpha)+cx,
            tx*Math.sin(alpha)+ty*Math.cos(alpha)+cy];
}

class Coord {
    constructor(x,y) {
        this.x=x;
        this.y=y;
    }
    moveTo(coord) {
        this.x=coord.x;
        this.y=coord.y;
    }
}

class Object extends Coord {
    constructor(x,y) {
        super(x,y);
        this.id;
        this.color=COLOR_INK;
        this.visible=true;
    }

    draw() {}

    setColor() {
        if (COLOR_HIGHLIGHT=="black") {
            ctx.strokeStyle=this.color;
            pn.highlighted==this?dashed():solid();
        }
        else {
            ctx.strokeStyle=pn.highlighted==this?COLOR_HIGHLIGHT:this.color;
        }
    }

    nextColor(delta) {
        if (delta>0) {
            this.color=COLORS[(COLORS.indexOf(this.color)+1)%COLORS.length];
        }
        else {
            this.color=COLORS[(COLORS.indexOf(this.color)-1+COLORS.length)%COLORS.length];
        }
        if (COLOR_HIGHLIGHT!="black") pn.highlighted=null;
    }

    cursored() {}

    clicked() {}

    dragTo(dx,dy) {
        this.x=snap(this.x+dx);
        this.y=snap(this.y+dy);
    }

    delete() {};
}

function stateChange(newState) {
    if (DEBUG) console.log(states[state]+" -> "+states[newState]);
    state=newState;
}

function getCoord(evt) {
    const rect = canvas.getBoundingClientRect();
    cursor.x = snap(evt.clientX/pn.zoom-rect.left-pn.cx/pn.zoom-pn.vpx);
    cursor.y = snap(evt.clientY/pn.zoom-rect.top-pn.cy/pn.zoom-pn.vpy);
    ccursor.x = evt.clientX-rect.left;
    ccursor.y = evt.clientY-rect.top;
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
    ctx.lineWidth=lineWidth;
    g.moveTo(fromx,fromy);
    g.lineTo(tox,toy);
    g.stroke();
    g.beginPath();
    if (subtype=="ENABLER") {
        ctx.lineWidth=1;
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

  function closeEnough(c1,c2) {
    return Math.hypot(c2.x-c1.x,c2.y-c1.y) <= 2;
  }

  function distancePointAndSection(p,p1,p2) {
    const A = p.x - p1.x;
    const B = p.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;
    var xx, yy;
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    }
    else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    }
    else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }
    return Math.hypot(p.x-xx,p.y-yy);
  }

  function getFormattedDate() {
    const d=new Date();
    return d.getFullYear()+"-"+zeroPad(d.getMonth()+1)+"-"+zeroPad(d.getDate())+" "+
        zeroPad(d.getHours())+":"+zeroPad(d.getMinutes())+":"+zeroPad(d.getSeconds());
  }

  function zeroPad(v) {
    if (v<10) return "0"+v;
    else return ""+v;
  }