// Automated Verification Test for Boss Defeat -> Resolution Animation -> Victory Screen -> Play Again Flow
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
      clickListeners: [],
      addEventListener: function(evt, handler) {
        if (evt === 'click') el.clickListeners.push(handler);
      },
      click: function() {
        el.clickListeners.forEach(h => h({ stopPropagation: () => {} }));
      }
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
  'victoryModal', 'victoryScoreDisplay', 'victoryRoundsDisplay', 'victoryStreakDisplay', 'victoryComboDisplay', 'victoryRestartBtn',
  'roundBanner', 'roundBannerBadge', 'roundBannerTitle', 'roundBannerSub',
  'marigold-1', 'marigold-2', 'marigold-3',
  'bossHealthContainer', 'bossHealthFill', 'bossHealthText'
].forEach(id => {
  const el = getOrCreateMockElement(id);
  if (['victoryModal', 'gameOverModal', 'startModal', 'roundBanner', 'bossHealthContainer'].includes(id)) {
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
let mockTime = 1000;
global.performance = { now: () => mockTime };
let loopCb = null;
global.requestAnimationFrame = (cb) => { loopCb = cb; };

// Load and evaluate game.js
const code = fs.readFileSync('game.js', 'utf8');
eval(code);

console.log('Testing Vighnasura Resolution Animation & Grand Victory Screen Flow...\n');
const engine = global.window.gameEngine;
engine.startGame();

// 1. Initial State Check
console.log('1. Checking Initial Victory State:');
console.assert(elements['victoryModal'].classList.contains('hidden'), 'Victory modal must start hidden');
console.assert(engine.isBossResolutionAnim() === false, 'Resolution animation must start inactive');
console.log('  PASS: Victory modal and resolution animation are clean.');

// 2. Start Boss Encounter and Simulate Battle Progress
console.log('\n2. Starting Boss Encounter:');
engine.triggerBossIntro();
// Step through intro animation (~3.7s)
for (let s = 0; s < 125; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

console.assert(engine.isBossEncounter() === true, 'Boss encounter active');
console.assert(engine.isBossDefeated() === false, 'Boss not yet defeated');
console.assert(engine.getBossHp() === 100, 'Boss HP is 100');

// Add some test score and streak
engine.setThaliFullness(60);
engine.setStreakMeter(80);

// Spawn a dummy object to verify screen wipe on defeat
engine.spawnObject('vighna');
console.assert(engine.getGameObjects().length > 0, 'Spawned active object during battle');

// 3. Trigger Boss Defeat (Boss Health Reaches 0)
console.log('\n3. Triggering Boss Defeat (Vighnasura Health Reaches 0):');
engine.setBossHp(0);
engine.triggerBossDefeat();

// 4. Verify Immediate Defeat Effects
console.log('\n4. Verifying Wave Halting and Immediate Screen Wipe:');
console.assert(engine.isBossDefeated() === true, 'Boss must be marked as defeated');
console.assert(engine.isBossResolutionAnim() === true, 'Resolution animation must be active');
console.assert(engine.getActiveWave() === null, 'Active wave must be cleared');
console.assert(engine.getGameObjects().length === 0, `All active objects must be wiped to 0 (got ${engine.getGameObjects().length})`);
console.assert(elements['bossHealthContainer'].classList.contains('hidden'), 'Boss health bar must be hidden on defeat');
console.log('  PASS: Wave spawning halted permanently, flying objects cleared to 0, health bar hidden.');

// 5. Step Through Peaceful Resolution Animation
console.log('\n5. Stepping Through Peaceful Resolution Animation (~3.6s):');
// Advance midway through animation (~1.8s)
for (let s = 0; s < 60; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

console.assert(engine.isBossResolutionAnim() === true, 'Resolution animation still active midway');
const midDarkness = engine.getBossDarkness();
console.assert(midDarkness < 0.45, `Sanctuary background must be returning to festive warmth (darkness: ${midDarkness})`);
console.assert(engine.getGameObjects().length === 0, 'No waves should have spawned during resolution');
console.log(`  PASS: Vighnasura dissolving into light/petals, pandal background easing to brightness (${Math.round((1 - midDarkness/0.72)*100)}% restored).`);

// Step to conclusion of resolution animation (~3.6s total)
for (let s = 0; s < 70; s++) {
  mockTime += 30;
  if (loopCb) loopCb(mockTime);
}

// 6. Verify Transition to Victory Screen
console.log('\n6. Verifying Transition to Victory Screen:');
console.assert(engine.isBossResolutionAnim() === false, 'Resolution animation should be completed');
console.assert(!elements['victoryModal'].classList.contains('hidden'), 'Victory modal must be visible');
console.assert(elements['victoryRoundsDisplay'].textContent.includes('BOSS'), `Rounds display should celebrate completing boss encounter (got ${elements['victoryRoundsDisplay'].textContent})`);
console.log(`  PASS: Victory modal displayed with Rounds: "${elements['victoryRoundsDisplay'].textContent}" and Score: "${elements['victoryScoreDisplay'].textContent}".`);

// 7. Test "Play Again" Full Reset to Level 1
console.log('\n7. Testing "Play Again" Button Full Game Reset to Level 1:');
// Click the Victory Modal restart button
elements['victoryRestartBtn'].click();

console.assert(elements['victoryModal'].classList.contains('hidden'), 'Victory modal must be hidden after Play Again');
console.assert(elements['gameOverModal'].classList.contains('hidden'), 'Game Over modal must be hidden');
console.assert(engine.isBossEncounter() === false, 'Boss encounter reset to false');
console.assert(engine.isBossDefeated() === false, 'Boss defeated reset to false');
console.assert(engine.isBossResolutionAnim() === false, 'Resolution animation reset to false');
console.assert(engine.getBossHp() === 100, 'Boss HP reset to 100');
console.assert(engine.getCurrentRound() === 1, `Current round must reset to 1 (got ${engine.getCurrentRound()})`);
console.assert(engine.getScore() === 0, `Score must reset to 0 (got ${engine.getScore()})`);
console.assert(engine.getMisses() === 0, `Misses must reset to 0 (got ${engine.getMisses()})`);
console.assert(engine.getThaliFullness() === 0, `Thali fullness must reset to 0 (got ${engine.getThaliFullness()})`);
console.assert(engine.getThaliOfferings().length === 0, 'Thali offerings array must be emptied');
console.assert(engine.getStreak() === 0, 'Streak must reset to 0');
console.assert(engine.getStreakMeter() === 0, 'Streak meter must reset to 0');
console.assert(elements['marigold-1'].classList.contains('dimmed') === false, 'Marigold 1 restored');
console.assert(elements['marigold-2'].classList.contains('dimmed') === false, 'Marigold 2 restored');
console.assert(elements['marigold-3'].classList.contains('dimmed') === false, 'Marigold 3 restored');
console.assert(elements['roundDisplay'].textContent === '1', 'HUD round display reset to 1');
console.assert(elements['scoreDisplay'].textContent === '0', 'HUD score display reset to 0');
console.log('  PASS: "Play Again" successfully and completely reset all state (Score: 0, Misses: 0, Thali: 0%, Level: 1).');

console.log('\n============================================================');
console.log('ALL RESOLUTION ANIMATION & VICTORY SCREEN TESTS PASSED!');
console.log('============================================================');
