// Default step/depth is 3
let bfsSteps = 3;
// a big or unbounded net: stop the search at this many markings
const BFS_MAX_NODES = 600;

function markingToString(marking) {
    return marking.join(",");
}

// simulation of firing
function simulateFire(marking, t) {
    const result = [...marking];
    const idx = new Map(pn.p.map((p, i) => [p, i]));

    // Input (PLACE -> TRANSITION)
    pn.f.forEach(flow => {
        if (flow.o2 === t && flow.o1.type === "PLACE") {
            if (flow.subtype === "ENABLER") {
                // consume tokens
                result[idx.get(flow.o1)] -= flow.weight;
            }
            // INHIBITOR arcs are ignored obv
        }
    });

    // Output (TRANSITION -> PLACE)
    pn.f.forEach(flow => {
        if (flow.o1 === t && flow.o2.type === "PLACE") {
            if (flow.subtype === "ENABLER") {
                result[idx.get(flow.o2)] += flow.weight;
            }
            else if (flow.subtype === "RESET") {
                result[idx.get(flow.o2)] = 0;
            }
        }
    });

    return result;
}

// Check if a transition is enabled under a given marking
function isTransitionEnabled(marking, t) {
    const idx = new Map(pn.p.map((p, i) => [p, i]));
    let enabled = true;

    pn.f.forEach(flow => {
        if (flow.o2 === t && flow.o1.type === "PLACE") {
            const tokens = marking[idx.get(flow.o1)];
            if (flow.subtype === "ENABLER" && tokens < flow.weight) {
                enabled = false;
            }
            else if (flow.subtype === "INHIBITOR" && tokens >= flow.weight) {
                enabled = false;
            }
        }
    });

    return enabled;
}

// Get all enabled transitions for a given marking
function getEnabledTransitions(marking) {
    return pn.t.filter(t => isTransitionEnabled(marking, t));
}

// BFS
function runMarkingBFS(startMarking, maxDepth = bfsSteps) {
    const rootKey = markingToString(startMarking);
    const root = { marking: [...startMarking], children: [], level: 0, parents: [] };

    // Lookup table to merge identical markings
    const nodeMap = new Map([[rootKey, root]]);
    const queue = [root];

    let truncated = false;
    while (queue.length > 0) {
        const current = queue.shift();
        const enabled = getEnabledTransitions(current.marking);
        // beyond the depth limit: not explored (there may be more)
        if (current.level >= maxDepth || truncated) {
            current.frontier = enabled.length > 0;
            continue;
        }
        // no enabled transition: a dead marking (deadlock)
        if (enabled.length == 0) current.dead = true;

        enabled.forEach(t => {
            const newM = simulateFire(current.marking, t);
            const key = markingToString(newM);

            let child;
            if (nodeMap.has(key)) {
                // Existing node -> merge instead of creating new
                child = nodeMap.get(key);
                // add parent link if not already present
                if (!child.parents.includes(current)) child.parents.push(current);
            } else {
                // New marking -> create new node
                child = {
                    marking: newM,
                    children: [],
                    parents: [current],
                    level: current.level + 1,
                    transition: t.id
                };
                nodeMap.set(key, child);
                queue.push(child);
                if (nodeMap.size >= BFS_MAX_NODES) truncated = true;
            }

            // Always record connection (edge), named like the transition
            current.children.push({
                target: child,
                transition: t.label.text || t.id
            });
        });
    }

    return { root, nodeMap, truncated };
}

