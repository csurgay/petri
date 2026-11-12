// File handling: save to / open from the user's computer, drag & drop,
// unsaved-changes tracking, autosave in the browser.

const fm = {
    name: "noname.pn",
    savedBody: "",          // net content at the last open/save (for "unsaved" mark)
};
const AUTOSAVE_KEY="petri-autosave";

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

// --- save to the computer: a plain download into the Downloads folder ----------
function saveNetToComputer() {
    if (undoPtr<0) pn.newUndo();
    const data=rawSave();
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([data],{type:"text/plain"}));
    a.download=fm.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 1000);
    markSaved(); autosave();
    showToast("Downloaded "+fm.name+" to your Downloads folder", 3000);
}

// --- open from the computer: the browser's plain file chooser ----------------
// (a hidden <input type=file> works everywhere, also where the newer
//  File System Access pickers are disabled by policy)
let fileInput=null;
function openNetFromComputer() {
    if (isDirty() && !confirm("Discard unsaved changes?")) return;
    if (!fileInput) {
        fileInput=document.createElement("input");
        fileInput.type="file";
        fileInput.accept=".pn";
        fileInput.style.display="none";
        fileInput.addEventListener("change", async ()=>{
            const f=fileInput.files[0];
            fileInput.value="";              // choosing the same file again works too
            if (!f) return;
            try { loadNetText(await f.text(), f.name); }
            catch(e) { showToast("Could not read "+f.name); }
        });
        document.body.appendChild(fileInput);
    }
    fileInput.click();
}

// --- drag & drop a .pn file onto the window ------------------------------------
window.addEventListener("dragover", e=>{ e.preventDefault(); e.dataTransfer.dropEffect="copy"; });
window.addEventListener("drop", async e=>{
    e.preventDefault();
    const f=e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    if (isDirty() && !confirm("Discard unsaved changes?")) return;
    loadNetText(await f.text(), f.name);
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
    markSaved();
    autosave();
}
