class Frame {
    constructor(title,x,y,w,h) {
        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h;
        this.title=title;
        this.tx=w/2; // relative x for title
        this.m=10; // margin
    }
    draw() {
        g.beginPath();
        g.standard(1);
        g.strokeStyle(COLOR_INK);
        g.fillStyle(COLOR_CANVAS);
        g.fillRect(this.x, this.y, this.w, this.h);
        g.rect(this.x+this.m, this.y+this.m, this.w-2*this.m, this.h-2*this.m);
        g.stroke();
        g.font("20px Arial");
        const w = g.measureText("   "+this.title+"   ").width;
        g.fillRect(this.x+this.tx-w/2, this.y, w, 20);
        g.fillStyle(COLOR_INK);
        g.fillText("   "+this.title+"   ", this.x+this.tx, this.y+10);
    }
}