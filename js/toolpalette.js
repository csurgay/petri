// Tool palette (left edge) and view helpers (zoom at cursor, fit view).

const TOOLS=[
    {id:"SELECT",     key:"v", name:"Select / edit",
     tip:"Select and edit (V)  —  the classic mode: click empty canvas for a place",
     svg:'<path d="M5 3l11 6.5-5 1.2 2.8 5.3-2 1-2.8-5.2L5 15z"/>'},
    {id:"PLACE",      key:"p", name:"Place",
     tip:"Place tool (P): click empty canvas to add places",
     svg:'<circle cx="10" cy="10" r="6.5" fill="none" stroke-width="1.8"/><circle cx="10" cy="10" r="1.8"/>'},
    {id:"TRANSITION", key:"t", name:"Transition",
     tip:"Transition tool (T): click empty canvas to add transitions (Shift: vertical)",
     svg:'<rect x="3" y="7.5" width="14" height="5"/>'},
    {id:"ARC",        key:"a", name:"Arc",
     tip:"Arc tool (A): drag from a place or transition to another one",
     svg:'<path d="M3 16L14 5" fill="none" stroke-width="1.8"/><path d="M16.5 2.5l-1.2 6.2-5-5z"/>'},
    {id:"TOKEN",      key:"k", name:"Token",
     tip:"Token tool (K): click a place to add a token, Shift+click to remove one",
     svg:'<circle cx="10" cy="10" r="6.5" fill="none" stroke-width="1.5"/><circle cx="7.5" cy="7.5" r="1.6"/><circle cx="12.5" cy="12.5" r="1.6"/><circle cx="12.5" cy="7.5" r="1.6"/><circle cx="7.5" cy="12.5" r="1.6"/>'},
    {id:"LABEL",      key:"l", name:"Label",
     tip:"Label tool (L): click empty canvas to add a text label",
     svg:'<text x="10" y="15" font-family="Arial" font-weight="700" font-size="14" text-anchor="middle" stroke="none">T</text>'}
];
const TOOL_KEYS={}; TOOLS.forEach(t=>TOOL_KEYS[t.key]=t.id);
var tool="SELECT";

const palette={ el:null };
function buildPalette() {
    const p=document.createElement("div");
    p.className="palette";
    ["mousedown","mouseup","mousemove","wheel","contextmenu","click"].forEach(t=>
        p.addEventListener(t, e=>{ e.stopPropagation(); if (t=="contextmenu"||t=="wheel") e.preventDefault(); },
            {passive:false}));
    TOOLS.forEach(t=>{
        const b=document.createElement("button");
        b.dataset.tool=t.id;
        b.title=t.tip;
        b.innerHTML='<svg width="20" height="20" viewBox="0 0 20 20">'+t.svg+'</svg><span>'+t.key.toUpperCase()+'</span>';
        b.addEventListener("click",()=>{ setTool(t.id); b.blur(); });
        p.appendChild(b);
    });
    document.body.appendChild(p);
    palette.el=p;
    setTool(tool);
}
function setTool(id) {
    tool=id;
    if (palette.el) palette.el.querySelectorAll("button").forEach(b=>
        b.classList.toggle("on", b.dataset.tool==id));
}
// hidden while a dialog (files, preferences, reachability) is open
let paletteShown=true;
function updatePalette() {
    if (!palette.el) return;
    const show=!(ff.active || fp.active || fbfs.active);
    if (show!==paletteShown) { palette.el.style.display=show?"":"none"; paletteShown=show; }
}
function toolName() { return TOOLS.find(t=>t.id==tool).name; }

// create an object with the current tool at a (snapped) point
function createByTool(at, shift=false) {
    let o=null;
    if (tool=="TRANSITION") { o=new Transition(at.x,at.y, shift?0:Math.PI/2); pn.addTransition(o); }
    else if (tool=="LABEL") { o=new Label("-",at.x,at.y); pn.addLabel(o); }
    else if (tool=="PLACE" || tool=="SELECT") { o=new Place(at.x,at.y); pn.addPlace(o); }
    return o;
}

// ---- view ----------------------------------------------------------------
const ZOOM_MIN=0.2, ZOOM_MAX=4;
// zoom by factor f, keeping the net point under the screen point (sx,sy) still
function zoomAt(sx, sy, f) {
    const z0=pn.zoom;
    const z1=Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z0*f));
    if (z1==z0) return;
    const wx=(sx-pn.cx)/z0-pn.vpx, wy=(sy-pn.cy)/z0-pn.vpy;
    pn.zoom=z1;
    pn.vpx=(sx-pn.cx)/z1-wx;
    pn.vpy=(sy-pn.cy)/z1-wy;
}
// zoom and pan so that the whole net is visible
function fitView() {
    const pts=[];
    pn.p.forEach(o=>pts.push([o.x-PLACE_R,o.y-PLACE_R],[o.x+PLACE_R,o.y+PLACE_R]));
    pn.t.forEach(o=>pts.push([o.x-th/2,o.y-th/2],[o.x+th/2,o.y+th/2]));
    pn.l.forEach(o=>pts.push([o.x-(o.width||20)/2,o.y-10],[o.x+(o.width||20)/2,o.y+10]));
    pn.f.forEach(f=>f.path.forEach(m=>pts.push([m.x,m.y])));
    if (pts.length==0) { pn.zoom=1; pn.vpx=0; pn.vpy=0; return; }
    const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
    const x1=Math.min(...xs), x2=Math.max(...xs), y1=Math.min(...ys), y2=Math.max(...ys);
    const left=palette.el?60:20, top=bar.h+20, right=ww-20, bottom=wh-HINT_H-20;
    const z=Math.max(ZOOM_MIN, Math.min(2, (right-left)/Math.max(1,x2-x1), (bottom-top)/Math.max(1,y2-y1)));
    pn.zoom=z;
    pn.vpx=((left+right)/2-pn.cx)/z-(x1+x2)/2;
    pn.vpy=((top+bottom)/2-pn.cy)/z-(y1+y2)/2;
}
