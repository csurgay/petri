class Status extends Label {
    constructor(label,x,y,callback) {
        super(label,x,y);
        this.callback=callback;
    }
    draw() {
        super.draw();
        g.fillText(this.callback(),this.x+50,this.y);
    }
}

const sx=40,sy=80,dy=15;
var i=0;

function setupStatus() {
    pn.addStatus(new Status("markings",sx,sy+i++*dy,function(){return pn.markings.length;}));
    pn.addStatus(new Status("mptr",sx,sy+i++*dy,function(){return pn.mptr;}));
    pn.addStatus(new Status("undo",sx,sy+i++*dy,function(){return undo.length;}));
    pn.addStatus(new Status("uptr",sx,sy+i++*dy,function(){return undoPtr;}));
    pn.addStatus(new Status("place",sx,sy+i++*dy,function(){return pn.p.length;}));
    pn.addStatus(new Status("trans",sx,sy+i++*dy,function(){return pn.t.length;}));
    pn.addStatus(new Status("flow",sx,sy+i++*dy,function(){return pn.f.length;}));
    pn.addStatus(new Status("label",sx,sy+i++*dy,function(){return pn.l.length;}));
    pn.addStatus(new Status("zoom",sx,sy+i++*dy,function(){return pn.zoom;}));
    pn.addStatus(new Status("cxy",sx,sy+i++*dy,function(){return pn.cx.toFixed()+" "+pn.cy.toFixed();}));
    pn.addStatus(new Status("vpxy",sx,sy+i++*dy,function(){return pn.vpx.toFixed()+" "+pn.vpy.toFixed();}));
    pn.addStatus(new Status("tcur",sx,sy+i++*dy,function(){return tcursor.x.toFixed()+" "+tcursor.y.toFixed();}));
    pn.addStatus(new Status("ccur",sx,sy+i++*dy,function(){return ccursor.x.toFixed()+" "+ccursor.y.toFixed();}));
    pn.addStatus(new Status("s",sx,sy+i++*dy,function(){return state.s;}));
    pn.addStatus(new Status("bhov",sx,sy+i++*dy,function(){return fb.hovered?fb.hovered.type:bar.hovered?bar.hovered.type:"";}));
    pn.addStatus(new Status("phov",sx,sy+i++*dy,function(){return fp.hovered?fp.hovered.type:"";}));
    pn.addStatus(new Status("id",sx,sy+i++*dy,function(){return fb.hovered?fb.hovered.id:bar.hovered?bar.hovered.id:"";}));
    pn.addStatus(new Status("hl",sx,sy+i++*dy,function(){return pn.highlighted?pn.highlighted.type:"";}));
    pn.addStatus(new Status("size",sx,sy+i++*dy,function(){return fb.hovered?(fb.hovered.type=="LABEL"?fb.hovered.size:""):"";}));
    pn.addStatus(new Status("rec",sx,sy+i++*dy,function(){return state.PLAYBACK?"PLAYBACK":state.RECORD?"REC":"";}));
    pn.addStatus(new Status("recs",sx,sy+i++*dy,function(){return events.rec.length;}));
    pn.addStatus(new Status("shifts",sx,sy+i++*dy,function(){return storedEvt.sca;}));
    pn.addStatus(new Status("key",sx,sy+i++*dy,function(){return storedEvt.key+"("+storedEvt.keyCode+")";}));
    pn.addStatus(new Status("events",sx,sy+i++*dy,function(){return events.e.length;}));
    pn.addStatus(new Status("e",sx,sy+i++*dy,function(){return storedEvt.type;}));
    pn.addStatus(new Status("",sx,sy+i++*dy,function(){return storedEvt.tstamp;}));
    pn.addStatus(new Status("",sx,sy+i++*dy,function(){return ms;}));
}
