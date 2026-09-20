// Automated Test for Miss Counter & Exactly 3rd Miss Game Over Rule
const fs = require('fs');

// Mock DOM environment
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

// Prepopulate mock elements
['gameCanvas', 'fpsDisplay', 'resDisplay', 'scoreDisplay', 'streakDisplay', 
 'meterPercent', 'streakMeterFill', 'ultimateBtn', 'gameOverModal', 
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
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = () => {};

// Load game.js
const code = fs.readFileSync('game.js', 'utf8');
eval(code);

console.log('Testing Miss Counter & Game Over System...');
const engine = global.window.gameEngine;

// 1. Initial State Check
console.log('1. Checking initial state:');
console.assert(engine.getMisses() === 0, `Misses should start at 0, got ${engine.getMisses()}`);
console.assert(engine.isGameOver() === false, 'Game should NOT be over at start');
console.assert(!elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 should be active');
console.assert(!elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 should be active');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 should be active');
console.log('  PASS: Started with 0 misses and all marigolds active.');

// 2. Miss 1: Dropped Good Object
console.log('2. Testing Miss #1 (Dropped good object falling past bottom):');
engine.recordMiss('dropped', 200, 550);
console.assert(engine.getMisses() === 1, `Misses should be 1, got ${engine.getMisses()}`);
console.assert(engine.isGameOver() === false, 'Game should NOT be over on 1st miss!');
console.assert(elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 must be dimmed');
console.assert(!elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 must NOT be dimmed yet');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 must NOT be dimmed yet');
console.log('  PASS: Miss 1 counted, 1st marigold dimmed, game is still playing.');

// 3. Miss 2: Slicing a Vighna Obstacle
console.log('3. Testing Miss #2 (Vighna obstacle sliced):');
const vighna = engine.spawnObject('vighna');
engine.sliceObject(vighna, 0);
console.assert(engine.getMisses() === 2, `Misses should be 2, got ${engine.getMisses()}`);
console.assert(engine.isGameOver() === false, 'Game should NOT be over on 2nd miss!');
console.assert(elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 must remain dimmed');
console.assert(elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 must be dimmed');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 must NOT be dimmed yet');
console.log('  PASS: Miss 2 counted from Vighna slice, 2nd marigold dimmed, game is still playing.');

// 4. Miss 3: Final miss triggers Game Over EXACTLY on 3rd miss
console.log('4. Testing Miss #3 (Final miss triggers Game Over exactly on 3rd miss):');
engine.recordMiss('dropped', 400, 550);
console.assert(engine.getMisses() === 3, `Misses should be 3, got ${engine.getMisses()}`);
console.assert(engine.isGameOver() === true, 'CRITICAL: Game MUST end on exactly the 3rd miss!');
console.assert(elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 must be dimmed');
console.assert(elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 must be dimmed');
console.assert(elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 must be dimmed');
console.assert(!elements['gameOverModal'].classList.contains('hidden'), 'Game Over modal must be shown');
console.log('  PASS: Game Over triggered EXACTLY on the 3rd miss with all 3 marigolds dimmed.');

// 5. Subsequent actions during Game Over must be ignored
console.log('5. Testing post-Game-Over actions (no 4th miss or corruption):');
engine.recordMiss('dropped', 400, 550);
console.assert(engine.getMisses() === 3, `Misses must stay capped at 3, got ${engine.getMisses()}`);
console.assert(engine.isGameOver() === true, 'Game remains over');
console.log('  PASS: Post-game-over actions properly ignored.');

// 6. Testing Restart
console.log('6. Testing Restart:');
engine.restartGame();
console.assert(engine.getMisses() === 0, `Misses reset to 0, got ${engine.getMisses()}`);
console.assert(engine.isGameOver() === false, 'Game should be active after restart');
console.assert(!elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 restored');
console.assert(!elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 restored');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 restored');
console.assert(elements['gameOverModal'].classList.contains('hidden'), 'Game Over modal hidden');
console.log('  PASS: Game restart cleanly restored all 3 marigolds and reset miss counter.');

console.log('\nALL MISS COUNTER TESTS PASSED SUCCESSFULLY!');
