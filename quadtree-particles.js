(function () {
        function QuadTree(particlesList) {
            this._x = defaultX;
            this._y = defaultY;
            this._x0 = NaN;
            this._y0 = NaN;
            this._x1 = NaN;
            this._y1 = NaN;
            this._root = undefined;
            initQuad(this, particlesList)
        }

        function Quad(node, x0, y0, x1, y1) {
            this.node = node;
            this.x0 = x0;
            this.y0 = y0;
            this.x1 = x1;
            this.y1 = y1;
        }

        function defaultX(d) {
            return d.x;
        }

        function defaultY(d) {
            return d.y;
        }

        function initQuad(tree, particlesList) {
            let d, i, n = particlesList.length,
                x,
                y,
                xz = new Array(n),
                yz = new Array(n),
                x0 = Infinity,
                y0 = Infinity,
                x1 = -Infinity,
                y1 = -Infinity;

            for (i = 0; i < n; ++i) {
                if (isNaN(x = +tree._x.call(null, d = particlesList[i])) || isNaN(y = +tree._y.call(null, d))) continue;
                xz[i] = x;
                yz[i] = y;
                if (x < x0) x0 = x;
                if (x > x1) x1 = x;
                if (y < y0) y0 = y;
                if (y > y1) y1 = y;
            }

            if (x0 > x1 || y0 > y1) return;

            cover(tree, x0, y0)
            cover(tree, x1, y1);

            for (i = 0; i < n; ++i) {
                addP(tree, xz[i], yz[i], particlesList[i]);
            }

            return tree;
        }

        function addP(tree, x, y, d) {
            if (isNaN(x) || isNaN(y)) return;

            let parent,
                node = tree._root,
                leaf = { data: d },
                x0 = tree._x0,
                y0 = tree._y0,
                x1 = tree._x1,
                y1 = tree._y1,
                xm,
                ym,
                xp,
                yp,
                right,
                bottom,
                i,
                j;

            if (!node) return tree._root = leaf, tree;



            while (node.length) {
                if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
                if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
                if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
            }

            xp = +tree._x.call(null, node.data);
            yp = +tree._y.call(null, node.data);
            if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

            do {
                parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
                if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
                if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
            } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
            return parent[j] = node, parent[i] = leaf, tree;
        }

        function cover(tree, x, y) {
            if (isNaN(x = +x) || isNaN(y = +y)) return;
            let x0 = tree._x0,
                y0 = tree._y0,
                x1 = tree._x1,
                y1 = tree._y1;

            if (isNaN(x0)) {
                x1 = (x0 = Math.floor(x)) + 1;
                y1 = (y0 = Math.floor(y)) + 1;
            }

            else {
                let z = x1 - x0,
                    node = tree._root,
                    parent,
                    i;

                while (x0 > x || x >= x1 || y0 > y || y >= y1) {
                    i = (y < y0) << 1 | (x < x0);
                    parent = new Array(4), parent[i] = node, node = parent, z *= 2;
                    switch (i) {
                        case 0: x1 = x0 + z, y1 = y0 + z; break;
                        case 1: x0 = x1 - z, y1 = y0 + z; break;
                        case 2: x1 = x0 + z, y0 = y1 - z; break;
                        case 3: x0 = x1 - z, y0 = y1 - z; break;
                    }
                }

                if (tree._root && tree._root.length) tree._root = node;
            }
            tree._x0 = x0;
            tree._y0 = y0;
            tree._x1 = x1;
            tree._y1 = y1;
        }

        function visit(tree, callback) {
            let quads = [], q, node = tree._root, child, x0, y0, x1, y1;
            if (node) quads.push(new Quad(node, tree._x0, tree._y0, tree._x1, tree._y1));
            while (q = quads.pop()) {
                if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
                    let xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
                    if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
                    if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
                    if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
                    if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
                }
            }
            return tree;
        }


        const canvas = document.querySelector(".assessment canvas"),
            number = 150,
            linkDistance = 120,
            linkWidth = 1,
            moveSpeed = 6,
            size = 3,
            repulseDistance = 140,
            repulseDuration = 0.4,
            interaction = {
                status: "mouseleave",
                pos_x: 0,
                pos_y: 0,
            },
            particlesList = [];
        const context = canvas.getContext("2d");
        window.onresize = () => setCanvasSize();
        setCanvasSize();
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < number; i++) {
            particlesList.push(createParticle(i));
        }
        canvas.addEventListener("mousemove", e => {
            interaction.pos_x = e.offsetX;
            interaction.pos_y = e.offsetY;
            interaction.status = "mousemove";
        });
        canvas.addEventListener("mouseleave", () => {
            interaction.pos_x = null;
            interaction.pos_y = null;
            interaction.status = "mouseleave";
        });
        render();
        function setCanvasSize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        function createParticle(index) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            const vx = Math.random() - 0.5;
            const vy = Math.random() - 0.5;
            if (x > canvas.width - size * 2) x = x - size;
            else if (x < size * 2) x = x + size;
            if (y > canvas.height - size * 2) y = y - size;
            else if (y < size * 2) y = y + size;
            return { x: x, y: y, vx: vx, vy: vy, index: index };
        }
        function draw(p) {
            context.fillStyle = "rgba(255,255,255, 1)";
            context.beginPath();
            context.arc(p.x, p.y, size, 0, Math.PI * 2, false);
            context.closePath();
            context.fill();
        }
        function particlesDraw() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            update();
            for (let i = 0, l = particlesList.length; i < l; i++) {
                draw(particlesList[i]);
            }
        }
        function update() {
            let p = { vx: 0, vy: 0, x: 0, y: 0 };
            let p2 = { vx: 0, vy: 0, x: 0, y: 0 };
            let ms = 0;
            let tree = new QuadTree(particlesList)
            for (let i = 0, l = particlesList.length; i < l; i++) {
                p = particlesList[i];
                ms = moveSpeed / 2;
                p.x += p.vx * ms;
                p.y += p.vy * ms;
                if (p.x - size > canvas.width) {
                    p.x = -size;
                    p.y = Math.random() * canvas.height;
                } else if (p.x + size < 0) {
                    p.x = canvas.width + size;
                    p.y = Math.random() * canvas.height;
                }
                if (p.y - size > canvas.height) {
                    p.y = -size;
                    p.x = Math.random() * canvas.width;
                } else if (p.y + size < 0) {
                    p.y = canvas.height + size;
                    p.x = Math.random() * canvas.width;
                }
                if (interaction.status === "mousemove") {
                    repulse(p);
                }
                const closePoints = getClosePoints(tree, p);
                p.connected = {};
                for (let j = 0, n = closePoints.length; j < n; j++) {
                    p2 = closePoints[j];
                    if (!p2.connected) p2.connected = {};
                    if (p2.connected && p2.connected[p.index]) continue;
                    linkParticles(p, p2);
                    p2.connected[p.index] = true;
                    p.connected[p2.index] = true;

                }
            }
        }
        function repulse(p) {
            const dx_mouse = p.x - interaction.pos_x,
                dy_mouse = p.y - interaction.pos_y,
                dist_mouse = Math.sqrt(Math.pow(dx_mouse, 2) + Math.pow(dy_mouse, 2));
            const velocity = 100,
                repulseFactor = Math.min(
                    Math.max(
                        (1 / repulseDistance) *
                        (-1 * Math.pow(dist_mouse / repulseDistance, 2) + 1) *
                        repulseDistance *
                        velocity,
                        0
                    ),
                    50
                );
            p.x = p.x + (dx_mouse / dist_mouse) * repulseFactor;
            p.y = p.y + (dy_mouse / dist_mouse) * repulseFactor;
        }

        function getClosePoints(tree, p) {
            let closePoints = [];
            let x0, y0, x3, y3;
            x0 = Math.max(0, p.x - linkDistance);
            y0 = Math.max(0, p.y - linkDistance);
            x3 = Math.min(canvas.width, p.x + linkDistance);
            y3 = Math.min(canvas.height, p.y + linkDistance);

            visit(tree, (node, x1, y1, x2, y2) => {
                let tf = x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
                if (node.data && !tf && node.data.index != p.index) {
                    closePoints.push(node.data);
                }
                return tf;
            })
            return closePoints
        }


        function linkParticles(p1, p2) {
            const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
            if (dist <= linkDistance) {
                if (0.7 - dist / (1 / 0.7) / linkDistance > 0) {
                    context.strokeStyle = "rgba(255, 255,255, .2)";
                    context.lineWidth = linkWidth;
                    context.beginPath();
                    context.moveTo(p1.x, p1.y);
                    context.lineTo(p2.x, p2.y);
                    context.stroke();
                    context.closePath();
                }
            }
        }
        function render() {
            particlesDraw();
            window.requestAnimationFrame(() => render());
        }
    })()