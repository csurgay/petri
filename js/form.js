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
        this.f.forEach(f=>{if (f.visible) f.draw();})
    }
    processFormsEvent(pMyEvent) {
        getCoord(pMyEvent); // sets tcursor (translated canvas) and ccursor (orig canvas)
        this.f.forEach(item=>{
            if (item.active) {
                item.processFormEvent(pMyEvent);
            }
        });
    }
}

class Form extends Frame {
    constructor(id,title,x,y,w,h) {
        super(title,x,y,w,h);
        this.id=id;
        this.hovered=null;
        this.dragged=null;
        this.visible=false; // shows up
        this.active=false; // reacts to events
        this.closable=true; // can be closed with Escape
        forms.addForm(this);
        this.mouseDownCoord=new Coord(0,0);
        this.children=[];
    }
    addChild(child) {
        this.children.push(child);
    }
    draw() {
        super.draw();
        this.children.forEach(child=>child.draw(child.hover()));
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

class FileForm extends Form {
    constructor(title,x,y,w,h) {
        super("FILEFORM",title,x,y,w,h);        
    }
    draw() {
        super.draw();
        selectedFile=-1;
        for (var i=0; i<files.length; i++) {
            g.setupText("16px arial","left","top");
            g.fillStyle(COLOR_INK);
            var width=g.measureText(files[i]).width;
            if (ccursor.x>200 && ccursor.x<200+width && ccursor.y>this.y+100+20*i && ccursor.y<this.y+119+20*i) {
                g.font("bold 16px arial");
                selectedFile=i;
            }
            g.fillText(files[i],200,this.y+100+20*i);
        }
    }
    processFormEvent(pMyEvent) {
        if (!this.hover()) return;
        super.processFormEvent(pMyEvent);
        if (pMyEvent.type == "mu" && selectedFile!=-1) {
            log(here(), files[selectedFile]);
            if (files[selectedFile]!="CANCEL") {
                pn.load(directory+"/"+files[selectedFile]);
            }
            ff.active=false;
            ff.visible=false;
            fb.active=true;
            state.set("IDLE");
            animate();
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
                files.push("CANCEL");
                ff.visible=true;
                ff.active=true;
            }
        }
        request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        request.send("dir="+dir);
    }
}
