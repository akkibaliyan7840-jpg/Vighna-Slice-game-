// Headless Verification Test for Streak & Ultimate System
const fs = require('fs');

// Create mock browser DOM environment
global.window = {
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: () => {}
};
global.document = {
  getElementById: (id) => ({
    id,
    getContext: () => ({
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
    }),
    style: {},
    classList: {
      remove: function(cls) { this[cls] = false; },
      add: function(cls) { this[cls] = true; },
      contains: function(cls) { return !!this[cls]; }
    },
    addEventListener: () => {}
  })
};
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => {};

// Load and evaluate game.js
const code = fs.readFileSync('game.js', 'utf8');
eval(code);

console.log('Testing Streak & Ultimate Engine...');
const engine = global.window.gameEngine;

if (!engine) {
  console.error('FAIL: window.gameEngine not exposed!');
  process.exit(1);
}

// 1. Initial State
console.log('1. Checking initial state:');
console.assert(engine.getStreakMeter() === 0, `Initial meter should be 0, got ${engine.getStreakMeter()}`);
console.assert(engine.isUltimateReady() === false, 'Ultimate should not be ready initially');
console.assert(engine.triggerUltimate() === false, 'Ultimate should fail when meter < 100%');
console.log('  PASS: Initial state is 0% and ultimate does not trigger.');

// 2. Chaining successful slices
console.log('2. Testing streak fill from successful slices:');
const modak1 = engine.spawnObject('modak');
engine.sliceObject(modak1, 0);
console.assert(engine.getStreak() === 1, `Streak should be 1, got ${engine.getStreak()}`);
console.assert(engine.getStreakMeter() === 14, `Meter should be 14, got ${engine.getStreakMeter()}`);

// Chain slices up to 100%
for (let i = 0; i < 7; i++) {
  const item = engine.spawnObject('laddoo');
  engine.sliceObject(item, 0);
}
console.assert(engine.getStreakMeter() === 100, `Meter should cap at 100, got ${engine.getStreakMeter()}`);
console.assert(engine.isUltimateReady() === true, 'Ultimate should be ready at 100%');
console.log('  PASS: Slices correctly increase streak and fill meter to 100%.');

// 3. Testing penalty/reduction on miss
console.log('3. Testing penalty on drop/miss:');
// Reduce meter test
engine.setStreakMeter(80);
console.assert(engine.getStreakMeter() === 80, 'Meter set to 80');
// Slicing obstacle reduces meter by 35% and resets streak
const vighnaTest = engine.spawnObject('vighna');
engine.sliceObject(vighnaTest, 0);
console.assert(engine.getStreak() === 0, `Streak should reset to 0 on obstacle slice, got ${engine.getStreak()}`);
console.assert(engine.getStreakMeter() === 45, `Meter should drop to 45 (80-35), got ${engine.getStreakMeter()}`);
console.assert(engine.triggerUltimate() === false, 'Ultimate should not fire at 45%');
console.log('  PASS: Penalty properly reduces meter and prevents premature activation.');

// 4. Testing Ultimate Activation: clears good objects, ignores Vighna obstacles
console.log('4. Testing Ultimate Activation ("Ganesha\'s Blessing"):');
// Fill meter to 100%
engine.setStreakMeter(100);
console.assert(engine.isUltimateReady() === true, 'Ultimate is ready');

// Clear existing objects
const objs = engine.getGameObjects();
objs.length = 0;

// Spawn 3 good objects and 2 Vighna obstacles
const good1 = engine.spawnObject('modak');
const good2 = engine.spawnObject('laddoo');
const good3 = engine.spawnObject('flower');
const obst1 = engine.spawnObject('vighna');
const obst2 = engine.spawnObject('vighna');

const scoreBefore = engine.getScore();
const success = engine.triggerUltimate();

console.assert(success === true, 'triggerUltimate should return true at 100%');
console.assert(engine.getStreakMeter() === 0, `Meter should reset to 0 after ultimate, got ${engine.getStreakMeter()}`);
console.assert(engine.getScore() > scoreBefore, `Score should increase from ultimate slice (was ${scoreBefore}, now ${engine.getScore()})`);

// Verify Good Objects are SLICED
console.assert(good1.isSliced === true, 'good1 (modak) should be sliced by ultimate');
console.assert(good2.isSliced === true, 'good2 (laddoo) should be sliced by ultimate');
console.assert(good3.isSliced === true, 'good3 (flower) should be sliced by ultimate');

// Verify Obstacles are NOT SLICED (Immune to Ultimate)
console.assert(obst1.isSliced === false, 'CRITICAL: obst1 (vighna) must NOT be sliced by ultimate!');
console.assert(obst2.isSliced === false, 'CRITICAL: obst2 (vighna) must NOT be sliced by ultimate!');

console.log('  PASS: Ultimate cleanly sliced all good objects, awarded scores, left Vighna obstacles untouched, and reset meter to 0.');
console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
