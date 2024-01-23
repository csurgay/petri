const COLOR = {
	BACKGROUND: '#edebe9',
//	TEXTBOX : { BACKGROUND: '#ffffff', FRAME: '#d9d9d9', COLOR: '#4d4d4d' },
	TEXTBOX : { BACKGROUND: COLOR_CANVAS, FRAME: COLOR_CANVAS, COLOR: '#4d4d4d' },
    TEXT: { LIGHT: '#cccccc', DARK: '#555555', HIGHLIGHT: "#aecbfa" },
}

var blinkms=0; // blink millisec counter
    
class Textbox {
	constructor(name, x,y,w,h, frame, visible, defaultText) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.visible = visible;
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
        this.callbackObject = null; // shall have a .label datamember
	}
    registerCallbackObject(o) {
        this.callbackObject=o;
    }
	cursorIn(cursor) {
		return cursor.x>this.x && cursor.x<this.x+this.w && 
            cursor.y>this.y && cursor.y<this.y+this.h;
	}
	clear() {
		this.text = '';
		this.ptrCursor = 0;
	}
	render() {
        if (this.visible) {
            this.h = this.size + 5;
            g.beginPath();
            g.solid();
            ctx.fillStyle = this.color_background;
            ctx.fillRect(this.x,this.y+0.5,this.w,this.h);
            ctx.strokeStyle = this.color_frame;
            g.lineWidth(1);
            if (this.frame=='frame') ctx.rect(this.x,this.y,this.w,this.h);
            ctx.stroke();
            ctx.strokeStyle = this.color;
            g.lineWidth(1);
            var ptr = this.ptrStart;
            var fits = true;
            var x = this.x+this.px; var y = this.y+this.py; var w;
            this.posChars = [];
            ctx.font = ""+this.size+"px arial";
            ctx.textAlign='left';
            ctx.textBaseline='top';
            while (fits && ptr<=this.text.length) {
                if (this.ptrCursor==ptr && this.cursorBlink) {
                    g.beginPath();
                    g.moveTo(x,y-3);
                    g.lineTo(x,y+this.h-2*this.py+3);
                    ctx.stroke();
                }
                if (Date.now()-blinkms>500) {
                    this.cursorBlink=!this.cursorBlink;
                    blinkms=Date.now();
                }
                if (ptr < this.text.length) {
                    w = ctx.measureText(this.text[ptr],x,y).width;
                    this.posChars[ptr] = [x,y-3,w,this.h-2*this.py+6];
                    g.beginPath();
                    ctx.fillStyle = COLOR.TEXT.DARK;
                    ctx.fillText(this.text[ptr],x,y-2);
                    ctx.fill();
                }
                if (ptr >= this.selectStart && ptr <=this.selectEnd) {
                    g.beginPath();
                    ctx.fillStyle = "#0000ff";
                    ctx.fillRect(x,y-3,w,this.h-2*this.py+6);
                    ctx.fill();
                    g.beginPath();
                    ctx.fillStyle = COLOR.TEXT.LIGHT;
                    ctx.fillText(this.text[ptr],x,y-2);
                    ctx.fill();
                }
                x += w;
                ptr++;
                if (x+ctx.measureText(this.text[ptr],x,y).width > this.x+this.w-this.px) {
                    // fits = false;
                }
            }
            this.posChars.push( [x, y-3, this.ax+this.w-x, this.h-2*this.py+6] );

            if (DEBUG) { // draw all chars rect
            g.beginPath();
            ctx.strokeStyle=COLOR_INK;
            g.lineWidth(1);
            g.solid();
            for (var i=0; i<this.posChars.length; i++) {
                var p=this.posChars[i];
                g.rect(p[0],p[1],p[2],p[3]);
            }
            ctx.stroke();
            }
        }
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
        if (DEBUG) log(this.text);
        this.callbackObject.label=this.text;
        this.callbackObject.visible=true;
        stateChange(IDLE);
        this.visible=false;
        pn.newUndo();
    }
    cancel() {
        if (DEBUG) log(this.text);
        stateChange(IDLE);
        this.callbackObject.visible=true;
        this.visible=false;
    }
    keypressed(evt) {
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
            paste( this, this.text.substr(0,this.ptrCursor), this.text.substr(this.ptrCursor,this.text.length-this.ptrCursor) );
        }
        else if ( (evt.keyCode >= 48 && evt.keyCode <= 57)   || // number keys
        evt.keyCode == 32 || evt.keyCode == 13   || // space, carriage return
        (evt.keyCode >= 65 && evt.keyCode <= 90)   || // letter keys
        (evt.keyCode > 95 && evt.keyCode < 112)  || // numpad keys
        (evt.keyCode > 185 && evt.keyCode < 193) || // ;=,-./` (in order)
        (evt.keyCode > 218 && evt.keyCode < 223) ) {   // [\]' (in order)
            this.text = this.text.substr(0,this.ptrCursor)+evt.key+this.text.substr(this.ptrCursor,this.text.length-this.ptrCursor);
            this.ptrCursor++;
        }
        else if (evt.keyCode == 8 && this.ptrCursor > 0) { // backspace
            this.text = this.text.substr(0,this.ptrCursor-1)+this.text.substr(this.ptrCursor,this.text.length-this.ptrCursor);
            this.ptrCursor--;
        }
        else if (evt.keyCode == 46) { // delete
            this.text = this.text.substr(0,this.ptrCursor)+this.text.substr(this.ptrCursor+1,this.text.length-this.ptrCursor);
        }
    }
}
