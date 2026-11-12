class MyEvent { // Data structure for an Event (mouse and keys)
    constructor() {
        this.type="xx";
        this.tstamp=".....";
        this.clientX=0;
        this.clientY=0;
        this.button=3;
        this.deltaY=0;
        this.key='';
        this.keyCode=-1;
        this.sca="sca";
    }
    copy(e) {
        this.type=e.type;
        this.tstamp=e.tstamp;
        this.key=e.key;
        this.keyCode=e.keyCode;
        this.button=e.button;
        this.deltaY=e.deltaY;
        this.sca=e.sca;
        this.clientX=e.clientX;
        this.clientY=e.clientY;
    }
    store(type,tstamp,e) {
        this.type=type;
        this.tstamp=tstamp;
        this.key=this.undefined(e.key);
        this.keyCode=this.undefined(e.keyCode);
        this.button=this.undefined(e.button);
        // Shift+wheel is reported as horizontal scroll (deltaX) by most browsers
        this.deltaY=this.undefined(e.deltaY || e.deltaX);
        if (e.deltaMode==1) this.deltaY*=16;       // Firefox: lines -> pixels
        // Modifier state is read from every key AND mouse event: relying on
        // key events only left it stale whenever an Alt keydown/keyup was
        // missed (window not focused, Alt+Tab, browser menu grabbing Alt).
        if (e.shiftKey!==undefined) {
            this.sca=(e.shiftKey?"S":"s")+(e.ctrlKey?"C":"c")+(e.altKey?"A":"a");
        }
        // only for mouse events so as to preserve coords for key events
        if (this.type[0]=="m") {
            this.clientX=this.undefined(e.clientX);
            this.clientY=this.undefined(e.clientY);
        }
    }
    undefined(value) {
        return value===undefined?-17:value;
    }
    toString() {
        return ""+this.type+' "'+this.tstamp+'" '+
            this.clientX+" "+this.clientY+" "+this.button+" "+
            this.deltaY+' "'+this.key+'" '+this.keyCode+" "+
            this.sca;
    }
    parse(str) {
        var arrayResult=[]; 
        tokenize(str,arrayResult); str=arrayResult;
        this.type=str[0];
        this.tstamp=str[1];
        this.clientX=+str[2];
        this.clientY=+str[3];
        this.button=+str[4];
        this.deltaY=+str[5];
        this.key=str[6];
        this.keyCode=+str[7];
        this.sca=str[8];
    }
}

const myEvent=new MyEvent(), storedEvt=new MyEvent(), 
    e1=new MyEvent(), e2=new MyEvent();
var strEvent="", msEvent=0, l;

class Events {
    constructor() {
        this.e=[];
        this.rec=[];
        this.lastX=-17000;
        this.lastY=-17000;
        this.focusMs=0;          // when the window last got focus
        this.swallowUp=false;    // mouseup of a focus-only click
        this.mouseDown=false;
        this.spaceDown=false;    // Space held: drag pans
    }
    // sysEvent => myEvent, e.push(strEvent)
    rcvEvent(type, pSysEvent) {
        myEvent.store(type, getFormattedDate('millisec'), pSysEvent);
        if (myEvent.type!="mm" || 
            this.lastX!=myEvent.clientX || this.lastY!=myEvent.clientY) 
        {
            this.e.push(myEvent.toString());
            this.lastX=myEvent.clientX;
            this.lastY=myEvent.clientY;
        }
    }

    // A click that only brings the window into focus must not edit the net
    focusevent() { this.focusMs=Date.now(); }
    mousedownevent(sysEvent) {
        if (confirmOpen()) return;              // the dialog has the focus
        // a click outside the open context menu only closes it
        if (ctxMenu.isOpen()) {
            ctxMenu.close();
            this.swallowUp=true;
            return;
        }
        if (Date.now()-this.focusMs<FOCUS_CLICK_MS) {
            this.swallowUp=true;
            return;
        }
        this.mouseDown=true;
        this.rcvEvent("md", sysEvent);
    }
    mouseupevent(sysEvent) {
        this.mouseDown=false;
        if (this.swallowUp) { this.swallowUp=false; return; }
        this.rcvEvent("mu", sysEvent);
    }
    mousemoveevent(sysEvent) {
        l=this.e.length;
        if (l>0) {
            myEvent.parse(this.e[l-1]);
            if (myEvent.type=="mm") {
                if (Math.hypot(myEvent.clientX-sysEvent.clientX,
                    myEvent.clientY-sysEvent.clientY)<50) {
                    this.e.pop();
                }
            }
        }
        this.rcvEvent("mm", sysEvent);
    }
    mousewheelevent(sysEvent) {
        ctxMenu.close();
        // no browser zoom (Ctrl), history navigation (Alt/Shift) etc.
        if (sysEvent.altKey || sysEvent.ctrlKey || sysEvent.shiftKey)
            sysEvent.preventDefault();
        this.rcvEvent("mw", sysEvent);
    }
    keyupevent(sysEvent) {
        if (sysEvent.key==" ") this.spaceDown=false;
        // keep the browser from activating its menu bar on a bare Alt,
        // which would swallow the following key events
        if (sysEvent.key=="Alt") sysEvent.preventDefault();
        // '.' freezes/unfreezes the animation loop: developer feature only
        if (sysEvent.key=="." && state.DEBUG) {
            state.RUNNING=!state.RUNNING; 
            if (state.RUNNING) animate(); 
        }
        else { this.rcvEvent("ku", sysEvent); }
    }
    keydownevent(sysEvent) {
        if (sysEvent.key=="Alt") sysEvent.preventDefault();
        if (confirmKey(sysEvent)) return;
        if (ctxMenu.key(sysEvent)) return;
        if (handleShortcut(sysEvent)) return;
        if (sysEvent.key==" " && !textbox.active) {
            this.spaceDown=true;
            sysEvent.preventDefault();
        }
        // auto-repeat only where holding a key makes sense
        if (sysEvent.repeat && !sysEvent.key.startsWith("Arrow") &&
            !fbfs.active) return;
        this.rcvEvent("kd", sysEvent);
    }
    // The net was replaced under a still mouse (undo/redo, Esc): forget the
    // old highlighted object and re-evaluate what is under the cursor.
    refreshHover() {
        pn.highlighted=null;
        const s=myEvent.sca;
        myEvent.store("mm", getFormattedDate('millisec'),
            {clientX:this.lastX, clientY:this.lastY});
        myEvent.sca=s;
        this.e.push(myEvent.toString());
    }
    // modifiers released while the window was not focused (e.g. Alt+Tab)
    blurevent() {
        this.spaceDown=false;
        myEvent.sca="sca";
        storedEvt.sca="sca";
    }

    // Handles every queued event in one frame, so fast input never lags
    // behind. Macro playback stays at one event per frame (that is its pace).
    processEvent() {
        let n=state.PLAYBACK ? 1 : this.e.length;
        while (n-- > 0 && this.e.length>0) this.processOneEvent();
    }
    processOneEvent() {
        {
            {
                strEvent=this.e.shift();
                myEvent.parse(strEvent);
                storedEvt.copy(myEvent);
                if (myEvent.type=="mm") {
                    l=this.rec.length;
                    if (l>1) {
                        e1.parse(this.rec[l-1]);
                        e2.parse(this.rec[l-2]);
                        if (e1.type=="mm" && e2.type=="mm") {
                          if (Math.hypot(e1.clientX-e2.clientX,e1.clientY-e2.clientY)<50) this.rec.pop()
                        }
                    }
                }
                if (state.RECORD) this.rec.push(strEvent);
                // dispatch Event to the Forms
                forms.processFormsEvent(myEvent);
            }
        }
    }
}
const FOCUS_CLICK_MS=300;

// Standard editor shortcuts, mapped onto the toolbar buttons.
// Returns true if the key was consumed.
function handleShortcut(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
    const k=e.key.toLowerCase();
    // keep the order: finish the queued input (e.g. an Esc just before)
    if ("azysod0".includes(k) && k.length==1) events.processEvent();
    // Ctrl+0: fit the whole net into the window
    if (k=="0") {
        e.preventDefault();
        if (state.is("IDLE") || bar.running()) fitView();
        return true;
    }
    // selection; Ctrl+C/X/V are handled as copy/cut/paste events (selection.js)
    const selActions={ a:()=>sel.selectAll(),
                       d:()=>{ if (sel.size==0) showToast("Nothing selected"); else sel.duplicate(); } };
    if (selActions[k] && !e.shiftKey) {
        e.preventDefault();
        if (e.repeat && k!="d") return true;
        if (textbox.active || ff.active || fp.active || fbfs.active) return true;
        if (!state.is("IDLE")) return true;
        selActions[k]();
        events.refreshHover();
        return true;
    }
    const map={ z: e.shiftKey?"REDO":"UNDO", y:"REDO", s:"SAVE", o:"OPEN" };
    const id=map[k];
    if (!id) return false;
    e.preventDefault();            // no browser save/open dialogs
    if (e.repeat) return true;
    if (textbox.active || ff.active) return true;
    if (!state.is("IDLE") && !bar.running()) return true;
    const b=bar.b.find(x=>x.button==id);
    // Ctrl+Shift+O opens the upload folder, like Ctrl+Shift+click on OPEN
    if (b && b.enabled()) {
        b.clicked({sca: e.shiftKey?"SCa":"sCa"});
        if (id=="UNDO" || id=="REDO") events.refreshHover();
    }
    return true;
}

function SCA(pMyEvent,s) {
    return (s[0]=='.'?true:s[0]==pMyEvent.sca[0]) &&
        (s[1]=='.'?true:s[1]==pMyEvent.sca[1]) &&
        (s[2]=='.'?true:s[2]==pMyEvent.sca[2]);
}
