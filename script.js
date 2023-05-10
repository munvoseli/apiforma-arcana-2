'use strict';

const c = (a => document.createElement(a));
const g = function(a) {return document.getElementById(a)};
const ct = (cnv => cnv.getContext("2d"));


const sprites = new Image();
let beesprite;

const canvas = g("canvas");
const ctx = ct(canvas);
canvas.width = canvas.height = 800;
ctx.imageSmoothingEnabled = false;
let pxsize = 5;

let controls = {
	n: false, w: false, e: false, s: false,
	A: false, B: false
};
function handleKey(e) {
	let b = e.type == "keydown";
	switch (e.code) {
	case "KeyA": controls.w = b; break;
	case "KeyS": controls.s = b; break;
	case "KeyD": controls.e = b; break;
	case "KeyW":
	case "KeyF": controls.n = b; break;
	case "KeyJ": controls.A = b; break;
	case "KeyK": controls.B = b; break;
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
	dot(v2) {
		return this.x * v2.x + this.y * v2.y;
	}
	rotateTowards(v2, elapsedTime) {
		// this is a vector of length 1
		// v2 might not be
		// should cause most change when perpendicular
		// warning: this is not mathematically verified with respect to elapsedTime
		const v3 = v2.clone();
		v3.normalize();
		const dot = this.dot(v3);
		this.x += v2.x*8;
		this.y += v2.y*8;
		this.normalize();
	}
}


const TileEnum = {
	Ungenerated: 0,
};
const tileSize = 12;
const baseVelocity = 1/8/16;

function drawCornerOverlay(h, v, d, ctx) {
	const l = tileSize/2;
	if (h && v && !d) {
		ctx.fillRect(0, 0, 1, 1);
		return;
	}
	switch (h * 2 + v) {
	case 0b00:
		ctx.fillRect(0, 0, l, 1);
		ctx.fillRect(0, 0, 1, l);
		break;
	case 0b10:
		ctx.fillRect(0, 0, l, 1);
		break;
	case 0b01:
		ctx.fillRect(0, 0, 1, l);
		break;
	case 0b11:
		break;
	}
}


class World {
	constructor() {
		this.tiles = new Uint8Array(256);
		for (let i = 2; i < this.tiles.length; i++) {
			this.tiles[i] = Math.random() < 0.3 ? 1 : 0;
		}
		this.canvas = c("canvas");
		this.canvas.width = tileSize * 16;
		this.canvas.height = tileSize * 16;
		this.ctx = ct(this.canvas);
		this.refreshCanvas();
	}
	getTile(x, y) {
		if (x >= 0 && y >= 0 && x < 16 && y < 16) {
			return this.tiles[x + 16 * y];
		} else {
			return 0;
		}
	}
	drawTile(x, y) {
		this.drawTileSpecified(x, y, this.getTile(x, y));
	}
	setTile(x, y, t) {
		if (x >= 0 && y >= 0 && x < 16 && y < 16) {
			if (this.tiles[x + 16 * y] != t) {
				this.tiles[x + 16 * y] = t;
				for (let yy = y-1; yy <= y+1; yy++)
				for (let xx = x-1; xx <= x+1; xx++) {
					this.drawTile(xx, yy);
				}
			}
		} else {
			return 0;
		}
	}
	drawTileSpecified(x, y, t) {
		const ctx = this.ctx;
		switch (t) {
		case 0: ctx.fillStyle = "#ccc"; break;
		case 1: ctx.fillStyle = "#a2a299"; break;
		default: ctx.fillStyle = "#500";
		}
		const s = tileSize;
		ctx.fillRect(x*s, y*s, s, s);
		if (t == 1) {
			ctx.fillStyle = "#000";
			ctx.save();
			// northwest
			ctx.translate(x*s, y*s);
			drawCornerOverlay(
				this.getTile(x-1, y),
				this.getTile(x, y-1),
				this.getTile(x-1,y-1),
				this.ctx);
			// northeast
			ctx.translate(s, 0);
			ctx.scale(-1, 1);
			drawCornerOverlay(
				this.getTile(x+1, y),
				this.getTile(x, y-1),
				this.getTile(x+1,y-1),
				this.ctx);
			// southeast
			ctx.translate(0, s);
			ctx.scale(1, -1);
			drawCornerOverlay(
				this.getTile(x+1, y),
				this.getTile(x, y+1),
				this.getTile(x+1,y+1),
				this.ctx);
			// southwest
			ctx.translate(s, 0);
			ctx.scale(-1, 1);
			drawCornerOverlay(
				this.getTile(x-1, y),
				this.getTile(x, y+1),
				this.getTile(x-1,y+1),
				this.ctx);
			ctx.restore();
		}
	}
	refreshCanvas() {
		let i = 0;
		const ctx = this.ctx;
		ctx.setTransform(1,0,0,1,0,0);
		for (let y = 0; y < 16; y++)
		for (let x = 0; x < 16; x++) {
			const t = this.tiles[i++];
			this.drawTileSpecified(x, y, t);
		}
	}
	draw() {
		ctx.drawImage(this.canvas, 0, 0);
	}
}
const world = new World();


function relu(x) { return x < 0 ? 0 : x; }

let player = {
	pos: new Vec(18, 18),
	vel: new Vec(0, 0),
	rot: new Vec(0.707, 0.707)
};


function applyBlockDenm(x, y, w, h) {
	const margin = 2;
	const dx = Math.abs(x+w/2 - player.pos.x) - w/2;
	const dy = Math.abs(y+h/2 - player.pos.y) - h/2;
	const maxd = Math.max(dx, dy);
	if (Math.max(dx, dy) > margin) return; // just eliminate majority of cases
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
	if (player.pos.x < x + w/2) nx *= -1;
	if (player.pos.y < y + h/2) ny *= -1;
	if (d < 0) {
		player.pos.x -= d * nx;
		player.pos.y -= d * ny;
		// this is more accurate but punishes clipping corners
		// const dot = nx * player.vel.x + ny * player.vel.y;
		// player.vel.x -= dot * nx;
		// player.vel.y -= dot * ny;
	}
}

class Step {
	static lastStepTime = Date.now();
	static frameRequested = false;
	static step() {
		let nowTime = Date.now();
		const elapsedTime = nowTime - Step.lastStepTime;
		Step.lastStepTime = nowTime;
		Step.movementStep(elapsedTime);
		Step.physicsStep();
		Step.miscControlsStep();
		if (!Step.frameRequested)
			requestAnimationFrame(Step.draw);
	}
	static movementStep(elapsedTime) {
		switch (1) { default:
			let pow = baseVelocity; // or, acceleration, really
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
		{
			const resistance = 0.9 ** (elapsedTime / 16);
			player.vel.x *= resistance;
			player.vel.y *= resistance;
			player.rot.rotateTowards(player.vel, elapsedTime);
			player.pos.x += player.vel.x * elapsedTime;
			player.pos.y += player.vel.y * elapsedTime;
		}
	}
	static physicsStep() {
		const cx = Math.floor(player.pos.x/tileSize);
		const cy = Math.floor(player.pos.y/tileSize);
		for (let y = cy-1; y <= cy+1; ++y)
		for (let x = cx-1; x <= cx+1; ++x) {
			if (world.getTile(x, y) != 1) continue;
			const bx = x * tileSize;
			const by = y * tileSize;
			applyBlockDenm(bx, by, tileSize, tileSize);
		}
	}
	static miscControlsStep() {
		if (controls.A) {
			const cx = Math.floor(player.pos.x/tileSize);
			const cy = Math.floor(player.pos.y/tileSize);
			const ax = Math.floor((player.pos.x - player.rot.x * 13)/tileSize);
			const ay = Math.floor((player.pos.y - player.rot.y * 13)/tileSize);
			if ((ax != cx || ay != cy)) {
				world.setTile(ax, ay, 1);
			}
		}
		if (controls.B) {
			const ax = Math.floor((player.pos.x + player.rot.x * 8)/tileSize);
			const ay = Math.floor((player.pos.y + player.rot.y * 8)/tileSize);
			if (world.getTile(ax, ay) == 1) {
				world.setTile(ax, ay, 0);
			}
		}
	}
	static draw() {
		ctx.setTransform(1,0,0,1,0,0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.translate(canvas.width/2, canvas.height/2);
		ctx.scale(pxsize, pxsize);
		ctx.translate(-player.pos.x, -player.pos.y);
		world.draw();
		drawBeeSprite(player.pos.x, player.pos.y, 5);
		ctx.restore();
		Step.frameRequested = false;
	}
}




function drawBeeSprite(x, y, rot) {
	ctx.save();
	//ctx.translate(x, y);
	//ctx.rotate(rot);
	ctx.transform(
		player.rot.x, player.rot.y,
		-player.rot.y, player.rot.x,
		x, y);
	ctx.drawImage(beesprite, -13, -5);
	ctx.fillStyle = 'rgba(128,128,128,0.8)';
	const m = player.vel.mag() / baseVelocity / 8;
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
	setInterval(Step.step, 1000/60);
};
sprites.src = "sprites.png";
