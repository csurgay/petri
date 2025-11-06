class BFSForm extends Form {
    constructor(title, margin) {
        super("BFSFORM", title, 20, 10, 200, 100, margin);

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
        const { root, nodeMap } = runMarkingBFS(pn.getMarking(), bfsSteps);
        this.root = root;
        this.nodes = nodeMap;
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

        // Position for every node
        // Even Spacing and doesn't look good on big graphs but that is fixed by panning/dragging and centering + cutoff
        const positions = new Map();

        let maxWidth = 0;
        levelMap.forEach((nodes, lvl) => {
            // Horizontal spacing
            const baseY = lvl * this.levelHeight;
            const totalWidth = (nodes.length - 1) * this.spacingX;

            maxWidth = Math.max(maxWidth, totalWidth);

            nodes.forEach((node, i) => {
                const x = i * this.spacingX - totalWidth / 2;
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
        const centery = this.y + this.h / 2;
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

                    // Only offset one of the two directions (stable ordering)
                    if (aKey < bKey) {
                        const offX = nx * sep;
                        const offY = ny * sep;
                        sx += offX; sy += offY;
                        ex += offX; ey += offY;
                    } else {
                        const offX = nx * sep;
                        const offY = ny * sep;
                        sx += offX; sy += offY;
                        ex += offX; ey += offY;
                    }
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
                const labelDist = 30;
                const lx = ex - Math.cos(angle) * labelDist;
                const ly = ey - Math.sin(angle) * labelDist;
                g.setupText("12px Arial", "center", "middle");
                g.fillStyle(COLOR_INK);
                const combined = transitions.join(", ");

                g.fillText(combined, lx, ly);
            });
        });


        // Markings
        this.nodes.forEach(node => {
            const pos = positions.get(node);
            if (!pos) return;

            g.beginPath();
            g.lineWidth(2);
            g.fillStyle(COLOR_CANVAS);
            g.strokeStyle(COLOR_INK);

            const rectW = nodeRadius * 3;
            const rectH = nodeRadius * 1.3;
            g.rect(pos.x - rectW / 2, pos.y - rectH / 2, rectW, rectH);

            g.fill();
            g.stroke();

            // Marking text
            const text = this.formatMarking(node.marking);
            g.setupText("11px monospace", "center", "middle");
            g.fillStyle(COLOR_HIGHLIGHT);
            g.fillText(text, pos.x, pos.y);
        });

        g.restore();

        // Info bar
        g.setupText("14px Arial", "left", "top");
        g.fillText(`BFS depth: ${bfsSteps}`, this.x + 20, this.y + 30);
        g.fillText(`Nodes: ${this.nodes.size}`, this.x + 20, this.y + 50);
        g.fillText(`Use the Arrow keys to pan, W and S to change level height, A and D to change horizontal spacing`, this.x + 20, this.y + 70);

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
