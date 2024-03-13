class MyEvent { // Data structure for an Event (mouse and keys)
    constructor() {
        this.clientX;
        this.clientY;
        this.button;
        this.deltaY;
        this.key;
        this.keyCode;
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
        this.deltaY=this.undefined(e.deltaY);
        // only for key events so as to preserve SCA for mouse events
        if (this.type[0]=="k") {
            this.sca=(e.shiftKey?"S":"s")+(e.ctrlKey?"C":"c")+(e.altKey?"A":"a");
        }
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
            this.sca;
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
        this.sca=str[8];
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
        if (!state.RUNNING && evt.key==".") { state.RUNNING=true; animate(); }
        else { myEvent.store("ku",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }
    }
    keydownevent(evt) { myEvent.store("kd",getFormattedDate('millisec'),evt); events.e.push(myEvent.toString()); }

    processEvent() {
        if (Date.now()-msEvent>1) {
            msEvent=Date.now();
            if (this.e.length>0) {
                evt=this.e.shift();
                myEvent.parse(evt);
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
                if (state.RECORD) this.rec.push(evt);
                // dispatch Event to the Forms
                forms.processFormsEvent(myEvent);
            }
        }
    }
}
function SCA(evt,s) {
    return (s[0]=='.'?true:s[0]==evt.sca[0]) &&
        (s[1]=='.'?true:s[1]==evt.sca[1]) &&
        (s[2]=='.'?true:s[2]==evt.sca[2]);
}
