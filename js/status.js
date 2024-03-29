class Status extends Label {
    constructor(label,x,y,callback) {
        super(label,x,y);
        pn.l.pop();
        pn.addStatus(this);
        this.callback=callback;
    }
    draw() {
        if (state.DEBUG) {
            super.draw();
            g.fillText(this.callback(),this.x+50,this.y);
        }
    }
    
    dragTo() {}
}

const sx=40,sy=80,dy=15;
var i=0;

function setupStatus() {
    new Status("marking",sx,sy+i++*dy,function(){return pn.markings.length;});
    new Status("mptr",sx,sy+i++*dy,function(){return pn.mptr;});
    new Status("undo",sx,sy+i++*dy,function(){return undo.length;});
    new Status("uptr",sx,sy+i++*dy,function(){return undoPtr;});
    new Status("place",sx,sy+i++*dy,function(){return pn.p.length;});
    new Status("trans",sx,sy+i++*dy,function(){return pn.t.length;});
    new Status("flow",sx,sy+i++*dy,function(){return pn.f.length;});
    new Status("label",sx,sy+i++*dy,function(){return pn.l.length;});
    new Status("zoom",sx,sy+i++*dy,function(){return pn.zoom;});
    new Status("cxy",sx,sy+i++*dy,function(){return pn.cx.toFixed()+" "+pn.cy.toFixed();});
    new Status("vpxy",sx,sy+i++*dy,function(){return pn.vpx.toFixed()+" "+pn.vpy.toFixed();});
    new Status("tcur",sx,sy+i++*dy,function(){return tcursor.x.toFixed()+" "+tcursor.y.toFixed();});
    new Status("ccur",sx,sy+i++*dy,function(){return ccursor.x.toFixed()+" "+ccursor.y.toFixed();});
    new Status("s",sx,sy+i++*dy,function(){return state.s;});
    new Status("hov",sx,sy+i++*dy,function(){return fb.hovered?fb.hovered.type:bar.hovered?bar.hovered.type:"";});
    new Status("id",sx,sy+i++*dy,function(){return fb.hovered?fb.hovered.id:bar.hovered?bar.hovered.id:"";});
    new Status("hl",sx,sy+i++*dy,function(){return pn.highlighted?pn.highlighted.type:"";});
    new Status("size",sx,sy+i++*dy,function(){return fb.hovered?(fb.hovered.type=="LABEL"?fb.hovered.size:""):"";});
    new Status("rec",sx,sy+i++*dy,function(){return state.PLAYBACK?"PLAYBACK":state.RECORD?"REC":"";});
    new Status("recs",sx,sy+i++*dy,function(){return events.rec.length;});
    new Status("shifts",sx,sy+i++*dy,function(){return storedEvt.sca;});
    new Status("key",sx,sy+i++*dy,function(){return storedEvt.key+"("+storedEvt.keyCode+")";});
    new Status("events",sx,sy+i++*dy,function(){return events.e.length;});
    new Status("e",sx,sy+i++*dy,function(){return storedEvt.type;});
    new Status("",sx,sy+i++*dy,function(){return storedEvt.tstamp;});
    new Status("",sx,sy+i++*dy,function(){return ms;});
}
