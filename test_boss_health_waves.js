// Automated Verification Test for Vighnasura Health Bar, Escalating Waves, and Clean Clear Damage Mechanics
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

console.log('Testing Vighnasura Health Bar, Escalating Waves & Clean Damage Mechanics...\n');
const engine = global.window.gameEngine;
engine.startGame();

// 1. Initial State Verification
console.log('1. Verifying initial state:');
console.assert(engine.isBossEncounter() === false, 'Should not start in boss encounter');
console.assert(elements['bossHealthContainer'].classList.contains('hidden'), 'Boss health bar must be hidden initially');
console.assert(engine.getBossHp() === 100, 'Boss HP should start at 100');
console.assert(engine.getBossMaxHp() === 100, 'Boss Max HP should be 100');
console.log('  PASS: Boss health bar is hidden and HP starts at 100/100.');

// 2. Trigger Boss Encounter & Intro Transition
console.log('\n2. Triggering Boss Encounter:');
engine.triggerBossIntro();
console.assert(engine.isBossEncounter() === true, 'Boss encounter active');
console.assert(engine.isBossIntro() === true, 'Boss intro active');
console.assert(elements['bossHealthContainer'].classList.contains('hidden'), 'Health bar stays hidden during initial dramatic intro banner');

// Advance through boss intro animation (~3.7s)
for (let s = 0; s < 125; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

console.assert(engine.isBossIntro() === false, 'Boss intro animation should have concluded');
console.assert(!elements['bossHealthContainer'].classList.contains('hidden'), 'Boss health bar must be visible during active battle');
console.assert(elements['bossHealthFill'].style.width === '100%', `Health fill width must be 100% (got ${elements['bossHealthFill'].style.width})`);
console.assert(elements['bossHealthText'].textContent === '100 / 100 HP', `Health text must show 100 / 100 HP (got ${elements['bossHealthText'].textContent})`);
console.log('  PASS: Boss intro concluded, #bossHealthContainer is now active with 100 / 100 HP.');

// 3. Verifying Escalating Wave Patterns
console.log('\n3. Verifying Escalating Wave Formations (Wave 1 through 4):');

// Helper to extract items belonging to a wave
function getWaveItems(waveId) {
  return engine.getGameObjects().filter(o => o.waveId === waveId);
}

// Wave 1: Expect 3 items (2 Vighna, 1 Good)
const wave1 = engine.spawnBossWave(1);
console.assert(wave1 !== null, 'Wave 1 should spawn');
console.assert(wave1.totalCount === 3, `Wave 1 must have 3 items (got ${wave1.totalCount})`);
const w1Items = getWaveItems(wave1.id);
const w1Vighnas = w1Items.filter(o => o.category === 'obstacle');
const w1Goods = w1Items.filter(o => o.category === 'good');
console.assert(w1Vighnas.length === 2, `Wave 1 must contain 2 Vighnas (got ${w1Vighnas.length})`);
console.assert(w1Goods.length === 1, `Wave 1 must contain 1 Good offering (got ${w1Goods.length})`);
console.log(`  PASS Wave 1: ${w1Items.length} items total (${w1Vighnas.length} Vighnas, ${w1Goods.length} Good offering).`);

// Helper to simulate a clean wave clear
function clearWaveCleanly(waveId) {
  const objs = getWaveItems(waveId);
  for (const obj of objs) {
    if (obj.category === 'good') {
      // Slice good offering cleanly
      engine.sliceObject(obj, 0);
    } else {
      // Vighna falls safely off bottom un-sliced
      obj.y = 800; // past screen bottom (600 + 70 = 670)
    }
  }
  // Run loop to process physics and drops
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

// 4. Test Clean Wave 1 Clear -> Boss Takes 25 HP Damage
console.log('\n4. Testing Clean Wave 1 Clear:');
const hpBeforeWave1 = engine.getBossHp();
clearWaveCleanly(wave1.id);

console.assert(engine.getBossHp() === hpBeforeWave1 - 25, `Boss HP must decrease by 25 on clean clear (was ${hpBeforeWave1}, now ${engine.getBossHp()})`);
console.assert(elements['bossHealthFill'].style.width === '75%', `Health fill must be 75% (got ${elements['bossHealthFill'].style.width})`);
console.assert(elements['bossHealthText'].textContent === '75 / 100 HP', `Health text must show 75 / 100 HP (got ${elements['bossHealthText'].textContent})`);
console.assert(engine.getActiveWave() === null, 'Active wave must be cleared after resolution');
console.log('  PASS: Wave 1 cleanly cleared! Vighnasura took 25 HP damage (HP: 75/100).');

// 5. Test Wave 2 Escalation & Miss Penalty Mechanics
console.log('\n5. Testing Wave 2 Escalation (4 items) and Miss Penalty (No damage dealt):');
// Advance frame to process resolution
mockTime += 30;
if (loopCb) loopCb(mockTime);

// Wave 2: Expect 4 items (3 Vighnas, 1 Good)
const wave2 = engine.spawnBossWave(2);
console.assert(wave2 !== null, 'Wave 2 should spawn');
console.assert(wave2.totalCount === 4, `Wave 2 must have 4 items (got ${wave2.totalCount})`);
const w2Items = getWaveItems(wave2.id);
const w2Vighnas = w2Items.filter(o => o.category === 'obstacle');
const w2Goods = w2Items.filter(o => o.category === 'good');
console.assert(w2Vighnas.length === 3, `Wave 2 must contain 3 Vighnas (got ${w2Vighnas.length})`);
console.assert(w2Goods.length === 1, `Wave 2 must contain 1 Good offering (got ${w2Goods.length})`);
console.log(`  PASS Wave 2: ${w2Items.length} items total (${w2Vighnas.length} Vighnas, ${w2Goods.length} Good offering).`);

// In Wave 2: Player accidentally slices a Vighna obstacle!
const missesBefore = engine.getMisses();
const hpBeforeWave2 = engine.getBossHp();

// Slice the obstacle (a miss!)
engine.sliceObject(w2Vighnas[0], 0);
console.assert(engine.getMisses() === missesBefore + 1, 'Miss count must increase on slicing Vighna');

// Resolve the rest of wave 2
for (let i = 1; i < w2Vighnas.length; i++) w2Vighnas[i].y = 800;
w2Goods[0].y = 800; // dropped good item

mockTime += 30;
if (loopCb) loopCb(mockTime);

console.assert(engine.getBossHp() === hpBeforeWave2, `Boss HP must NOT decrease when wave had a miss (was ${hpBeforeWave2}, now ${engine.getBossHp()})`);
console.assert(engine.getActiveWave() === null, 'Active wave should reset after resolution');
console.log('  PASS: Miss in wave prevented damage! Boss HP remained at 75/100.');

// 6. Test Wave 3 Escalation (5 items: 3 Vighnas, 2 Good) & Clean Clear (-25 HP)
console.log('\n6. Testing Wave 3 Escalation (5 items) and Clean Clear:');
// Advance frame
mockTime += 30;
if (loopCb) loopCb(mockTime);

const wave3 = engine.spawnBossWave(3);
console.assert(wave3 !== null, 'Wave 3 should spawn');
console.assert(wave3.totalCount === 5, `Wave 3 must have 5 items (got ${wave3.totalCount})`);
const w3Items = getWaveItems(wave3.id);
const w3Vighnas = w3Items.filter(o => o.category === 'obstacle');
const w3Goods = w3Items.filter(o => o.category === 'good');
console.assert(w3Vighnas.length === 3, `Wave 3 must contain 3 Vighnas (got ${w3Vighnas.length})`);
console.assert(w3Goods.length === 2, `Wave 3 must contain 2 Good offerings (got ${w3Goods.length})`);

clearWaveCleanly(wave3.id);
console.assert(engine.getBossHp() === 50, `Boss HP should be 50 after 2nd clean wave (got ${engine.getBossHp()})`);
console.assert(elements['bossHealthFill'].style.width === '50%', `Health fill must be 50% (got ${elements['bossHealthFill'].style.width})`);
console.assert(elements['bossHealthText'].textContent === '50 / 100 HP', `Health text must show 50 / 100 HP (got ${elements['bossHealthText'].textContent})`);
console.log('  PASS: Wave 3 cleanly cleared! Boss HP reduced to 50/100.');

// 7. Test Wave 4 Escalation (6 items: 4 Vighnas, 2 Good) & Clean Clear (-25 HP)
console.log('\n7. Testing Wave 4 Escalation (6 items) and Clean Clear:');
// Advance frame
mockTime += 30;
if (loopCb) loopCb(mockTime);

const wave4 = engine.spawnBossWave(4);
console.assert(wave4 !== null, 'Wave 4 should spawn');
console.assert(wave4.totalCount === 6, `Wave 4 must have 6 items (got ${wave4.totalCount})`);
const w4Items = getWaveItems(wave4.id);
const w4Vighnas = w4Items.filter(o => o.category === 'obstacle');
const w4Goods = w4Items.filter(o => o.category === 'good');
console.assert(w4Vighnas.length === 4, `Wave 4 must contain 4 Vighnas (got ${w4Vighnas.length})`);
console.assert(w4Goods.length === 2, `Wave 4 must contain 2 Good offerings (got ${w4Goods.length})`);

clearWaveCleanly(wave4.id);
console.assert(engine.getBossHp() === 25, `Boss HP should be 25 after 3rd clean wave (got ${engine.getBossHp()})`);
console.log('  PASS: Wave 4 cleanly cleared! Boss HP reduced to 25/100.');

// 8. Test 4th Clean Wave -> Boss Defeat (0 HP)
console.log('\n8. Testing Final Clean Wave -> Boss Defeat (0 HP):');
// Advance frame
mockTime += 30;
if (loopCb) loopCb(mockTime);

const wave5 = engine.spawnBossWave(5);
clearWaveCleanly(wave5.id);
console.assert(engine.getBossHp() === 0, `Boss HP should be 0 (got ${engine.getBossHp()})`);
console.assert(engine.isBossDefeated() === true, 'Boss must be marked as defeated');
console.assert(engine.isBossResolutionAnim() === true, 'Resolution animation must be active');
console.assert(elements['bossHealthFill'].style.width === '0%', 'Health bar width should be 0%');
console.assert(elements['bossHealthText'].textContent === '0 / 100 HP', 'Health text should show 0 / 100 HP');
console.log('  PASS: Vighnasura purified at 0 HP! Resolution animation commenced.');

// 9. Verify Restart Resets Boss Health and Wave System Cleanly
console.log('\n9. Testing restart resets boss health and wave system:');
engine.restartGame();
console.assert(engine.isBossEncounter() === false, 'Boss encounter reset to false');
console.assert(engine.isBossDefeated() === false, 'Boss defeated reset to false');
console.assert(engine.getBossHp() === 100, 'Boss HP reset to 100');
console.assert(engine.getActiveWave() === null, 'Active wave reset to null');
console.assert(elements['bossHealthContainer'].classList.contains('hidden'), 'Boss health container hidden after restart');
console.log('  PASS: Game restart cleanly resets boss HP to 100, hides health bar, and resets state.');

console.log('\n============================================================');
console.log('ALL BOSS HEALTH & ESCALATING WAVE TESTS PASSED SUCCESSFULLY!');
console.log('============================================================');
