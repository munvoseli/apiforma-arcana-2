'use strict';
const canvas = g("canvas");
const ctx = canvas.getContext("2d");

function getColor(i) {
	const tileColors = [
		// forbidden, the green is colorless
		85,0,85,
		// pinks
		255,150,255,
		255,80,198,
		255,153,192,
		226,92,141,
		191,26,118,
		// red to orange
		242,62,24,
		246,99,63,
		246,129,68,
		251,189,148,
		247,162,74,
		132,89,0,
		// yellow
		255,241,148,
		247,223,74,
		// green
		113,219,98,
		84,206,67,
		49,184,30,
		// mint
		151,254,191,
		76,237,199,
		12,164,119,
		// sky
		102, 221, 255,
		56, 190, 241,
		// blue
		154,208,249,
		105,127,200,
		51,52,227,
		26,27,191,
		// purple
		220,169,242,
		204,109,244,
		194,85,241,
		142,26,191,
		// greyscale
		255,255,255,
		181,181,181,
		93,93,93,
		34,34,34,
		0xa2,0xa2,0x99,
		// ubq
		231,158,0,
		225,115,255,
	];
	i *= 3;
	return `rgb(${tileColors[i]},${tileColors[i+1]},${tileColors[i+2]})`;
}

class RoomTiles {
	constructor(w, h) {
		this.w = w;
		this.h = h;
		this.data = new Uint32Array(w * h);
	}
	get(x, y) {
		return this.data[y * this.w + x];
	}
	set(x, y, t) {
		this.data[y * this.w + x] = t;
	}
}

//              tiles/screen   px/tile
// celeste        40 : 22.5     8px
// mario maker    24 : 13.5     ---
// smw            16 : 14       16px
// mega man 2     16 : 15       16px
// going for 4:3 ratio so mobile can have controls?

// player / enemy : none / death / collide : state switches
// 1-way
// in romhacks, blocks pc collides with have center,
// and blocks/areas npe collide with have border

/*
in celeste, each material has a set of properties

there's one material which
	destroys jellies
	is collision for seekers
	does not interact with player character or theo

spikes don't hurt non-player entities, such as seekers,
but can make grabbable objects inaccessible

it might not be extensible
to go full combinatoric with visual representation of this

layers
	foreground decals
	interactive - collision, secret areas, entities
	interactive+
	background tiles
	styleground

umbrella
bubble
dream block
secret area
waterfall

shell

(accidentally)
(apioformically)
(alphabetically)
(acoustically)
(amazingly)
(ambiguously)
(ambitiously)
(aqueously / aquatically)
(arboreally)
(assuredly)
*/

// layers which can move
// how control movement of layers?
// parallax / smash/moveto / repeated movement

// how control of position of motile entities in kaizo?

// ORB vs exit

// 32x24, 24x18
let rt = new RoomTiles(24, 24); // or 24x18?

let cam = {
	x: 0,
	y: 0,
	scl: 1
};

function canvasSetsize() {
	if (canvas.width != document.body.clientWidth)
		canvas.width = document.body.clientWidth;
	if (canvas.height != document.body.clientHeight)
		canvas.height = document.body.clientHeight;
	ctx.imageSmoothingEnabled = false;
}
canvasSetsize();
window.addEventListener("resize", canvasSetsize, false);

function drawRoom(room) {
	const l = Math.floor(canvas.height/room.h);
	for (let y = 0; y < room.h; y++) {
	for (let x = 0; x < room.w; x++) {
		ctx.beginPath();
		ctx.fillStyle = getColor(room.get(x, y));
		ctx.fillRect(x*l, y*l, l, l);
		ctx.closePath();
	}}
}
drawRoom(rt);
