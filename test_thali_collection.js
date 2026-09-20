// Verification Test for Thali Collection & Stacking Mechanics
const fs = require('fs');

const elements = {};
function getOrCreateMockElement(id) {
  if (!elements[id]) {
    const el = {
      id,
      textContent: '',
      style: {},
      classes: new Set(),
      classList: {
        add: function(...cls) { cls.forEach(c => el.classes.add(c)); },
        remove: function(...cls) { cls.forEach(c => el.classes.delete(c)); },
        contains: function(c) { return el.classes.has(c); }
      },
      addEventListener: () => {}
    };
    if (id === 'gameCanvas') {
      el.getContext = () => ({
        scale: () => {},
        setTransform: () => {},
        clearRect: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        rect: () => {},
        clip: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        quadraticCurveTo: () => {},
        bezierCurveTo: () => {},
        ellipse: () => {},
        fillText: () => {}
      });
    }
    elements[id] = el;
  }
  return elements[id];
}

['gameCanvas', 'fpsDisplay', 'resDisplay', 'scoreDisplay', 'streakDisplay', 
 'thaliDisplay', 'meterPercent', 'streakMeterFill', 'ultimateBtn', 'gameOverModal', 
 'finalScoreDisplay', 'bestStreakDisplay', 'restartBtn', 
 'marigold-1', 'marigold-2', 'marigold-3'].forEach(id => getOrCreateMockElement(id));

global.window = {
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: () => {}
};
global.document = {
  getElementById: (id) => getOrCreateMockElement(id)
};
let mockTime = 1000;
global.performance = { now: () => mockTime };
let animationLoopCallback = null;
global.requestAnimationFrame = (cb) => { animationLoopCallback = cb; };

// Load and evaluate game.js
const code = fs.readFileSync('game.js', 'utf8');
eval(code);

console.log('Testing Thali Collection & Stacking Mechanics...');
const engine = global.window.gameEngine;

// 1. Initial state
console.log('1. Checking initial thali state:');
console.assert(engine.getThaliFullness() === 0, `Initial fullness should be 0, got ${engine.getThaliFullness()}`);
console.assert(engine.getThaliOfferings().length === 0, 'Initial thali offerings should be empty');
console.assert(elements['thaliDisplay'].textContent === '0%', `HUD display should show 0%, got ${elements['thaliDisplay'].textContent}`);
console.log('  PASS: Thali starts completely empty at 0%.');

// 2. Slicing good object generates halves targeted at the thali
console.log('2. Slicing a Modak and testing half trajectory towards thali:');
const modak = engine.spawnObject('modak');
engine.sliceObject(modak, 0);

const halves = engine.getSlicedHalves();
console.assert(halves.length === 2, `Should have 2 sliced halves in flight, got ${halves.length}`);
console.assert(halves[0].targetX !== undefined && halves[0].targetY !== undefined, 'Half must have target coordinates in the thali');
console.assert(halves[1].targetX !== undefined && halves[1].targetY !== undefined, 'Half must have target coordinates in the thali');
console.log('  PASS: Sliced halves successfully spawned with thali plate landing trajectory.');

// 3. Simulating physics frames until halves land in thali
console.log('3. Simulating physics steps until halves land in thali:');
for (let step = 0; step < 40; step++) {
  mockTime += 30; // advance 30ms
  if (animationLoopCallback) animationLoopCallback(mockTime);
}

console.assert(engine.getThaliFullness() === 10, `Thali fullness should be 10% after 1 sliced item (2 halves * 5%), got ${engine.getThaliFullness()}%`);
console.assert(engine.getThaliOfferings().length === 2, `Thali offerings count should be 2, got ${engine.getThaliOfferings().length}`);
console.assert(elements['thaliDisplay'].textContent === '10%', `HUD thaliDisplay should show 10%, got ${elements['thaliDisplay'].textContent}`);
console.log('  PASS: Sliced modak halves visibly traveled to and accumulated in the thali (+10% fullness).');

// 4. Slice second and third item to test consistent accumulation
console.log('4. Slicing Laddoo and Flower for consistent accumulation:');
const laddoo = engine.spawnObject('laddoo');
engine.sliceObject(laddoo, 0);
const flower = engine.spawnObject('flower');
engine.sliceObject(flower, 0);

for (let step = 0; step < 40; step++) {
  mockTime += 30;
  if (animationLoopCallback) animationLoopCallback(mockTime);
}

// 3 total items sliced = 6 halves * 5% = 30% fullness
console.assert(engine.getThaliFullness() === 30, `Thali fullness should be 30% after 3 items, got ${engine.getThaliFullness()}%`);
console.assert(engine.getThaliOfferings().length === 6, `Thali offerings count should be 6, got ${engine.getThaliOfferings().length}`);
console.assert(elements['thaliDisplay'].textContent === '30%', `HUD thaliDisplay should show 30%, got ${elements['thaliDisplay'].textContent}`);
console.log('  PASS: Offerings accumulated in the thali and fullness increased consistently per item (+10% each).');

// 5. Restarting resets thali
console.log('5. Testing game restart cleans thali:');
engine.restartGame();
console.assert(engine.getThaliFullness() === 0, `Fullness should reset to 0, got ${engine.getThaliFullness()}`);
console.assert(engine.getThaliOfferings().length === 0, 'Offerings should be cleared on restart');
console.assert(elements['thaliDisplay'].textContent === '0%', 'HUD should show 0% after restart');
console.log('  PASS: Restart cleanly reset thali offerings and fullness.');

console.log('\nALL THALI COLLECTION TESTS PASSED SUCCESSFULLY!');
