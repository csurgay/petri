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
        pn.l.pop();
    }

    draw() {
        ctx.beginPath();
        solid();
        ctx.lineWidth=1;
        ctx.strokeStyle="black";
        ctx.fillStyle="black";
        ovalPatch(this.x,this.y,this.width,bh,br);
        ctx.stroke();
        if (this.button=="PLAY") {
            ctx.beginPath();
            triangle(this.x,this.y,bdw,bdh,bdo);
            ctx.fill();
        }
        else if (this.button=="STOP") {
            ctx.beginPath();
            ctx.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            ctx.fill();
        }
        else if (this.button=="STEP_FWD") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            ctx.rect(this.x+bdw/3-1,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="FAST_FWD") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-1);
            ctx.fill();
        }
        else if (this.button=="STEP_BWD") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,+1,-1);
            ctx.rect(this.x-bdw/3-3,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="REWIND") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,-3,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-3,-1);
            ctx.rect(this.x-bdw/3-5,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="HELP") {
            ctx.beginPath();
            ctx.font="bold 14px Arial";
            ctx.fillText("?",this.x,this.y);
            ctx.fillText("?",this.x+1,this.y);
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
        if (this.button=="FAST_FWD") {
            if (state!=RUN) stateChange(RUN);
            else stateChange(IDLE);
        }
        if (this.button=="STOP") {
            stateChange(IDLE);
        }
        if (this.button=="STEP_BWD") {
            stateChange(IDLE);
            pn.stepBackward();
        }
        if (this.button=="STEP_FWD") {
            stateChange(IDLE);
            pn.stepForward();
        }
        if (this.button=="REWIND") {
            stateChange(IDLE);
            pn.rewind();
        }
        if (this.button=="HELP") {
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
            msg+="Sticky FLOW arrowheads: 's' over TRANSITION'\n";
            msg+="Pan: Drag canvas\n";
            msg+="Zoom: Mousewheel click and rotate\n";
            msg+="\n";
            msg+="SIMULATE PETRINET\n";
            msg+="Fire TRANSITOIN: click TRANSITION\n";
            msg+="Step+- / random fire: Mousewheel over canvas\n";
            msg+="Random simulation: Right click on canvas\n";
            msg+="Debug mode: 'd'\n";
            alert(msg)
        }
    }
}

function ovalPatch(x,y,w,h,r) {
    ctx.moveTo(x-w/2+r,y-h/2);
    ctx.lineTo(x+w/2-r,y-h/2);
    ctx.moveTo(x+w/2-r,y-h/2);
    ctx.arc(x+w/2-r,y,r,3*Math.PI/2,Math.PI/2);
    ctx.moveTo(x+w/2-r,y+h/2);
    ctx.lineTo(x-w/2+r,y+h/2);
    ctx.arc(x-w/2+r,y,r,Math.PI/2,3*Math.PI/2);
}

function triangle(x,y,w,h,o,r=1) { // r for reverse
    ctx.moveTo(x-r*w/2+o,y-h/2);
    ctx.lineTo(x+r*w/2+o,y);
    ctx.lineTo(x-r*w/2+o,y+h/2);
    ctx.lineTo(x-r*w/2+o,y-h/2);
}

function setupButton() {
    var x=220,y=25,dw=55,dx=0;
    new Button("REWIND",x+dx++*dw,y);
    new Button("STEP_BWD",x+dx++*dw,y);
    new Button("STEP_FWD",x+dx++*dw,y);
    new Button("PLAY",x+dx++*dw,y);
    new Button("STOP",x+dx++*dw,y);
    new Button("FAST_FWD",x+dx++*dw,y);

    new Button("HELP",600,y,30);
}
