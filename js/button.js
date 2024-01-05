const bh=20,br=10,bdw=17,bdh=12,bdo=3;

class Button extends Object {
    constructor(button,x,y,width=50) {
        super(x,y);
        this.type=BUTTON;
        this.button=button;
        this.width=width;
        pn.addButton(this);
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
        if (this.button=="STOP") {
            ctx.beginPath();
            ctx.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            ctx.fill();
        }
        if (this.button=="STEP_FWD") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            ctx.rect(this.x+bdw/3-1,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        if (this.button=="FAST_FWD") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-1);
            ctx.fill();
        }
        if (this.button=="STEP_BWD") {
            ctx.beginPath();
            triangle(this.x,this.y,2*bdw/3,bdh,+1,-1);
            ctx.rect(this.x-bdw/3-3,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
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
            pn.stepBackward();
        }
        if (this.button=="STEP_FWD") {
            pn.stepForward();
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
    var x=420,y=25,dw=55,dx=0;
    new Button("STEP_BWD",x+dx++*dw,y);
    new Button("STOP",x+dx++*dw,y);
    new Button("PLAY",x+dx++*dw,y);
    new Button("FAST_FWD",x+dx++*dw,y);
    new Button("STEP_FWD",x+dx++*dw,y);
}
