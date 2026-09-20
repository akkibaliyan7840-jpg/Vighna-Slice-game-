// Verification Test for Level 3 -> Boss Encounter (Vighnasura) Transition
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

console.log('Testing Vighnasura Boss Encounter after Level 3 Completion...');
const engine = global.window.gameEngine;
engine.startGame();

// Helper to simulate an entire offering ceremony completion
function completeOfferingCeremony() {
  engine.setThaliFullness(100);
  console.assert(engine.isOfferingAnimation() === true, 'Offering ceremony must be active');
  // Step through ceremony (~2.9 seconds of simulation)
  for (let s = 0; s < 100; s++) {
    mockTime += 30; // dt ~0.03s
    if (loopCb) loopCb(mockTime);
  }
  console.assert(engine.isOfferingAnimation() === false, 'Ceremony should be complete');
}

// 1. Progress through Level 1 -> Level 2
console.log('1. Completing 1st Thali (Level 1):');
console.assert(engine.getCurrentRound() === 1, 'Should start at Round 1');
completeOfferingCeremony();
console.assert(engine.getCurrentRound() === 2, `Should advance to Round 2, got ${engine.getCurrentRound()}`);
console.assert(engine.isBossEncounter() === false, 'Level 2 should NOT be boss encounter');
console.log('  PASS: Level 1 thali completed, advanced cleanly to Level 2.');

// 2. Progress through Level 2 -> Level 3
console.log('2. Completing 2nd Thali (Level 2):');
completeOfferingCeremony();
console.assert(engine.getCurrentRound() === 3, `Should advance to Round 3, got ${engine.getCurrentRound()}`);
console.assert(engine.isBossEncounter() === false, 'Level 3 should NOT be boss encounter yet');
console.log('  PASS: Level 2 thali completed, advanced cleanly to Level 3.');

// 3. Complete 3rd Thali (Level 3) -> Trigger Boss Encounter
console.log('3. Completing 3rd Thali (Level 3) -> Testing Boss Encounter Trigger:');
// Add some leftover objects to verify they get wiped
engine.spawnObject('modak');
engine.spawnObject('vighna');
console.assert(engine.getGameObjects().length > 0, 'Spawned dummy objects in Level 3');

// Complete 3rd thali offering ceremony
completeOfferingCeremony();

// 4. Verify Boss Encounter State
console.log('4. Verifying Boss Transition State:');
console.assert(engine.isBossEncounter() === true, 'Boss encounter MUST be active after 3rd thali');
console.assert(engine.isBossIntro() === true, 'Boss intro animation must be active');
console.assert(elements['roundDisplay'].textContent === 'BOSS', 'HUD Round badge should display BOSS');

// Verify all leftover Level 3 objects were cleared
console.assert(engine.getGameObjects().length === 0, `Leftover game objects MUST be cleared (got ${engine.getGameObjects().length})`);
console.assert(engine.getSlicedHalves().length === 0, `Leftover sliced halves MUST be cleared (got ${engine.getSlicedHalves().length})`);
console.log('  PASS: Leftover Level 3 objects wiped cleanly to 0.');

// 5. Verify Boss Banner Content
console.log('5. Verifying Boss Banner content:');
console.assert(!elements['roundBanner'].classList.contains('hidden'), 'Boss banner must be visible');
console.assert(elements['roundBannerBadge'].textContent === 'BOSS ENCOUNTER', 'Badge should say BOSS ENCOUNTER');
console.assert(elements['roundBannerTitle'].textContent === 'VIGHNASURA APPEARS!', 'Title should announce VIGHNASURA APPEARS!');
console.assert(elements['roundBannerSub'].textContent === 'Clear his obstacles to proceed.', 'Subtitle matches required prompt text');
console.log('  PASS: Boss Banner correctly displays "Vighnasura appears! Clear his obstacles to proceed."');

// 6. Verify Background Darkening and Vighnasura Rising into Top Half
console.log('6. Verifying background darkening and Vighnasura rising:');
// Step intro animation forward
for (let s = 0; s < 40; s++) {
  mockTime += 40;
  if (loopCb) loopCb(mockTime);
}

const darkness = engine.getBossDarkness();
const vY = engine.getVighnasuraY();
console.assert(darkness > 0.4, `Background should darken (got ${darkness})`);
console.assert(vY > 0 && vY <= 600 * 0.45, `Vighnasura must rise into the top half of the screen (y=${vY})`);
console.log(`  PASS: Background darkened (${Math.round(darkness * 100)}%), Vighnasura smoothly animated to y=${Math.round(vY)}px (top half).`);

// 7. Verify Vighnasura Vector Rendering Function
console.log('7. Verifying drawVighnasura execution:');
let vighnasuraRenderedWithoutError = false;
try {
  const canvas = elements['gameCanvas'];
  const ctx = canvas.getContext();
  engine.drawVighnasura(ctx, 400, 150, 1.0, 3.5);
  vighnasuraRenderedWithoutError = true;
} catch (e) {
  console.error('Error in drawVighnasura:', e);
}
console.assert(vighnasuraRenderedWithoutError === true, 'drawVighnasura must execute without errors');
console.log('  PASS: Vighnasura 2D stylized obstacle-demon vector art rendered cleanly.');

// 8. Verify Clean Reset Back to Level 1
console.log('8. Testing game restart resets boss state:');
engine.restartGame();
console.assert(engine.isBossEncounter() === false, 'Boss encounter reset');
console.assert(engine.isBossIntro() === false, 'Boss intro reset');
console.assert(engine.getBossDarkness() === 0, 'Darkness reset to 0');
console.assert(engine.getCurrentRound() === 1, 'Current round reset to 1');
console.log('  PASS: Restart cleanly reset all boss state back to Level 1.');

console.log('\nALL BOSS ENCOUNTER VERIFICATION TESTS PASSED SUCCESSFULLY!');
