// File handling: save to / open from the user's computer, drag & drop,
// unsaved-changes tracking, autosave in the browser.

const fm = {
    name: "noname.pn",
    savedBody: "",          // net content at the last open/save (for "unsaved" mark)
    handle: null,           // File System Access handle (Chrome/Edge), if any
};
const AUTOSAVE_KEY="petri-autosave";
// Some embedded browsers (e.g. app webviews) expose the file pickers but
// reject them at once without showing a dialog. A "cancel" that arrives
// faster than a person could click means: no dialog here, use the fallback.
let pickerBroken=false;
const INSTANT_ABORT_MS=400;
function pickerUsable(fn) { return !!fn && !pickerBroken; }

// net content without timestamp and view settings
function netBody(raw) {
    if (!raw) return "";
    const a=raw.indexOf("Places:"), b=raw.indexOf("Config:");
    return raw.substring(a<0?0:a, b<0?raw.length:b);
}
function isDirty() {
    return undoPtr>=0 && netBody(undo[undoPtr])!==fm.savedBody;
}
function markSaved() {
    fm.savedBody = undoPtr>=0 ? netBody(undo[undoPtr]) : "";
}
function setFileName(n) {
    fm.name = (n||"noname.pn").replace(/^.*[\\/]/,"");
}
// called every frame: file name with unsaved mark on the toolbar and in the tab
var lastTitle="";
function updateFileTitle() {
    const t=fm.name+(isDirty()?" *":"");
    if (t===lastTitle) return;
    lastTitle=t;
    bar.children[0].text="File: "+t;
    document.title=t+" – PetriNet Simulator";
}

// --- load from text ---------------------------------------------------------
function loadNetText(text, name) {
    if (!text || text.indexOf("Places:")<0 || text.indexOf("End")<0) {
        showToast("Not a PetriNet (.pn) file");
        return false;
    }
    const backup = undoPtr>=0 ? undo[undoPtr] : null;
    try {
        undo.length=0; undoPtr=-1;
        rawLoad(text);
        pn.clearMarkings();
        pn.newUndo();
    } catch(e) {
        if (backup) { rawLoad(backup); pn.newUndo(); }
        showToast("Could not read this file");
        return false;
    }
    setFileName(name);
    markSaved();
    autosave();
    events.refreshHover();
    return true;
}

// --- save to the computer ------------------------------------------------------
// saveAs: always ask for a (new) location
async function saveNetToComputer(saveAs=false) {
    if (undoPtr<0) pn.newUndo();
    const data=rawSave();
    if (saveAs) fm.handle=null;
    let problem="";
    // Chrome/Edge on https or localhost: real "Save as" dialog,
    // later saves go to the same file
    if (pickerUsable(window.showSaveFilePicker)) {
        let handle=fm.handle, step="dialog";
        const t0=Date.now();
        try {
            if (!handle) {
                handle=await window.showSaveFilePicker({
                    suggestedName: fm.name,
                    types:[{description:"PetriNet", accept:{"text/plain":[".pn"]}}]
                });
            }
            step="permission";
            if (handle.requestPermission &&
                await handle.requestPermission({mode:"readwrite"})!=="granted")
                throw new DOMException("write permission denied","NotAllowedError");
            step="write";
            const w=await handle.createWritable();
            await w.write(data);
            await w.close();
        } catch(e) {
            fm.handle=null;
            const name=(e && e.name) || "Error";
            if (step=="dialog" && name=="AbortError" && Date.now()-t0>=INSTANT_ABORT_MS)
                return;                                    // the user cancelled
            console.warn("Save via file dialog failed at step '"+step+"':", e);
            if (step=="dialog") pickerBroken=true;         // no usable dialog here
            problem=" — the file dialog failed ("+step+": "+name+(e&&e.message?", "+e.message:"")+")";
            handle=null;
        }
        if (handle) {
            // written: bookkeeping outside the try, so it can never trigger a download
            fm.handle=handle;
            setFileName(handle.name);
            markSaved(); autosave();
            showToast("Saved "+fm.name+(saveAs?"":"   (Ctrl+Shift+S: save as)"), 3000);
            return;
        }
    }
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([data],{type:"text/plain"}));
    a.download=fm.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    markSaved(); autosave();
    // tell where it went and why there was no location dialog
    const why = problem ? problem
              : !window.isSecureContext ? " (location choice needs https or localhost)"
              : (!window.showSaveFilePicker || pickerBroken) ? " (this browser cannot ask for a location)" : "";
    showToast("Downloaded "+fm.name+" to the browser's download folder"+why, problem?12000:5000);
}

// --- open from the computer ---------------------------------------------------
async function openNetFromComputer() {
    if (isDirty() && !confirm("Discard unsaved changes?")) return;
    if (pickerUsable(window.showOpenFilePicker)) {
        const t0=Date.now();
        try {
            const [h]=await window.showOpenFilePicker({
                types:[{description:"PetriNet", accept:{"text/plain":[".pn"]}}]
            });
            const f=await h.getFile();
            if (loadNetText(await f.text(), f.name)) fm.handle=h;
            return;
        } catch(e) {
            if (e && e.name=="AbortError" && Date.now()-t0>=INSTANT_ABORT_MS) return;
            pickerBroken=true;
        }
    }
    const inp=document.createElement("input");
    inp.type="file"; inp.accept=".pn,text/plain";
    inp.onchange=async ()=>{
        const f=inp.files[0];
        if (f && loadNetText(await f.text(), f.name)) fm.handle=null;
    };
    inp.click();
}

// --- drag & drop a .pn file onto the window ------------------------------------
window.addEventListener("dragover", e=>{ e.preventDefault(); e.dataTransfer.dropEffect="copy"; });
window.addEventListener("drop", async e=>{
    e.preventDefault();
    const f=e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    if (isDirty() && !confirm("Discard unsaved changes?")) return;
    if (loadNetText(await f.text(), f.name)) fm.handle=null;
});

// --- unsaved changes warning ------------------------------------------------------
window.addEventListener("beforeunload", e=>{
    if (isDirty()) { e.preventDefault(); e.returnValue=""; }
});

// --- autosave in the browser (restored on the next start) -----------------------------
function autosave() {
    try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
            name: fm.name, data: undoPtr>=0 ? undo[undoPtr] : "", saved: fm.savedBody
        }));
    } catch(e) {}
}
function restoreAutosave() {
    let a=null;
    try { a=JSON.parse(localStorage.getItem(AUTOSAVE_KEY)||"null"); } catch(e) {}
    if (!a || !a.data || netBody(a.data).split("\n").length<4) return false;
    try {
        rawLoad(a.data);
        pn.clearMarkings();
        pn.newUndo();
        setFileName(a.name);
        fm.savedBody=a.saved||"";
        showToast("Last session restored  —  NEW starts an empty net");
        return true;
    } catch(e) { return false; }
}
function newNet() {
    if (isDirty() && !confirm("Discard unsaved changes?")) return;
    pn.clear();
    undo.length=0; undoPtr=-1;
    pn.newUndo();
    setFileName("noname.pn");
    fm.handle=null;
    markSaved();
    autosave();
}
