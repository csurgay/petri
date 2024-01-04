const sx=-150;

class Status extends Label {
    constructor(label,x,y,callback) {
        super(label,x,y);
        this.callback=callback;
    }
    draw() {
        if (DEBUG) {
            super.draw();
            ctx.fillText(this.callback(),this.x+40,this.y);
        }
    }
}

function setupStatus() {
    new Status("debug",sx,-150,function(){return DEBUG;});
    new Status("marking",sx,-135,function(){return pn.markings.length;});
    new Status("ptr",sx,-120,function(){return pn.mptr;});
    new Status("undo",sx,-105,function(){return undo.length;});
    new Status("ptr",sx,-90,function(){return undoPtr;});
    new Status("place",sx,-75,function(){return pn.p.length;});
    new Status("trans",sx,-60,function(){return pn.t.length;});
    new Status("flow",sx,-45,function(){return pn.f.length;});
    new Status("label",sx,-30,function(){return pn.l.length;});
    new Status("zoom",sx,-15,function(){return pn.zoom;});
    new Status("vpxy",sx,0,function(){return pn.vpx.toFixed()+" "+pn.vpy.toFixed();});
    new Status("cur",sx,15,function(){return cursor.x.toFixed()+" "+cursor.y.toFixed();});
}
