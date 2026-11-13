class BFSForm extends Form {
    constructor(title, margin) {
        super("BFSFORM", title, 20, 10, 200, 100, margin);
        this.belowBar=true;

        // Root and all nodes
        this.root = null;
        this.nodes = null;

        // For panning
        this.panx = 0;
        this.pany = 0;
        this.panstep = 40;
        this.levelHeight = 100;
        this.spacingX = 150;

        //this.b=[]
    }

    runFrom() {
        // Store root and map of all nodes
        const { root, nodeMap, truncated } = runMarkingBFS(pn.getMarking(), bfsSteps);
        this.root = root;
        this.nodes = nodeMap;
        this.truncated = truncated;
        this.title = "Reachability graph";
    }

    draw() {
        super.draw();
        //this.b.forEach(item=>item.draw());

        // If there is nothing to show
        if (!this.root || !this.nodes || this.nodes.size === 0) {
            g.setupText("16px Arial", "left", "top");
            g.fillText("There is nothing to visualize.", this.x + 40, this.y + 60);
            return;
        }

        g.save();

        // Consts for config
        const nodeRadius = 20;
        const levelMap = new Map();

        // Group nodes by their depth level -> Render by row
        this.nodes.forEach(node => {
            const lvl = node.level ?? 0;
            if (!levelMap.has(lvl)) levelMap.set(lvl, []);
            levelMap.get(lvl).push(node);
        });

        // box width from the longest marking text
        g.setupText("11px monospace", "center", "middle");
        let boxW = 60;
        this.nodes.forEach(node => { boxW = Math.max(boxW, g.measureText(this.formatMarking(node.marking)).width + 14); });
        const spacingX = Math.max(this.spacingX, boxW + 24);

        // Position for every node
        // Even Spacing
	// doesn't look good on big graphs but that is fixed by panning/dragging and centering + cutoff
        const positions = new Map();

        let maxWidth = 0;
        levelMap.forEach((nodes, lvl) => {
            // Horizontal spacing
            const baseY = lvl * this.levelHeight;
            const totalWidth = (nodes.length - 1) * spacingX;

            maxWidth = Math.max(maxWidth, totalWidth);

            nodes.forEach((node, i) => {
                const x = i * spacingX - totalWidth / 2;
                const y = baseY;
                positions.set(node, { x, y });
            });
        });

        // Bounding box
        const xs = [...positions.values()].map(p => p.x);
        const ys = [...positions.values()].map(p => p.y);
        const minx = Math.min(...xs);
        const maxx = Math.max(...xs);
        const miny = Math.min(...ys);
        const maxy = Math.max(...ys);

        const graphw = maxx - minx + nodeRadius * 2;
        const graphh = maxy - miny + nodeRadius * 2;

        // Center of graph and form
        const centerx = this.x + this.w / 2;
        const centery = this.y + 80 + (this.h - 80) / 2;      // below the info panel
        const graphcenterx = minx + graphw / 2;
        const graphcentery = miny + graphh / 2;

        // Offset to translate by
        const offsetx = centerx - graphcenterx;
        const offsety = centery - graphcentery;

        // Draw with clipping
        g.beginPath();
        g.rect(this.x, this.y, this.w, this.h);
        g.clip();

        g.translate(offsetx + this.panx, offsety + this.pany);

        // Arrows
        g.lineWidth(2);
        this.nodes.forEach(node => {
            if (!node.children) return;

            // We group the children by target
            const grouped = new Map();
            node.children.forEach(edge => {
                const target = edge.target;
                const key = target;
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key).push(edge.transition);
            });

            // helper: reverse edge exists?
            const hasReverse = (a, b) => (b && b.children) ? b.children.some(e => e.target === a) : false;

            // To all unique destinations, 1 line
            grouped.forEach((transitions, target) => {
                const from = positions.get(node);
                const to = positions.get(target);
                if (!from || !to) return;

                // Arrow offset with keeping direction in mind
                const dirX = to.x - from.x;
                const dirY = to.y - from.y;
                const len = Math.hypot(dirX, dirY) || 1;
                const ux = dirX / len;
                const uy = dirY / len;

                const startX = from.x + ux * nodeRadius;
                const startY = from.y + uy * nodeRadius;
                const endX = to.x - ux * nodeRadius;
                const endY = to.y - uy * nodeRadius;


                // handle bidirectional overlap with straight, parallel offset
                let sx = startX, sy = startY, ex = endX, ey = endY;
                const reverseExists = hasReverse(node, target);
                if (reverseExists) {
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const len = Math.hypot(dx, dy) || 1;
                    // unit perpendicular
                    const nx = -dy / len;
                    const ny =  dx / len;
                    const sep = 8; // px separation between the two opposite edges

                    // make a unique order-independent pair key
                    const aKey = from.x * 1e6 + from.y;
                    const bKey = to.x   * 1e6 + to.y;

                    // each direction moves to its own side (n flips with the direction)
                    const offX = nx * sep / 2 * 1.5;
                    const offY = ny * sep / 2 * 1.5;
                    sx += offX; sy += offY;
                    ex += offX; ey += offY;
                }

                // Line
                g.beginPath();
                g.strokeStyle(COLOR_INK);
                g.moveTo(sx, sy);
                g.lineTo(ex, ey);
                g.stroke();

                // Arrowhead
                const angle = Math.atan2(ey - sy, ex - sx);
                const arrowSize = 12;
                g.beginPath();
                g.moveTo(ex, ey);
                g.lineTo(
                    ex - arrowSize * Math.cos(angle - Math.PI / 6),
                    ey - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                g.lineTo(
                    ex - arrowSize * Math.cos(angle + Math.PI / 6),
                    ey - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                g.closePath();
                g.fillStyle(COLOR_INK);
                g.fill();

                // Muiltple transitions going from x to y will show as a single line
                // but the transition names are in a single label
                // the transition name(s) in the middle of the edge, on a
                // light patch so crossing edges do not hide it
                // (a bit before the middle: the two directions of a pair differ)
                const lx = sx + (ex - sx) * 0.4;
                const ly = sy + (ey - sy) * 0.4;
                g.setupText("12px Arial", "center", "middle");
                const combined = transitions.join(", ");
                const tw = g.measureText(combined).width;
                g.beginPath();
                g.fillStyle("rgba(255,245,235,0.85)");
                g.fillRect(lx - tw / 2 - 2, ly - 7, tw + 4, 14);
                g.fillStyle(COLOR_INK);
                g.fillText(combined, lx, ly);
            });
        });


        // Markings: M0 (the current marking) bold, deadlocks red,
        // not yet explored ones (beyond the depth) dashed
        let dead = 0, frontier = 0;
        this.nodes.forEach(node => {
            const pos = positions.get(node);
            if (!pos) return;
            if (node.dead) dead++;
            if (node.frontier) frontier++;

            const rectW = boxW;
            const rectH = nodeRadius * 1.3;
            g.beginPath();
            g.lineWidth(node === this.root ? 3 : (node.dead ? 3 : 1.5));
            g.fillStyle(node.dead ? "#fde3df" : (node === this.root ? "#e4eefc" : COLOR_CANVAS));
            g.strokeStyle(node.dead ? "#c0392b" : COLOR_INK);
            if (node.frontier) g.ctx.setLineDash([5, 4]);
            g.rect(pos.x - rectW / 2, pos.y - rectH / 2, rectW, rectH);
            g.fill();
            g.stroke();
            g.ctx.setLineDash([]);

            // Marking text
            const text = this.formatMarking(node.marking);
            g.setupText("11px monospace", "center", "middle");
            g.fillStyle(node.dead ? "#c0392b" : COLOR_HIGHLIGHT);
            g.fillText(text, pos.x, pos.y);
            g.setupText("bold 11px Arial", "center", "top");
            if (node === this.root) { g.fillStyle(COLOR_INK); g.fillText("M0", pos.x - rectW / 2 - 12, pos.y - 6); }
            if (node.dead) { g.fillStyle("#c0392b"); g.fillText("deadlock", pos.x, pos.y + rectH / 2 + 3); }
        });
        this.deadCount = dead;

        g.restore();

        // Info panel: numbers, completeness, which place is which in a marking
        const names = pn.p.map(p => p.label.text.trim() || p.id);
        const lines = [
            `Depth ${bfsSteps}  \u00b7  ${this.nodes.size} markings  \u00b7  ${dead} deadlock${dead == 1 ? "" : "s"}`,
            this.truncated ? `Stopped at ${BFS_MAX_NODES} markings (too many to show)` :
                (frontier ? "More beyond this depth (dashed): use + to go deeper" : "Complete: every reachable marking is shown")
        ];
        g.setupText("12px Arial", "left", "top");
        let legend = "Marking = (", rows = [];
        const maxW = this.w - 100;                  // room for the ✕
        names.forEach((n, i) => {
            const part = n + (i < names.length - 1 ? ", " : ")");
            if (g.measureText(legend + part).width > maxW) { rows.push(legend); legend = "   "; }
            legend += part;
        });
        rows.push(legend);
        g.setupText("14px Arial", "left", "top");
        const panelH = 10 + lines.length * 19 + rows.length * 16 + 4;
        g.beginPath();
        g.fillStyle("rgba(255,245,235,0.92)");
        g.fillRect(this.x + 12, this.y + 18, Math.min(this.w - 70, maxW + 30), panelH);
        g.fillStyle(COLOR_INK);
        lines.forEach((t, i) => {
            g.setupText(i == 0 ? "bold 14px Arial" : "13px Arial", "left", "top");
            g.fillStyle(i == 1 && frontier && !this.truncated ? "#7a5a00" : (i == 1 && !frontier && !this.truncated ? "#1e7a3c" : COLOR_INK));
            g.fillText(t, this.x + 20, this.y + 24 + i * 19);
        });
        g.setupText("12px Arial", "left", "top");
        g.fillStyle(COLOR_INK);
        rows.forEach((t, i) => g.fillText(t, this.x + 20, this.y + 24 + lines.length * 19 + i * 16));

        // Will finish integrating steps buttons into the form later.
        //this.b.push(new Button("STEPS-", "STEPS-", this.x+40, this.y+100, 50, ()=>{return true}));
        //this.b.push(new Button("STEPS+", "STEPS+", this.x+100, this.y+100, 50, ()=>{return true}));
    }

    // Formats markings into a simple "1,0,1" string
    formatMarking(marking) {
        return pn.p.map((p, i) => `${marking[i]}`).join(",");
    }

    // Event handling
    // Also for panning and for changing spacing
    processFormEvent(evt) {
        // drag inside the window pans the graph
        if (evt.type === "md" && evt.button==LEFTBUTTON) this.dragFrom={x:ccursor.x, y:ccursor.y};
        else if (evt.type === "mm" && this.dragFrom) {
            this.panx+=ccursor.x-this.dragFrom.x; this.pany+=ccursor.y-this.dragFrom.y;
            this.dragFrom={x:ccursor.x, y:ccursor.y};
        }
        else if (evt.type === "mu") this.dragFrom=null;
        if (evt.type === "kd") {
            const k = evt.key;
            if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
                const step = this.panstep;

                if (k === "ArrowRight") this.panx -= step;
                if (k === "ArrowLeft") this.panx += step;
                if (k === "ArrowDown") this.pany -= step;
                if (k === "ArrowUp") this.pany += step;
            }
            if (k === "w") this.levelHeight += 10;
            if (k === "s" && this.levelHeight > 70) this.levelHeight -= 10;
            if (k === "a") this.spacingX += 10;
            if (k === "d" && this.spacingX > 80) this.spacingX -= 10;
	    // switch to full screen
	    if (k === " ") {
                this.halfScreen = !this.halfScreen;
	    }
        }

        super.processFormEvent(evt);
        if (evt.type === "ku" && evt.key === "Escape") {
            this.visible = false;
            this.active = false;
            fb.active = true;
            state.set("IDLE");
        }
    }
}
