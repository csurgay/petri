const PLACE=0, TRANSITION=1, FLOW=2;
const d=7.5;
const tokenpos=[
    [],
    [ [0,0] ],
    [ [-d,-d], [d,d] ],
    [ [-d,-d], [0,0], [d,d] ],
    [ [-d,-d], [-d,d], [d,-d], [d,d] ],
    [ [-d,-d], [-d,d], [0,0], [d,-d], [d,d] ],
    [ [-d,-d], [-d,d], [-d,0], [d,0], [d,-d], [d,d] ]
];

class Place extends Object {
    constructor(x,y) {
        super(x,y);
        this.type=PLACE;
        this.id="P"+nextId(this.type);
        this.r=20;
        this.tokens=0;
        this.label=new Label(this.id,this.x,this.y-30);
        this.connectors=[];
        this.adjustConnectors();
    }

    adjustConnectors() {
        this.connectors.length=0;
        for (var i=0; i<16; i++) {
            this.connectors.push( new Coord(
                this.x+this.r*Math.sin(i*Math.PI/8),
                this.y+this.r*Math.cos(i*Math.PI/8)
            ));
        }
    }

    draw() {
        this.adjustConnectors();
        // Circle
        ctx.beginPath();
        ctx.lineWidth=LINEWIDTH;
        ctx.strokeStyle=pn.highlighted==this?COLOR_HIGHLIGHT:this.color;
        ctx.fillStyle=COLOR_CANVAS;
        ctx.arc(this.x,this.y,this.r,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
        // Tokens dice
        ctx.beginPath();
        ctx.fillStyle=COLOR_INK;
        if (this.tokens<=6) {
            tokenpos[this.tokens].forEach(t => {
                ctx.moveTo(this.x+t[0],this.y+t[1]);
                ctx.arc(this.x+t[0],this.y+t[1],3.5,0,2*Math.PI);
            }) 
            ctx.fill();
        }
        // Tokens number
        else {
            ctx.font ="20px arial";
            ctx.textAlign = "center";
            ctx.textBaseline = 'middle';
            ctx.fillText(this.tokens,this.x,this.y+2);
        }
    }

    dragTo(dx,dy) {
        super.dragTo(dx,dy);
        this.label.dragTo(dx,dy);
    }

    cursored(cursor) {
        if (Math.hypot(this.x-cursor.x,this.y-cursor.y) < this.r)
            return true;
        else 
            return false;
    }

    delete() {
        for (var i=0; i<pn.f.length; i++) {
            pn.f.forEach(flow => {
                if (flow.o1==this || flow.o2==this) {
                    pn.f.splice(pn.f.indexOf(flow),1);
                }
            });
        }
        pn.l.splice(pn.l.indexOf(this.label),1);
        pn.p.splice(pn.p.indexOf(this),1);
    }

    changeTokens(delta) {
        this.tokens+=delta;
        if (this.tokens<0) this.tokens=0;
        else pn.staticChanged();
    }
}
