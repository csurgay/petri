class Form extends Frame {
    constructor(title,x,y,w,h) {
        super(title,x,y,w,h);
        this.visible=false; // shows up
        this.active=false; // reacts to events
    }
    draw() {
        super.draw();
    }
}

class FileForm extends Form {
    constructor(title,x,y,w,h) {
        super(title,x,y,w,h);        
    }
    draw() {
        super.draw();
        selectedFile=-1;
        for (var i=0; i<files.length; i++) {
            g.textAlign("left");
            g.textBaseline('top');
            g.font("16px arial");
            g.fillStyle(COLOR_INK);
            var width=g.measureText(files[i]).width;
            if (ccursor.x>200 && ccursor.x<200+width && ccursor.y>this.y+100+20*i && ccursor.y<this.y+119+20*i) {
                g.font("bold 16px arial");
                selectedFile=i;
            }
            g.fillText(files[i],200,this.y+100+20*i);
        }
    }
}
