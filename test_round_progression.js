// Verification Test for Offering Ceremony & Round Progression
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
 'thaliDisplay', 'meterPercent', 'streakMeterFill', 'ultimateBtn', 'gameOverModal', 
 'finalScoreDisplay', 'bestStreakDisplay', 'restartBtn', 'roundBanner', 
 'roundBannerBadge', 'roundBannerTitle', 'roundBannerSub',
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

console.log('Testing Offering Ceremony & Round 2 Progression...');
const engine = global.window.gameEngine;

// 1. Initial round state
console.log('1. Checking initial round state:');
console.assert(engine.getCurrentRound() === 1, `Should start at Round 1, got ${engine.getCurrentRound()}`);
console.assert(elements['roundDisplay'].textContent === '1', 'HUD roundDisplay should show 1');

// Setup some initial score and a miss to verify preservation
engine.recordMiss('dropped', 200, 500); // 1 miss
const initialMisses = engine.getMisses();
console.assert(initialMisses === 1, 'Set initial misses to 1');

// Slice objects to gain score
const item = engine.spawnObject('modak');
engine.sliceObject(item, 0);
const initialScore = engine.getScore();
console.assert(initialScore > 0, `Initial score should be > 0, got ${initialScore}`);
console.log(`  PASS: Round 1 active with score=${initialScore}, misses=${initialMisses}.`);

// 2. Fill thali to 100%
console.log('2. Filling thali to 100% to trigger offering ceremony:');
engine.setThaliFullness(100);

console.assert(engine.isOfferingAnimation() === true, 'Offering animation MUST trigger when thali reaches 100%');
console.log('  PASS: Offering ceremony triggered at 100% fullness.');

// 3. Advancing animation: Phase 1 (Thali moves up to Ganesha)
console.log('3. Checking Phase 1: Thali moves up to Ganesha:');
for (let step = 0; step < 25; step++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}
console.assert(engine.getThaliAnimOffsetY() < 0, `Thali must have risen upwards (negative Y offset), got ${engine.getThaliAnimOffsetY()}`);
console.log(`  PASS: Thali rose upwards (offset = ${Math.round(engine.getThaliAnimOffsetY())}px).`);

// 4. Advancing animation: Phase 2 (Ganesha acknowledges and thali empties)
console.log('4. Checking Phase 2: Ganesha acknowledges and offerings dissolve:');
for (let step = 0; step < 40; step++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}
console.assert(engine.getThaliOfferings().length === 0, 'Thali offerings must empty after Ganesha blessing');
console.log('  PASS: Offerings accepted and emptied from thali.');

// 5. Advancing animation: Phase 3 & 4 (Thali returns, Round 2 starts!)
console.log('5. Completing ceremony and starting Round 2:');
for (let step = 0; step < 40; step++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

console.assert(engine.isOfferingAnimation() === false, 'Offering animation should be complete');
console.assert(engine.getCurrentRound() === 2, `Current round should now be 2, got ${engine.getCurrentRound()}`);
console.assert(elements['roundDisplay'].textContent === '2', `HUD roundDisplay must show 2, got ${elements['roundDisplay'].textContent}`);
console.assert(engine.getThaliFullness() === 0, `Thali fullness must reset to 0% for Round 2, got ${engine.getThaliFullness()}%`);
console.assert(elements['thaliDisplay'].textContent === '0%', 'HUD thaliDisplay must show 0%');

// Verify Score and Misses were CARRIED FORWARD
console.assert(engine.getScore() >= initialScore, `Score MUST carry forward (was ${initialScore}, now ${engine.getScore()})`);
console.assert(engine.getMisses() === initialMisses, `Miss count MUST carry forward (was ${initialMisses}, now ${engine.getMisses()})`);
console.assert(elements['marigold-1'].classList.contains('dimmed'), 'Preserved marigold 1 dimmed state forward');
console.log('  PASS: Round 2 started! Score and misses correctly preserved, thali reset to 0%.');

// 6. Verify higher difficulty in Round 2
console.log('6. Verifying higher difficulty in Round 2 (faster falling speed, more Vighna obstacles):');
let vighnaCountRound2 = 0;
const trials = 1000;
let avgSpeedRound2 = 0;

for (let i = 0; i < trials; i++) {
  const obj = engine.spawnObject();
  if (obj.type === 'vighna') vighnaCountRound2++;
  avgSpeedRound2 += obj.gravity;
}
avgSpeedRound2 /= trials;

// Round 1 baseline comparison
engine.restartGame(); // resets to round 1
let vighnaCountRound1 = 0;
let avgSpeedRound1 = 0;
for (let i = 0; i < trials; i++) {
  const obj = engine.spawnObject();
  if (obj.type === 'vighna') vighnaCountRound1++;
  avgSpeedRound1 += obj.gravity;
}
avgSpeedRound1 /= trials;

console.log(`  Round 1 Vighna Rate: ${(vighnaCountRound1 / trials * 100).toFixed(1)}%, Gravity: ${avgSpeedRound1.toFixed(0)}`);
console.log(`  Round 2 Vighna Rate: ${(vighnaCountRound2 / trials * 100).toFixed(1)}%, Gravity: ${avgSpeedRound2.toFixed(0)}`);

console.assert(avgSpeedRound2 > avgSpeedRound1, 'Round 2 gravity/speed must be higher than Round 1');
console.assert(vighnaCountRound2 > vighnaCountRound1, 'Round 2 must spawn more Vighna obstacles than Round 1');
console.log('  PASS: Difficulty visibly and measurably higher in Round 2.');

// 7. Verify new thali fills in Round 2
console.log('7. Verifying new thali begins filling in Round 2:');
// Advance back to round 2
engine.setThaliFullness(100);
for (let step = 0; step < 110; step++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}
console.assert(engine.getCurrentRound() === 2, 'In Round 2');
console.assert(engine.getThaliFullness() === 0, 'Round 2 thali starts at 0%');

const newModak = engine.spawnObject('modak');
engine.sliceObject(newModak, 0);

for (let step = 0; step < 40; step++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

console.assert(engine.getThaliFullness() === 10, `New thali in Round 2 accumulated offerings (got ${engine.getThaliFullness()}%)`);
console.log('  PASS: New thali begins filling in Round 2.');

console.log('\nALL ROUND PROGRESSION TESTS PASSED SUCCESSFULLY!');
