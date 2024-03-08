class MyEvent { // Data structure for an Event (mouse and keys)
    constructor() {
        this.clientX;
        this.clientY;
        this.button;
        this.deltaY;
        this.key;
        this.keyCode;
        this.ctrlKey;
        this.shiftKey;
        this.altKey;
    }
    store(type,tstamp,e) {
        this.type=type;
        this.tstamp=tstamp;
        this.key=this.undefined(e.key);
        this.keyCode=this.undefined(e.keyCode);
        this.ctrlKey=this.undefined(e.ctrlKey);
        this.shiftKey=this.undefined(e.shiftKey);
        this.altKey=this.undefined(e.altKey);
        this.button=this.undefined(e.button);
        this.deltaY=this.undefined(e.deltaY);
        // only for mouse events so as to preserve coords for key events
        if (this.type[0]=="m") {
            this.clientX=this.undefined(e.clientX);
            this.clientY=this.undefined(e.clientY);
        }
    }
    undefined(value) {
        return value===undefined?"-":value;
    }
    toString() {
        return ""+this.type+' "'+this.tstamp+'" '+
            this.clientX+" "+this.clientY+" "+this.button+" "+
            this.deltaY+' "'+this.key+'" '+this.keyCode+" "+
            sca(this.shiftKey,this.ctrlKey,this.altKey);
    }
    parse(str) {
        var arrayResult=[]; tokenize(str,arrayResult); str=arrayResult;
        this.type=str[0];
        this.tstamp=str[1];
        this.clientX=+str[2];
        this.clientY=+str[3];
        this.button=+str[4];
        this.deltaY=+str[5];
        this.key=str[6];
        this.keyCode=+str[7];
        var tmp=sca2(str[8]);
        this.shiftKey=tmp[0];
        this.ctrlKey=tmp[1];
        this.altKey=tmp[2];
    }
}

const myEvent=new MyEvent(), storedEvt=new MyEvent(), 
    e1=new MyEvent(), e2=new MyEvent();
var evt, msEvent=0, l;

class Events {
    constructor() {
        this.e=[];
        this.rec=[];
    }

    mousedownevent(evt) { myEvent.store("md",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }
    mouseupevent(evt)   { myEvent.store("mu",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }
    mousemoveevent(evt) {
        l=events.e.length;
        if (l>0) {
            myEvent.parse(events.e[l-1]);
            if (myEvent.type=="mm") {
                if (Math.hypot(myEvent.clientX-evt.clientX,
                    myEvent.clientY-evt.clientY)<50) {
                    events.e.pop();
                }
            }
        }
        myEvent.store("mm",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString());
    }
    mousewheelevent(evt) { myEvent.store("mw",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }
    keyupevent(evt) {
        if (!RUNNING && evt.key==".") { RUNNING=true; animate(); }
        else { myEvent.store("ku",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }
    }
    keydownevent(evt) { myEvent.store("kd",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }

    processEvent() {
        if (Date.now()-msEvent>1) {
            msEvent=Date.now();
            if (this.e.length>0) {
                evt=this.e.shift();
                myEvent.parse(evt);
                storedEvt.store(myEvent.type,myEvent.tstamp,myEvent);
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
                if (RECORD) this.rec.push(evt);
                forms.forEach(f=>{
                    if (f.active) f.processEvent(myEvent);
                })
            }
        }
    }
}
function shiftKeys(evt,shifts) {
    if (shifts=="NONE") return !evt.ctrlKey && !evt.shiftKey && !evt.altKey;
    else if (shifts=="CTRL") return evt.ctrlKey && !evt.shiftKey && !evt.altKey;
    else if (shifts=="SHIFT") return !evt.ctrlKey && evt.shiftKey && !evt.altKey;
    else if (shifts=="ALT") return !evt.ctrlKey && !evt.shiftKey && evt.altKey;
    else if (shifts=="ALTSHIFT") return !evt.ctrlKey && evt.shiftKey && evt.altKey;
    else if (shifts=="CTRLSHIFT") return evt.ctrlKey && evt.shiftKey && !evt.altKey;
    else if (shifts=="ALTNONE") return !evt.ctrlKey && !evt.shiftKey;
    else if (shifts=="CTRLALTNONE") return !evt.shiftKey;
}
function stored_sca() {
    return ""+(storedEvt.shiftKey?"S":"s")+(storedEvt.ctrlKey?"C":"c")+(storedEvt.altKey?"A":"a");
}
function sca(s,c,a) {
    return ""+(s?"S":"s")+(c?"C":"c")+(a?"A":"a");
}
function sca2(sca) {
    return [sca[0]=='S',sca[1]=='C',sca[2]=='A'];
}
