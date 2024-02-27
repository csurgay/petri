var DEBUG=0, RECORD=0, PLAYBACK=0;

const           PLACE=0,TRANSITION=1,FLOW=2,MIDPOINT=3,LABEL=4,BUTTON=5;
const objects=["PLACE","TRANSITION","FLOW","MIDPOINT","LABEL","BUTTON"];

const states=[
     "IDLE","SELECT","DRAG","DRAWARROW","LEFTDOWN","DELETE",
     "MIDDLE","PAN","RUN","SHIFTCLICK","ZOOM", "MULTISEGMENT", 
     "SLOWRUN", "FILES", "FLY", "TEXTBOX", "DRAGALL", "HELP", "PREFS"];
var state="IDLE";

function log(str) {
    console.log(str);
}

function error(str) {
    console.log("Error: "+str);
}

var idPlace=0, idTrans=0, idFlow=0, idLabel=0, idMidpoint=0;
function nextId(type) {
    if (type==PLACE) return ++idPlace;
    else if (type==TRANSITION) return ++idTrans;
    else if (type==FLOW) return ++idFlow;
    else if (type==LABEL) return ++idLabel;
    else if (type==MIDPOINT) return ++idMidpoint;
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

function isState(oldState) {
    if (!states.includes(oldState)) { console.log("ERROR: unknown state '"+oldState+"'"); }
    return state==oldState;
}

function stateChange(newState) {
    if (!states.includes(newState)) { console.log("ERROR: unknown state '"+newState+"'"); }
    if (DEBUG) if (!isState(newState)) log(state+" -> "+newState);
    state=newState;
}

function getCoord(evt) {
    const rect = canvas.getBoundingClientRect();
    cursor.x = evt.clientX/pn.zoom-rect.left-pn.cx/pn.zoom-pn.vpx;
    cursor.y = evt.clientY/pn.zoom-rect.top-pn.cy/pn.zoom-pn.vpy;
    scursor.x = snap(evt.clientX/pn.zoom-rect.left-pn.cx/pn.zoom-pn.vpx);
    scursor.y = snap(evt.clientY/pn.zoom-rect.top-pn.cy/pn.zoom-pn.vpy);
    ccursor.x = evt.clientX-rect.left;
    ccursor.y = evt.clientY-rect.top;
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

  function getFormattedDate(millisec="none") {
    if (millisec=='millisec') return Date.now();
    const d=new Date();
    var str=d.getFullYear()+"-"+
        zeroPad(d.getMonth()+1)+"-"+
        zeroPad(d.getDate())+" "+
        zeroPad(d.getHours())+":"+
        zeroPad(d.getMinutes())+":"+
        zeroPad(d.getSeconds());
    if (millisec=='millisec')
        str+="."+("00"+d.getMilliseconds()).substr(-3);
    return str;
  }

  function zeroPad(v) {
    if (v<10) return "0"+v;
    else return ""+v;
  }