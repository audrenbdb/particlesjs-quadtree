"use strict";
let number = 200;
const speed = 8;
const linkWidth = 0.5;
const linkDistance = 120;
const size = 2;
var repulseDistance = 100;
const linkDistance2 = (0.7 * linkDistance) ** 2;
const repulseDistance2 = repulseDistance ** 2;
Math.TAU = Math.PI * 2;
const particleStyle = "#FFF";
const linkRGB = "#FFF";
const quadStyle = "#F00";
const candidates = [];
var W,H;

const bounce = true;

const mouse = { x: 0, y: 0}
let particlesList = [];
const links = [[],[],[],[]];
const linkBatchAlphas = [0.1, 0.3, 0.7, 0.9];
const linkBatches = links.length;
const linkPool = [];
let quadTree;
let boundary;
const ctx = canvas.getContext("2d");
canvas.style.height = "100%";
canvas.style.width = "100%";
W = canvas.width = canvas.offsetX;
H = canvas.height = canvas.offsetY;

/*controls*/
const addControl = document.getElementById("add-particle")
const removeControl = document.getElementById("remove-particle")
addControl.addEventListener("click", () => editNumber(20));
removeControl.addEventListener("click", () => editNumber(number > 20 ? -20 : -number));

canvas.addEventListener('mousemove', e => {
    mouse.x = e.offsetX;
    mouse.y = e.offsetY;
})
canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
})

window.addEventListener('resize', setCanvasSize);

setTimeout(start, 42);

function start(){ 
    initParticle();
    setCanvasSize();
    animate();
}

function editNumber(n) {
  number = number + n;
  particlesList = [];
  initParticle();
}

function initParticle() {
  quadTree = new QuadTree();
  for (let i = 0; i < number; i++) {
      particlesList.push(new Particle(canvas, size));
  }
}

var times = [];
var fps;
function animate () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const now = performance.now();
    updateParticles();
    updateLinks();

    while (times.length > 0 && times [0] <= now - 1000) {
        times.shift();
    }
    times.push(now);
    info.textContent = number + " particles. FPS : " + times.length;

    requestAnimationFrame(animate);
}

function updateParticles() {	
    quadTree.close();
    ctx.fillStyle = particleStyle;
    ctx.beginPath();
    for (const particle of particlesList) { particle.update(ctx, true) }
    ctx.fill();
}
function updateLinks() {

    var i, link;
    for(const p1 of particlesList) {
        p1.explored = true;
        const count = quadTree.query(p1, 0, candidates);
        for (i = 0; i < count; i++) {
            const p2 = candidates[i];
            if (!p2.explored) {
                link = linkPool.length ? linkPool.pop() : new Link();
                link.init(p1, candidates[i]);
                links[link.batchId].push(link);
            }
        }
    }
    var alphaIdx = 0;
    ctx.lineWidth = linkWidth;
    ctx.strokeStyle = linkRGB;
    for(const l of links) {
        ctx.globalAlpha = linkBatchAlphas[alphaIdx++]; 
        
        ctx.beginPath();
        while(l.length) { linkPool.push(l.pop().addPath(ctx)) }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}
function resetParticles() {
    quadTree = new QuadTree();
    for (const particle of particlesList) { particle.reset(canvas) };

   
}

function setCanvasSize () {
    H = canvas.height = canvas.offsetHeight;
    W = canvas.width = canvas.offsetWidth;
    resetParticles();
}



class Link {
    constructor() {  }
    init(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        this.alpha = 1 - (dx * dx + dy * dy) / linkDistance2;
        this.batchId = this.alpha * linkBatches | 0;
        this.batchId = this.batchId >= linkBatches ? linkBatches : this.batchId;
    }		
    addPath(ctx) {
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        return this;
    }
	
}


class Particle {
    constructor (canvas, r) {
        this.r = r;
        this.speedScale = speed / 2;
        this.reset(canvas, r);
    }
    reset(canvas, r = this.r) {
        const W = canvas.width - r * 2;
        const H = canvas.height - r * 2;
        this.x = Math.random() * W + r;
        this.y = Math.random() * H + r;
        this.vx = Math.random() - 0.5;
        this.vy = Math.random() - 0.5;
        this.quad = undefined;
        this.explored = false;

    }
	  addPath(ctx) {
	      ctx.moveTo(this.x + this.r,  this.y);
          ctx.arc(this.x,  this.y, this.r, 0, Math.TAU);
	  }
	  near(p) {
		    return ((p.x - this.x) ** 2 + (p.y - this.y) ** 2) <= linkDistance2;
	  }
    intersects(range) {
        const xd = Math.abs(range.x - this.x);
        const yd = Math.abs(range.y - this.y);
        const r = linkDistance;
        const w = range.w;
        const h = range.h;
        if (xd > r + w || yd > r + h) { return false }
        if (xd <= w || yd <= h) { return true }
        return  ((xd - w) ** 2 + (yd - h) ** 2) <= linkDistance2;

    }
    update(ctx, repulse = true) { 
        this.explored = false;
        const r = this.r;
        let W, H;
        this.x += this.vx * this.speedScale;
        this.y += this.vy * this.speedScale;

        if (bounce) {
            W = ctx.canvas.width - r;
            H = ctx.canvas.height - r;
            if (this.x > W || this.x < 0) {
                this.vx = -this.vx;
            } else if (this.y > H || this.y < 0) {
                this.vy = -this.vy;
            }
        } else {
            W = ctx.canvas.width + r;
            H = ctx.canvas.height + r;
            if (this.x > W) {
                this.x = 0;
                this.y = Math.random() * (H - r);
            } else if (this.x < -r) {
                this.x = W - r;
                this.y = Math.random() * (H - r);
            }
            if (this.y > H) {
                this.y = 0
                this.x = Math.random() * (W - r);
            } else if (this.y < -r) {
                this.y = H - r;
                this.x = Math.random() * (W - r);
            }
        }
        repulse && mouse.x && this.repulse();
        this.addPath(ctx);
        quadTree.insert(this);
        this.quad && (this.quad.drawn = false)
    }
    repulse() {
        var dx = this.x - mouse.x;
        var dy = this.y - mouse.y;

        const dist = (dx * dx + dy * dy) ** 0.5;
        var rf = ((1 - (dist / repulseDistance) ** 2)  * 100);
            rf = (rf < 0 ? 0 : rf > 50  ? 50 : rf) / dist;
        
        var posX = this.x + dx * rf;
        var posY = this.y + dy * rf;

        if (bounce) {
            if (posX - size > 0 && posX + size < canvas.width) this.x = posX;
            if (posY - size > 0 && posY + size < canvas.height) this.y = posY;
        } else {
            this.x = posX;
            this.y = posY;
        }
    }
}

class Bounds {
    constructor(x, y, w, h) { this.init(x, y, w, h) }
    init(x,y,w,h) { 
        this.x = x; 
        this.y = y; 
        this.w = w; 
        this.h = h; 
        this.left = x - w;
        this.right = x + w;
        this.top = y - h;
        this.bottom = y + h;
        this.diagonal = (w * w + h * h);
    }

    contains(p) {
        return (p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom);
    }

    near(p) {
        if (!this.contains(p)) {
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const dist = (dx * dx + dy * dy) - this.diagonal - linkDistance2;
            return dist < 0;
        }
        return true;
    }
}

class QuadTree {
    constructor(boundary, depth = 0) {
		this.boundary = boundary || new Bounds(canvas.width / 2,canvas.height / 2,canvas.width / 2 ,canvas.height / 2);
        this.divided = false;		
        this.points = depth > 1 ? [] : null;
        this.pointCount = 0
        this.drawn = false;
        this.depth = depth;
        if(depth === 0) {   // BM67 Fix on resize
            this.subdivide();
            this.NE.subdivide();
            this.NW.subdivide();
            this.SE.subdivide();
            this.SW.subdivide();
        }


    }

    addPath() {
        const b = this.boundary;
        ctx.rect(b.left, b.top, b.w * 2, b.h * 2);
        this.drawn = true;
    }
    addToSubQuad(particle) {
        if (this.NE.insert(particle)) { return true }
        if (this.NW.insert(particle)) { return true }
        if (this.SE.insert(particle)) { return true }
        if (this.SW.insert(particle)) { return true }	
        particle.quad = undefined;		
    }
    insert(particle) {
        if (this.depth > 0 && !this.boundary.contains(particle)) { return false }
        
        if (this.depth > 1 && this.pointCount < 4) { 
            this.points[this.pointCount++] = particle;
            particle.quad = this;
            return true;
        } 
        if (!this.divided) { this.subdivide() }
        return this.addToSubQuad(particle);
    }

    subdivide() {
        if (!this.NW) {
            const x = this.boundary.x;
            const y = this.boundary.y;
            const w = this.boundary.w / 2;
            const h = this.boundary.h / 2;
            const depth = this.depth + 1;

            this.NE = new QuadTree(new Bounds(x + w, y - h, w, h), depth);
            this.NW = new QuadTree(new Bounds(x - w, y - h, w, h), depth); 
            this.SE = new QuadTree(new Bounds(x + w, y + h, w, h), depth);
            this.SW = new QuadTree(new Bounds(x - w, y + h, w, h), depth);
        } else {
            this.NE.pointCount = 0;
            this.NW.pointCount = 0;            
            this.SE.pointCount = 0;
            this.SW.pointCount = 0;            
        }

        this.divided = true;
    }
    query(part, fc, found) {
        var i = this.pointCount;
        if (this.depth === 0 || this.boundary.near(part)) {
            if (this.depth > 1) {
                while (i--) {
                    const p = this.points[i];
                    if (!p.explored && part.near(p)) { found[fc++] = p }
                }
                if (this.divided) {
                    fc = this.NE.pointCount ? this.NE.query(part, fc, found) : fc;
                    fc = this.NW.pointCount ? this.NW.query(part, fc, found) : fc;
                    fc = this.SE.pointCount ? this.SE.query(part, fc, found) : fc;
                    fc = this.SW.pointCount ? this.SW.query(part, fc, found) : fc;
                }
            } else if(this.divided) {
                fc = this.NE.query(part, fc, found);
                fc = this.NW.query(part, fc, found);
                fc = this.SE.query(part, fc, found);
                fc = this.SW.query(part, fc, found);
            }
        }
        return fc;
    }

    close() {
        if (this.divided) {
           this.NE.close();
           this.NW.close();
           this.SE.close();
           this.SW.close();
        }
      
        if (this.depth === 2 && this.divided) {
            this.NE.pointCount = 0;
            this.NW.pointCount = 0;
            this.SE.pointCount = 0;
            this.SW.pointCount = 0;
        } else if (this.depth > 2) {
            this.divided = false;
        }
    }
}