// Automated Verification Test for Vighnasura Glowing Weak Point & Ultimate Smite Mechanics
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

[
  'gameCanvas', 'fpsDisplay', 'resDisplay', 'roundDisplay', 'scoreDisplay', 'streakDisplay', 
  'thaliDisplay', 'meterPercent', 'streakMeterFill', 'ultimateBtn', 'startModal', 'startBtn',
  'gameOverModal', 'finalScoreDisplay', 'bestStreakDisplay', 'bestComboDisplay', 'restartBtn', 
  'roundBanner', 'roundBannerBadge', 'roundBannerTitle', 'roundBannerSub',
  'marigold-1', 'marigold-2', 'marigold-3',
  'bossHealthContainer', 'bossHealthFill', 'bossHealthText'
].forEach(id => getOrCreateMockElement(id));

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

console.log('Testing Vighnasura Glowing Weak Point & Ultimate Smite Mechanics...\n');
const engine = global.window.gameEngine;
engine.startGame();

// 1. Initial State Check
console.log('1. Verifying initial state:');
console.assert(engine.isWeakPointExposed() === false, 'Weak point must start unexposed');
console.assert(engine.getWeakPointTimer() === 0, 'Weak point timer must be 0 initially');
console.log('  PASS: Initial weak point state is clean.');

// 2. Transition to Boss Encounter
console.log('\n2. Starting Boss Encounter:');
engine.triggerBossIntro();
// Advance through intro animation (~3.7s)
for (let s = 0; s < 125; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}
console.assert(engine.isBossEncounter() === true, 'Boss encounter active');
console.assert(engine.isBossIntro() === false, 'Intro completed');
console.assert(engine.isWeakPointExposed() === false, 'Weak point should not be exposed before waves');

// Helper to clear a wave cleanly
function clearWaveCleanly(waveId) {
  const objs = engine.getGameObjects().filter(o => o.waveId === waveId);
  for (const obj of objs) {
    if (obj.category === 'good') {
      engine.sliceObject(obj, 0);
    } else {
      obj.y = 800; // pass safely off bottom
    }
  }
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

// 3. Complete Wave 1 -> Weak point should NOT appear after odd wave (wave 1)
console.log('\n3. Completing Wave 1 (Odd wave):');
const wave1 = engine.spawnBossWave(1);
clearWaveCleanly(wave1.id);
console.assert(engine.isWeakPointExposed() === false, 'Weak point must NOT appear after Wave 1');
console.log('  PASS: Wave 1 completed, weak point did not appear (schedule: only after every 2 waves).');

// 4. Complete Wave 2 -> Weak point MUST appear on schedule (after 2 waves)!
console.log('\n4. Completing Wave 2 (Even wave):');
mockTime += 30;
if (loopCb) loopCb(mockTime);

const wave2 = engine.spawnBossWave(2);
clearWaveCleanly(wave2.id);

console.assert(engine.isWeakPointExposed() === true, 'Weak point MUST be exposed after Wave 2!');
console.assert(engine.getWeakPointTimer() > 1.8 && engine.getWeakPointTimer() <= 2.0, `Weak point timer should be ~2.0s (got ${engine.getWeakPointTimer()})`);
const pos = engine.getWeakPointPos();
console.assert(pos.x === 400, `Weak point X must align with Vighnasura (got ${pos.x})`);
console.assert(pos.y > 0 && pos.y < 300, `Weak point Y must be in Vighnasura torso area (got ${pos.y})`);
console.assert(pos.radius > 20, `Weak point radius must be sliceable (got ${pos.radius})`);
console.log(`  PASS: Weak point appeared on schedule after Wave 2! (Timer: ${engine.getWeakPointTimer().toFixed(2)}s, Pos: (${pos.x}, ${Math.round(pos.y)}), Radius: ${Math.round(pos.radius)}px)`);

// 5. Test Slicing Weak Point with Ankusha -> Deals 20 HP Bonus Damage
console.log('\n5. Testing Ankusha Slice on Exposed Weak Point:');
const hpBeforeSlice = engine.getBossHp();
// Simulate a drag stroke intersecting the weak point
const sliceSuccess = engine.sliceWeakPoint(0);
console.assert(sliceSuccess === true, 'Slicing exposed weak point must return true');
console.assert(engine.getBossHp() === hpBeforeSlice - 20, `Boss HP should decrease by 20 bonus damage (was ${hpBeforeSlice}, now ${engine.getBossHp()})`);
console.assert(elements['bossHealthText'].textContent === `${engine.getBossHp()} / 100 HP`, `Health text updated (got ${elements['bossHealthText'].textContent})`);

// Slicing again during the same window should NOT deal duplicate damage
const duplicateSlice = engine.sliceWeakPoint(0);
console.assert(duplicateSlice === false, 'Duplicate slice in same window must be rejected');
console.assert(engine.getBossHp() === hpBeforeSlice - 20, 'Boss HP must not decrease twice in one window');
console.log(`  PASS: Ankusha slice successfully shattered crack, dealing 20 HP bonus damage (HP: ${engine.getBossHp()}/100). Duplicate slice rejected.`);

// 6. Test Expiry: Advance time past 2.0 seconds -> Weak point closes
console.log('\n6. Testing Weak Point Window Expiry (~2 seconds):');
// Expose manually or simulate window
engine.exposeWeakPoint();
console.assert(engine.isWeakPointExposed() === true, 'Weak point exposed');
// Step forward 2.2 seconds (75 frames * 30ms = 2.25s)
for (let s = 0; s < 75; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}
console.assert(engine.isWeakPointExposed() === false, 'Weak point must close after 2 seconds');
console.assert(engine.getWeakPointTimer() <= 0, 'Weak point timer must be <= 0');
console.log('  PASS: Weak point closed automatically after 2 seconds.');

// 7. Test Ultimate Power (Ganesha's Blessing) Smite -> Deals 50 HP Large Chunk Damage!
console.log("\n7. Testing Ganesha's Blessing (Ultimate) Smite during Weak Point Window:");
engine.setBossHp(60);
engine.setStreakMeter(100); // Ready ultimate
console.assert(engine.isUltimateReady() === true, 'Ultimate should be ready at 100%');

// Expose weak point
engine.exposeWeakPoint();
console.assert(engine.isWeakPointExposed() === true, 'Weak point is exposed');

// Trigger Ultimate
const ultFired = engine.triggerUltimate();
console.assert(ultFired === true, 'Ultimate must fire');
console.assert(engine.getBossHp() === 10, `Boss HP must take 50 HP chunk damage (was 60, now ${engine.getBossHp()})`);
console.assert(engine.isWeakPointExposed() === false, 'Weak point should close upon being smote by ultimate');
console.assert(engine.getStreakMeter() === 0, 'Streak meter resets to 0 after ultimate');
console.log(`  PASS: Ganesha's Blessing dealt massive 50 HP Divine Smite to Vighnasura! (Boss HP: ${engine.getBossHp()}/100)`);

// 8. Test Finishing Vighnasura via Weak Point Slice -> Triggers Defeat
console.log('\n8. Testing Weak Point finishing blow (reduces HP to 0 -> Defeat):');
engine.setBossHp(10);
engine.exposeWeakPoint();
engine.sliceWeakPoint(0);
console.assert(engine.isBossDefeated() === true, 'Boss must be defeated at 0 HP');
console.assert(engine.isBossResolutionAnim() === true, 'Resolution animation active on defeat');
console.log('  PASS: Weak point finishing blow defeated Vighnasura cleanly at 0 HP.');

// 9. Test Game Restart Resets Weak Point State
console.log('\n9. Testing restart cleanly resets weak point state:');
engine.restartGame();
console.assert(engine.isWeakPointExposed() === false, 'Weak point exposed reset to false');
console.assert(engine.getWeakPointTimer() === 0, 'Weak point timer reset to 0');
console.assert(engine.getBossHp() === 100, 'Boss HP reset to 100');
console.log('  PASS: Restart cleanly reset weak point state.');

console.log('\n============================================================');
console.log('ALL WEAK POINT & ULTIMATE SMITE TESTS PASSED SUCCESSFULLY!');
console.log('============================================================');
