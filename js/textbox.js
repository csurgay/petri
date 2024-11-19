const COLOR = {
	BACKGROUND: '#edebe9',
//	TEXTBOX : { BACKGROUND: '#ffffff', FRAME: '#d9d9d9', COLOR: '#4d4d4d' },
	TEXTBOX : { BACKGROUND: COLOR_CANVAS, FRAME: COLOR_CANVAS, COLOR: '#4d4d4d' },
    TEXT: { LIGHT: '#cccccc', DARK: '#555555', HIGHLIGHT: "#aecbfa" },
}

var blinkms=0; // blink millisec counter
    
class TextboxForm extends Form {
	constructor(name, x,y,w,h, frame, defaultText="-") {
        super("TEXTBOX",name,x,y,w,h);
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.frame = frame;
		this.name = name;
		this.defaultText = defaultText;
		this.text = defaultText;
        this.size = 14;
		this.ptrCursor = 0;
		this.ptrStart = 0; // longer texts start somewhere
		this.selectStart = 1; // selected region inside text
		this.selectEnd = 0;
		this.posChars = []; // position of chars to know which one was clicked
		this.cursorBlink = true; // true visible, false not visible
		this.px = 7; this.py = 7; // padding
		this.color_background = COLOR.TEXTBOX.BACKGROUND;
		this.color_frame = COLOR.TEXTBOX.FRAME;
		this.color = COLOR.TEXTBOX.COLOR;
        this.referencedLabel = null; // shall have a .label datamember
	}
	clear() {
		this.text = '';
		this.ptrCursor = 0;
	}
	draw() {
        if (this.visible) {
            g.save();
            g.translate(pn.cx,pn.cy);
            g.scale(pn.zoom,pn.zoom);
            g.translate(pn.vpx,pn.vpy);
            g.setupText(""+this.size+"px arial","left","top");
            this.w = g.measureText(this.text).width;
            this.h = this.size + 5;
            g.beginPath();
            g.solid();
            g.fillStyle(this.color_background);
            g.fillRect(this.x,this.y+0.5,this.w,this.h);
            g.strokeStyle(this.color_frame);
            g.lineWidth(1);
            if (this.frame=='frame') g.rect(this.x,this.y,this.w,this.h);
            g.stroke();
            g.strokeStyle(this.color);
            g.lineWidth(1);
            var ptr = this.ptrStart;
            var fits = true;
            var x = this.x+this.px; var y = this.y+this.py; var w;
            this.posChars = [];
            while (fits && ptr<=this.text.length) {
                if (this.ptrCursor==ptr && this.cursorBlink) {
                    g.beginPath();
                    g.moveTo(x,y-3);
                    g.lineTo(x,y+this.h-2*this.py+3);
                    g.stroke();
                }
                if (Date.now()-blinkms>500) {
                    this.cursorBlink=!this.cursorBlink;
                    blinkms=Date.now();
                }
                if (ptr < this.text.length) {
                    w = g.measureText(this.text[ptr],x,y).width;
                    this.posChars[ptr] = [x,y-3,w,this.h-2*this.py+6];
                    g.beginPath();
                    g.fillStyle(COLOR.TEXT.DARK);
                    g.fillText(this.text[ptr],x,y-2);
                }
                if (ptr >= this.selectStart && ptr <=this.selectEnd) {
                    g.beginPath();
                    g.fillStyle("#0000ff");
                    g.fillRect(x,y-3,w,this.h-2*this.py+6);
                    g.fill();
                    g.beginPath();
                    g.fillStyle(COLOR.TEXT.LIGHT);
                    g.fillText(this.text[ptr],x,y-2);
                }
                x += w;
                ptr++;
                if (x+g.measureText(this.text[ptr],x,y).width > this.x+this.w-this.px) {
                    // fits = false;
                }
            }
            this.posChars.push( [x, y-3, this.ax+this.w-x, this.h-2*this.py+6] );

            if (state.DEBUG && false) { // draw all chars rect
                g.beginPath();
                g.strokeStyle(COLOR_INK);
                g.lineWidth(1);
                g.solid();
                for (var i=0; i<this.posChars.length; i++) {
                    var p=this.posChars[i];
                    g.rect(p[0],p[1],p[2],p[3]);
                }
                g.stroke();
            }
            g.restore();
        }
	}
    processFormEvent(evt) {
        super.processFormEvent(evt);
        if (evt.type == "mu") this.mouseup(evt);
        else if (evt.type == "mm") this.mousemove(evt);
        else if (evt.type == "ku") this.keyup(evt);
    }
    mouseup(evt) {
        // Textbox text tcursor click
        if (this.hovered && SCA(evt,"sca")) {
            this.clicked(tcursor);
        }
        // Textbox cancel click
        else if (!this.hovered || this.hovered!=this && SCA(evt,"sca")) {
            this.cancel();
        }
        // Textbox attach to Object
        else if (this.hovered && SCA(evt,"scA")) { // ALT
            this.attachToObject(this.hovered);
            this.referencedLabel.visible=true;
            this.active=false;
            this.visible=false;
            fb.active=true;
        }
    }
    mousemove(evt) {
    }
	clicked(cursor) {
        var mx=cursor.x, my=cursor.y;
		if (this.text == this.defaultText) {
			this.clear();
		}
		else for(var i=0; i<this.posChars.length; i++) {
			var p = this.posChars[i];
			if (mx>=p[0] && mx<=p[0]+p[2] && my>=p[1] && my<=p[1]+p[3]) {
				this.ptrCursor = i;
				i = this.posChars.length;
			}
		}
	}
    confirm() {
        if (this.text=="") this.text="-";
        log(here(), "confirm: "+this.text);
        this.referencedLabel.text=this.text;
        this.referencedLabel.visible=true;
        state.set("IDLE");
        this.visible=false;
        this.active=false;
        fb.active=true;
        pn.newUndo();
    }
    cancel() {
        log(here(), "cancel: "+this.text);
        state.set("IDLE");
        this.referencedLabel.visible=true;
        this.visible=false;
        this.active=false;
        fb.active=true;
    }
    attachToObject(o) {
        var a=this.referencedLabel.getAttached();
        if (a) {
            log(here(), "detach: "+this.text+" from object: "+a.id);
            this.referencedLabel.setAttached(null);
            a.detach(this.referencedLabel);
        }
        if (o.id!=this.referencedLabel.id) {
            log(here(), "attach: "+this.text+" to object: "+o.id);
            this.referencedLabel.setAttached(o);
            o.attach(this.referencedLabel);
        }
        pn.newUndo();
    }
    keyup(evt) {
        // left, right, home, end
        if (evt.keyCode == 37) { this.ptrCursor = this.ptrCursor<=0?0:this.ptrCursor-1; }
        else if (evt.keyCode == 39) { this.ptrCursor = this.ptrCursor>=this.text.length?this.text.length:this.ptrCursor+1; }
        else if (evt.keyCode == 36) this.ptrCursor = 0;
        else if (evt.keyCode == 35) this.ptrCursor = this.text.length;
        // enter
        else if (evt.keyCode == 13) {
            this.confirm();
        }
        // esc
        else if (evt.keyCode == 27) {
            this.cancel();
        }
        else if (evt.keyCode == 86 && evt.ctrlKey) { // paste
            paste( this, this.text.substring(0,this.ptrCursor), this.text.substring(this.ptrCursor,this.text.length) );
        }
        else if ( (evt.keyCode >= 48 && evt.keyCode <= 57)   || // number keys
        evt.keyCode == 32 || evt.keyCode == 13   || // space, carriage return
        (evt.keyCode >= 65 && evt.keyCode <= 90)   || // letter keys
        (evt.keyCode > 95 && evt.keyCode < 112)  || // numpad keys
        (evt.keyCode > 185 && evt.keyCode < 193) || // ;=,-./` (in order)
        (evt.keyCode > 218 && evt.keyCode < 223) ) {   // [\]' (in order)
            this.text = this.text.substring(0,this.ptrCursor)+evt.key+this.text.substring(this.ptrCursor,this.text.length);
            this.ptrCursor++;
        }
        else if (evt.keyCode == 8 && this.ptrCursor > 0) { // backspace
            this.text = this.text.substring(0,this.ptrCursor-1)+this.text.substring(this.ptrCursor,this.text.length);
            this.ptrCursor--;
        }
        else if (evt.keyCode == 46) { // delete
            this.text = this.text.substring(0,this.ptrCursor)+this.text.substring(this.ptrCursor+1,this.text.length);
        }
    }
}
