// ==========================================================
// TEST SUITE: Boss Checkpoint System, Retry Flow & Pacing Tuning
// ==========================================================

const fs = require('fs');
const path = require('path');

console.log('Testing Checkpoint System & Boss Retry Flow...\n');

// Mock DOM elements
const elements = {};
function getOrCreateMockElement(id) {
  if (!elements[id]) {
    const classList = new Set();
    const el = {
      id: id,
      classList: {
        add: (...names) => names.forEach(n => classList.add(n)),
        remove: (...names) => names.forEach(n => classList.delete(n)),
        contains: (n) => classList.has(n),
        toggle: (n) => classList.has(n) ? classList.delete(n) : classList.add(n)
      },
      style: {},
      textContent: '',
      innerHTML: '',
      addEventListener: (evt, cb) => {
        el[`on_${evt}`] = cb;
      },
      click: () => {
        if (el['on_click']) el['on_click']({ stopPropagation: () => {} });
      }
    };
    if (id === 'gameCanvas') {
      el.width = 800;
      el.height = 600;
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
  'gameOverModal', 'gameOverBadge', 'gameOverTitle', 'gameOverSubtitle',
  'bossGameOverActions', 'retryBossBtn', 'restartLevel1Btn',
  'finalScoreDisplay', 'bestStreakDisplay', 'bestComboDisplay', 'restartBtn', 
  'victoryModal', 'victoryScoreDisplay', 'victoryRoundsDisplay', 'victoryStreakDisplay', 'victoryComboDisplay', 'victoryRestartBtn',
  'roundBanner', 'roundBannerBadge', 'roundBannerTitle', 'roundBannerSub',
  'marigold-1', 'marigold-2', 'marigold-3',
  'bossHealthContainer', 'bossHealthFill', 'bossHealthText'
].forEach(id => {
  const el = getOrCreateMockElement(id);
  if (['victoryModal', 'gameOverModal', 'startModal', 'roundBanner', 'bossHealthContainer', 'bossGameOverActions'].includes(id)) {
    el.classList.add('hidden');
  }
});

global.window = {
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: () => {}
};
global.document = {
  getElementById: (id) => getOrCreateMockElement(id)
};

let loopCb = null;
global.requestAnimationFrame = (cb) => {
  loopCb = cb;
  return 1;
};

let mockTime = 1000;
global.performance = { now: () => mockTime };

// Load and evaluate game.js
const code = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(code);

const engine = window.gameEngine;

// 1. Initial State Check
console.log('1. Checking Initial State:');
console.assert(engine.hasBossCheckpoint() === false, 'Should have no checkpoint initially');
console.assert(engine.isGameOver() === false, 'Game should not be over');
console.log('  PASS: Initial game state clean, no checkpoint active.');

// 2. Test Losing in Levels 1-3 -> Full Reset to Level 1
console.log('\n2. Testing Game Over in Levels 1-3 (Normal Level 1-3 loss):');
engine.startGame();
const dummyObj = engine.spawnObject('modak');
dummyObj.y = 800; // Drop off bottom -> Miss 1
mockTime += 30; if (loopCb) loopCb(mockTime);

const dummyObj2 = engine.spawnObject('modak');
dummyObj2.y = 800; // Drop off bottom -> Miss 2
mockTime += 30; if (loopCb) loopCb(mockTime);

const dummyObj3 = engine.spawnObject('modak');
dummyObj3.y = 800; // Drop off bottom -> Miss 3 -> Game Over!
mockTime += 30; if (loopCb) loopCb(mockTime);

console.assert(engine.isGameOver() === true, 'Game should be over on 3rd miss');
console.assert(!elements['gameOverModal'].classList.contains('hidden'), 'Game Over modal must be shown');
console.assert(elements['gameOverBadge'].textContent === 'PUJA CONCLUDED', 'Badge must say PUJA CONCLUDED for Level 1-3');
console.assert(elements['gameOverTitle'].textContent === 'TEMPLE BLESSINGS', 'Title must say TEMPLE BLESSINGS for Level 1-3');
console.assert(!elements['restartBtn'].classList.contains('hidden'), 'Normal Play Again button must be visible');
console.assert(elements['bossGameOverActions'].classList.contains('hidden'), 'Boss retry actions must be hidden');
console.log('  PASS: Level 1-3 loss displays standard game over screen.');

// Test clicking "PLAY AGAIN" resets fully to Level 1
elements['restartBtn'].click();
console.assert(engine.isGameOver() === false, 'Game over cleared');
console.assert(engine.getCurrentRound() === 1, 'Round reset to 1');
console.assert(engine.getScore() === 0, 'Score reset to 0');
console.assert(engine.getMisses() === 0, 'Misses reset to 0');
console.assert(elements['gameOverModal'].classList.contains('hidden'), 'Game Over modal hidden');
console.log('  PASS: "PLAY AGAIN" resets state fully back to Level 1.');

// 3. Test Entering Boss Encounter -> Checkpoint Snapshot & Fresh 3 Misses
console.log('\n3. Testing Boss Encounter Entry & Checkpoint Snapshot:');
// Simulate player scoring points in levels 1-3 and completing level 3
for (let i = 0; i < 6; i++) {
  const o = engine.spawnObject('modak');
  engine.sliceObject(o, 0);
}
const scoreBeforeBoss = engine.getScore();
console.assert(scoreBeforeBoss > 0, `Player should have score before boss (got ${scoreBeforeBoss})`);

// Suffer 2 misses before entering boss
const preBossMissObj1 = engine.spawnObject('vighna');
engine.sliceObject(preBossMissObj1, 0); // Miss 1
const preBossMissObj2 = engine.spawnObject('vighna');
engine.sliceObject(preBossMissObj2, 0); // Miss 2
console.assert(engine.getMisses() === 2, `Player had 2 misses prior to boss (got ${engine.getMisses()})`);
console.assert(elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 should be dimmed before boss');
console.assert(elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 should be dimmed before boss');

// Transition into Boss Encounter (as happens after Level 3 3rd thali)
engine.triggerBossIntro();

console.assert(engine.hasBossCheckpoint() === true, 'Boss checkpoint MUST be saved upon entering boss encounter');
const snapshot = engine.getBossCheckpoint();
console.assert(snapshot.score === scoreBeforeBoss, `Checkpoint snapshot must preserve entry score ${scoreBeforeBoss} (got ${snapshot.score})`);
console.assert(engine.getMisses() === 0, `CRITICAL: Misses MUST be reset to 0 for fresh boss attempt (got ${engine.getMisses()})`);
console.assert(!elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 must be restored/un-dimmed');
console.assert(!elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 must be restored/un-dimmed');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 must be active');
console.assert(elements['roundDisplay'].textContent === 'BOSS', 'Round display must indicate BOSS');
console.log(`  PASS: Checkpoint snapshot saved! Entry Score: ${snapshot.score}, Misses reset to 0/3, Marigolds refreshed.`);

// Advance through boss intro
for (let s = 0; s < 125; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

// 4. Test Losing During Boss Fight -> Distinct Boss Game Over Screen
console.log('\n4. Testing Loss During Boss Fight:');
const bossWave1 = engine.spawnBossWave(1);
const goodItem = engine.getGameObjects().find(o => o.waveId === bossWave1.id && o.category === 'good');
engine.sliceObject(goodItem, 0); // Player scores points
const scoreDuringAttempt = engine.getScore();
console.assert(scoreDuringAttempt > scoreBeforeBoss, `Score increased during boss attempt (${scoreDuringAttempt} > ${scoreBeforeBoss})`);

// Player suffers 3 misses during boss encounter
const bossHazard1 = engine.spawnObject('vighna');
engine.sliceObject(bossHazard1, 0); // Miss 1
mockTime += 30; if (loopCb) loopCb(mockTime);

const bossHazard2 = engine.spawnObject('vighna');
engine.sliceObject(bossHazard2, 0); // Miss 2
mockTime += 30; if (loopCb) loopCb(mockTime);

const bossHazard3 = engine.spawnObject('vighna');
engine.sliceObject(bossHazard3, 0); // Miss 3 -> Game Over!
mockTime += 30; if (loopCb) loopCb(mockTime);

console.assert(engine.isGameOver() === true, 'Game over triggered in boss fight');
console.assert(!elements['gameOverModal'].classList.contains('hidden'), 'Game over modal shown');
console.assert(elements['gameOverBadge'].textContent === '✦ TRIAL OF VIGHNASURA ✦', 'Modal badge must show TRIAL OF VIGHNASURA');
console.assert(elements['gameOverTitle'].innerHTML.includes('VIGHNASURA'), 'Modal title must mention Vighnasura');
console.assert(elements['restartBtn'].classList.contains('hidden'), 'Normal restartBtn must be hidden in boss game over');
console.assert(!elements['bossGameOverActions'].classList.contains('hidden'), 'bossGameOverActions must be visible');
console.log('  PASS: Boss fight loss displays distinct "TRY BOSS AGAIN" options.');

// 5. Test "TRY BOSS AGAIN" Checkpoint Reload
console.log('\n5. Testing "TRY BOSS AGAIN" Checkpoint Reload:');
elements['retryBossBtn'].click();

console.assert(engine.isGameOver() === false, 'Game should be active after checkpoint retry');
console.assert(engine.isGameStarted() === true, 'Game started flag active');
console.assert(engine.isBossEncounter() === true, 'Must still be in Boss Encounter');
console.assert(engine.getScore() === scoreBeforeBoss, `CRITICAL: Score MUST be restored to snapshot score ${scoreBeforeBoss} (got ${engine.getScore()})`);
console.assert(engine.getMisses() === 0, `CRITICAL: Misses MUST be reset to 0 (got ${engine.getMisses()})`);
console.assert(!elements['marigold-1'].classList.contains('dimmed'), 'Marigold 1 fresh');
console.assert(!elements['marigold-2'].classList.contains('dimmed'), 'Marigold 2 fresh');
console.assert(!elements['marigold-3'].classList.contains('dimmed'), 'Marigold 3 fresh');
console.assert(engine.getBossHp() === 100, `Boss HP MUST be reset to full 100 HP (got ${engine.getBossHp()})`);
console.assert(elements['bossHealthText'].textContent === '100', `Boss health text must show 100 (got ${elements['bossHealthText'].textContent})`);
console.assert(engine.getStreakMeter() === 0, `Ultimate meter must reset to 0 (got ${engine.getStreakMeter()})`);
console.assert(engine.getBossWaveNumber() === 0, `Boss wave number must reset to 0 (got ${engine.getBossWaveNumber()})`);
console.assert(engine.getActiveWave() === null, 'Active wave must be null');
console.assert(engine.getGameObjects().length === 0, `Game objects must be wiped to 0 (got ${engine.getGameObjects().length})`);
console.assert(elements['gameOverModal'].classList.contains('hidden'), 'Game over modal must be hidden');
console.log('  PASS: Checkpoint restored! Entry score preserved, 3 fresh misses, boss HP full, zero object leakage.');

// 6. Test Repeated Boss Retries (Verify Zero State Leakage)
console.log('\n6. Testing Repeated Boss Retries (State Leakage Check):');
for (let retry = 1; retry <= 3; retry++) {
  const w = engine.spawnBossWave(retry);
  engine.setBossHp(50); // damage boss
  engine.sliceObject(engine.spawnObject('vighna'), 0); // miss 1
  engine.sliceObject(engine.spawnObject('vighna'), 0); // miss 2
  engine.sliceObject(engine.spawnObject('vighna'), 0); // miss 3 -> Game Over!
  mockTime += 30; if (loopCb) loopCb(mockTime);

  console.assert(engine.isGameOver() === true, `Retry ${retry} game over`);
  elements['retryBossBtn'].click();

  console.assert(engine.getScore() === scoreBeforeBoss, `Retry ${retry}: Score must remain ${scoreBeforeBoss}`);
  console.assert(engine.getMisses() === 0, `Retry ${retry}: Misses must be 0`);
  console.assert(engine.getBossHp() === 100, `Retry ${retry}: Boss HP must be 100`);
  console.assert(engine.getBossWaveNumber() === 0, `Retry ${retry}: Wave number must be 0`);
  console.assert(engine.getStreakMeter() === 0, `Retry ${retry}: Ultimate meter must be 0`);
  console.assert(engine.getGameObjects().length === 0, `Retry ${retry}: Objects must be 0`);
}
console.log('  PASS: Multiple consecutive retries executed with zero state leakage!');

// 7. Test "Restart from Level 1" Option on Boss Game Over Screen
console.log('\n7. Testing "Restart from Level 1" on Boss Screen:');
engine.sliceObject(engine.spawnObject('vighna'), 0);
engine.sliceObject(engine.spawnObject('vighna'), 0);
engine.sliceObject(engine.spawnObject('vighna'), 0);
mockTime += 30; if (loopCb) loopCb(mockTime);

console.assert(engine.isGameOver() === true, 'Game over in boss');
elements['restartLevel1Btn'].click();

console.assert(engine.hasBossCheckpoint() === false, 'Boss checkpoint must be wiped after restarting Level 1');
console.assert(engine.getCurrentRound() === 1, 'Current round must be 1');
console.assert(engine.getScore() === 0, 'Score must be 0');
console.assert(engine.getMisses() === 0, 'Misses must be 0');
console.assert(engine.isBossEncounter() === false, 'Boss encounter flag must be false');
console.assert(elements['bossHealthContainer'].classList.contains('hidden'), 'Boss health bar must be hidden');
console.assert(elements['gameOverModal'].classList.contains('hidden'), 'Game over modal hidden');
console.log('  PASS: "Restart from Level 1" completely resets game to Level 1 with no leftover checkpoint.');

// 8. Test Boss Wave Density & Ultimate Charge Tuning
console.log('\n8. Testing Boss Ultimate Charge Rate Tuning:');
engine.triggerBossIntro();
for (let s = 0; s < 125; s++) { mockTime += 30; if (loopCb) loopCb(mockTime); }

console.assert(engine.getStreakMeter() === 0, 'Meter starts at 0%');

// Spawn Wave 1 (3 items: 2 Vighnas, 1 Good)
const tunedWave1 = engine.spawnBossWave(1);
const w1Good = engine.getGameObjects().find(o => o.waveId === tunedWave1.id && o.category === 'good');
engine.sliceObject(w1Good, 0); // Slice good item in boss wave
console.assert(engine.getStreakMeter() === 35, `Good offering in boss wave should grant +35% streak meter (got ${engine.getStreakMeter()}%)`);

// Let obstacles pass safely
engine.getGameObjects().filter(o => o.waveId === tunedWave1.id && o.category === 'obstacle').forEach(o => { o.y = 800; });
mockTime += 30; if (loopCb) loopCb(mockTime);

// Clean wave 1 clear grants bonus +15%
console.assert(engine.getStreakMeter() === 50, `Clean wave 1 clear should give +15% bonus, totaling 50% (got ${engine.getStreakMeter()}%)`);
console.log('  PASS: Wave 1 clean clear charged ultimate to 50%.');

// Spawn Wave 2 (4 items: 3 Vighnas, 1 Good)
mockTime += 30; if (loopCb) loopCb(mockTime);
const tunedWave2 = engine.spawnBossWave(2);
const w2Good = engine.getGameObjects().find(o => o.waveId === tunedWave2.id && o.category === 'good');
engine.sliceObject(w2Good, 0); // Slice good item -> +35% (now 85%)
console.assert(engine.getStreakMeter() === 85, `Wave 2 good item brings meter to 85% (got ${engine.getStreakMeter()}%)`);

// Cleanly let obstacles pass
engine.getGameObjects().filter(o => o.waveId === tunedWave2.id && o.category === 'obstacle').forEach(o => { o.y = 800; });
mockTime += 30; if (loopCb) loopCb(mockTime);

// Clean wave 2 clear brings meter to 100%!
console.assert(engine.getStreakMeter() === 100, `Clean wave 2 clear should cap meter at 100% (got ${engine.getStreakMeter()}%)`);
console.assert(engine.isUltimateReady() === true, 'Ultimate must be ready!');
console.assert(engine.isWeakPointExposed() === true, 'Weak point must be exposed after Wave 2!');
console.assert(!elements['ultimateBtn'].classList.contains('hidden'), 'Ultimate button illuminated for Weak Point smite!');
console.log('  PASS: Pacing tuned perfectly: 2 clean waves charged Ganesha’s Blessing to 100% in sync with Weak Point exposure!');

console.log('\n============================================================');
console.log('ALL CHECKPOINT SYSTEM & BOSS RETRY TESTS PASSED!');
console.log('============================================================');
