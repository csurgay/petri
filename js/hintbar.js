// Context-sensitive hint bar at the bottom of the canvas:
// tells what the mouse and keys would do right now.

const HINT_H=24;

function currentHint() {
    const s=state.s;
    if (ctxMenu.isOpen()) return "↑↓ Enter: choose  ·  Esc: close menu";
    if (textbox.active) return "Type the text  ·  Enter: done  ·  Esc: cancel";
    if (fbfs.active) return "Arrows: pan  ·  W/S: level spacing  ·  A/D: horizontal spacing  ·  Space: half screen  ·  Esc: close";
    if (fp.active) return "Wheel over a value: change it  ·  Click text: edit  ·  Esc: close";
    if (ff.active) return "Click a file to open it  ·  Esc: cancel";
    if (bar.running()) return "Simulation running  ·  STOP button or right-click: stop  ·  Wheel over a place: tokens";
    switch (s) {
        case "DRAWARROW": return "Release over a place or transition to connect  ·  Esc: cancel";
        case "SELECT":    return "Release to select the objects inside  ·  Shift/Ctrl: add to selection  ·  Esc: cancel";
        case "DRAG": case "DRAGALL": return "Release to drop  ·  Alt: no grid snap  ·  Esc: cancel move";
        case "PAN":       return "Release to stop panning";
        case "MIDDLE": case "ZOOM": return "Wheel: zoom  ·  Drag: pan  ·  Release on a place: clear its tokens";
    }
    if (ccursor.y < bar.h) return "Hover a button for its description";
    if (events.spaceDown) return "Drag: pan the view";
    const o=pn.highlighted;
    // tool-specific hints
    const back="  ·  V or Esc: back to Select";
    if (tool=="TOKEN")
        return (o && o.type=="PLACE" ? "Click: add token  ·  Shift+click: remove token" :
                "Token tool: click a place to add a token, Shift+click to remove one")+back;
    if (tool=="ARC")
        return (o && (o.type=="PLACE"||o.type=="TRANSITION") ? "Drag to another place or transition to connect" :
                "Arc tool: drag from a place or transition to another one")+back;
    if (!o && tool=="PLACE") return "Place tool: click to add a place  ·  Drag: select"+back;
    if (!o && tool=="TRANSITION") return "Transition tool: click to add a transition  ·  Shift+click: vertical  ·  Drag: select"+back;
    if (!o && tool=="LABEL") return "Label tool: click to add a text label  ·  Drag: select"+back;
    if (o && sel.has(o) && sel.size>1)
        return "Drag: move selection  ·  Del: delete  ·  Ctrl+C/X/D: copy/cut/duplicate  ·  Shift+wheel: rotate  ·  Alt+wheel: colour  ·  Right-click: menu";
    if (o) switch (o.type) {
        case "PLACE":
            return "Wheel: tokens  ·  Drag: move  ·  Ctrl+drag: new arc  ·  Middle-click: clear tokens"+
                (pn.noFlowFromHere(o) ? "  ·  Click again: make transition" : "")+"  ·  Right-click: menu";
        case "TRANSITION":
            return (o.enabled() ? "Click: fire  ·  " : "Not enabled  ·  ")+
                "Wheel: rotate  ·  Drag: move  ·  Ctrl+drag: new arc  ·  S: sticky arrowheads  ·  Right-click: menu";
        case "FLOW":
            return "Click: select, click again: "+(o.o1.type=="PLACE"?"inhibitor":"reset")+
                " arc  ·  Wheel: weight  ·  Drag: add bend point  ·  Right-click: menu";
        case "MIDPOINT":
            return "Drag: move bend point  ·  Del or right-click: delete it";
        case "LABEL":
            return "Click: edit  ·  Wheel or 0–5: size  ·  Alt+wheel: colour  ·  Drag: move  ·  Right-click: menu";
    }
    if (sel.size>0)
        return "Click: deselect  ·  Arrows: move selection  ·  Del: delete  ·  Ctrl+C/X/V/D  ·  Esc: deselect";
    return "Click: new place  ·  Ctrl+click: transition  ·  Drag: select  ·  Space+drag: pan  ·  Ctrl+wheel or pinch: zoom  ·  Ctrl+0: fit  ·  ←/→: step  ·  Right-click: menu";
}

function drawHintBar() {
    if (!fp.hintBar || !fp.hintBar.value) return;
    const c=g.ctx;
    c.save();
    c.setLineDash([]);
    c.fillStyle="rgba(255,255,255,0.82)";
    c.fillRect(0, wh-HINT_H, ww, HINT_H);
    c.strokeStyle="rgba(0,0,0,0.15)";
    c.lineWidth=1;
    c.beginPath(); c.moveTo(0,wh-HINT_H+0.5); c.lineTo(ww,wh-HINT_H+0.5); c.stroke();
    c.fillStyle="#444";
    c.font="13px arial"; c.textAlign="left"; c.textBaseline="middle";
    c.fillText(currentHint(), 12, wh-HINT_H/2+1);
    // selection count on the right
    const n=sel.size;
    if (n>0) {
        c.textAlign="right"; c.fillStyle="rgba(44,86,201,1)";
        c.fillText(n+" selected", ww-12, wh-HINT_H/2+1);
    }
    c.restore();
}
