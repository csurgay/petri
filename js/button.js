const bh=20,br=10,bdw=17,bdh=12,bdo=3;

class Button extends Object {
    constructor(button,label,x,y,w,enabled) {
        super(x,y);
        this.type=BUTTON;
        this.enabled=true;
        this.button=button;
        this.w=w;
        pn.addButton(this);
        this.label=new Label(label,x,y+bh);
        pn.l.pop();
        this.enabled=enabled;
    }

    draw() {
//        this.setEnabled();
        ctx.beginPath();
        solid();
        ctx.lineWidth=1;
        ctx.strokeStyle="black";
        ctx.fillStyle=COLOR_CANVAS;
        if (this.enabled() && pn.highlighted==this) ctx.fillStyle=COLOR_ENABLED;
        ovalPatch(this.x,this.y,this.w,bh,br);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle=this.enabled()?COLOR_INK:"gray";
        ctx.strokeStyle=this.enabled()?COLOR_INK:"gray";
        if (this.button=="PLAY") {
            triangle(this.x,this.y,bdw,bdh,bdo);
        }
        else if (this.button=="STOP") {
            ctx.beginPath();
            ctx.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            ctx.fill();
        }
        else if (this.button=="STEP_FWD") {
            if (pn.mptr==pn.markings.length-1&&pn.getEnabled().length>0) {
                this.label.label="FIRE";
            }
            else {
                this.label.label="STEP+";
            }
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            ctx.beginPath();
            ctx.rect(this.x+bdw/3-1,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="RUN") {
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-1);
        }
        else if (this.button=="FLY") {
            triangle(this.x,this.y,2*bdw/3,bdh,-6);
            triangle(this.x+2*bdw/3-3,this.y,2*bdw/3,bdh,-6);
            triangle(this.x+4*bdw/3-6,this.y,2*bdw/3,bdh,-7);
        }
        else if (this.button=="STEP_BWD") {
            triangle(this.x,this.y,2*bdw/3,bdh,+1,-1);
            ctx.beginPath();
            ctx.rect(this.x-bdw/3-3,this.y-bdh/2,4,bdh);
            ctx.fill();
        }
        else if (this.button=="REWIND") {
            triangle(this.x,this.y,2*bdw/3,bdh,-3,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-3,-1);
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
            curvedArrow(this.x,this.y);
        }
        else if (this.button=="REDO") {
            curvedArrow(this.x,this.y,-1);
        }
        else if (this.button=="UNDO_ALL") {
            triangle(this.x,this.y,2*bdw/3,bdh,-6,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-6,-1);
        }
        else if (this.button=="CLEAR") {
            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            ctx.stroke();
        }
        else if (this.button=="OPEN") {
            ctx.beginPath();
            ctx.moveTo(this.x-8,this.y+7);
            ctx.lineTo(this.x+8,this.y+7);
            ctx.lineTo(this.x+13,this.y-3);
            ctx.lineTo(this.x-3,this.y-3);
            ctx.lineTo(this.x-8,this.y+7);
            ctx.fill();
            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.moveTo(this.x+8,this.y-3);
            ctx.lineTo(this.x+8,this.y-5);
            ctx.lineTo(this.x+2,this.y-5);
            ctx.lineTo(this.x-1,this.y-7);
            ctx.lineTo(this.x-7,this.y-7);
            ctx.lineTo(this.x-8,this.y-6);
            ctx.lineTo(this.x-8,this.y+6);
            ctx.lineTo(this.x-7,this.y+6);
            ctx.stroke();
        }
        else if (this.button=="SAVE") {
            ctx.beginPath();
            ctx.lineWidth=1;
            ctx.moveTo(this.x-8,this.y+8);
            ctx.lineTo(this.x+8,this.y+8);
            ctx.lineTo(this.x+8,this.y-4);
            ctx.lineTo(this.x+4,this.y-8);
            ctx.lineTo(this.x-8,this.y-8);
            ctx.lineTo(this.x-8,this.y+8);
            ctx.fill();
            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.strokeStyle="white";
            ctx.moveTo(this.x+2,this.y-7);
            ctx.lineTo(this.x+2,this.y-3);
            ctx.lineTo(this.x-4,this.y-3);
            ctx.lineTo(this.x-4,this.y-7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x-5,this.y+6);
            ctx.lineTo(this.x+5,this.y+6);
            ctx.moveTo(this.x-5,this.y+3);
            ctx.lineTo(this.x+5,this.y+3);
            ctx.stroke();
        }
        else if (this.button=="SETTINGS") {
            ctx.beginPath();
            var cx=this.x,cy=this.y,notches=8,
            radiusO=bh/2-2,radiusI=bh/3-1,radiusH=bh/7,
            taperO=50,taperI=35, // outer/inner taper %
            angle=2*Math.PI/(notches*2), // angle between notches
            taperAI=angle*taperI*0.005, // inner taper offset (100% = half notch)
            taperAO=angle*taperO*0.005, // outer taper offset
            toggle=false; // notch radius level (i/o)
            ctx.moveTo(cx+radiusO*Math.cos(taperAO),cy+radiusO*Math.sin(taperAO));
            for (var a=angle;a<=2*Math.PI;a+=angle) {
                // draw inner to outer line
                if (toggle) {
                    ctx.lineTo(cx+radiusI*Math.cos(a-taperAI),cy+radiusI*Math.sin(a-taperAI));
                    ctx.lineTo(cx+radiusO*Math.cos(a+taperAO),cy+radiusO*Math.sin(a+taperAO));
                }
                // draw outer to inner line
                else {
                    ctx.lineTo(cx+radiusO*Math.cos(a-taperAO),cy+radiusO*Math.sin(a-taperAO));
                    ctx.lineTo(cx+radiusI*Math.cos(a+taperAI),cy+radiusI*Math.sin(a+taperAI));
                }
                toggle = !toggle;
            }
            ctx.closePath();
            // Punch hole
            ctx.moveTo(cx + radiusH, cy);
            ctx.arc(cx, cy, radiusH, 0,2*Math.PI);
            ctx.fill("evenodd");
        }
        if (this.label) this.label.draw(12);
    }

    dragTo() {}

    cursored(cursor) {
        return (
            Math.abs(this.x-cursor.x)<=this.w/2 && 
            Math.abs(this.y-cursor.y)<=bh/2
        );
    }

    clicked(evt) {
        if (this.button=="PLAY") {
            if (state!=SLOWRUN) stateChange(SLOWRUN);
            else stateChange(IDLE);
        }
        else if (this.button=="RUN") {
            if (state!=RUN) stateChange(RUN);
            else stateChange(IDLE);
        }
        else if (this.button=="FLY") {
            if (state!=FLY) stateChange(FLY);
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
            window.open("help.html", "_blank");
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
        else if (this.button=="OPEN") {
            pn.animate=false;
            directory="nets";
            if (shiftKeys(evt,"CTRLSHIFT")) directory="upload";
            pn.getFileNames(directory);
        }
        else if (this.button=="SAVE") {
            pn.save(""+ms+".pn");
            alert("PetriNet uploaded for review.");
        }
    }
}

function selectFile() {
    clearCanvas(canvas);
    ctx.beginPath();
    ctx.fillStyle=COLOR_INK;
    ctx.textAlign = "left";
    ctx.textBaseline = 'top';
    ctx.font="16px arial";
    for (var i=0; i<files.length; i++) {
        ctx.fillText(files[i],50,50+i*20);
    }
    stateChange(FILES);
}

function ovalPatch(x,y,w,h,r) {
    ctx.moveTo(x-w/2+r,y-h/2);
    ctx.lineTo(x+w/2-r,y-h/2);
//    ctx.moveTo(x+w/2-r,y-h/2);
    ctx.arc(x+w/2-r,y,r,3*Math.PI/2,Math.PI/2);
//    ctx.moveTo(x+w/2-r,y+h/2);
    ctx.lineTo(x-w/2+r,y+h/2);
    ctx.arc(x-w/2+r,y,r,Math.PI/2,3*Math.PI/2);
}

function triangle(x,y,w,h,o,r=1) { // r for reverse
    ctx.beginPath();
    ctx.lineWidth=1;
    ctx.moveTo(x-r*w/2+o,y-h/2);
    ctx.lineTo(x+r*w/2+o,y);
    ctx.lineTo(x-r*w/2+o,y+h/2);
    ctx.lineTo(x-r*w/2+o,y-h/2);
    ctx.fill();
}

function curvedArrow(x,y,r=1) { // r for reverse
    ctx.beginPath();
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

var x,y=20,w,dx,ddw=5,dw=20;
function setupButton() {
    x=dw+ddw,w=35,x+=w/2,dx=0;
    new Button("CLEAR","NEW",x+dx++*(w+ddw),y,w,()=>{return true});
    new Button("OPEN","OPEN",x+dx++*(w+ddw),y,w,()=>{return true});
    new Button("SAVE","SAVE",x+dx++*(w+ddw),y,w,()=>{return true});
    new Button("UNDO_ALL","ORIG",x+dx++*(w+ddw),y,w,()=>{return undo.length>1&&undoPtr>0});
    new Button("UNDO","UNDO",x+dx++*(w+ddw),y,w,()=>{return undoPtr>0});
    new Button("REDO","REDO",x+dx++*(w+ddw),y,w,()=>{return undoPtr<undo.length-1});

    x+=dx*(w+ddw)-w/2,w=50,x+=w/2+dw,dx=0;
    new Button("REWIND","m0",x+dx++*(w+ddw),y,w,()=>{return pn.mptr>0});
    new Button("STEP_BWD","STEP-",x+dx++*(w+ddw),y,w,()=>{return pn.mptr>0});
    new Button("STEP_FWD","STEP+",x+dx++*(w+ddw),y,w,()=>{return pn.mptr<pn.markings.length-1||pn.getEnabled().length>0});
    new Button("PLAY","PLAY",x+dx++*(w+ddw),y,w,()=>{return true});
    new Button("STOP","STOP",x+dx++*(w+ddw),y,w,()=>{return state==RUN||state==SLOWRUN||state==FLY});
    new Button("RUN","RUN",x+dx++*(w+ddw),y,w,()=>{return true});
    new Button("FLY","FLY",x+dx++*(w+ddw),y,w,()=>{return true});

    x+=dx*(w+ddw)-w/2,w=35,x+=w/2+dw,dx=0;
    new Button("SETTINGS","PREF",x+dx++*(w+ddw),y,w,()=>{return true});
    new Button("HELP","HELP",x+dx++*(w+ddw),y,w,()=>{return true});
}
