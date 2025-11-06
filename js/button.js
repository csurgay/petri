const bh=20,br=10,bdw=17,bdh=12,bdo=3;

class Button extends Object {
    constructor(button,label,x,y,w,enabled) {
        super(x,y);
        this.type="BAR.BUTTON";
        this.id=button;
        this.button=button;
        this.w=w;
        pn.addButton(this);
        this.label=new Label(label,x,y+bh);
        this.label.size=13;
        this.enabled=enabled;
    }

    draw() {
        g.beginPath();
        g.standard(1);
        if (this.enabled() && pn.highlighted==this) {
            g.fillStyle(COLOR_CANVAS);
            g.standard(3);
        }
        if (state.is("RUN") && this.button=="RUN" ||
            state.is("PLAY") && this.button=="PLAY" ||
            state.is("FLY") && this.button=="FLY") {
            g.fillStyle(COLOR_CANVAS);
            g.standard(5);
        }
        ovalPatch(this.x,this.y,this.w,bh,br);
        g.fill();
        g.stroke();
        g.beginPath();
        g.fillStyle(this.enabled()?COLOR_INK:"gray");
        g.strokeStyle(this.enabled()?COLOR_INK:"gray");
        if (this.button=="PLAY") {
            triangle(this.x,this.y,bdw,bdh,bdo);
        }
        else if (this.button=="STOP") {
            g.beginPath();
            g.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            g.fill();
        }
        else if (this.button=="STEP_FWD") {
            if (pn.mptr==pn.markings.length-1&&pn.getEnabled().length>0) {
                this.label.text="FIRE";
            }
            else {
                this.label.text="STEP+";
            }
            triangle(this.x,this.y,2*bdw/3,bdh,-1);
            g.beginPath();
            g.rect(this.x+bdw/3-1,this.y-bdh/2,4,bdh);
            g.fill();
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
            g.beginPath();
            g.rect(this.x-bdw/3-3,this.y-bdh/2,4,bdh);
            g.fill();
        }
        else if (this.button=="REWIND") {
            triangle(this.x,this.y,2*bdw/3,bdh,-3,-1);
            triangle(this.x+2*bdw/3-2,this.y,2*bdw/3,bdh,-3,-1);
            g.beginPath();
            g.rect(this.x-bdw/3-5,this.y-bdh/2,4,bdh);
            g.fill();
        }
        else if (this.button=="HELP") {
            g.beginPath();
            g.font("bold 18px arial");
            g.fillText("?",this.x,this.y+1);
            g.fillText("?",this.x-1,this.y+1);
            g.fillText("?",this.x+1,this.y+1);
        }
        else if (this.button=="UNDO") {
            curvedArrow(this.x,this.y);
        }
        else if (this.button=="REDO") {
            curvedArrow(this.x,this.y,-1);
        }
        else if (this.button=="CLEAR") {
            g.beginPath();
            g.lineWidth(2);
            g.rect(this.x-bdh/2,this.y-bdh/2,bdh,bdh);
            g.stroke();
        }
        else if (this.button=="OPEN") {
            g.beginPath();
            g.moveTo(this.x-8,this.y+7);
            g.lineTo(this.x+8,this.y+7);
            g.lineTo(this.x+13,this.y-3);
            g.lineTo(this.x-3,this.y-3);
            g.lineTo(this.x-8,this.y+7);
            g.fill();
            g.beginPath();
            g.lineWidth(2);
            g.moveTo(this.x+8,this.y-3);
            g.lineTo(this.x+8,this.y-5);
            g.lineTo(this.x+2,this.y-5);
            g.lineTo(this.x-1,this.y-7);
            g.lineTo(this.x-7,this.y-7);
            g.lineTo(this.x-8,this.y-6);
            g.lineTo(this.x-8,this.y+6);
            g.lineTo(this.x-7,this.y+6);
            g.stroke();
        }
        else if (this.button=="SAVE") {
            g.beginPath();
            g.lineWidth(1);
            g.moveTo(this.x-8,this.y+8);
            g.lineTo(this.x+8,this.y+8);
            g.lineTo(this.x+8,this.y-4);
            g.lineTo(this.x+4,this.y-8);
            g.lineTo(this.x-8,this.y-8);
            g.lineTo(this.x-8,this.y+8);
            g.fill();
            g.beginPath();
            g.lineWidth(2);
            g.strokeStyle("white");
            g.moveTo(this.x+2,this.y-7);
            g.lineTo(this.x+2,this.y-3);
            g.lineTo(this.x-4,this.y-3);
            g.lineTo(this.x-4,this.y-7);
            g.stroke();
            g.beginPath();
            g.moveTo(this.x-5,this.y+6);
            g.lineTo(this.x+5,this.y+6);
            g.moveTo(this.x-5,this.y+3);
            g.lineTo(this.x+5,this.y+3);
            g.stroke();
        }
        else if (this.button=="PREF") {
            g.beginPath();
            var cx=this.x,cy=this.y,notches=8,
                radiusO=bh/2-2,radiusI=bh/3-1,radiusH=bh/7,
                taperO=50,taperI=35, // outer/inner taper %
                angle=2*Math.PI/(notches*2), // angle between notches
                taperAI=angle*taperI*0.005, // inner taper offset (100% = half notch)
                taperAO=angle*taperO*0.005, // outer taper offset
                toggle=false; // notch radius level (i/o)
            g.moveTo(cx+radiusO*Math.cos(taperAO),cy+radiusO*Math.sin(taperAO));
            for (var a=angle;a<=2*Math.PI;a+=angle) {
                // draw inner to outer line
                if (toggle) {
                    g.lineTo(cx+radiusI*Math.cos(a-taperAI),cy+radiusI*Math.sin(a-taperAI));
                    g.lineTo(cx+radiusO*Math.cos(a+taperAO),cy+radiusO*Math.sin(a+taperAO));
                }
                // draw outer to inner line
                else {
                    g.lineTo(cx+radiusO*Math.cos(a-taperAO),cy+radiusO*Math.sin(a-taperAO));
                    g.lineTo(cx+radiusI*Math.cos(a+taperAI),cy+radiusI*Math.sin(a+taperAI));
                }
                toggle = !toggle;
            }
            g.closePath();
            // Punch hole
            g.moveTo(cx + radiusH, cy);
            g.arc(cx, cy, radiusH, 0,2*Math.PI);
            g.fill("evenodd");
        }

        // BFS Buttons
        if (this.button == "STEPS+") {
            drawPlusMinus(this.x, this.y, 6, "+");
        }
        if (this.button == "STEPS-") {
            drawPlusMinus(this.x, this.y, 6, "-");
        }
        if (this.button == "SEARCH") {
            drawBFSIcon(this.x, this.y, 2, 5);
        }
        if (this.button == "STEPS") {
            g.setupText("15px Arial", "center", "center");
            g.fillText(bfsSteps, this.x, this.y+1);
        }

        if (this.label) this.label.draw();
    }

    dragTo() {}

    hover() {
        return (
            Math.abs(this.x-ccursor.x)<=this.w/2 &&
            Math.abs(this.y-ccursor.y)<=bh/2
        );
    }

    clicked(evt) {
        if (!this.enabled()) return;
        if (state.DEBUG) log(here(), "Button: "+this.button);
        if (this.button=="PLAY") {
            if (!state.is("PLAY")) state.set("PLAY");
            else state.set("IDLE");
        }
        else if (this.button=="RUN") {
            if (!state.is("RUN")) state.set("RUN");
            else state.set("IDLE");
        }
        else if (this.button=="FLY") {
            if (!state.is("FLY")) state.set("FLY");
            else state.set("IDLE");
        }
        else if (this.button=="STOP") {
            state.set("IDLE");
        }
        else if (this.button=="STEP_BWD") {
            state.set("IDLE");
            pn.stepBackward();
        }
        else if (this.button=="STEP_FWD") {
            state.set("IDLE");
            pn.stepForward();
        }
        else if (this.button=="REWIND") {
            state.set("IDLE");
            pn.rewind();
        }
        else if (this.button=="HELP") {
            window.open("doc/help.html", "_blank");
            //fb.active=false;
            //fh.visible=true;
            //fh.active=true;
        }
        else if (this.button=="PREF") {
            if (!fp.visible) {
                fb.active=false;
                fp.visible=true;
                fp.active=true;
            }
            else {
                fb.active=true;
                fp.visible=false;
                fp.active=false;
            }
        }
        else if (this.button=="UNDO") {
            if (undoPtr>0) rawLoad(undo[--undoPtr]);
        }
        else if (this.button=="REDO") {
            if (undoPtr<undo.length-1) rawLoad(undo[++undoPtr]);
        }
        else if (this.button=="CLEAR") {
            if (confirm("Sure want to clear workspace?")) {
                bar.children[0].text="File: noname.pn";
                pn.clear();
                undo.length=0;
                undoPtr=-1;
            }
        }
        else if (this.button=="OPEN") {
            fb.active=false;
            directory="nets";
            if (SCA(evt,"SCa")) // CTRLSHIFT
                directory="upload";
            ff.getFileNames(directory);
        }
        else if (this.button=="SAVE") {
            pn.save(""+ms+".pn");
            alert("PetriNet uploaded for review.");
        }

        // BFS Buttons Eventhandling
        else if (this.button === "SEARCH") {
            if (!fbfs.visible) {
                fb.active = false;
                fbfs.visible = true;
                fbfs.active = true;
                state.set("IDLE");

                if (pn.p.length > 0) {
                    fbfs.runFrom(pn.p[0]);
                }
            } else {
                fb.active = true;
                fbfs.visible = false;
                fbfs.active = false;
            }
        }
        else if (this.button === "STEPS+") {
            bfsSteps++;
            if (fbfs.visible)
                if (pn.p.length > 0)
                    fbfs.runFrom(pn.p[0]);
        }
        else if (this.button === "STEPS-") {
            if (bfsSteps > 1) bfsSteps--;
            if (fbfs.visible)
                if (pn.p.length > 0)
                    fbfs.runFrom(pn.p[0]);
        }
    }
}

function ovalPatch(x,y,w,h,r) {
    g.moveTo(x-w/2+r,y-h/2);
    g.lineTo(x+w/2-r,y-h/2);
    g.arc(x+w/2-r,y,r,3*Math.PI/2,Math.PI/2);
    g.lineTo(x-w/2+r,y+h/2);
    g.arc(x-w/2+r,y,r,Math.PI/2,3*Math.PI/2);
}

function triangle(x,y,w,h,o,r=1) { // r for reverse
    g.beginPath();
    g.lineWidth(1);
    g.moveTo(x-r*w/2+o,y-h/2);
    g.lineTo(x+r*w/2+o,y);
    g.lineTo(x-r*w/2+o,y+h/2);
    g.lineTo(x-r*w/2+o,y-h/2);
    g.fill();
}

// New icons for the BFS buttons
function drawPlusMinus(x, y, size = 8, mode = "+") {
    g.beginPath();
    g.lineWidth(2);
    g.moveTo(x - size, y);
    g.lineTo(x + size, y);
    g.stroke();

    if (mode === "+") {
        g.beginPath();
        g.moveTo(x, y - size);
        g.lineTo(x, y + size);
        g.stroke();
    }
}

function drawBFSIcon(x, y, r = 3, size = 10) {
    const nodes = [
        { x: x, y: y - size },
        { x: x - size, y: y + size },
        { x: x + size, y: y + size }
    ];

    g.beginPath();
    g.lineWidth(2);

    g.moveTo(nodes[0].x, nodes[0].y);
    g.lineTo(nodes[1].x, nodes[1].y);
    g.moveTo(nodes[0].x, nodes[0].y);
    g.lineTo(nodes[2].x, nodes[2].y);
    g.moveTo(nodes[1].x, nodes[1].y);
    g.stroke();

    nodes.forEach(n => {
        g.beginPath();
        g.arc(n.x, n.y, r, 0, 2 * Math.PI);
        g.fill();
    });
}


function curvedArrow(x,y,r=1) { // r for reverse
    g.beginPath();
    g.lineWidth(3);
    var ux=-4,uy=-3,a1=3,a2=7;
    g.moveTo(x+r*(ux-a1),y+(uy-a1));
    g.lineTo(x+r*(ux+a1),y+(uy+a1));
    g.lineTo(x+r*(ux-a2),y+(uy+a2));
    g.lineTo(x+r*(ux-a1),y+(uy-a1));
    g.fill();
    g.beginPath();
    if (r==1) g.arc(x,y+1,bdh/2,5*Math.PI/4,Math.PI/4);
    else if (r==-1) g.arc(x,y+1,bdh/2,3*Math.PI/4,7*Math.PI/4);
    g.stroke();
}