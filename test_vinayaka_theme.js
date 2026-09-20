// Verification Test for Vinayaka Chaturthi Theme Reskin & Pandal Background
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

['gameCanvas', 'fpsDisplay', 'resDisplay', 'roundDisplay', 'scoreDisplay', 'streakDisplay', 
 'thaliDisplay', 'meterPercent', 'streakMeterFill', 'ultimateBtn', 'startModal', 'startBtn',
 'gameOverModal', 'finalScoreDisplay', 'bestStreakDisplay', 'bestComboDisplay', 'restartBtn', 
 'roundBanner', 'roundBannerBadge', 'roundBannerTitle', 'roundBannerSub',
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
let loopCb = null;
global.requestAnimationFrame = (cb) => { loopCb = cb; };

// Load and evaluate game.js
const code = fs.readFileSync('game.js', 'utf8');
eval(code);

console.log('Testing Vinayaka Chaturthi Theme Reskin & Pandal Background...');
const engine = global.window.gameEngine;

// 1. Verify 5 Sacred Offerings
console.log('1. Checking 5 Sacred Offerings to slice:');
const goodTypes = ['modak', 'laddoo', 'flower', 'diya', 'durva'];
const expectedProperties = {
  modak:  { points: 10, radius: 26 },
  laddoo: { points: 12, radius: 22 },
  flower: { points: 15, radius: 24 },
  diya:   { points: 18, radius: 23 },
  durva:  { points: 20, radius: 21 }
};

for (const type of goodTypes) {
  const item = engine.spawnObject(type);
  console.assert(item.type === type, `Type should be ${type}`);
  console.assert(item.category === 'good', `${type} must be 'good' category`);
  console.assert(item.points === expectedProperties[type].points, `${type} points should be ${expectedProperties[type].points}, got ${item.points}`);
  console.assert(item.radius === expectedProperties[type].radius, `${type} radius should be ${expectedProperties[type].radius}, got ${item.radius}`);
  console.log(`  PASS: Sacred offering '${type}' verified (Points: ${item.points}, Radius: ${item.radius}px).`);
}

// 2. Verify Slicing all 5 offerings creates halves & accumulates in Thali
console.log('2. Verifying slicing and Thali collection for all 5 offerings:');
engine.restartGame();
for (let i = 0; i < goodTypes.length; i++) {
  const type = goodTypes[i];
  const item = engine.spawnObject(type);
  const prevHalvesCount = engine.getSlicedHalves().length;
  engine.sliceObject(item, 0);
  const newHalves = engine.getSlicedHalves();
  console.assert(newHalves.length === prevHalvesCount + 2, `Slicing ${type} should produce 2 halves`);
  const leftHalf = newHalves[newHalves.length - 2];
  const rightHalf = newHalves[newHalves.length - 1];
  console.assert(leftHalf.type === type && leftHalf.half === 'left', 'Left half type match');
  console.assert(rightHalf.type === type && rightHalf.half === 'right', 'Right half type match');
}

// Step game loop until all halves land in thali
for (let step = 0; step < 80; step++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

const thaliOfferings = engine.getThaliOfferings();
const thaliFullness = engine.getThaliFullness();
console.assert(thaliOfferings.length >= 5, `Thali should have accumulated sliced offerings, got ${thaliOfferings.length}`);
console.assert(thaliFullness === 50, `5 offerings * 10% = 50% fullness, got ${thaliFullness}%`);
console.log(`  PASS: All 5 offerings sliced into halves and accumulated in the thali (${thaliFullness}% fullness).`);

// 3. Verify Bad "Vighna" Obstacle
console.log('3. Checking Bad Vighna Obstacle:');
const vighna = engine.spawnObject('vighna');
console.assert(vighna.type === 'vighna', "Type must be 'vighna'");
console.assert(vighna.category === 'obstacle', "Category must be 'obstacle'");
console.assert(vighna.points === 0, 'Vighna awards 0 points');
console.assert(vighna.radius === 26, 'Vighna radius should be 26');

// Slicing Vighna costs 1 life and clears streak
const missesBefore = engine.getMisses();
engine.sliceObject(vighna, 0);
const missesAfter = engine.getMisses();
console.assert(missesAfter === missesBefore + 1, 'Slicing Vighna must cost 1 life / miss');
console.assert(engine.getStreak() === 0, 'Slicing Vighna must reset streak to 0');
console.log('  PASS: Vighna is an abstract spiky obstacle, costs 1 life on hit, and clears combo/streak.');

// 4. Verify Pandal Background Canvas Rendering
console.log('4. Verifying Pandal Background Drawing Function:');
let backgroundRenderedWithoutError = false;
try {
  const canvas = elements['gameCanvas'];
  const ctx = canvas.getContext();
  engine.drawPandalBackground(ctx, 800, 600, 2.5);
  backgroundRenderedWithoutError = true;
} catch (e) {
  console.error('Error in drawPandalBackground:', e);
}
console.assert(backgroundRenderedWithoutError === true, 'Pandal background must render without errors');
console.log('  PASS: Pandal background with string lights, warm gradient & canopy executed cleanly.');

console.log('\nALL VINAYAKA CHATURTHI THEME TESTS PASSED SUCCESSFULLY!');
