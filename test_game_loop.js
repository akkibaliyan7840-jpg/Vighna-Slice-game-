// Verification Test for Full Game Loop, Start Screen, Drag Stroke Combos, 3 Lives, and Clean Reset
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

console.log('Testing Full Game Loop, Drag Stroke Combos, 3 Lives, and Clean Reset...');
const engine = global.window.gameEngine;

// 1. Check Initial Start Screen State
console.log('1. Checking Start Screen initial state:');
console.assert(engine.isGameStarted() === false, 'Game should wait for player to click Play/Begin Puja');
console.assert(!elements['startModal'].classList.contains('hidden'), 'startModal should be visible on load');

// Click Start / Begin Puja
engine.startGame();
console.assert(engine.isGameStarted() === true, 'Game should be active after startGame()');
console.assert(elements['startModal'].classList.contains('hidden'), 'startModal should be hidden after startGame()');
console.log('  PASS: Start screen properly blocks gameplay until Play button is clicked.');

// 2. Drag Stroke Combo Multiplier System
console.log('2. Testing Drag Stroke Combo Multiplier:');
engine.restartGame();
const initialScore = engine.getScore();
console.assert(initialScore === 0, 'Score should be 0');

// First item in stroke: 1x multiplier
const item1 = engine.spawnObject('modak'); // 10 base pts
engine.sliceObject(item1, 0);
const scoreAfter1 = engine.getScore();
console.assert(scoreAfter1 === 10, `1st item: 10 * 1x = 10 pts, got ${scoreAfter1}`);
console.assert(engine.getCurrentStrokeSlices() === 1, 'Current stroke slice count should be 1');

// Second item in continuous stroke: 2x combo multiplier!
const item2 = engine.spawnObject('laddoo'); // 12 base pts * 2x combo = 24 pts
engine.sliceObject(item2, 0);
const scoreAfter2 = engine.getScore();
console.assert(scoreAfter2 === 10 + 24, `2nd item in stroke: 10 + (12 * 2x) = 34 pts, got ${scoreAfter2}`);
console.assert(engine.getCurrentStrokeSlices() === 2, 'Current stroke slice count should be 2');
console.assert(engine.getBestCombo() === 2, 'Best combo should be recorded as 2x');

// Third item in continuous stroke: 3x combo multiplier!
const item3 = engine.spawnObject('flower'); // 15 base pts * 3x combo = 45 pts
engine.sliceObject(item3, 0);
const scoreAfter3 = engine.getScore();
console.assert(scoreAfter3 === 34 + 45, `3rd item in stroke: 34 + (15 * 3x) = 79 pts, got ${scoreAfter3}`);
console.assert(engine.getCurrentStrokeSlices() === 3, 'Current stroke slice count should be 3');
console.assert(engine.getBestCombo() === 3, 'Best combo should be recorded as 3x');
console.log(`  PASS: Continuous drag stroke awarded 1x -> 2x -> 3x combo multipliers correctly (Score=${scoreAfter3}).`);

// 3. Vighna Breaks the Current Combo
console.log('3. Testing Vighna Obstacle breaks current combo:');
const vighna = engine.spawnObject('vighna');
engine.sliceObject(vighna, 0);
console.assert(engine.getCurrentStrokeSlices() === 0, 'Slicing Vighna must reset current stroke combo to 0');
console.assert(engine.getStreak() === 0, 'Slicing Vighna must reset streak to 0');
console.assert(engine.getMisses() === 1, 'Slicing Vighna counted 1st miss');
console.log('  PASS: Slicing Vighna breaks the current combo and inflicts a life loss.');

// 4. Testing 3 Lives & Game Over
console.log('4. Testing 3-Miss Game Over triggering:');
// Miss #2: Dropped offering
const droppedItem = engine.spawnObject('durva');
engine.recordMiss('dropped', 200, 500);
console.assert(engine.getMisses() === 2, 'Misses should now be 2');
console.assert(engine.isGameOver() === false, 'Game should still be running at 2 misses');

// Miss #3: Third miss triggers Game Over
engine.recordMiss('dropped', 200, 500);
console.assert(engine.getMisses() === 3, 'Misses should now be 3');
console.assert(engine.isGameOver() === true, 'Game MUST be over on the 3rd miss');
console.assert(!elements['gameOverModal'].classList.contains('hidden'), 'Game Over modal should be displayed');
console.assert(elements['finalScoreDisplay'].textContent == scoreAfter3, 'Final score displayed accurately');
console.assert(elements['bestComboDisplay'].textContent === '3x', 'Best combo displayed accurately');
console.log('  PASS: Exactly on 3rd miss, game over triggers and modal displays final score & best combo.');

// 5. Clean Session Reset via "Play Again"
console.log('5. Testing "Play Again" / restartGame cleanly resets entire game state:');
engine.restartGame();

console.assert(engine.getScore() === 0, 'Score should reset cleanly to 0');
console.assert(engine.getStreak() === 0, 'Streak should reset cleanly to 0');
console.assert(engine.getStreakMeter() === 0, 'Streak meter should reset cleanly to 0');
console.assert(engine.getMisses() === 0, 'Miss count should reset cleanly to 0');
console.assert(engine.getThaliFullness() === 0, 'Thali fullness should reset to 0%');
console.assert(engine.getCurrentRound() === 1, 'Round should reset to 1');
console.assert(engine.isGameOver() === false, 'isGameOver should be false');
console.assert(engine.isGameStarted() === true, 'isGameStarted should be true');
console.assert(engine.getGameObjects().length === 0, 'Game objects list should be empty');
console.assert(engine.getSlicedHalves().length === 0, 'Sliced halves should be empty');
console.assert(engine.getThaliOfferings().length === 0, 'Thali offerings should be empty');
console.assert(elements['gameOverModal'].classList.contains('hidden'), 'Game over modal should be hidden');
console.assert(!elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 restored');
console.assert(!elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 restored');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 restored');
console.log('  PASS: Game reset cleanly wiped all score, objects, halves, and restored all 3 lives.');

console.log('\nALL GAME LOOP & SESSION TESTS PASSED SUCCESSFULLY!');
