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
    processFormsEvent(evt) {
        storedEvt.store(evt.type,getFormattedDate('millisec'),evt);
        this.f.forEach(item=>{
            if (item.active && (item.hover(evt) || item==textbox)) {
                item.processFormEvent(evt);
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
        forms.addForm(this);
        this.mouseDownCoord=new Coord(0,0);
    }
    draw() {
        super.draw();
    }
    hover() {
        return tcursor.x>=this.x && tcursor.x<=this.x+this.w &&
        tcursor.y>=this.y && tcursor.y<=this.y+this.h
    }
    processFormEvent(evt) {
        log(here(), this.id);
        getCoord(evt); // sets tcursor (translated canvas) and ccursor (orig canvas)
        if (state.is("BAR.CLICK") && !bar.hover(evt)) state.set("IDLE");
        // default is tcursor, ccursor can override in inherited ProcessFormEvent
        this.hovered=pn.getCursoredObject(tcursor,"VIEWPORT");
        if (evt.type=="md") {
            this.mouseDownCoord.x=tcursor.x;
            this.mouseDownCoord.y=tcursor.y;
        }
    }
    mousedown(evt) {}
    mouseup(evt) {}
    mousemove(evt) {}
    mousewheel(evt) {}
    keyup(evt) {
        if (evt.key=="Escape") {
            this.active=this.visible=false;
            fb.active=true;
        }
    }
    keydown(evt) {}
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
    mouseup(evt) {
        if (selectedFile!=-1) {
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
                log(here(), request.responseText);
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
