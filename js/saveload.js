function rawSave() {
    var str=getFormattedDate();
    str+="\nPlaces:";
    pn.p.forEach(o=>{
        str+="\n"+o.id+" "+o.x.toFixed(1)+" "+o.y.toFixed(1)+" "+o.color+" "+
        o.tokens+" "+
        o.label.label+" "+o.label.x.toFixed(1)+" "+o.label.y.toFixed(1)+" "+o.label.color;
    });
    str+="\nTransitions:";
    pn.t.forEach(o=>{
        str+="\n"+o.id+" "+o.x.toFixed(1)+" "+o.y.toFixed(1)+" "+o.color+" "+
        o.alpha.toFixed(3)+" "+
        o.label.label+" "+o.label.x.toFixed(1)+" "+o.label.y.toFixed(1)+" "+o.label.color;
    });
    str+="\nFlows:";
    pn.f.forEach(o=>{
        str+="\n"+o.id+" "+o.color+" "+
        o.subtype+" "+o.weight+" "+
        o.o1.id+" "+o.o2.id+" "+(o.path.length-2);
        for (var i=1; i<o.path.length-1; i++) str+=" "+o.path[i].x.toFixed(1)+" "+o.path[i].y.toFixed(1);
    });
    str+="\nEnd";
    return str;
}

var l;
function rawLoad(str) {
    pn.clear();
    str=str.replaceAll('\r','').split('\n'); ptr=0;
    while(str[ptr]!="Places:") ptr++; ptr++;
    while(str[ptr]!="Transitions:") {
        if (DEBUG) log(str[ptr]);
        l=str[ptr].split(" ");
        const o=new Place(+l[1],+l[2]); o.id=l[0]; o.color=l[3];
        o.tokens=+l[4];
        o.label.label=l[5]; o.label.x=+l[6]; o.label.y=+l[7]; o.label.color=l[8];
        pn.addPlace(o);
        ptr++;
    }
    ptr++;
    while(str[ptr]!="Flows:") {
        if (DEBUG) log(str[ptr]);
        l=str[ptr].split(" ");
        const o=new Transition(+l[1],+l[2]); o.id=l[0]; o.color=l[3];
        o.alpha=+l[4];
        o.label.label=l[5]; o.label.x=+l[6]; o.label.y=+l[7]; o.label.color=l[8];
        pn.addTransition(o);
        ptr++;
    }
    ptr++;
    while(str[ptr]!="End") {
        if (DEBUG) log(str[ptr]);
        l=str[ptr].split(" ");
        const o=new Flow(pn.locate(l[4]),pn.locate(l[5])); o.id=l[0]; o.color=l[1];
        o.subtype=l[2]; o.weight=+l[3];
        for (var i=7; i<7+2*parseInt(l[6]); i+=2) {
            o.path.splice(o.path.length-1,0,new MidPoint(+l[i],+l[i+1]));
        }
        pn.addFlow(o);
        ptr++;
    }
}

function processLoad(str) {
    pn.clear();
    const jsonObject = JSON.parse(str);
    pn.zoom=jsonObject.zoom;
    pn.vpx=jsonObject.vpx; pn.vpy=jsonObject.vpy;
    jsonObject.p.forEach(p=>{
        const newPlace=new Place(p.x,p.y);
        newPlace.id=p.id;
        newPlace.tokens=p.tokens;
        newPlace.label.label=p.label.label;
        newPlace.label.x=p.label.x;
        newPlace.label.y=p.label.y;
        if (p.color) newPlace.color=p.color;
        pn.addPlace(newPlace);
    });
    jsonObject.t.forEach(t=>{
        const newTrans = new Transition(t.x,t.y);
        newTrans.id=t.id;
        newTrans.alpha=t.alpha;
        newTrans.label.label=t.label.label;
        newTrans.label.x=t.label.x;
        newTrans.label.y=t.label.y;
        if (t.color) newTrans.color=t.color;
        pn.addTransition(newTrans);
    });
    jsonObject.f.forEach(f=>{
        var o1,o2;
        pn.p.forEach(p=>{if(p.x==f.o1.x && p.y==f.o1.y) o1=p;});
        pn.p.forEach(p=>{if(p.x==f.o2.x && p.y==f.o2.y) o2=p;});
        pn.t.forEach(t=>{if(t.x==f.o1.x && t.y==f.o1.y) o1=t;});
        pn.t.forEach(t=>{if(t.x==f.o2.x && t.y==f.o2.y) o2=t;});
        const newFlow = new Flow(o1,o2);
        newFlow.subtype=f.subtype;
        newFlow.delta=new Coord(f.delta.x,f.delta.y);
        newFlow.newo2=new Coord(f.newo2.x,f.newo2.y);
        newFlow.weight=f.weight;
        if (f.color) newFlow.color=f.color;
        if (f.path) for (var i=f.path.length-2; i>0; i--) {
            newFlow.addSegment(new MidPoint(f.path[i].x,f.path[i].y));
        }
        pn.addFlow(newFlow);
    });
}
