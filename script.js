const c = (a => document.createElement(a));
const g = function(a) {return document.getElementById(a)};
const ct = (cnv => cnv.getContext("2d"));


const sprites = new Image();
let beesprite;

const canvas = g("canvas");
const ctx = ct(canvas);
canvas.width = canvas.height = 600;
ctx.imageSmoothingEnabled = false;
let pxsize = 5;

let controls = {n: false, w: false, e: false, s: false};
function handleKey(e) {
	let b = e.type == "keydown";
	switch (e.key) {
	case "a": controls.w = b; break;
	case "s": controls.s = b; break;
	case "d": controls.e = b; break;
	case "w":
	case "f": controls.n = b; break;
	}
}
addEventListener("keydown", handleKey, false);
addEventListener("keyup", handleKey, false);

class Vec {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	mag2() {
		return this.x * this.x + this.y * this.y;
	}
	mag() {
		return Math.sqrt(this.mag2());
	}
	normalize() {
		const mag = this.mag();
		this.x /= mag;
		this.y /= mag;
	}
	clone() {
		return new Vec(this.x, this.y);
	}
	rotateTowards(v2) {
		// should cause most change when perpendicular
		const v3 = v2.clone();
		v3.normalize();
		this.x += v2.x/2;
		this.y += v2.y/2;
		this.normalize();
	}
}

function relu(x) { return x < 0 ? 0 : x; }

let player = {
	pos: new Vec(8, 8),
	vel: new Vec(0, 0),
	rot: new Vec(0.707, 0.707)
};

let blocks = [
	{ x: 64, y: 68, w: 32, h: 32 },
	{ x: 64, y: 32, w: 32, h: 32 },
];
function step() {
	switch (1) { default:
		let pow = 1/8;
		let dx = controls.e - controls.w;
		let dy = controls.s - controls.n;
		if (dx == 0 && dy == 0) {
			break;
		}
		if (dx != 0 && dy != 0) {
			dx /= Math.sqrt(2);
			dy /= Math.sqrt(2);
		}
		const dot = dx * player.rot.x + dy * player.rot.y; // [-1, 1]
		const undot = (dot + 2) / 3; // [, 1]
		pow *= undot;
		player.vel.x += pow * dx;
		player.vel.y += pow * dy;
	}
	player.vel.x *= 0.9;
	player.vel.y *= 0.9;
	player.pos.x += player.vel.x;
	player.pos.y += player.vel.y;
	player.rot.rotateTowards(player.vel);
	ctx.setTransform(1,0,0,1,0,0);
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.scale(pxsize, pxsize);
	{
		for (const block of blocks) {
			ctx.beginPath();
			ctx.fillStyle = "#f0f";
			ctx.fillRect(block.x, block.y, block.w, block.h);
			ctx.closePath();
			const margin = 2;
			const dx = Math.abs(block.x+block.w/2 - player.pos.x) - block.w/2;
			const dy = Math.abs(block.y+block.h/2 - player.pos.y) - block.h/2;
			const maxd = Math.max(dx, dy);
			if (Math.max(dx, dy) > margin) continue; // just eliminate majority of cases
			let d, nx, ny; // our three friends
			if (maxd < 0) {
				d = maxd;
				if (dx > dy) {
					nx = 1;
					ny = 0;
				} else {
					nx = 0;
					ny = 1;
				}
			} else {
				d = Math.sqrt(relu(dx)**2 + relu(dy)**2);
				nx = relu(dx) / d;
				ny = relu(dy) / d;
			}
			d -= margin;
			if (player.pos.x < block.x + block.w/2) nx *= -1;
			if (player.pos.y < block.y + block.h/2) ny *= -1;
			if (d < 0) {
				player.pos.x -= d * nx;
				player.pos.y -= d * ny;
				// this is more accurate but punishes clipping corners
				// const dot = nx * player.vel.x + ny * player.vel.y;
				// player.vel.x -= dot * nx;
				// player.vel.y -= dot * ny;
			}
		}
	}
	ctx.restore();
	drawBeeSprite(player.pos.x, player.pos.y, 5);
}
setInterval(step, 1000/60);



function drawBeeSprite(x, y, rot) {
	ctx.save();
	//ctx.translate(x, y);
	//ctx.rotate(rot);
	ctx.scale(pxsize, pxsize);
	ctx.transform(
		player.rot.x, player.rot.y,
		-player.rot.y, player.rot.x,
		x, y);
	ctx.drawImage(beesprite, -13, -5);
	ctx.fillStyle = 'rgba(128,128,128,0.8)';
	const m = player.vel.mag();
	function drawWing() {
		ctx.translate(0, 2);
		ctx.rotate(-m);
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(-10, -1);
		ctx.lineTo(-12, 5);
		ctx.lineTo(0, 1);
		ctx.fill();
		ctx.closePath();
	}
	// wings
	{
		ctx.save();
		drawWing();
		ctx.restore();
	}
	{
		ctx.save();
		ctx.scale(1, -1);
		drawWing();
		ctx.restore();
	}
	ctx.restore();
}

sprites.onload = function() {
	beesprite = c("canvas");
	beesprite.width = 23;
	beesprite.height = 10;
	const ctxb = ct(beesprite);
	ctxb.drawImage(sprites, 3+23*0,18+11*0, 23,10,  0,0, 23,10);
	//drawBeeSprite(75, 50, 0.8);
};
sprites.src = "sprites.png";
