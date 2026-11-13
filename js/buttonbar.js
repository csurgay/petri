class Buttonbar extends Form {
    constructor(title, x, y, w, h) {
        super("BUTTONBAR", title, x, y, w, h);
        this.b=[];
        this.visible = true;
        this.closable = false;
        this.init();
    }
    init() {
        var x,y=15,w,dx,ddw=5,dw=20;
        var stepw = 20;
        x=dw+ddw+25,w=35,x+=w/2,dx=0;
        this.b.push(new Button("CLEAR","NEW",x+dx++*(w+ddw),y,w,()=>{return !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("OPEN","OPEN",x+dx++*(w+ddw),y,w,()=>{return !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("SAVE","SAVE",x+dx++*(w+ddw),y,w,()=>{return !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("SEND","SEND",x+dx++*(w+ddw),y,w,()=>{return !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("UNDO","UNDO",x+dx++*(w+ddw),y,w,()=>{return undoPtr>0 && !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("REDO","REDO",x+dx++*(w+ddw),y,w,()=>{return undoPtr<undo.length-1 && !this.running()&&!fp.active && !fbfs.active}));

        x+=dx*(w+ddw)-w/2,w=50,x+=w/2+dw,dx=0;
        this.b.push(new Button("REWIND","m0",x+dx++*(w+ddw),y,w,()=>{return pn.mptr>0 && !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("STEP_BWD","STEP-",x+dx++*(w+ddw),y,w,()=>{return pn.mptr>0 && !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("STEP_FWD","STEP+",x+dx++*(w+ddw),y,w,()=>{return (pn.mptr<pn.markings.length-1||pn.getEnabled().length>0) && !this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("PLAY","PLAY",x+dx++*(w+ddw),y,w,()=>{return true&&!fp.active && !fbfs.active}));
        this.b.push(new Button("STOP","STOP",x+dx++*(w+ddw),y,w,()=>{return this.running()&&!fp.active && !fbfs.active}));
        this.b.push(new Button("RUN","RUN",x+dx++*(w+ddw),y,w,()=>{return true&&!fp.active && !fbfs.active}));
        this.b.push(new Button("FLY","FLY",x+dx++*(w+ddw),y,w,()=>{return true&&!fp.active && !fbfs.active}));
        // Reachability: depth- | REACH (icon + depth) | depth+
        x+=dx*(w+ddw)-w/2,w=35,x+=w/2+dw,dx=0;
        const reachEnabled=()=>{return !this.running() && !fp.active};
        this.b.push(new Button("STEPS-", "STEPS-", x, y, w, reachEnabled));
        x+=w/2+2*ddw; w=60; x+=w/2;
        this.b.push(new Button("REACH", "REACH", x, y, w, reachEnabled));
        x+=w/2+2*ddw; w=35; x+=w/2;
        this.b.push(new Button("STEPS+", "STEPS+", x, y, w, reachEnabled));
        dx=1;

        x+=dx*(w+ddw)-w/2,w=35,x+=w/2+dw,dx=0;
        this.b.push(new Button("PREF","PREF",x+dx++*(w+ddw),y,w,()=>{return !this.running()}));
        this.b.push(new Button("HELP","HELP",x+dx++*(w+ddw),y,w,()=>{return !this.running()}));

        this.addChild(new Label( "File: noname.pn", x+dx++*(w+ddw),y, "left" ));
        this.layout(ww);
    }
    // Place the button groups left to right; a group that does not fit
    // starts a new row (phones, narrow windows). Sets this.h.
    layout(W) {
        this.layoutW=W;
        const groups=[["CLEAR","OPEN","SAVE","SEND","UNDO","REDO"],
                      ["REWIND","STEP_BWD","STEP_FWD","PLAY","STOP","RUN","FLY"],
                      ["STEPS-","REACH","STEPS+"],
                      ["PREF","HELP"]];
        const gap=g=>g[0]=="STEPS-"?10:5, rowH=40, groupGap=20;
        let x=50, y=15;
        groups.forEach(ids=>{
            const bs=ids.map(id=>this.b.find(b=>b.button==id));
            bs.forEach(b=>{ if (b.w0===undefined) b.w0=b.w; b.w=b.w0; });
            let gw=bs.reduce((a,b)=>a+b.w,0)+gap(ids)*(bs.length-1);
            if (x+gw>W-8 && x>50) { y+=rowH; x=10; }
            // a group wider than a whole row: narrow its buttons evenly
            if (x+gw>W-8) {
                const f=Math.max(0.6, (W-8-x-gap(ids)*(bs.length-1))/(gw-gap(ids)*(bs.length-1)));
                bs.forEach(b=>b.w=Math.floor(b.w0*f));
                gw=bs.reduce((a,b)=>a+b.w,0)+gap(ids)*(bs.length-1);
            }
            bs.forEach(b=>{
                b.x=x+b.w/2; b.y=y;
                b.label.x=b.x; b.label.y=y+bh;
                x+=b.w+gap(ids);
            });
            x+=groupGap-gap(ids);
        });
        // (the file name is shown in the status bar at the bottom)
        this.children[0].visible=false;
        this.h=y+25;
    }
    running() {
        return state.is("PLAY") || state.is("RUN") || state.is("FLY");
    }
    hoveredButton() {
        return this.b.find(item=>item.hover()) || null;
    }
    // Tooltip after a short hover: what the button does, its shortcut,
    // and why it is disabled when it is.
    drawTooltip() {
        if (isTouch()) return;                   // no hover on touch screens
        const hb=(ccursor.y<this.h) ? this.hoveredButton() : null;
        if (hb!==this.tipBtn) { this.tipBtn=hb; this.tipMs=Date.now(); }
        if (!hb || Date.now()-this.tipMs<TOOLTIP_DELAY || events.mouseDown) return;
        let text=TOOLTIPS[hb.button] || hb.button;
        if (typeof text==="function") text=text();
        if (!hb.enabled()) text+="  \u2014  "+disabledReason(hb.button);
        const c=g.ctx;
        c.save();
        c.setLineDash([]);
        c.font="13px arial"; c.textAlign="left"; c.textBaseline="middle";
        const w=c.measureText(text).width+16, h=22;
        let x=hb.x-w/2, y=hb.y+bh/2+20;
        x=Math.max(4, Math.min(x, ww-w-4));
        c.fillStyle="rgba(40,40,40,0.92)";
        c.beginPath();
        if (c.roundRect) c.roundRect(x,y,w,h,5); else c.rect(x,y,w,h);
        c.fill();
        c.fillStyle="white";
        c.fillText(text,x+8,y+h/2+1);
        c.restore();
    }
    draw() {
        super.draw();
        this.b.forEach(item=>item.draw());
    }
    processFormEvent(pMyEvent) {
        if (!this.hover()) return;
        super.processFormEvent(pMyEvent);
        this.hovered=this.getCursoredObject(pMyEvent);
        if (state.is("IDLE") || this.running()) {
            if (pMyEvent.type=="mu" && pMyEvent.button==LEFTBUTTON &&
                this.hovered)
            {
                this.hovered.clicked(pMyEvent);
            }
        }
    }
    getCursoredObject(pMyEvent) {
        var ret=null;
        if (ret==null)
            this.b.forEach(item => {
                if (item.hover()) ret=item;
            });
        return ret;
    }
}


const TOOLTIP_DELAY=500;
const TOOLTIPS={
    CLEAR:   "New empty net",
    OPEN:    "Open a net: examples or from your computer (Ctrl+O; Ctrl+Shift+O: upload folder)",
    SAVE:    "Download the net to your Downloads folder (Ctrl+S)",
    SEND:    "Send the net to the server for review",
    UNDO:    "Undo (Ctrl+Z)",
    REDO:    "Redo (Ctrl+Y, Ctrl+Shift+Z)",
    REWIND:  "Back to initial marking M0",
    STEP_BWD:"Step back in history",
    STEP_FWD:()=> (pn.mptr==pn.markings.length-1 ? "Fire a random enabled transition" : "Step forward in history"),
    PLAY:    "Play: 1 firing / s",
    STOP:    "Stop",
    RUN:     "Run: ~10 firings / s",
    FLY:     "Fly: as fast as possible",
    "STEPS-":"Reachability depth \u2212",
    REACH:   ()=> "Reachability graph, depth "+bfsSteps+" (\u2715 or Esc closes)",
    "STEPS+":"Reachability depth +",
    PREF:    "Preferences",
    HELP:    "Help"
};
function disabledReason(id) {
    const simButtons=["PLAY","STOP","RUN","FLY"];
    if (fp.active) return "close Preferences first";
    if (bar.running() && !simButtons.includes(id)) return "stop the simulation first";
    if (fbfs.active && !["STEPS-","REACH","STEPS+","PREF","HELP"].includes(id))
        return "close the reachability window first";
    switch (id) {
        case "UNDO": return "nothing to undo";
        case "REDO": return "nothing to redo";
        case "REWIND": case "STEP_BWD": return "already at M0";
        case "STEP_FWD": return "no enabled transition";
        case "STOP": return "not running";
    }
    return "not available now";
}

// Mouse cursor shows what a click or drag would do (also per tool)
var lastCursor="";
function updateCursor() {
    let c="default";
    const s=state.s;
    const onNet=fb.active && fb.hover(), o=pn.highlighted, T=o && o.type;
    const node=(T=="PLACE"||T=="TRANSITION");
    if (textbox.active) c="text";
    else if (s=="PAN") c="grabbing";
    else if (s=="SELECT") c="crosshair";
    else if (s=="DRAG" || s=="DRAGALL" || s=="MULTISEGMENT") c="move";
    else if (s=="DRAWARROW") c="crosshair";
    else if (s=="ZOOM" || s=="MIDDLE") c="zoom-in";
    else if (ccursor.y < bar.h) {
        const hb=bar.hoveredButton();
        c=hb ? (hb.enabled() ? "pointer" : "not-allowed") : "default";
    }
    else if (onNet && (events.spaceDown || tool=="PAN")) c="grab";
    else if (onNet && tool=="MARKING")
        c = T=="PLACE" ? "cell" : (T=="TRANSITION" ? (o.enabled()?"pointer":"not-allowed") : "default");
    else if (onNet && ["FLOW","INHIBITOR","RESET"].includes(tool))
        c = node ? "crosshair" : (T=="FLOW" ? "pointer" : (T=="MIDPOINT" ? "move" : "default"));
    else if (onNet && ["PLACE","TRANSITION","LABEL"].includes(tool) && !o) c="crosshair";
    else if (onNet) {
        if (!o) c="default";
        else if (T=="FLOW") c="pointer";
        else c="move";
    }
    else if (ff.active && selectedFile>=0) c="pointer";
    if (c!=lastCursor) { canvas.style.cursor=c; lastCursor=c; }
}
