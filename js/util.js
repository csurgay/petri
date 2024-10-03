/// IV9VBS Rework -> Open in multiple Browsers!
function here() {
  const e = new Error();
  const stackLine = e.stack ? e.stack.split("\n")[2] : null;

  if (stackLine) {
      const regex = /@?(.*):(\d+):(\d+)/;
      const match = regex.exec(stackLine);

      if (match) {
          var filepath = match[1];
          var line = match[2];
          var column = match[3];
          var filename = filepath.replace(/^.*[\\/]/, '');
          return filename + "(" + line + "): ";
      } else {
          console.warn("Stack trace format did not match expected pattern:", stackLine);
          return "unknown location: ";
      }
  } else {
      console.error("Could not retrieve stack trace.");
      return "unknown location: ";
  }
}
  
function log(here="js: ", str) {
    console.log(here+str);
}
function error(here="js: ", str) {
    console.log("Error in "+here+": "+str);
}

var idPlace=0, idTrans=0, idFlow=0, idLabel=0, idMidpoint=0;
function nextId(type) {
    switch (type) {
      case "PLACE": return ++idPlace;
      case "TRANSITION": return ++idTrans;
      case "FLOW": return ++idFlow;
      case "LABEL": return ++idLabel;
      case "MIDPOINT": return ++idMidpoint;
      default: error(here(), "Unknown object type: " + type);
    }
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
function getCoord(myevt) {
    const rect = canvas.getBoundingClientRect();
    tcursor.x = myevt.clientX/pn.zoom-rect.left-pn.cx/pn.zoom-pn.vpx;
    tcursor.y = myevt.clientY/pn.zoom-rect.top-pn.cy/pn.zoom-pn.vpy;
    scursor.x = snap(myevt.clientX/pn.zoom-rect.left-pn.cx/pn.zoom-pn.vpx);
    scursor.y = snap(myevt.clientY/pn.zoom-rect.top-pn.cy/pn.zoom-pn.vpy);
    ccursor.x = myevt.clientX-rect.left;
    ccursor.y = myevt.clientY-rect.top;
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
      str+="."+("00"+d.getMilliseconds()).slice(-3);
  return str;
}
function zeroPad(v) {
  if (v<10) return "0"+v;
  else return ""+v;
}