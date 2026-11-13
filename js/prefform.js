let pd=20, pi=0;
class PrefForm extends Form {
    constructor(title, margin) { // m=margin
        super("PREFFORM", title, 20, 10, 200, 100, margin);
        this.belowBar=true;
        this.gridSize=new Control(this,"Grid Size",100,100+pd*pi++,"INTEGER",grid);
        this.gridShown=new Control(this,"Grid Shown",100,100+pd*pi++,"BOOLEAN",true);
        this.snapToGrid=new Control(this,"Snap to Grid",100,100+pd*pi++,"BOOLEAN",true);
        this.assertOnOff=new Control(this,"Breakpoint",100,100+pd*pi++,"BOOLEAN",false);
        this.assertString=new Control(this,"Assert String",100,100+pd*pi++,"STRING","ANY>1 || ALL>1 || P3>1");
        this.hintBar=new Control(this,"Hint Bar",100,100+pd*pi++,"BOOLEAN",true);
        pi++;
        this.selfTest=new Control(this,"Self-test",100,100+pd*pi++,"ACTION","Run \u25B6");
        this.animBuild=new Control(this,"Animated build",100,100+pd*pi++,"ACTION","Run \u25B6");
        this.animSpeed=new Control(this,"Animation speed",100,100+pd*pi++,"INTEGER",1);
        pi++;
        this.story1=new Control(this,"Story 1: Philosophers",100,100+pd*pi++,"ACTION","Run \u25B6");
        this.story2=new Control(this,"Story 2: Producer–consumer",100,100+pd*pi++,"ACTION","Run \u25B6");
        this.story3=new Control(this,"Story 3: Mutex + breakpoint",100,100+pd*pi++,"ACTION","Run \u25B6");
    }
    // controls in two columns: names, then values right of the longest name
    // (narrower on phones)
    layoutControls() {
        const left=ww<560 ? 20 : 60;
        g.setupText("14px arial","left","middle");
        let wmax=0;
        this.children.forEach(c=>{ if (c.type=="CONTROL") wmax=Math.max(wmax, g.measureText(c.text).width); });
        this.children.forEach(c=>{
            if (c.type!="CONTROL") return;
            c.x=left; c.valueLabel.x=left+wmax+18;
            c.valueLabel.y=c.y;
            // a long value (Assert String) is shortened to fit the window
            const room=this.w-c.valueLabel.x-24;
            let t=c.value.toString();
            if (g.measureText(t).width>room) {
                while (t.length>1 && g.measureText(t+"\u2026").width>room) t=t.slice(0,-1);
                t+="\u2026";
            }
            c.valueLabel.text=t;
        });
        // a long list of controls on a short screen: tighter rows
        const rows=this.children.filter(c=>c.type=="CONTROL");
        const top=56, step=Math.max(18, Math.min(22, (this.h-top-20)/(rows.length+2)));
        let y=top, prev=null;
        rows.forEach(c=>{
            if (prev && (c===this.story1 || c===this.selfTest)) y+=step*0.6;   // groups
            c.y=y; c.valueLabel.y=y; y+=step; prev=c;
        });
    }
    draw() {
        this.layoutControls();
        super.draw();
    }
    processFormEvent(evt) {
        if (!this.hover() && evt.type!="ku") return;
        super.processFormEvent(evt);
        this.hovered=this.getCursoredObject(evt);
        const delta=-Math.sign(evt.deltaY);
        // IDLE or running state (PLAY/RUN/FLY)
        if (state.is("IDLE")) {
            // Add/remove values
            if (evt.type == "mw" && SCA(evt, "sca") && 
                this.hovered && this.hovered.type=="CONTROL") 
            {
                if (delta>0) this.hovered.increment();
                else if (delta<0) this.hovered.decrement();
            }
        }
        // IDLE STATE
        if (state.is("IDLE")) {
            // Click / tap a value: toggle it or type it
            if (evt.type == "mu" && this.hovered && this.hovered.type=="CONTROL" &&
                closeEnough(this.mouseDownCoord, tcursor))
            {
                const c=this.hovered;
                if (c.controlType=="ACTION") {          // Self-test / Animated build: close PREF, run
                    fp.visible=fp.active=false; fb.active=true;
                    const story=[this.story1,this.story2,this.story3].indexOf(c);
                    if (c===this.animBuild) setTimeout(()=>animatedBuild(),50);
                    else if (story>=0) setTimeout(()=>runStory(story),50);
                    else setTimeout(()=>runSelfTest(),50);
                }
                else if (c.controlType=="BOOLEAN") { c.value=!c.value; c.newValue(); }
                else askValue(c.text, c.value, c.controlType=="INTEGER"?"number":"text", v=>{
                    c.value = c.controlType=="INTEGER" ? (parseInt(v)||0) : v;
                    c.newValue();
                });
            }
            // Label edit
            if (evt.type == "mu" && this.hovered && 
                this.hovered.type=="LABEL" && 
                closeEnough(this.mouseDownCoord, tcursor)) 
            {
                this.hovered.clicked(evt);
            }
        }
    }
}
