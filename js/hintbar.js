// Context-sensitive hint bar at the bottom of the canvas:
// tells what the mouse and keys would do right now.

const HINT_H=24;

function currentHint() { return touchHint(rawHint()); }
function rawHint() {
    const s=state.s;
    if (typeof confirmOpen==="function" && confirmOpen()) return "Enter: OK  ·  Esc: cancel";
    if (ctxMenu.isOpen()) return "↑↓ Enter: choose  ·  Esc: close menu";
    if (textbox.active) return "Type the text  ·  Enter: done  ·  Esc: cancel";
    if (fbfs.active) return "Drag or arrows: pan  ·  W/S: level spacing  ·  A/D: horizontal spacing  ·  Space: half screen  ·  REACH or Esc: close";
    if (fp.active) return "Click a value to change it  ·  Wheel over a value: step it  ·  PREF or Esc: close";
    if (ff.active) return "Click a file to open it  ·  Esc: cancel";
    if (bar.running()) return "Simulation running  ·  STOP or right-click: stop  ·  Two fingers or Space+drag: pan";
    switch (s) {
        case "DRAWARROW": return "Release over a "+(tool=="INHIBITOR"?"transition":tool=="RESET"?"place":"place or transition")+" to connect  ·  Esc: cancel";
        case "SELECT":    return "Release to select the objects inside  ·  Shift/Ctrl: add to selection  ·  Esc: cancel";
        case "DRAG": case "DRAGALL": return "Release to drop  ·  Alt: no grid snap  ·  Esc: cancel move";
        case "PAN":       return "Release to stop panning";
        case "MIDDLE": case "ZOOM": return "Wheel: zoom  ·  Drag: pan  ·  Release on a place: clear its tokens";
    }
    if (ccursor.y < bar.h) return "Hover a button for its description";
    if (events.spaceDown) return "Drag: pan the view";
    const o=pn.highlighted;
    const T=o && o.type;
    const view="  ·  Space+drag or two fingers: pan  ·  Ctrl+wheel or pinch: zoom";
    switch (tool) {
        case "PLACE":
            return T=="PLACE" ? "Drag: move  ·  Right-click: delete place  ·  Double-click: rename"
                              : "Click: add a place  ·  Drag: select"+view;
        case "TRANSITION":
            return T=="TRANSITION" ? "Drag: move  ·  Right-click: delete transition  ·  Double-click: rename  ·  Wheel: rotate"
                                   : "Click: add a transition  ·  Shift+click: vertical  ·  Drag: select"+view;
        case "FLOW": case "INHIBITOR": case "RESET": {
            const what = tool=="INHIBITOR" ? "inhibitor arc (place \u2192 transition)"
                       : tool=="RESET" ? "reset arc (transition \u2192 place)" : "arc";
            if (T=="PLACE"||T=="TRANSITION") return "Drag to the target: new "+what;
            if (T=="FLOW") return "Right-click: delete arc  ·  Double-click: weight  ·  Drag: add bend point";
            if (T=="MIDPOINT") return "Drag: move bend point  ·  Right-click: delete it";
            return "Drag from a place or transition: new "+what+view;
        }
        case "MARKING":
            if (T=="PLACE") return "Click: +1 token  ·  Right-click: \u22121  ·  Double-click: type the number";
            if (T=="TRANSITION") return o.enabled() ? "Click: fire" : "Not enabled  ·  needs tokens on its input places";
            return "Click a place: +1 token  ·  Right-click: \u22121  ·  Double-click: type  ·  Click a transition: fire"+view;
        case "LABEL":
            return T=="LABEL" ? "Drag: move  ·  Double-click: edit  ·  Right-click: delete  ·  Wheel or 0–5: size"
                              : "Click: add a label"+view;
        case "PAN":
            return "Drag: pan the view  ·  Ctrl+wheel or pinch: zoom  ·  Ctrl+0: fit";
    }
    // SELECT
    if (o && sel.has(o) && sel.size>1)
        return "Drag: move selection  ·  Del: delete  ·  Ctrl+C/X/D: copy/cut/duplicate  ·  Shift+wheel: rotate  ·  Alt+wheel: colour  ·  Right-click: menu";
    if (o) switch (T) {
        case "PLACE":      return "Click: select  ·  Drag: move  ·  Double-click: rename  ·  Wheel: tokens  ·  Right-click: menu";
        case "TRANSITION": return "Click: select  ·  Drag: move  ·  Double-click: rename  ·  Wheel: rotate  ·  Right-click: menu";
        case "FLOW":       return "Click: select  ·  Double-click: weight  ·  Drag: add bend point  ·  Wheel: weight  ·  Right-click: menu";
        case "MIDPOINT":   return "Drag: move bend point  ·  Right-click: menu";
        case "LABEL":      return "Click: select  ·  Drag: move  ·  Double-click: edit  ·  Wheel or 0–5: size  ·  Right-click: menu";
    }
    if (sel.size>0) return "Click: deselect  ·  Arrows: move selection  ·  Del: delete  ·  Ctrl+C/X/V/D  ·  Esc: deselect";
    return "Drag: select  ·  Right-click: menu  ·  Tools: P T F I R M L H"+view+"  ·  ←/→: step";
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
