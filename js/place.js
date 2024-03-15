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
const placeConnectors=[];

class Place extends Object {
    constructor(x,y) {
        super(x,y);
        this.type="PLACE";
        this.id="P"+nextId(this.type);
        this.tokens=0;
        this.label=new Label(this.id,this.x-30,this.y-30);
        this.adjustConnectors();
    }

    adjustConnectors() {
        placeConnectors.length=0;
        for (var i=0; i<16; i++) {
            placeConnectors.push( new Coord(
                PLACE_R*Math.sin(i*Math.PI/8),
                PLACE_R*Math.cos(i*Math.PI/8)
            ));
        }
    }

    draw() {
        // Circle
        g.beginPath();
        g.lineWidth(LINEWIDTH);
        this.setColor();
        g.fillStyle(COLOR_CANVAS);
        g.arc(this.x,this.y,PLACE_R,0,2*Math.PI);
        g.fill();
        g.stroke();
        // Tokens dice
        g.beginPath();
        g.fillStyle(COLOR_INK);
        if (this.tokens<=6) {
            tokenpos[this.tokens].forEach(t => {
                g.moveTo(this.x+t[0],this.y+t[1]);
                g.arc(this.x+t[0],this.y+t[1],3.5,0,2*Math.PI);
            }) 
            g.fill();
        }
        // Tokens number
        else if (this.tokens<=999) {
            g.setupText("20px arial","center","middle");
            g.fillText(this.tokens,this.x,this.y+2);
        }
        else {
            var t1000=Math.floor(this.tokens/1000);
            var t="000"+(this.tokens-1000*t1000);
            t=t.slice(-3);
            g.setupText("14px arial","center","middle");
            g.fillText(t1000,this.x,this.y-7);
            g.fillText(t,this.x,this.y+8);
        }
        if (state.DEBUG) super.draw();
    }

    dragTo(dx,dy) {
        super.dragTo(dx,dy);
        this.label.dragTo(dx,dy);
    }

    hovered(cursor) {
        return (Math.hypot(this.x-cursor.x,this.y-cursor.y) < PLACE_R);
    }

    delete() {
        for (var i=pn.f.length-1; i>=0; i--) {
            if (pn.f[i].o1==this || pn.f[i].o2==this) {
                pn.f.splice(pn.f.indexOf(pn.f[i]),1);
            }
        }
        pn.l.splice(pn.l.indexOf(this.label),1);
        pn.p.splice(pn.p.indexOf(this),1);
        pn.clearMarkings();
    }

    changeTokens(delta) {
        this.tokens+=delta;
        if (this.tokens<0) this.tokens=0;
        pn.clearMarkings();
    }
}
