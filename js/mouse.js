const LEFTBUTTON=0, MIDDLEBUTTON=1, RIGHTBUTTON=2;

var tcursor=new Coord(0,0); // Viewport (translated) tcursor
var scursor=new Coord(0,0); // Snapped viewport (translated) cursor
var ccursor=new Coord(0,0); // Canvas cursor (for toolbar, not translated)
