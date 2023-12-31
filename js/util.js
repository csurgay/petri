function clearCanvas(canvas) {
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
}

var idPlace=0, idTrans=0;
function nextId(type) {
    if (type==PLACE) return ++idPlace;
    else if (type==TRANSITION) return ++idTrans;
}

class Coord {
    constructor(x,y) {
        this.x=x;
        this.y=y;
    }
}

class Object extends Coord {
    constructor(x,y) {
        super(x,y);
    }
    draw() {}
    cursored() {}
    dragTo(dx,dy) {
        this.x+=dx;
        this.y+=dy;
    }
    delete() {};
}

function stateChange(newState) {
    state=newState;
}

function getCoord(evt) {
    const rect = canvas.getBoundingClientRect();
    return new Coord(
        evt.clientX/pn.zoom-rect.left-pn.cx/pn.zoom-pn.vpx,
        evt.clientY/pn.zoom-rect.top-pn.cy/pn.zoom-pn.vpy);
}

function drawArrow(fromx,fromy,tox,toy,lineWidth=1,highlight=false,subtype="ENABLER") {
    const headlen=20;
    const alpha=17;
    var dx=tox-fromx;
    var dy=toy-fromy;
    var angle=Math.atan2(dy,dx);
    ctx.beginPath();
    ctx.strokeStyle="black";
    ctx.fillStyle="black";
    ctx.lineWidth=lineWidth;
    if (highlight) {
        ctx.strokeStyle="blue";
        ctx.fillStyle="blue";
    }
    ctx.moveTo(fromx,fromy);
    ctx.lineTo(tox,toy);
    ctx.stroke();
    ctx.beginPath();
    if (subtype=="ENABLER") {
        ctx.moveTo(tox,toy);
        ctx.lineTo(tox-headlen*Math.cos(angle-alpha*Math.PI/180),toy-headlen*Math.sin(angle-alpha*Math.PI/180));
        ctx.lineTo(tox-headlen*Math.cos(angle+alpha*Math.PI/180),toy-headlen*Math.sin(angle+alpha*Math.PI/180));
        ctx.closePath();
        ctx.fill();
    } 
    else if (subtype=="INHIBITOR") {
        ctx.fillStyle="rgb(250, 230, 190)";
        ctx.arc(tox,toy,7,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
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
