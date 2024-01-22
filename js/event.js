resultArray=[];

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
        this.clientX=this.undefined(e.clientX);
        this.clientY=this.undefined(e.clientY);
        this.deltaY=this.undefined(e.deltaY);
    }
    undefined(value) {
        return value===undefined?"-":value;
    }
    toString() {
        return ""+this.type+' "'+this.tstamp+'" '+
            this.clientX+" "+this.clientY+" "+this.button+" "+
            this.deltaY+' "'+this.key+'" '+this.keyCode+" "+
            this.ctrlKey+" "+this.shiftKey+" "+this.altKey;
    }
    parse(str) {
        resultArray=[]; tokenize(str,resultArray); str=resultArray;
        this.type=str[0];
        this.tstamp=str[1];
        this.clientX=+str[2];
        this.clientY=+str[3];
        this.button=+str[4];
        this.deltaY=+str[5];
        this.key=str[6];
        this.keyCode=+str[7];
        this.ctrlKey=str[8]=='true';
        this.shiftKey=str[9]=='true';
        this.altKey=str[10]=='true';
    }
}

const myEvent=new MyEvent(), storedEvt=new MyEvent();
var evt, msEvent=0, l;

class Events {
    constructor() {
        this.e=[];
        this.rec=[];
    }

    processEvent() {
        if (Date.now()-msEvent>1) {
            msEvent=Date.now();
            if (this.e.length>0) {
                evt=this.e.shift();
                myEvent.parse(evt);
                storedEvt.store(myEvent.type,myEvent.tstamp,myEvent);
                if (myEvent.type=="mousemove") {
                    l=events.rec.length;
                    if (l>1 && events.rec[l-1][0]=="mousemove" && events.rec[l-2][0]=="mousemove") 
                        if (+events.rec[l-1][1]-events.rec[l-2][1]<100) events.rec.pop()
                }
                if (RECORD) events.rec.push(evt);
                if (myEvent.type=="mousedown") {
                    mousedown(myEvent);
                }
                else if (myEvent.type=="mouseup") {
                    mouseup(myEvent);
                }
                else if (myEvent.type=="mousemove") {
                    mousemove(myEvent);
                }
                else if (myEvent.type=="mousewheel") {
                    mousewheel(myEvent);
                }
                else if (myEvent.type=="keyup") {
                    keyup(myEvent);
                }
                else if (myEvent.type=="keydown") {
                    keydown(myEvent);
                }
            }
        }
    }

    mousedownevent(evt) {
        myEvent.store("mousedown",getFormattedDate('millisec'),evt);
        events.e.push(myEvent.toString());
    }
    mouseupevent(evt) {
        myEvent.store("mouseup",getFormattedDate('millisec'),evt);
        events.e.push(myEvent.toString());
    }
    mousemoveevent(evt) {
        l=events.e.length;
        if (l>0) {
            myEvent.parse(events.e[l-1]);
            if (myEvent.type=="mousemove") {
                if (Math.hypot(myEvent.clientX-evt.clientX,
                    myEvent.clientY-evt.clientY)<10) {
                    events.e.pop();
                }
            }
        }
        myEvent.store("mousemove",getFormattedDate('millisec'),evt);
        events.e.push(myEvent.toString());
    }
    mousewheelevent(evt) {
        myEvent.store("mousewheel",getFormattedDate('millisec'),evt);
        events.e.push(myEvent.toString());
    }
    keyupevent(evt) {
        myEvent.store("keyup",getFormattedDate('millisec'),evt);
        events.e.push(myEvent.toString());
    }
    keydownevent(evt) {
        myEvent.store("keydown",getFormattedDate('millisec'),evt);
        events.e.push(myEvent.toString());
    }
}

function keydown(myevt) {
    if (state==TEXTBOX) {
        textbox.keypressed(myevt);
    }
}

function keyup(myevt) {
    if (state!=TEXTBOX) {
        if (myevt.key=='d') DEBUG=1-DEBUG;
        else if (myevt.key=='p') {
            PLAYBACK=1-PLAYBACK;
            if (PLAYBACK==1) RECORD=0;
        }
        else if (myevt.key=='r' && PLAYBACK==0) {
            RECORD=1-RECORD;
            if (RECORD==1) events.rec=[];
        }
        else if (myevt.key=='l') {
            pn.macroLoad("macro/nemtudom.rec");
        }
        else if (myevt.key=='s') {
            // Toggle sticky Flow heads of this Transition
            var o=pn.getCursoredObject(cursor,"VIEWPORT");
            if (o && o.type==TRANSITION) {
                pn.f.forEach(f=>{
                    if (f.o2==o) {
                        f.stickyHead=!f.stickyHead;
                    }
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

function sca() {
    return ""+(storedEvt.shiftKey?"S":"s")+(storedEvt.ctrlKey?"C":"c")+(storedEvt.altKey?"A":"a");
}
