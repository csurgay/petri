const bh=20,br=10,bdw=17,bdh=12,bdo=3;

class Button extends Object {
    constructor(button,x,y,width=50) {
        super(x,y);
        this.type=BUTTON;
        this.button=button;
        this.width=width;
        pn.addButton(this);
        if (button=="PLAY") this.label=new Label("PLAY",x,y+bh);
        else if (button=="STOP") this.label=new Label("STOP",x,y+bh);
        else if (button=="FAST_FWD") this.label=new Label("RUN",x,y+bh);
        else if (button=="STEP_BWD") this.label=new Label("STEP-",x,y+bh);
        else if (button=="STEP_FWD") this.label=new Label("STEP+",x,y+bh);
        else if (button=="REWIND") this.label=new Label("m0",x,y+bh);
        else if (button=="HELP") this.label=new Label("HELP",x,y+bh);
        else if (button=="UNDO_ALL") this.label=new Label("ORIG",x,y+bh);
        else if (button=="UNDO") this.label=new Label("UNDO",x,y+bh);
        else if (button=="REDO") this.label=new Label("REDO",x,y+bh);
        else if (button=="CLEAR") this.label=new Label("NEW",x,y+bh);
        pn.l.pop();
    }

    draw() {
        ctx.beginPath();
        solid();
        ctx.strokeStyle="black";
        ctx.fillStyle="black";
        ovalPatch(this.x,this.y,this.width,bh,br);
        ctx.stroke();
        if (this.button=="PLAY") {
            triangle(false,this.x,this.y,bdw,bdh,bdo);
        }
        else if (this.button=="STOP") {
            ctx.beginPath();
            ctx.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            ctx.fill();
        }
        else if (this.button=="STEP_FWD") {
            triangle(false,this.x,this.y,2*bdw/3,bdh,-1);
            ctx.beginPath();
            ctx.rect(this.x+bdw/3-1,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="FAST_FWD") {
            triangle(false,this.x,this.y,2*bdw/3,bdh,-1);
            triangle(false,this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-1);
        }
        else if (this.button=="STEP_BWD") {
            triangle(false,this.x,this.y,2*bdw/3,bdh,+1,-1);
            ctx.beginPath();
            ctx.rect(this.x-bdw/3-3,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="REWIND") {
            triangle(false,this.x,this.y,2*bdw/3,bdh,-3,-1);
            triangle(false,this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-3,-1);
            ctx.beginPath();
            ctx.rect(this.x-bdw/3-5,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="HELP") {
            ctx.beginPath();
            ctx.font="bold 18px arial";
            ctx.fillText("?",this.x,this.y+1);
            ctx.fillText("?",this.x-1,this.y+1);
            ctx.fillText("?",this.x+1,this.y+1);
        }
        else if (this.button=="UNDO") {
            curvedArrow(undoPtr<1,this.x,this.y);
        }
        else if (this.button=="REDO") {
            curvedArrow(undoPtr==undo.length-1,this.x,this.y,-1);
        }
        else if (this.button=="UNDO_ALL") {
            triangle(undo.length<=1,this.x,this.y,2*bdw/3,bdh,-6,-1);
            triangle(undo.length<=1,this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-6,-1);
        }
        else if (this.button=="CLEAR") {
            ctx.beginPath();
            ctx.lineWidth=3;
            ctx.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            ctx.stroke();
        }
        if (this.label) this.label.draw(12);
    }

    dragTo() {}

    cursored(cursor) {
        return (
            Math.abs(this.x-cursor.x)<=this.width/2 && 
            Math.abs(this.y-cursor.y)<=bh/2
        );
    }

    clicked() {
        if (this.button=="PLAY") {
            if (state!=SLOWRUN) stateChange(SLOWRUN);
            else stateChange(IDLE);
        }
        else if (this.button=="FAST_FWD") {
            if (state!=RUN) stateChange(RUN);
            else stateChange(IDLE);
        }
        else if (this.button=="STOP") {
            stateChange(IDLE);
        }
        else if (this.button=="STEP_BWD") {
            stateChange(IDLE);
            pn.stepBackward();
        }
        else if (this.button=="STEP_FWD") {
            stateChange(IDLE);
            pn.stepForward();
        }
        else if (this.button=="REWIND") {
            stateChange(IDLE);
            pn.rewind();
        }
        else if (this.button=="HELP") {
            var msg="";
            msg+="CREATE PETRINET\n";
            msg+="Create PLACE: Left button\n";
            msg+="Create TRANSITION: Click PLACE again\n";
            msg+="Create FLOW: Drag from PLACE/TRANS to PLACE/TRANS\n";
            msg+="Create INHIBITOR: Click FLOW again\n";
            msg+="Create TOKENS: Mousewheel over PLACE\n";
            msg+="\n";
            msg+="EDIT PETRINET\n";
            msg+="Move objects: Drag\n";
            msg+="Delete objects: Right click\n";
            msg+="Clear tokens from PLACE: Middle click on PLACE\n";
            msg+="Clear all tokens: Middle click on canvas\n";
            msg+="Rotate TRANSITION: Mousewheel over TRANSITION\n";
            msg+="Adjust FLOW weight: Mousewheel over TRANSITION\n";
            msg+="Multisegment FLOW: Drag FLOW\n";
            msg+="Sticky FLOW arrowheads: 's' over TRANSITION\n";
            msg+="Pan: Drag canvas\n";
            msg+="Zoom: Mousewheel click and rotate\n";
            msg+="\n";
            msg+="SIMULATE PETRINET\n";
            msg+="Fire TRANSITOIN: click TRANSITION\n";
            msg+="Step+- / random fire: Mousewheel over canvas\n";
            msg+="Random simulation: Right click on canvas\n";
            alert(msg)
        }
        else if (this.button=="UNDO") {
            if (undoPtr>0) rawLoad(undo[--undoPtr]);
        }
        else if (this.button=="REDO") {
            if (undoPtr<undo.length-1) rawLoad(undo[++undoPtr]);
        }
        else if (this.button=="UNDO_ALL") {
            if (undo.length>0) { undoPtr=0; rawLoad(undo[undoPtr]) };
        }
        else if (this.button=="CLEAR") {
            if (confirm("Sure want to clear workspace?")) {
                pn.clear();
                undo.length=0;
                undoPtr=-1;
            }
        }
    }
}

function ovalPatch(x,y,w,h,r) {
    ctx.lineWidth=1;
    ctx.moveTo(x-w/2+r,y-h/2);
    ctx.lineTo(x+w/2-r,y-h/2);
    ctx.moveTo(x+w/2-r,y-h/2);
    ctx.arc(x+w/2-r,y,r,3*Math.PI/2,Math.PI/2);
    ctx.moveTo(x+w/2-r,y+h/2);
    ctx.lineTo(x-w/2+r,y+h/2);
    ctx.arc(x-w/2+r,y,r,Math.PI/2,3*Math.PI/2);
}

function triangle(grayed,x,y,w,h,o,r=1) { // r for reverse
    ctx.beginPath();
    ctx.fillStyle=grayed?"gray":COLOR_INK;
    ctx.lineWidth=1;
    ctx.moveTo(x-r*w/2+o,y-h/2);
    ctx.lineTo(x+r*w/2+o,y);
    ctx.lineTo(x-r*w/2+o,y+h/2);
    ctx.lineTo(x-r*w/2+o,y-h/2);
    ctx.fill();
}

function curvedArrow(grayed,x,y,r=1) { // r for reverse
    ctx.beginPath();
    ctx.strokeStyle=grayed?"gray":COLOR_INK;
    ctx.fillStyle=grayed?"gray":COLOR_INK;
    ctx.lineWidth=3;
    var ux=-4,uy=-3,a1=3,a2=7;
    ctx.moveTo(x+r*(ux-a1),y+(uy-a1));
    ctx.lineTo(x+r*(ux+a1),y+(uy+a1));
    ctx.lineTo(x+r*(ux-a2),y+(uy+a2));
    ctx.lineTo(x+r*(ux-a1),y+(uy-a1));
    ctx.fill();
    ctx.beginPath();
    if (r==1) ctx.arc(x,y+1,bdh/2,5*Math.PI/4,Math.PI/4);
    else if (r==-1) ctx.arc(x,y+1,bdh/2,3*Math.PI/4,7*Math.PI/4);
    ctx.stroke();
}

var x,y=20,w,dw,dx;
function setupButton() {
    x=75,w=35,dx=0,dw=40;
    new Button("CLEAR",x+dx++*dw,y,w);
    new Button("UNDO_ALL",x+dx++*dw,y,w);
    new Button("UNDO",x+dx++*dw,y,w);
    new Button("REDO",x+dx++*dw,y,w);

    x=260,w=50,dx=0,dw=55;
    new Button("REWIND",x+dx++*dw,y,w);
    new Button("STEP_BWD",x+dx++*dw,y,w);
    new Button("STEP_FWD",x+dx++*dw,y,w);
    new Button("PLAY",x+dx++*dw,y,w);
    new Button("STOP",x+dx++*dw,y,w);
    new Button("FAST_FWD",x+dx++*dw,y,w);

    new Button("HELP",600,y,35);
}
