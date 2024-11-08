function rawSave() {
    var str=getFormattedDate();
    str+="\nPlaces:";
    pn.p.forEach(o=>{
        str+="\n"+o.id+" "+o.x.toFixed(1)+" "+o.y.toFixed(1)+" "+o.color+" "+
        o.tokens+' "'+
        o.label.label+ '" '+o.label.x.toFixed(1)+" "+o.label.y.toFixed(1)+" "+o.label.color;
    });
    str+="\nTransitions:";
    pn.t.forEach(o=>{
        str+="\n"+o.id+" "+o.x.toFixed(1)+" "+o.y.toFixed(1)+" "+o.color+" "+
        o.alpha.toFixed(3)+' "'+
        o.label.label+'" '+o.label.x.toFixed(1)+" "+o.label.y.toFixed(1)+" "+o.label.color;
    });
    str+="\nFlows:";
    pn.f.forEach(o=>{
        str+="\n"+o.id+" "+o.color+" "+
        o.subtype+" "+o.weight+" "+
        o.o1.id+" "+o.o2.id+" "+o.stickyHead+" "+o.stickyTransConnector;
        str+=" "+(o.path.length-2);
        for (var i=1; i<o.path.length-1; i++) str+=" "+o.path[i].id+" "+o.path[i].x.toFixed(1)+" "+o.path[i].y.toFixed(1);
    });
    str+="\nLabels:";
    pn.l.forEach(o=>{
        if (!o.objectsLabel()) {
            str+="\n"+o.id+" "+o.color+" "+o.size+' "'+
            o.label+'" '+o.x.toFixed(1)+" "+o.y.toFixed(1)+" "+
            (o.attached==null?"none":o.attached.id);
        }
    });
    str+="\nConfig:\nzoom: "+pn.zoom.toFixed(1)
    +"\ncx: "+pn.cx.toFixed(1)+"\ncy: "+pn.cy.toFixed(1)
    +"\nvpx: "+pn.vpx.toFixed(1)+"\nvpy: "+pn.vpy.toFixed(1);
    str+="\nEnd";
    return str;
}

var l;
function rawLoad(str) {
    pn.clear();
    str=str.replaceAll('\r','').split('\n'); ptr=0;
    while(str[ptr]!="Places:") ptr++; ptr++;
    // Places
    while(str[ptr]!="Transitions:") {
        l=[]; tokenize(str[ptr],l);
        const o=new Place(+l[1],+l[2]); o.id=l[0]; o.color=l[3];
        o.tokens=+l[4];
        o.label.label=l[5]; o.label.x=+l[6]; o.label.y=+l[7]; o.label.color=l[8];
        pn.addPlace(o);
        ptr++;
    }
    ptr++;
    // Transitions
    while(str[ptr]!="Flows:") {
        l=[]; tokenize(str[ptr],l);
        const o=new Transition(+l[1],+l[2]); o.id=l[0]; o.color=l[3];
        o.alpha=+l[4];
        o.label.label=l[5]; o.label.x=+l[6]; o.label.y=+l[7]; o.label.color=l[8];
        pn.addTransition(o);
        ptr++;
    }
    ptr++;
    // Flows
    while(str[ptr]!="Labels:") {
        l=[]; tokenize(str[ptr],l);
        const o=new Flow(pn.locate(l[4]),pn.locate(l[5])); 
        o.id=l[0]; o.color=l[1]; o.subtype=l[2]; o.weight=+l[3];
        o.stickyHead=l[6]==="true"; o.stickyTransConnector=+l[7];
        for (var i=9; i<9+3*parseInt(l[8]); i+=3) {
            var mp = new MidPoint(+l[i+1],+l[i+2]);
            mp.id = l[i];
            pn.m.push(mp);
            o.path.splice(o.path.length-1,0,mp);
        }
        pn.addFlow(o);
        ptr++;
    }
    ptr++;
    // Labels
    while(str[ptr]!="Config:") {
        l=[]; tokenize(str[ptr],l);
        const o=new Label(l[3],+l[4],+l[5]);
        pn.addLabel(o);
        o.id=l[0]; o.color=l[1]; o.size=+l[2];
        if (l[6][0]=='P') { pn.p.forEach(i=>{ if (l[6]==i.id) { o.attached=i; i.attachedLabels.push(o); }}) }
        if (l[6][0]=='T') { pn.t.forEach(i=>{ if (l[6]==i.id) { o.attached=i; i.attachedLabels.push(o); }}) }
        if (l[6][0]=='L') { pn.l.forEach(i=>{ if (l[6]==i.id) { o.attached=i; i.attachedLabels.push(o); }}) }
        if (l[6][0]=='M') { pn.m.forEach(i=>{ if (l[6]==i.id) { o.attached=i; i.attachedLabels.push(o); }}) }
        ptr++;
    }
    ptr++;
    // Config
    while(str[ptr]!="End") {
        l=str[ptr].split(" ");
        if (l[0]=="zoom:") pn.zoom=+l[1];
        else if (l[0]=="cx:") pn.cx=+l[1];
        else if (l[0]=="cy:") pn.cy=+l[1];
        else if (l[0]=="vpx:") pn.vpx=+l[1];
        else if (l[0]=="vpy:") pn.vpy=+l[1];
        ptr++;
    }
    // Adjust max ID-s to avoid ID conflict of additional objects
    idPlace=maxID(pn.p);
    idTrans=maxID(pn.t);
    idFlow=maxID(pn.f);
    idLabel=maxID(pn.l);
}
function maxID(a) {
    var max=0,v;
    a.forEach(i=>{v=parseInt(i.id.substring(1));if(v>max)max=v;})
    return max;
}
function tokenize(str,resultArray) {
    const myRegexp = /[^\s"]+|"([^"]*)"/gi;
    do {
        //Each call to exec returns the next regex match as an array
        var match = myRegexp.exec(str);
        if (match != null)
        {
            //Index 1 in the array is the captured group if it exists
            //Index 0 is the matched text, which we use if no captured group exists
            if (match[0]=='""') match[0]='';
            resultArray.push(match[1] ? match[1] : match[0]);
        }
    } while (match != null);
       
}
