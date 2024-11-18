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
