class Forms {
    constructor() {
        this.f=[];
        this.o=null;
        this.highlihgted=null;
    }
    addForm(form) {
        this.f.push(form);
    }
    draw() {
        this.f.forEach(f=>{ if (f.visible) { f.draw(); if (f.drawCloseBox) f.drawCloseBox(); } });
    }
    processFormsEvent(pMyEvent) {
        getCoord(pMyEvent); // sets tcursor (translated canvas) and ccursor (orig canvas)
        // the ✕ of an open window: press and release on it closes the window
        const win=this.f.find(f=>f.active && f.inCloseBox());
        if (win && (pMyEvent.type=="md" || pMyEvent.type=="mu")) {
            if (pMyEvent.type=="md") this.closePressed=win;
            else if (this.closePressed===win) { win.close(); this.closePressed=null; }
            return;
        }
        if (pMyEvent.type=="mu") this.closePressed=null;
        this.f.forEach(item=>{
            if (item.active) {
                item.processFormEvent(pMyEvent);
            }
        });
    }
}

class Form extends Frame {
    constructor(id,title,x,y,w,h,margin) {
        super(title,x,y,w,h);
        this.margin=margin;
        this.id=id;
        this.hovered=null;
        this.dragged=null;
        this.visible=false; // shows up
        this.active=false; // reacts to events
        this.closable=true; // can be closed with Escape
        forms.addForm(this);
        this.mouseDownCoord=new Coord(0,0);
        this.children=[];
	this.halfScreen = false;
    }
    initSize() {
        this.x=ww/this.margin;
        this.y=20+wh/this.margin;
        this.w=(this.margin-2)*ww/this.margin;
        this.h=(this.margin-2)*wh/this.margin;
        // windows open below the toolbar (it wraps into rows on phones)
        // and above the hint bar, so both stay usable
        if (this.belowBar && typeof bar!=="undefined" && bar.h) {
            this.y=Math.max(this.y, bar.h+12);
            this.h=Math.max(120, wh-HINT_H-8-this.y);
        }
	if (this.halfScreen) {
		this.x += (ww / 2 - ww/this.margin);
		this.w -= (ww / 2 - ww/this.margin);
	}
    }
    addChild(child) {
        this.children.push(child);
    }
    draw() {
        super.draw();
        this.children.forEach(child=>child.draw(child.hover()));
    }
    // drawn last, over the window's own content
    drawCloseBox() {
        const b=this.closeBox();
        if (b) {
            const on=ccursor.x>=b.x && ccursor.x<=b.x+b.w && ccursor.y>=b.y && ccursor.y<=b.y+b.h && !isTouch();
            g.beginPath(); g.lineWidth(1);
            g.fillStyle(on?COLOR_INK:COLOR_CANVAS); g.strokeStyle(COLOR_INK);
            g.rect(b.x,b.y,b.w,b.h); g.fill(); g.stroke();
            g.beginPath(); g.lineWidth(2); g.strokeStyle(on?COLOR_CANVAS:COLOR_INK);
            const d=b.w*0.28, cx=b.x+b.w/2, cy=b.y+b.h/2;
            g.moveTo(cx-d,cy-d); g.lineTo(cx+d,cy+d); g.moveTo(cx+d,cy-d); g.lineTo(cx-d,cy+d);
            g.stroke(); g.lineWidth(1);
        }
    }
    // the ✕ in the top right corner of a window (works with mouse and finger)
    closeBox() {
        if (!this.belowBar || !this.closable || !this.visible) return null;
        const s=isTouch()?34:24;
        return { x:this.x+this.w-this.m-s-4, y:this.y+this.m+4, w:s, h:s };
    }
    inCloseBox() {
        const b=this.closeBox();
        return b && ccursor.x>=b.x && ccursor.x<=b.x+b.w && ccursor.y>=b.y && ccursor.y<=b.y+b.h;
    }
    close() {
        this.active=this.visible=false;
        fb.active=bar.active=true;
        state.set("IDLE");
    }
    hover() {
        return ccursor.x > this.x && ccursor.x < this.x+this.w &&
        ccursor.y > this.y && ccursor.y < this.y+this.h
    }
    leftClick(evt) {
        return evt.type=="md" && evt.button==LEFTBUTTON;
    }
    rightClick(evt) {
        return evt.type=="md" && evt.button==RIGHTBUTTON;
    }
    middleClick(evt) {
        return evt.type=="md" && evt.button==MIDDLEBUTTON;
    }
    getCursoredObject(pMyEvent) {
        if (!this.active) return null;
        var ret=null;
        if (ret==null) {
            this.children.forEach(child=>{ret=ret||child.hover();})
        }
        return ret;
    }
    // This one is called as super from descendant processFormEvents
    processFormEvent(pMyEvent) {
        this.hovered=pn.getCursoredObject(pMyEvent);
        if (pMyEvent.type=="md") {
            // ALWAYS TCURSOR !!!
            this.mouseDownCoord.x=tcursor.x;
            this.mouseDownCoord.y=tcursor.y;
        }
        if (pMyEvent.type == "ku" && pMyEvent.key == "Escape") {
            if (this.closable) {
                this.active=this.visible=false;
                fb.active=bar.active=true;
                state.set("IDLE");
            }
        }
    }
    mousedown(pMyEvent) {}
    mouseup(pMyEvent) {}
    mousemove(pMyEvent) {}
    mousewheel(pMyEvent) {}
    keyup(pMyEvent) {}
    keydown(pMyEvent) {}
}

var files=[], directory="", selectedFile=-1;
const LOCAL_FILE_ENTRY="\u{1F4C2}  From your computer\u2026";

class FileForm extends Form {
    constructor(title, margin) { // m=margin
        super("FILEFORM", title, 20, 10, 200, 100, margin);
        this.belowBar=true;
    }
    draw() {
        super.draw();
        selectedFile=-1;
        for (var i=0; i<files.length; i++) {
            g.setupText("16px arial","left","top");
            g.fillStyle(COLOR_INK);
            var width=g.measureText(files[i]).width;
            const fx=this.x+Math.min(140, this.w*0.12);       // inside the window, also on phones
            if (ccursor.x>fx && ccursor.x<fx+width && ccursor.y>this.y+100+20*i && ccursor.y<this.y+119+20*i) {
                g.font("bold 16px arial");
                selectedFile=i;
            }
            g.fillText(files[i],fx,this.y+100+20*i);
        }
    }
    processFormEvent(pMyEvent) {
        if (!this.hover()) return;
        super.processFormEvent(pMyEvent);
        if (pMyEvent.type == "mu" && selectedFile!=-1) {
            if (state.DEBUG) log(here(), files[selectedFile]);
            const chosen=files[selectedFile];
            ff.active=false;
            ff.visible=false;
            fb.active=true;
            state.set("IDLE");
            if (chosen==LOCAL_FILE_ENTRY) openNetFromComputer();
            else if (chosen!="CANCEL") {
                const path=directory+"/"+chosen;
                unlessUnsaved(()=>pn.load(path), "Discard and open");
            }
            // (no animate() here: it would start a second animation loop)
        }
    }
    getFileNames(dir) {
        var request=new XMLHttpRequest();
        request.open('POST','php/scandir.php',true);
        request.onreadystatechange=function() {
            if (request.readyState==4 && request.status==200) {
                if (state.DEBUG) log(here(), request.responseText);
                files.length=0;
                files.push(...request.responseText.split('\n'));
                files.pop();
                files.unshift(LOCAL_FILE_ENTRY);
                files.push("CANCEL");
                ff.visible=true;
                ff.active=true;
            }
        }
        request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        request.send("dir="+dir);
    }
}
