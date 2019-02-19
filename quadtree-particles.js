


class Circle {
    constructor(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.rSquared = this.r * this.r;
    }
    contains(point) {
        let d = Math.pow((point.x - this.x), 2) + Math.pow((point.y - this.y), 2);
        return d <= this.rSquared;
    }
    intersects(range) {
        var xDist = Math.abs(range.x - this.x);
        var yDist = Math.abs(range.y - this.y);
        var r = this.r;
        var w = range.w;
        var h = range.h;
        var edges = Math.pow((xDist - w), 2) + Math.pow((yDist - h), 2);
        if (xDist > (r + w) || yDist > (r + h))
            return false;
        if (xDist <= w || yDist <= h)
            return true;
        return edges <= this.rSquared;
    }
}

class point {
    constructor(x, y, userData) {
        this.x = x
        this.y = y
        this.userData = userData
    }
}

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    contains(point) {
        return (point.x >= this.x - this.w &&
            point.x < this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y < this.y + this.h);
    }
    intersects(range) {
        return !(range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h);
    }
}
class Quadtree {
    constructor(rectangle, n) {
        this.rectangle = rectangle
        this.capacity = n
        this.points = []
        this.divided = false
    }
    subdivide() {
        let x = this.rectangle.x
        let y = this.rectangle.y
        let w = this.rectangle.w
        let h = this.rectangle.h
        this.ne = new Quadtree(new Rectangle(x, y, w / 2, h / 2), this.capacity)
        this.no = new Quadtree(new Rectangle(x + w / 2, y, w / 2, h / 2), this.capacity)
        this.se = new Quadtree(new Rectangle(x, y + h / 2, w / 2, h / 2), this.capacity)
        this.so = new Quadtree(new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2), this.capacity)
        this.divided = true
    }
    insert(point) {
        if (!this.rectangle.contains(point)) {
            return
        }

        if (this.points.length < this.capacity) {
            this.points.push(point)
            return true
        } else {
            if (!this.divided)
                this.subdivide()
        }
        if (this.ne.insert(point)) {
            return true
        } else if (this.no.insert(point)) {
            return true
        } else if (this.se.insert(point)) {
            return true
        } else if (this.so.insert(point)) {
            return true
        }


    }
    draw() {
        let r = this.rectangle
        ctx.save()
        ctx.beginPath()
        ctx.strokeRect(r.x, r.y, r.w, r.h)
        ctx.stroke()
        ctx.closePath()
        ctx.restore()
        if (this.divided) {
            this.ne.draw()
            this.no.draw()
            this.se.draw()
            this.so.draw()
        }
    }
    query(range, found) {
        if (!found) {
            found = [];
        }
        if (!this.rectangle.intersects(range)) {
            return;
        } else {
            for (let p of this.points) {
                if (range.contains(p)) {
                    found.push(p);
                }
            }
            if (this.divided) {
                this.ne.query(range, found);
                this.no.query(range, found);
                this.se.query(range, found);
                this.so.query(range, found);
            }
        }
        return found;
    }
}

class particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = (Math.random() * 3) + 1
        this.dx = (Math.random() - 0.5) * 3
        this.dy = (Math.random() - 0.5) * 3
    }
    draw() {
        ctx.save()
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false)
        ctx.fillStyle = "rgba(255,255,255,1)"
        ctx.fill()
        ctx.restore()
    }
    update() {
        if (this.x + this.r > width + pointerMargin || this.x - this.r < -pointerMargin)
            this.dx = -this.dx;
        if (this.y + this.r > height + pointerMargin || this.y - this.r < -pointerMargin)
            this.dy = -this.dy;

        this.x += this.dx
        this.y += this.dy
        this.draw()
    }
    intersects(x1, y1) {
        var xd = x1 - this.x
        var yd = y1 - this.y
        return Math.sqrt(xd * xd + yd * yd)
    }
}

function animate() {
    requestAnimationFrame(animate);

    ctx.clearRect(0, 0, width, height)

    qTree = new Quadtree(new Rectangle(0, 0, width, height), 4)

    for (let p of particlesArray) {
        p.update()
        qTree.insert(new point(p.x, p.y, p))

        let points = qTree.query(new Circle(p.x, p.y, linkMargin));
        for (let point of points) {
            var d = p.intersects(point.x, point.y)
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(point.x, point.y)
            var opacity = 1 - (d / linkMargin)
            opacity = opacity / 2
            ctx.strokeStyle = `rgba(255,255,255,${opacity})`
            ctx.stroke()
            ctx.closePath()
            ctx.restore()
        }
    }

    founds = qTree.query(range);

    for (let f of founds) {
        p = f.userData

        dx = p.x - mouse.x;
        dy = p.y - mouse.y;
        da = Math.sqrt(dx * dx + dy * dy);
        ox = dx / da * pointerMargin - dx;
        oy = dy / da * pointerMargin - dy;

        if (mode == 1) {
            p.x += ox * 0.5;
            p.y += oy * 0.5;
        } else if (mode == 2) {
            particlesArray[0].x = mouse.x
            particlesArray[0].y = mouse.y
        } else {
            p.x += p.dx * 5;
            p.y += p.dy * 5;
        }
    }

    ctx.save();
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,0,0,0.5)'
    ctx.stroke()
    ctx.closePath()
    ctx.restore()
}



var canvas = document.querySelector('canvas');
var ctx = canvas.getContext("2d")
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var width = canvas.width;
var height = canvas.height;


var mouse = {
    x: -200,
    y: -200
}

window.addEventListener('mouseout',
    function(e) {
        mouse.x = -200
        mouse.y = -200
        range.x = mouse.x
        range.y = mouse.y

    })

window.addEventListener('mousemove',
    function(e) {
        mouse.x = event.x
        mouse.y = event.y
        range.x = mouse.x
        range.y = mouse.y

    })


window.addEventListener('resize', function(e) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    init()
})

let range
var qTree
var linkMargin
var particlesNumber
var pointerMargin
var mode
var particlesArray

function init() {
    linkMargin = 120
    particlesNumber = 150
    pointerMargin = 200
    mode = 1
    particlesArray = []

    for (var i = 0; i < particlesNumber; i++) {
        particlesArray[i] = new particle(Math.random() * width, Math.random() * height)
    }
    range = new Circle(0, 0, pointerMargin);

}

init()
animate()












