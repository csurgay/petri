class Frame {
    constructor(title,x,y,w,h) {
        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h;
        this.title=title;
        this.tx=w/2; // relative x for title
        this.m=5; // margin
    }
    draw() {
        g.beginPath();
        g.standard(1);
        g.fillRect(this.x, this.y, this.w, this.h);
        if (this.title!="noframe") {
            g.rect(this.x+this.m, this.y+this.m, this.w-2*this.m, this.h-2*this.m);
            g.stroke();
            if (this.title!="notitle") {
                g.setupText("16px Arial","center","middle");
                const w = g.measureText(this.title).width+30;
                g.fillRect(this.x+this.tx-w/2, this.y, w, 20);
                g.fillStyle(COLOR_INK);
                g.fillText(this.title, this.x+this.tx, this.y+10);
            }
        }
    }
}