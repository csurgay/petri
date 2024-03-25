class Buttonbar extends Form {
    constructor(title, x, y, w, h) {
        super("BUTTONBAR", title, x, y, w, h);
        this.b=[];
        this.active = true;
        this.visible = true;
        this.init();
    }
    init() {
        var x,y=15,w,dx,ddw=5,dw=20;
        x=dw+ddw+25,w=35,x+=w/2,dx=0;
        this.b.push(new Button("CLEAR","NEW",x+dx++*(w+ddw),y,w,()=>{return true}));
        this.b.push(new Button("OPEN","OPEN",x+dx++*(w+ddw),y,w,()=>{return true}));
        this.b.push(new Button("SAVE","SAVE",x+dx++*(w+ddw),y,w,()=>{return true}));
        this.b.push(new Button("UNDO","UNDO",x+dx++*(w+ddw),y,w,()=>{return undoPtr>0}));
        this.b.push(new Button("REDO","REDO",x+dx++*(w+ddw),y,w,()=>{return undoPtr<undo.length-1}));
    
        x+=dx*(w+ddw)-w/2,w=50,x+=w/2+dw,dx=0;
        this.b.push(new Button("REWIND","m0",x+dx++*(w+ddw),y,w,()=>{return pn.mptr>0}));
        this.b.push(new Button("STEP_BWD","STEP-",x+dx++*(w+ddw),y,w,()=>{return pn.mptr>0}));
        this.b.push(new Button("STEP_FWD","STEP+",x+dx++*(w+ddw),y,w,()=>{return pn.mptr<pn.markings.length-1||pn.getEnabled().length>0}));
        this.b.push(new Button("PLAY","PLAY",x+dx++*(w+ddw),y,w,()=>{return true}));
        this.b.push(new Button("STOP","STOP",x+dx++*(w+ddw),y,w,()=>{return state.is("RUN")||state.is("PLAY")||state.is("FLY")}));
        this.b.push(new Button("RUN","RUN",x+dx++*(w+ddw),y,w,()=>{return true}));
        this.b.push(new Button("FLY","FLY",x+dx++*(w+ddw),y,w,()=>{return true}));
    
        x+=dx*(w+ddw)-w/2,w=35,x+=w/2+dw,dx=0;
        this.b.push(new Button("PREF","PREF",x+dx++*(w+ddw),y,w,()=>{return true}));
        this.b.push(new Button("HELP","HELP",x+dx++*(w+ddw),y,w,()=>{return true}));
    }
    draw() {
        super.draw();
        this.b.forEach(item=>item.draw());
    }
    processFormEvent(evt) {
        getCoord(evt);
        this.hovered=this.getCursoredObject(ccursor,"CANVAS");
        if (state.is("IDLE")) {
            if (evt.type=="md" && evt.button==LEFTBUTTON) {
                state.set("BUTTONCLICK");
            }
        }
        else if (state.is("BUTTONCLICK")) {
            if (evt.type=="mu") {
                this.hovered.clicked(evt);
            }
        }
    }
    getCursoredObject(cursor) {
        var ret=null;
        if (ret==null)
            this.b.forEach(item => { 
                if (item.hover(cursor)) ret=item;
            });
        return ret;
    }
}
