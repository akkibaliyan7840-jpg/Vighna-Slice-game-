/**
 * VIGHNA SLICE - Core Game Engine
 * 2D Canvas Engine with Friendly Ganesha Vector Character,
 * Idle Animation Loops, Bottom-Center Thali Plate, and Slice Controls.
 * Pure Vanilla JS, zero external dependencies, responsive High-DPI.
 */

(() => {
  'use strict';

  // --- Core Canvas References ---
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const fpsDisplay = document.getElementById('fpsDisplay');
  const resDisplay = document.getElementById('resDisplay');
  const roundDisplay = document.getElementById('roundDisplay');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const streakDisplay = document.getElementById('streakDisplay');
  const thaliDisplay = document.getElementById('thaliDisplay');
  const meterPercent = document.getElementById('meterPercent');
  const streakMeterFill = document.getElementById('streakMeterFill');
  const ultimateBtn = document.getElementById('ultimateBtn');
  const controlHintNote = document.getElementById('controlHintNote');

  // --- Viewport & High-DPI State ---
  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = window.devicePixelRatio || 1;

  // --- Score, Streak & Ultimate State ---
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let bestCombo = 1;
  let currentStrokeSlices = 0; // Combo counter for current continuous drag stroke
  let streakMeter = 0; // 0 to 100
  let misses = 0; // 0 to 3
  const maxMisses = 3;
  let isGameOver = false;
  let isGameStarted = false; // Start screen active until player clicks Begin Puja
  let screenFlash = 0;
  let screenFlashRed = 0; // Brief red screen flash on miss or obstacle hit
  let screenShake = 0;
  let gameTime = 0; // Elapsed active gameplay time for continuous difficulty ramp
  let hasShownControlHint = false; // Shown once on first load, dismissed on first slice

  // --- Round Progression & Offering Animation State ---
  let currentRound = 1;
  let isOfferingAnimation = false;
  let offeringAnimTimer = 0;
  let thaliAnimOffsetY = 0; // vertical offset for thali rising to Ganesha
  let ganeshaHappyBounce = 0;
  let ganeshaAuraBoost = 0;

  // --- Boss Encounter: Vighnasura State ---
  let isBossEncounter = false;
  let isBossIntro = false;
  let bossIntroTimer = 0;
  let bossDarkness = 0; // 0 to 0.75 for background darkening
  let vighnasuraY = -280; // Starts above canvas, rises into top half
  let vighnasuraScale = 1.0;
  let bossHp = 100;
  const bossMaxHp = 100;
  const bossDamagePerCleanWave = 25; // 4 clean waves to purify Vighnasura
  let bossWaveNumber = 0;
  let bossWaveTimer = 1.8;
  let activeWave = null; // { id: number, waveNumber: number, totalCount: number, resolvedCount: number, hadMiss: boolean }
  let nextWaveId = 1;
  let isBossDefeated = false;
  let bossDefeatTimer = 0;
  let bossFlinchTimer = 0;
  let isBossResolutionAnim = false;
  let bossResolutionTimer = 0;
  const bossResolutionDuration = 3.6;
  let ganeshaBlessingGlow = 0;

  // --- Boss Weak Point System ---
  let isWeakPointExposed = false;
  let weakPointTimer = 0;
  const weakPointDuration = 2.0; // Exposes for ~2 seconds
  let weakPointSliced = false;
  let weakPointX = 0;
  let weakPointY = 0;
  let weakPointRadius = 38;
  const bossWeakPointBonusDamage = 20; // Ankusha slice bonus damage
  const bossUltimateDamage = 50; // Ganesha's Blessing massive smite damage

  // --- Thali Collection System State ---
  let thaliFullness = 0; // 0 to 100%
  const thaliOfferings = []; // Offerings resting in the thali

  // --- Checkpoint System State ---
  let bossCheckpoint = null; // { score, bestStreak, bestCombo }

  // --- Modal & Banner References ---
  const startModal = document.getElementById('startModal');
  const startBtn = document.getElementById('startBtn');
  const gameOverModal = document.getElementById('gameOverModal');
  const gameOverBadge = document.getElementById('gameOverBadge');
  const gameOverTitle = document.getElementById('gameOverTitle');
  const gameOverSubtitle = document.getElementById('gameOverSubtitle');
  const bossGameOverActions = document.getElementById('bossGameOverActions');
  const retryBossBtn = document.getElementById('retryBossBtn');
  const restartLevel1Btn = document.getElementById('restartLevel1Btn');
  const finalScoreDisplay = document.getElementById('finalScoreDisplay');
  const bestStreakDisplay = document.getElementById('bestStreakDisplay');
  const bestComboDisplay = document.getElementById('bestComboDisplay');
  const restartBtn = document.getElementById('restartBtn');
  const victoryModal = document.getElementById('victoryModal');
  const victoryScoreDisplay = document.getElementById('victoryScoreDisplay');
  const victoryRoundsDisplay = document.getElementById('victoryRoundsDisplay');
  const victoryStreakDisplay = document.getElementById('victoryStreakDisplay');
  const victoryComboDisplay = document.getElementById('victoryComboDisplay');
  const victoryRestartBtn = document.getElementById('victoryRestartBtn');
  const roundBanner = document.getElementById('roundBanner');
  const roundBannerBadge = document.getElementById('roundBannerBadge');
  const roundBannerTitle = document.getElementById('roundBannerTitle');
  const roundBannerSub = document.getElementById('roundBannerSub');
  const bossHealthContainer = document.getElementById('bossHealthContainer');
  const bossHealthFill = document.getElementById('bossHealthFill');
  const bossHealthText = document.getElementById('bossHealthText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');

  // --- Game Objects & Entity State ---
  const gameObjects = [];
  const slicedHalves = [];
  const floatingTexts = [];
  let spawnTimer = 0;
  const spawnInterval = 1.7; // seconds

  // --- Performance & Loop Timing ---
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTimer = 0;
  let currentFps = 60;

  // --- Interactive Blade Slicing Trail ---
  const bladePoints = [];
  const maxBladePoints = 18;
  const particles = [];
  let isPointerDown = false;

  /**
   * Handle responsive viewport resizing with Device Pixel Ratio scaling.
   * Leverages window.visualViewport to avoid UI cut-off when mobile browser toolbars shift.
   */
  function handleResize() {
    const vp = window.visualViewport;
    width = vp ? Math.round(vp.width) : window.innerWidth;
    height = vp ? Math.round(vp.height) : window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for smooth mobile performance

    // Canvas internal buffer size
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    // CSS display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Coordinate space normalization
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (resDisplay) {
      resDisplay.textContent = `RES: ${width}x${height} (${dpr.toFixed(1)}x)`;
    }
  }

  handleResize();
  window.addEventListener('resize', handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }
  window.addEventListener('orientationchange', () => {
    setTimeout(handleResize, 150);
  });

  // --- UI Update Helper ---
  function updateHUD() {
    if (roundDisplay) {
      roundDisplay.textContent = isBossEncounter ? 'BOSS' : `${currentRound}`;
    }
    if (scoreDisplay) scoreDisplay.textContent = `${score}`;
    if (streakDisplay) streakDisplay.textContent = `${streak}x`;
    if (thaliDisplay) thaliDisplay.textContent = `${Math.round(thaliFullness)}%`;
    if (meterPercent) meterPercent.textContent = `${Math.round(streakMeter)}%`;
    if (streakMeterFill) {
      streakMeterFill.style.width = `${Math.min(100, Math.max(0, streakMeter))}%`;
    }
    if (bossHealthContainer) {
      if (isBossEncounter && !isBossIntro && !isGameOver && !isBossDefeated && !isBossResolutionAnim) {
        bossHealthContainer.classList.remove('hidden');
      } else {
        bossHealthContainer.classList.add('hidden');
      }
    }
    if (bossHealthFill) {
      const pct = Math.max(0, Math.min(100, (bossHp / bossMaxHp) * 100));
      bossHealthFill.style.height = `${pct}%`; // vertical bar – grows from bottom
    }
    if (bossHealthText) {
      bossHealthText.textContent = `${Math.max(0, Math.round(bossHp))}`;
    }
    if (ultimateBtn) {
      if (streakMeter >= 100 && !isGameOver && !isOfferingAnimation && !isBossIntro) {
        ultimateBtn.classList.remove('hidden');
      } else {
        ultimateBtn.classList.add('hidden');
      }
    }
    if (streak > bestStreak) bestStreak = streak;
  }

  // ==========================================================
  //  PROCEDURAL WEB AUDIO SYNTHESIZER & FESTIVE DHOL ENGINE
  // ==========================================================
  let audioCtx = null;
  let masterGain = null;
  let dholGain = null;
  let sfxGain = null;
  let isSoundMuted = false;
  let dholBeatTimer = 0;
  let dholStep = 0;
  const dholTempo = 114; // Festive temple celebration BPM
  const dholStepInterval = (60 / dholTempo) / 4; // 16th-note step (~0.131s)

  function initAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return;
    }

    const AudioContextClass = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AudioContextClass) return;

    try {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(isSoundMuted ? 0 : 0.85, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      dholGain = audioCtx.createGain();
      dholGain.gain.setValueAtTime(0.16, audioCtx.currentTime); // Subtle background ambiance
      dholGain.connect(masterGain);

      sfxGain = audioCtx.createGain();
      sfxGain.gain.setValueAtTime(0.42, audioCtx.currentTime);
      sfxGain.connect(masterGain);
    } catch (e) {
      // Graceful fallback
    }
  }

  function toggleSound() {
    initAudio();
    isSoundMuted = !isSoundMuted;
    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(isSoundMuted ? 0 : 0.85, audioCtx.currentTime, 0.05);
    }
    const icon = document.getElementById('soundIcon');
    if (icon) {
      icon.textContent = isSoundMuted ? '🔇' : '🔊';
    }
    return !isSoundMuted;
  }

  function synthDholBass(time, strength = 1.0) {
    if (!audioCtx || isSoundMuted) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, time);
      osc.frequency.exponentialRampToValueAtTime(38, time + 0.16);

      gain.gain.setValueAtTime(0.55 * strength, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

      osc.connect(gain);
      gain.connect(dholGain);
      osc.start(time);
      osc.stop(time + 0.17);
    } catch (e) {}
  }

  function synthDholTreble(time, strength = 0.7) {
    if (!audioCtx || isSoundMuted) return;
    try {
      const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * 0.045));
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.012));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, time);
      filter.Q.setValueAtTime(3.2, time);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.35 * strength, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dholGain);
      noise.start(time);
    } catch (e) {}
  }

  function synthDholMid(time, strength = 0.8) {
    if (!audioCtx || isSoundMuted) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(125, time);
      osc.frequency.exponentialRampToValueAtTime(62, time + 0.12);

      gain.gain.setValueAtTime(0.4 * strength, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(dholGain);
      osc.start(time);
      osc.stop(time + 0.13);
    } catch (e) {}
  }

  function updateDhol(dt) {
    if (!audioCtx || isSoundMuted || !isGameStarted || isGameOver) return;
    dholBeatTimer += dt;
    if (dholBeatTimer >= dholStepInterval) {
      dholBeatTimer -= dholStepInterval;
      const now = audioCtx.currentTime;
      // 16-step celebratory Indian temple dhol rhythm
      switch (dholStep) {
        case 0: // Dha: heavy bass + treble
          synthDholBass(now, 1.0);
          synthDholTreble(now, 0.7);
          break;
        case 2: // Na: treble snap
          synthDholTreble(now, 0.6);
          break;
        case 4: // Ge: resonant mid
          synthDholMid(now, 0.75);
          break;
        case 6: // Na: treble snap
          synthDholTreble(now, 0.6);
          break;
        case 7: // Ta: pickup tap
          synthDholTreble(now, 0.35);
          break;
        case 8: // Dha: bass hit
          synthDholBass(now, 0.9);
          break;
        case 10: // Dha: bass hit
          synthDholBass(now, 0.85);
          break;
        case 12: // Ge: resonant mid
          synthDholMid(now, 0.7);
          break;
        case 14: // Na: treble snap
          synthDholTreble(now, 0.65);
          break;
      }
      dholStep = (dholStep + 1) % 16;
    }
  }

  function playSliceSound(combo = 1) {
    if (!audioCtx || isSoundMuted) return;
    const now = audioCtx.currentTime;

    // 1. Blade swoosh (high-passed noise)
    try {
      const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * 0.065));
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const hpFilter = audioCtx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.setValueAtTime(1900, now);

      const swooshGain = audioCtx.createGain();
      swooshGain.gain.setValueAtTime(0.26, now);
      swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      noise.connect(hpFilter);
      hpFilter.connect(swooshGain);
      swooshGain.connect(sfxGain);
      noise.start(now);
    } catch (e) {}

    // 2. Resonant Bell/Chime pitched with combo multiplier
    try {
      const osc = audioCtx.createOscillator();
      const chimeGain = audioCtx.createGain();
      osc.type = 'sine';
      const baseFreq = 520;
      const pitchMultiplier = 1 + Math.min(combo - 1, 5) * 0.16;
      osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * pitchMultiplier * 0.94, now + 0.18);

      chimeGain.gain.setValueAtTime(0.32, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(chimeGain);
      chimeGain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  function playMissSound(isVighna = false) {
    if (!audioCtx || isSoundMuted) return;
    const now = audioCtx.currentTime;

    if (isVighna) {
      // Vighna hit: deep distorted obstacle crunch
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.28);

        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.29);
      } catch (e) {}
    } else {
      // Dropped offering: soft descending minor chime
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.25);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.26);
      } catch (e) {}
    }
  }

  function playThaliDropSound() {
    if (!audioCtx || isSoundMuted) return;
    const now = audioCtx.currentTime;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.14);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {}
  }

  // --- Offering Ceremony Transition Trigger ---
  function triggerOfferingAnimation() {
    if (isOfferingAnimation || isGameOver) return;
    isOfferingAnimation = true;
    offeringAnimTimer = 0;
  }

  // --- Boss Encounter Transition Trigger ---
  function triggerBossIntro(isRetry = false) {
    // Save checkpoint snapshot on initial entry to boss encounter
    if (!isRetry) {
      bossCheckpoint = {
        score: score,
        bestStreak: bestStreak,
        bestCombo: bestCombo
      };
    }

    // Reset current miss count to 0 for the boss attempt and restore marigold flowers
    misses = 0;
    for (let i = 1; i <= maxMisses; i++) {
      const el = document.getElementById(`marigold-${i}`);
      if (el) el.classList.remove('dimmed', 'wilted-anim');
    }

    isBossEncounter = true;
    isBossIntro = true;
    bossIntroTimer = 0;
    bossDarkness = 0;
    vighnasuraY = -280;
    bossHp = bossMaxHp;
    bossWaveNumber = 0;
    bossWaveTimer = 1.8;
    activeWave = null;
    isBossDefeated = false;
    bossDefeatTimer = 0;
    bossFlinchTimer = 0;
    isWeakPointExposed = false;
    weakPointTimer = 0;
    weakPointSliced = false;

    // Clear any leftover Level 3 objects and halves immediately
    gameObjects.length = 0;
    slicedHalves.length = 0;

    // Display Boss Banner
    if (roundBanner) {
      if (roundBannerBadge) roundBannerBadge.textContent = 'BOSS ENCOUNTER';
      if (roundBannerTitle) roundBannerTitle.textContent = 'VIGHNASURA APPEARS!';
      if (roundBannerSub) roundBannerSub.textContent = 'Clear his obstacles to proceed.';
      roundBanner.classList.remove('hidden');
      setTimeout(() => {
        if (roundBanner && !isGameOver) roundBanner.classList.add('hidden');
      }, 3600);
    }
    updateHUD();
  }

  // --- Miss Counter & Game Over System ---
  function recordMiss(reason, x, y) {
    if (isGameOver) return;
    misses++;

    // Brief screen flash/shake on hit
    screenShake = Math.max(screenShake, reason === 'vighna' ? 18 : 12);
    screenFlashRed = Math.max(screenFlashRed, reason === 'vighna' ? 0.65 : 0.4);

    // Visually dim the corresponding marigold flower icon
    const targetIcon = document.getElementById(`marigold-${misses}`);
    if (targetIcon) {
      targetIcon.classList.add('dimmed', 'wilted-anim');
    }

    const label = reason === 'vighna'
      ? `VIGHNA HIT! (Miss ${misses}/${maxMisses})`
      : `OFFERING LOST! (Miss ${misses}/${maxMisses})`;

    floatingTexts.push({
      text: label,
      x: Math.min(Math.max(x, 70), width - 70),
      y: Math.min(Math.max(y, 60), height - 60),
      color: '#ef4444',
      life: 1.5,
      scale: 1.3
    });

    // Exactly on the 3rd miss, game over triggers!
    if (misses >= maxMisses) {
      triggerGameOver();
    }

    playMissSound(reason === 'vighna');
  }

  function triggerGameOver() {
    if (isGameOver) return;
    isGameOver = true;
    isGameStarted = false;
    if (streak > bestStreak) bestStreak = streak;

    if (finalScoreDisplay) finalScoreDisplay.textContent = score;
    if (bestStreakDisplay) bestStreakDisplay.textContent = `${bestStreak}x`;
    if (bestComboDisplay) bestComboDisplay.textContent = `${bestCombo}x`;

    if (isBossEncounter) {
      // Distinct Boss Game Over screen: Checkpoint retry options
      if (gameOverBadge) gameOverBadge.textContent = '✦ TRIAL OF VIGHNASURA ✦';
      if (gameOverTitle) gameOverTitle.innerHTML = 'VIGHNASURA <span class="accent-text">OVERWHELMED</span>';
      if (gameOverSubtitle) gameOverSubtitle.textContent = "Obstacles overcame the puja. Seek Ganesha's blessings and try again!";
      if (restartBtn) restartBtn.classList.add('hidden');
      if (bossGameOverActions) bossGameOverActions.classList.remove('hidden');
    } else {
      // Standard Level 1-3 Game Over screen: Full reset to Level 1
      if (gameOverBadge) gameOverBadge.textContent = 'PUJA CONCLUDED';
      if (gameOverTitle) gameOverTitle.textContent = 'TEMPLE BLESSINGS';
      if (gameOverSubtitle) gameOverSubtitle.textContent = 'Three sacred offerings were lost to obstacles';
      if (restartBtn) restartBtn.classList.remove('hidden');
      if (bossGameOverActions) bossGameOverActions.classList.add('hidden');
    }

    if (gameOverModal) gameOverModal.classList.remove('hidden');
    if (ultimateBtn) ultimateBtn.classList.add('hidden');

    screenShake = 18;
    screenFlashRed = 0.8;
  }

  function retryBossCheckpoint() {
    // Restore checkpoint snapshot score (discard score gained during failed boss attempt)
    if (bossCheckpoint) {
      score = bossCheckpoint.score;
      bestStreak = Math.max(bestStreak, bossCheckpoint.bestStreak || 0);
      bestCombo = Math.max(bestCombo, bossCheckpoint.bestCombo || 1);
    }

    // Fresh 3 misses
    misses = 0;
    for (let i = 1; i <= maxMisses; i++) {
      const el = document.getElementById(`marigold-${i}`);
      if (el) el.classList.remove('dimmed', 'wilted-anim');
    }

    // Reset combos & ultimate meter cleanly
    streak = 0;
    currentStrokeSlices = 0;
    streakMeter = 0;
    if (ultimateBtn) ultimateBtn.classList.add('hidden');

    // Reset Vighnasura stats & wave counters cleanly
    bossHp = bossMaxHp;
    bossWaveNumber = 0;
    bossWaveTimer = 1.8;
    activeWave = null;
    isBossDefeated = false;
    bossDefeatTimer = 0;
    bossFlinchTimer = 0;
    isBossResolutionAnim = false;
    bossResolutionTimer = 0;
    ganeshaBlessingGlow = 0;
    isWeakPointExposed = false;
    weakPointTimer = 0;
    weakPointSliced = false;

    // Entity cleanup: prevent any state leakage across retries!
    gameObjects.length = 0;
    slicedHalves.length = 0;
    floatingTexts.length = 0;
    particles.length = 0;
    bladePoints.length = 0;
    screenShake = 0;
    screenFlash = 0;
    screenFlashRed = 0;

    // Game state
    isGameOver = false;
    isGameStarted = true;
    isBossEncounter = true;
    isBossIntro = false;
    bossDarkness = 0.75;
    vighnasuraY = Math.min(height * 0.18, 115);

    // Hide modals
    if (gameOverModal) gameOverModal.classList.add('hidden');
    if (victoryModal) victoryModal.classList.add('hidden');
    if (bossGameOverActions) bossGameOverActions.classList.add('hidden');
    if (controlHintNote) controlHintNote.classList.add('hidden');

    // Display Checkpoint Restored Banner
    if (roundBanner) {
      if (roundBannerBadge) roundBannerBadge.textContent = 'CHECKPOINT RESTORED';
      if (roundBannerTitle) roundBannerTitle.textContent = 'TRY BOSS AGAIN!';
      if (roundBannerSub) roundBannerSub.textContent = 'Channel Ganesha’s grace to overcome Vighnasura.';
      roundBanner.classList.remove('hidden');
      setTimeout(() => {
        if (roundBanner && !isGameOver) roundBanner.classList.add('hidden');
      }, 2600);
    }

    floatingTexts.push({
      text: '✦ RETRY: OVERCOME THE OBSTACLE! ✦',
      x: width * 0.5,
      y: Math.min(height * 0.38, 230),
      color: '#ffd700',
      life: 2.0,
      scale: 1.5
    });

    updateHUD();
  }

  function startGame() {
    if (isGameStarted) return;
    isGameStarted = true;
    isGameOver = false;
    if (startModal) startModal.classList.add('hidden');
    if (gameOverModal) gameOverModal.classList.add('hidden');
    if (!hasShownControlHint && controlHintNote) {
      controlHintNote.classList.remove('hidden', 'faded');
    } else if (controlHintNote) {
      controlHintNote.classList.add('hidden');
    }
    updateHUD();
  }

  function restartGame() {
    bossCheckpoint = null;
    score = 0;
    streak = 0;
    bestStreak = 0;
    bestCombo = 1;
    currentStrokeSlices = 0;
    streakMeter = 0;
    misses = 0;
    thaliFullness = 0;
    thaliOfferings.length = 0;
    currentRound = 1;
    gameTime = 0;
    isOfferingAnimation = false;
    offeringAnimTimer = 0;
    thaliAnimOffsetY = 0;
    ganeshaHappyBounce = 0;
    ganeshaAuraBoost = 0;
    isBossEncounter = false;
    isBossIntro = false;
    bossIntroTimer = 0;
    bossDarkness = 0;
    vighnasuraY = -280;
    bossHp = bossMaxHp;
    bossWaveNumber = 0;
    bossWaveTimer = 1.8;
    activeWave = null;
    isBossDefeated = false;
    bossDefeatTimer = 0;
    bossFlinchTimer = 0;
    isBossResolutionAnim = false;
    bossResolutionTimer = 0;
    ganeshaBlessingGlow = 0;
    isWeakPointExposed = false;
    weakPointTimer = 0;
    weakPointSliced = false;
    isGameOver = false;
    isGameStarted = true;
    gameObjects.length = 0;
    slicedHalves.length = 0;
    floatingTexts.length = 0;
    particles.length = 0;
    screenShake = 0;
    screenFlash = 0;
    screenFlashRed = 0;

    for (let i = 1; i <= maxMisses; i++) {
      const el = document.getElementById(`marigold-${i}`);
      if (el) el.classList.remove('dimmed', 'wilted-anim');
    }

    if (gameOverBadge) gameOverBadge.textContent = 'PUJA CONCLUDED';
    if (gameOverTitle) gameOverTitle.textContent = 'TEMPLE BLESSINGS';
    if (gameOverSubtitle) gameOverSubtitle.textContent = 'Three sacred offerings were lost to obstacles';
    if (restartBtn) restartBtn.classList.remove('hidden');
    if (bossGameOverActions) bossGameOverActions.classList.add('hidden');

    if (gameOverModal) gameOverModal.classList.add('hidden');
    if (victoryModal) victoryModal.classList.add('hidden');
    if (startModal) startModal.classList.add('hidden');
    if (roundBanner) roundBanner.classList.add('hidden');
    if (bossHealthContainer) bossHealthContainer.classList.add('hidden');
    if (controlHintNote) controlHintNote.classList.add('hidden');
    updateHUD();
  }

  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      startGame();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      restartGame();
    });
  }

  if (retryBossBtn) {
    retryBossBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      retryBossCheckpoint();
    });
  }

  if (restartLevel1Btn) {
    restartLevel1Btn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      restartGame();
    });
  }

  if (victoryRestartBtn) {
    victoryRestartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudio();
      restartGame();
    });
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSound();
    });
  }

  // Keyboard shortcut: Space or Enter on start screen begins game
  window.addEventListener('keydown', (e) => {
    if (!isGameStarted && !isGameOver && (e.code === 'Space' || e.code === 'Enter')) {
      e.preventDefault();
      startGame();
    }
  });

  // --- Mathematical Distance to Segment for Slicing ---
  function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  // --- Interactive Pointer & Swipe Events ---
  function checkSliceCollisions(p1, p2) {
    if (isGameOver) return;
    const sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    for (let i = 0; i < gameObjects.length; i++) {
      const obj = gameObjects[i];
      if (obj.isSliced) continue;

      const d = distToSegment(obj.x, obj.y, p1.x, p1.y, p2.x, p2.y);
      if (d <= obj.radius) {
        sliceObject(obj, sliceAngle);
      }
    }

    // Check intersection with Vighnasura's exposed glowing crack / weak point
    if (isBossEncounter && isWeakPointExposed && !weakPointSliced && !isBossDefeated) {
      const d = distToSegment(weakPointX, weakPointY, p1.x, p1.y, p2.x, p2.y);
      if (d <= weakPointRadius) {
        sliceWeakPoint(sliceAngle);
      }
    }
  }

  function addBladePoint(x, y) {
    if (isGameOver) return;
    const newPt = { x, y, age: 0, maxAge: 14 };

    if (bladePoints.length > 0) {
      const lastPt = bladePoints[bladePoints.length - 1];
      checkSliceCollisions(lastPt, newPt);
    }

    bladePoints.push(newPt);

    // Spawn slice spark particles
    for (let i = 0; i < 2; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 1,
        life: 1,
        decay: Math.random() * 0.04 + 0.03,
        color: Math.random() > 0.3 ? '#ffb703' : '#fb8500'
      });
    }
  }

  function dismissControlHint() {
    if (hasShownControlHint) return;
    hasShownControlHint = true;
    if (controlHintNote && !controlHintNote.classList.contains('faded')) {
      controlHintNote.classList.add('faded');
      setTimeout(() => {
        if (controlHintNote) controlHintNote.classList.add('hidden');
      }, 500);
    }
  }

  function handlePointerDown(e) {
    initAudio();
    isPointerDown = true;
    currentStrokeSlices = 0; // Reset stroke slice combo on new swipe
    if (isGameStarted && !isGameOver) {
      dismissControlHint();
    }
    addBladePoint(e.clientX, e.clientY);
  }

  function handlePointerMove(e) {
    if (isPointerDown) {
      if (isGameStarted && !isGameOver) {
        dismissControlHint();
      }
      addBladePoint(e.clientX, e.clientY);
    }
  }

  function handlePointerUp() {
    isPointerDown = false;
    currentStrokeSlices = 0; // Reset continuous stroke combo
  }

  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);

  // --- Cross-Campus Touch Gesture & Scroll Lockdown ---
  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    // Prevent iOS Safari pinch-to-zoom gestures
    document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
    document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

    // Prevent double-tap zooming on mobile touch surfaces
    let lastTouchEndTime = 0;
    document.addEventListener('touchend', (e) => {
      if (e.target && typeof e.target.closest === 'function' && e.target.closest('button, .stat-badge, .offering-chip, .modal-card')) return;
      const now = Date.now();
      if (now - lastTouchEndTime <= 320) {
        e.preventDefault();
      }
      lastTouchEndTime = now;
    }, { passive: false });

    // Prevent mobile pull-to-refresh & rubber-band scroll bounce while playing
    document.addEventListener('touchmove', (e) => {
      if (e.target && typeof e.target.closest === 'function' && !e.target.closest('.modal-card')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  // Ensure canvas directly prevents touch scroll/zoom default events
  if (canvas && typeof canvas.addEventListener === 'function') {
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', (e) => { e.preventDefault(); }, { passive: false });
  }

  // ==========================================================
  //  WARM PANDAL-STYLE CANVAS BACKGROUND & STRING LIGHTS
  // ==========================================================

  /**
   * Draw festive Indian pandal background directly on the canvas:
   * - Soft orange/marigold & saffron radial gradient centered on altar
   * - Scalloped decorative pandal fabric canopy (toran) with gold trim & marigolds
   * - 2 curved catenary string lights (mirchi/fairy lights) with warm glowing bulbs
   * - Animated twinkling glow on bulbs
   * - Ambient floating golden motes / aarti embers
   */
  const pandalBulbColors = ['#ffd166', '#fb8500', '#ff4d6d', '#4ade80', '#fde047'];

  function fillSafeRect(ctx, x, y, w, h) {
    if (ctx.fillRect) {
      ctx.fillRect(x, y, w, h);
    } else if (ctx.rect) {
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
    }
  }

  function drawPandalBackground(ctx, width, height, time) {
    ctx.save();

    // 1. Soft Orange/Marigold & Deep Saffron Festival Gradient
    const altarX = width * 0.5;
    const altarY = height * 0.44;
    const maxDim = Math.max(width, height);

    const bgGrad = ctx.createRadialGradient(altarX, altarY, 30, altarX, altarY, maxDim * 0.85);
    bgGrad.addColorStop(0, '#421206');   // Warm radiant saffron/marigold heart
    bgGrad.addColorStop(0.35, '#280c08'); // Deep temple vermilion
    bgGrad.addColorStop(0.72, '#140508'); // Auspicious royal burgundy
    bgGrad.addColorStop(1, '#080204');    // Deep sanctuary night
    ctx.fillStyle = bgGrad;
    fillSafeRect(ctx, 0, 0, width, height);

    // Warm Altar Radiant Halo Glow Pool behind Ganesha
    const altarGlow = ctx.createRadialGradient(altarX, altarY, 10, altarX, altarY, Math.min(width, height) * 0.52);
    altarGlow.addColorStop(0, 'rgba(255, 145, 0, 0.20)');
    altarGlow.addColorStop(0.45, 'rgba(251, 133, 0, 0.08)');
    altarGlow.addColorStop(1, 'rgba(251, 133, 0, 0)');
    ctx.fillStyle = altarGlow;
    fillSafeRect(ctx, 0, 0, width, height);

    // 2. Pandal Fabric Drapery / Toran Canopy at Canvas Top
    const canopyHeight = Math.min(44, height * 0.08);
    const scallopCount = Math.max(5, Math.floor(width / 68));
    const scallopWidth = width / scallopCount;

    // Scalloped Cloth Valance
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, canopyHeight * 0.5);
    for (let i = 0; i < scallopCount; i++) {
      const sx = i * scallopWidth;
      const mx = sx + scallopWidth * 0.5;
      const ex = sx + scallopWidth;
      ctx.quadraticCurveTo(mx, canopyHeight * 1.1, ex, canopyHeight * 0.5);
    }
    ctx.lineTo(width, 0);
    ctx.closePath();

    const canopyGrad = ctx.createLinearGradient(0, 0, 0, canopyHeight);
    canopyGrad.addColorStop(0, '#780016');
    canopyGrad.addColorStop(0.7, '#9d0208');
    canopyGrad.addColorStop(1, '#590d10');
    ctx.fillStyle = canopyGrad;
    ctx.fill();

    // Golden Embroidered Trim on Valance
    ctx.beginPath();
    for (let i = 0; i < scallopCount; i++) {
      const sx = i * scallopWidth;
      const mx = sx + scallopWidth * 0.5;
      const ex = sx + scallopWidth;
      if (i === 0) ctx.moveTo(0, canopyHeight * 0.5);
      ctx.quadraticCurveTo(mx, canopyHeight * 1.1, ex, canopyHeight * 0.5);
    }
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Marigold Petal Tassel Accents at Scallop Vertices
    for (let i = 0; i <= scallopCount; i++) {
      const x = i * scallopWidth;
      ctx.beginPath();
      ctx.arc(x, canopyHeight * 0.52, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb703';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Festive String Lights (Catenary Garland Mirchi/Fairy Lights)
    const renderStringGarland = (yStart, ySag, phaseOffset) => {
      // Dark electrical garland wire
      ctx.beginPath();
      ctx.moveTo(0, yStart);
      ctx.quadraticCurveTo(width * 0.5, yStart + ySag, width, yStart);
      ctx.strokeStyle = 'rgba(75, 55, 20, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const bulbCount = Math.max(8, Math.floor(width / 44));
      for (let i = 0; i < bulbCount; i++) {
        const u = (i + 0.5) / bulbCount;
        // Catenary curve quadratic formula
        const bx = u * width;
        const by = (1 - u) * (1 - u) * yStart + 2 * (1 - u) * u * (yStart + ySag) + u * u * yStart;

        const colorIndex = (i + phaseOffset) % pandalBulbColors.length;
        const color = pandalBulbColors[colorIndex];
        const twinkle = 0.55 + 0.45 * Math.sin(time * 3.2 + i * 1.3 + phaseOffset);

        // Soft Glowing Radial Light Halo
        const glowRadius = 14 * twinkle;
        const haloGrad = ctx.createRadialGradient(bx, by + 4, 1, bx, by + 4, glowRadius);
        haloGrad.addColorStop(0, color);
        haloGrad.addColorStop(0.35, color === '#ffd166' ? 'rgba(255,209,102,0.35)' :
                                   color === '#fb8500' ? 'rgba(251,133,0,0.35)' :
                                   color === '#ff4d6d' ? 'rgba(255,77,109,0.35)' :
                                   color === '#4ade80' ? 'rgba(74,222,128,0.35)' : 'rgba(253,224,71,0.35)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(bx, by + 4, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Brass socket cap
        ctx.fillStyle = '#b45309';
        fillSafeRect(ctx, bx - 1.5, by, 3, 2.5);

        // Warm glass bulb
        ctx.beginPath();
        ctx.ellipse(bx, by + 4, 2.8, 4.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    };

    renderStringGarland(canopyHeight * 0.7, 26, 0);
    renderStringGarland(canopyHeight * 0.85, 42, 2);

    // 4. Boss Encounter Atmosphere: Darken Background Slightly
    if (bossDarkness > 0) {
      const darkGrad = ctx.createRadialGradient(width * 0.5, height * 0.28, 40, width * 0.5, height * 0.45, Math.max(width, height) * 0.85);
      darkGrad.addColorStop(0, `rgba(18, 10, 30, ${bossDarkness * 0.55})`);
      darkGrad.addColorStop(0.5, `rgba(12, 6, 20, ${bossDarkness * 0.72})`);
      darkGrad.addColorStop(1, `rgba(6, 3, 12, ${bossDarkness * 0.85})`);
      ctx.fillStyle = darkGrad;
      fillSafeRect(ctx, 0, 0, width, height);
    }

    ctx.restore();
  }

  // ==========================================================
  //  GANESHA VECTOR CHARACTER & IDLE ANIMATION
  // ==========================================================

  /**
   * Draw friendly 2D vector Ganesha character in a blessing pose.
   * Features:
   * - Abhaya Mudra (blessing right hand) with auspicious lotus mark
   * - Left hand holding a golden modak bowl
   * - Subtle idle animations: gentle breathing bob, ear sway, trunk sway, glowing halo pulse
   * - Ekadanta (one broken tusk, one intact tusk)
   * - Lotus pedestal (Padmasana) and golden Mukut (crown)
   */
  function drawGanesha(ctx, x, y, scale, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Continuous smooth animation parameters
    const breathBob = Math.sin(time * 2.4) * 3.5;
    const earSway = Math.sin(time * 2.0) * 0.045;
    const trunkSway = Math.sin(time * 1.8) * 0.06;
    const haloPulse = 1 + Math.sin(time * 1.5) * 0.05;

    // Apply gentle idle vertical bobbing + happy bounce during offering ceremony
    ctx.translate(0, breathBob - ganeshaHappyBounce);

    // --- 1. Glowing Prabhavali (Aura / Halo) ---
    ctx.save();
    const haloRadius = 72 * (haloPulse + ganeshaAuraBoost * 0.4);
    const haloGrad = ctx.createRadialGradient(0, -78, 10, 0, -78, haloRadius);
    haloGrad.addColorStop(0, `rgba(255, 235, 120, ${Math.min(0.9, 0.45 + ganeshaAuraBoost * 0.35)})`);
    haloGrad.addColorStop(0.5, `rgba(251, 133, 0, ${Math.min(0.7, 0.22 + ganeshaAuraBoost * 0.25)})`);
    haloGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, -78, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Sacred rays ring
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -78, 54 * haloPulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // --- 2. Lotus Throne (Padmasana Pedestal) ---
    ctx.save();
    const petalCount = 7;
    for (let i = 0; i < petalCount; i++) {
      const angle = Math.PI * 0.15 + (i / (petalCount - 1)) * Math.PI * 0.7;
      const px = Math.cos(angle) * 58;
      const py = Math.sin(angle) * 26 + 48;

      ctx.beginPath();
      ctx.ellipse(px, py, 16, 10, angle - Math.PI / 2, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#ff5c8a' : '#ff758f';
      ctx.fill();
      ctx.strokeStyle = '#c9184a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    // Lotus base cushion
    ctx.beginPath();
    ctx.ellipse(0, 48, 54, 15, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
    ctx.strokeStyle = '#e07a5f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // --- 3. Upper Hands / Background Arms ---
    // Upper Right (Holding sacred lotus bud)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(44, -40, 9, 22, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.stroke();
    // Lotus bud
    ctx.beginPath();
    ctx.ellipse(54, -62, 7, 11, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff758f';
    ctx.fill();
    ctx.restore();

    // Upper Left (Holding Parashu / sacred axe)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-44, -40, 9, 22, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.stroke();
    // Golden Axe head
    ctx.beginPath();
    ctx.arc(-56, -60, 10, -Math.PI / 2, Math.PI / 2);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
    ctx.strokeStyle = '#d48b00';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // --- 4. Seated Folded Legs & Golden Dhoti (Pitambar) ---
    ctx.save();
    // Dhoti / Legs outline
    ctx.beginPath();
    ctx.ellipse(-26, 36, 28, 16, -0.2, 0, Math.PI * 2);
    ctx.ellipse(26, 36, 28, 16, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
    ctx.strokeStyle = '#e07a5f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gold embroidered dhoti pleats
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.quadraticCurveTo(-10, 42, -6, 52);
    ctx.moveTo(0, 24);
    ctx.quadraticCurveTo(10, 42, 6, 52);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // --- 5. Torso & Cute Round Tummy (Lambodara) ---
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 10, 36, 28, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.strokeStyle = '#d47343';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sacred Thread (Janeu / Yajnopavita across chest)
    ctx.beginPath();
    ctx.moveTo(-20, -10);
    ctx.quadraticCurveTo(0, 8, 22, 24);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Golden necklace (Haar)
    ctx.beginPath();
    ctx.arc(0, -14, 20, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3.5;
    ctx.stroke();
    // Ruby pendant
    ctx.beginPath();
    ctx.arc(0, 6, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.restore();

    // --- 6. Large Elephant Ears (Animated Sway) ---
    // Left Ear (Viewer's left)
    ctx.save();
    ctx.translate(-36, -48);
    ctx.rotate(-earSway);
    ctx.beginPath();
    ctx.ellipse(-18, 0, 24, 30, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.strokeStyle = '#d47343';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner ear warm blush
    ctx.beginPath();
    ctx.ellipse(-17, 0, 15, 20, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f8ad9d';
    ctx.fill();
    ctx.restore();

    // Right Ear (Viewer's right)
    ctx.save();
    ctx.translate(36, -48);
    ctx.rotate(earSway);
    ctx.beginPath();
    ctx.ellipse(18, 0, 24, 30, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.strokeStyle = '#d47343';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Inner ear warm blush
    ctx.beginPath();
    ctx.ellipse(17, 0, 15, 20, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f8ad9d';
    ctx.fill();
    ctx.restore();

    // --- 7. Head & Cute Cheeks ---
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, -50, 36, 32, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.strokeStyle = '#d47343';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Friendly Eyes & Eyebrows
    // Left eye
    ctx.beginPath();
    ctx.ellipse(-14, -54, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1e24';
    ctx.fill();
    // Sparkle
    ctx.beginPath();
    ctx.arc(-13, -55, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.ellipse(14, -54, 4.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1e24';
    ctx.fill();
    // Sparkle
    ctx.beginPath();
    ctx.arc(15, -55, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Warm Eyebrows
    ctx.strokeStyle = '#a2481e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(-14, -60, 7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, -60, 7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // Sacred Forehead Tilak (Trishula / Chandan Crescent & Red Kumkum)
    ctx.fillStyle = '#fffdf0';
    ctx.beginPath();
    ctx.arc(0, -66, 8, 0.1, Math.PI - 0.1);
    ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.ellipse(0, -68, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Tusks (Ekadanta: Left intact, Right broken)
    // Left tusk (intact curved ivory)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-10, -38);
    ctx.quadraticCurveTo(-18, -26, -20, -32);
    ctx.quadraticCurveTo(-16, -38, -8, -40);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#d3c5b4';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Right tusk (broken flat end)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(10, -38);
    ctx.lineTo(16, -34);
    ctx.lineTo(14, -40);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#d3c5b4';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // --- 8. Graceful Curved Trunk (Vakratunda with Sway) ---
    ctx.save();
    ctx.translate(0, -42);
    ctx.rotate(trunkSway);

    ctx.beginPath();
    ctx.moveTo(-9, 0);
    // Trunk curve swinging gently left and curling at tip
    ctx.bezierCurveTo(-10, 20, -26, 32, -32, 20);
    ctx.bezierCurveTo(-36, 12, -28, 8, -26, 15);
    ctx.bezierCurveTo(-24, 22, -12, 14, -1, 0);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.strokeStyle = '#d47343';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ornamental golden rings on trunk
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(-12, 15, 6, 0.8, 2.4);
    ctx.stroke();
    ctx.restore();
    ctx.restore();

    // --- 9. Front Arms (Blessing & Modak) ---
    // Right Hand: Abhaya Mudra (Blessing / Ashirwad Pose)
    ctx.save();
    ctx.translate(34, -4);
    // Upper arm / Forearm raised
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 16, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.strokeStyle = '#d47343';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Golden bangle
    ctx.beginPath();
    ctx.ellipse(0, -10, 8, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();

    // Open Blessing Palm facing viewer
    ctx.beginPath();
    ctx.arc(0, -18, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#f4a261';
    ctx.fill();
    ctx.stroke();
    // Fingers raised
    ctx.beginPath();
    ctx.rect(-7, -27, 14, 10);
    ctx.fillStyle = '#f4a261';
    ctx.fill();

    // Auspicious Red Lotus / Bindi mark on blessing palm
    ctx.beginPath();
    ctx.arc(0, -18, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.fill();

    // Calm Radiant Blessing Palm Aura during Resolution
    if (ganeshaBlessingGlow > 0) {
      const bGrad = ctx.createRadialGradient(0, -18, 2, 0, -18, 26 * ganeshaBlessingGlow);
      bGrad.addColorStop(0, `rgba(255, 235, 150, ${ganeshaBlessingGlow * 0.85})`);
      bGrad.addColorStop(0.5, `rgba(255, 183, 3, ${ganeshaBlessingGlow * 0.4})`);
      bGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(0, -18, 26 * ganeshaBlessingGlow, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Left Hand: Holding Golden Modak Bowl
    ctx.save();
    ctx.translate(-30, 4);
    // Golden bowl (katori)
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
    ctx.strokeStyle = '#b58428';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sacred Modak inside bowl
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.quadraticCurveTo(-8, -12, 0, -16);
    ctx.quadraticCurveTo(8, -12, 7, 0);
    ctx.closePath();
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#e07a5f';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Modak peak saffron fold
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, -4);
    ctx.strokeStyle = '#fb8500';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // --- 10. Golden Mukut (Ornate Crown) ---
    ctx.save();
    ctx.translate(0, -74);

    // Crown Base Band
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb703';
    ctx.fill();
    ctx.strokeStyle = '#d48b00';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Tiara Gems on base
    const gemColors = ['#e63946', '#2a9d8f', '#e63946'];
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 12, 0, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = gemColors[i + 1];
      ctx.fill();
    }

    // Tier 1 Crown Peak
    ctx.beginPath();
    ctx.moveTo(-20, -2);
    ctx.lineTo(-14, -26);
    ctx.lineTo(0, -36);
    ctx.lineTo(14, -26);
    ctx.lineTo(20, -2);
    ctx.closePath();
    const crownGrad = ctx.createLinearGradient(0, -36, 0, 0);
    crownGrad.addColorStop(0, '#fff3b0');
    crownGrad.addColorStop(0.6, '#ffb703');
    crownGrad.addColorStop(1, '#d48b00');
    ctx.fillStyle = crownGrad;
    ctx.fill();
    ctx.strokeStyle = '#b57600';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Center Crown Ruby
    ctx.beginPath();
    ctx.ellipse(0, -18, 4.5, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Kalash Finial on Crown Top
    ctx.beginPath();
    ctx.arc(0, -39, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#b57600';
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // ==========================================================
  //  VIGHNASURA: 2D OBSTACLE-DEMON (STYLIZED SYMBOLIC DESIGN)
  // ==========================================================

  /**
   * Draw Vighnasura - The Obstacle Demon (Original stylized 2D design):
   * - Stylized, not scary/gory: a symbolic obstacle-creature made of thorns, coal, and stormy cloud puffs
   * - Billowing dark obsidian-and-amethyst cloud silhouette with spiky brambles
   * - Symmetrical curved thorny bramble horns with amber/crimson glowing tips
   * - Spiky coal pauldron plates with red crackle fissures
   * - Glowing ember fissure eyes and blazing chest core
   * - Animated hover floating and crackling energy aura
   */
  function drawVighnasura(ctx, x, y, scale, time, flinch = 0, opacity = 1) {
    if (opacity <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    const flinchScale = flinch > 0 ? (1 - flinch * 0.12) : 1;
    ctx.scale(scale * flinchScale, scale * flinchScale);
    ctx.globalAlpha = opacity;

    const hoverSway = Math.sin(time * 2.2) * 0.03;
    const pulse = 1 + Math.sin(time * 4) * 0.06;
    ctx.rotate(hoverSway);

    // If flinching from clean wave obstacle overcome: luminous golden purification flash
    if (flinch > 0) {
      const flashGrad = ctx.createRadialGradient(0, -10, 10, 0, -10, 130);
      flashGrad.addColorStop(0, `rgba(255, 235, 150, ${flinch * 0.75})`);
      flashGrad.addColorStop(0.6, `rgba(255, 183, 3, ${flinch * 0.35})`);
      flashGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(0, -10, 130, 0, Math.PI * 2);
      ctx.fill();
    }

    // 1. Ominous Storm Cloud Aura (Dark Purple & Crimson Energy)
    const auraGrad = ctx.createRadialGradient(0, -10, 20, 0, -10, 110 * pulse);
    auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
    auraGrad.addColorStop(0.4, 'rgba(109, 40, 217, 0.22)');
    auraGrad.addColorStop(0.7, 'rgba(220, 38, 38, 0.12)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -10, 110 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Billowing Storm Cloud Torso (Layered Charcoal & Shadow Amethyst)
    const puffCoords = [
      { x: -52, y: -20, r: 34, c: '#1f1338' },
      { x: 52, y: -20, r: 34, c: '#1f1338' },
      { x: -68, y: 12, r: 28, c: '#170e28' },
      { x: 68, y: 12, r: 28, c: '#170e28' },
      { x: -34, y: 35, r: 30, c: '#120b20' },
      { x: 34, y: 35, r: 30, c: '#120b20' },
      { x: 0, y: 44, r: 32, c: '#0f081c' },
      { x: 0, y: -16, r: 52, c: '#231640' }
    ];

    for (const p of puffCoords) {
      const puffPulse = Math.sin(time * 3 + p.x * 0.1) * 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + puffPulse, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.fill();
      ctx.strokeStyle = '#4c1d95';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 3. Spiky Coal Shoulder Armor (Jagged Floating Coal Slabs)
    const drawCoalSlab = (cx, cy, flip) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (flip) ctx.scale(-1, 1);

      ctx.beginPath();
      ctx.moveTo(-10, -22);
      ctx.lineTo(24, -28);
      ctx.lineTo(36, -8);
      ctx.lineTo(28, 16);
      ctx.lineTo(-4, 18);
      ctx.lineTo(-18, 0);
      ctx.closePath();

      const slabGrad = ctx.createLinearGradient(-15, -25, 35, 15);
      slabGrad.addColorStop(0, '#4b5563');
      slabGrad.addColorStop(0.5, '#1f2937');
      slabGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = slabGrad;
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Glowing crackle fissures
      ctx.beginPath();
      ctx.moveTo(2, -18); ctx.lineTo(14, -6); ctx.lineTo(6, 8);
      ctx.moveTo(14, -6); ctx.lineTo(26, -2);
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.restore();
    };

    drawCoalSlab(-54, -12, false);
    drawCoalSlab(54, -12, true);

    // 4. Thorny Bramble Horns (Symmetrical Curved Thorn Crown)
    const drawThornyHorn = (flip) => {
      ctx.save();
      if (flip) ctx.scale(-1, 1);

      // Main curving horn spine
      ctx.beginPath();
      ctx.moveTo(18, -48);
      ctx.bezierCurveTo(34, -72, 65, -88, 88, -66);
      ctx.bezierCurveTo(94, -58, 86, -50, 78, -52);
      ctx.bezierCurveTo(58, -66, 36, -56, 16, -38);
      ctx.closePath();

      const hornGrad = ctx.createLinearGradient(18, -48, 88, -66);
      hornGrad.addColorStop(0, '#311c11');
      hornGrad.addColorStop(0.7, '#1b0d06');
      hornGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = hornGrad;
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Sharp thorns branching off the horn
      const thorns = [
        { x: 38, y: -68, len: 14, angle: -0.6 },
        { x: 56, y: -78, len: 16, angle: -0.8 },
        { x: 75, y: -76, len: 15, angle: -0.9 },
        { x: 86, y: -64, len: 12, angle: -0.4 }
      ];

      for (const t of thorns) {
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        const tx = t.x + Math.cos(t.angle) * t.len;
        const ty = t.y + Math.sin(t.angle) * t.len;
        ctx.lineTo(tx, ty);
        ctx.lineTo(t.x + 4, t.y + 4);
        ctx.closePath();
        ctx.fillStyle = '#f97316';
        ctx.fill();
      }

      ctx.restore();
    };

    drawThornyHorn(false);
    drawThornyHorn(true);

    // 5. Stylized Symbolic Face / Mask
    ctx.beginPath();
    ctx.moveTo(-28, -52);
    ctx.lineTo(28, -52);
    ctx.lineTo(36, -20);
    ctx.lineTo(22, 12);
    ctx.lineTo(0, 24);
    ctx.lineTo(-22, 12);
    ctx.lineTo(-36, -20);
    ctx.closePath();

    const maskGrad = ctx.createLinearGradient(-25, -50, 25, 25);
    maskGrad.addColorStop(0, '#374151');
    maskGrad.addColorStop(0.6, '#1f2937');
    maskGrad.addColorStop(1, '#0b0f19');
    ctx.fillStyle = maskGrad;
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Brow ridge
    ctx.beginPath();
    ctx.moveTo(-24, -36);
    ctx.lineTo(0, -28);
    ctx.lineTo(24, -36);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 6. Glowing Amber/Crimson Ember Slit Eyes
    ctx.beginPath();
    ctx.ellipse(-14, -26, 7, 3.2, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-14, -26, 4, 1.8, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(14, -26, 7, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -26, 4, 1.8, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();

    // 7. Molten Obstacle Chest Core (Vighna Fissure)
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-4, 16);
    ctx.lineTo(0, 12);
    ctx.lineTo(6, 18);
    ctx.lineTo(10, 6);
    ctx.closePath();

    const coreGrad = ctx.createRadialGradient(0, 8, 1, 0, 8, 16);
    coreGrad.addColorStop(0, '#fffbeb');
    coreGrad.addColorStop(0.35, '#f59e0b');
    coreGrad.addColorStop(0.8, '#dc2626');
    coreGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = coreGrad;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 15;
    ctx.fill();

    // Floating thorn/coal embers orbiting Vighnasura
    for (let i = 0; i < 6; i++) {
      const a = time * 2.5 + (i / 6) * Math.PI * 2;
      const rx = Math.cos(a) * (80 + Math.sin(i * 1.5) * 15);
      const ry = Math.sin(a) * 35 + 8;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fb923c';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================================
  //  TRADITIONAL BRASS THALI PLATE GRAPHIC (BOTTOM CENTER)
  // ==========================================================

  /**
   * Draw ceremonial Indian puja brass thali plate reserved at bottom-center.
   * Reserved empty interior ready for collected modaks / sliced items.
   */
  function drawThali(ctx, x, y, rx, ry) {
    ctx.save();
    ctx.translate(x, y + thaliAnimOffsetY);

    // Deep plate drop shadow
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 10, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.filter = 'blur(8px)';
    ctx.fill();
    ctx.restore();

    // 1. Outer Brass Beveled Rim
    const outerGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
    outerGrad.addColorStop(0.0, '#785311');
    outerGrad.addColorStop(0.2, '#e0aa3e');
    outerGrad.addColorStop(0.45, '#fff2a3');
    outerGrad.addColorStop(0.7, '#c28925');
    outerGrad.addColorStop(1.0, '#664208');

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = outerGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Decorative Rim Dots / Etching
    ctx.save();
    const dotCount = Math.floor(rx * 0.4);
    for (let i = 0; i < dotCount; i++) {
      const a = (i / dotCount) * Math.PI * 2;
      const dx = Math.cos(a) * (rx - 6);
      const dy = Math.sin(a) * (ry - 4);
      ctx.beginPath();
      ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? '#fff5b8' : '#734e0d';
      ctx.fill();
    }
    ctx.restore();

    // 3. Inner Stepped Wall
    ctx.beginPath();
    ctx.ellipse(0, 1, rx * 0.88, ry * 0.88, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80, 50, 8, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Interior Plate Surface (Reserved Empty Offering Basin)
    const basinGrad = ctx.createRadialGradient(0, -ry * 0.2, 5, 0, 0, rx * 0.85);
    basinGrad.addColorStop(0, '#f3c969');
    basinGrad.addColorStop(0.5, '#d49b28');
    basinGrad.addColorStop(0.85, '#996711');
    basinGrad.addColorStop(1, '#664106');

    ctx.beginPath();
    ctx.ellipse(0, 2, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2);
    ctx.fillStyle = basinGrad;
    ctx.fill();

    // Auspicious subtle engraved lotus mandala in plate center
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 235, 170, 0.22)';
    ctx.lineWidth = 1.2;
    const centerPetals = 8;
    for (let i = 0; i < centerPetals; i++) {
      const a = (i / centerPetals) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        Math.cos(a) * (rx * 0.25),
        Math.sin(a) * (ry * 0.25) + 2,
        rx * 0.16,
        ry * 0.16,
        a,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, 2, rx * 0.12, ry * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // --- 5. Render Accumulated Offerings Piling inside Thali Basin ---
    // Sort offerings back-to-front (by relY) for accurate 2.5D visual layering
    thaliOfferings.sort((a, b) => a.relY - b.relY);

    for (let i = 0; i < thaliOfferings.length; i++) {
      const item = thaliOfferings[i];
      if (item.bounce > 0.1) {
        item.bounce *= 0.82;
      } else {
        item.bounce = 0;
      }

      ctx.save();
      ctx.translate(item.relX, item.relY - item.bounce);
      ctx.rotate(item.rot);
      ctx.scale(item.scale, item.scale);

      if (item.type === 'modak') drawModak(ctx, item.half);
      else if (item.type === 'laddoo') drawLaddoo(ctx, item.half);
      else if (item.type === 'flower') drawFlower(ctx, item.half);
      else if (item.type === 'diya') drawDiya(ctx, item.half);
      else if (item.type === 'durva') drawDurva(ctx, item.half);

      ctx.restore();
    }

    // --- 6. Subtle Metallic Sheen Arc ---
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-rx * 0.15, -ry * 0.35, rx * 0.55, ry * 0.35, -0.3, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // --- 7. Thali Fullness Level Indicator Arc & Engraved Badge ---
    if (thaliFullness > 0) {
      ctx.save();
      const fillRatio = Math.min(1, thaliFullness / 100);
      const startAngle = Math.PI * 0.12;
      const endAngle = startAngle + fillRatio * Math.PI * 0.76;

      // Glowing emerald-gold fullness meter arc along the rim
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.98, ry * 0.98, 0, startAngle, endAngle);
      ctx.strokeStyle = thaliFullness >= 100 ? '#ffd700' : '#22c55e';
      ctx.shadowColor = thaliFullness >= 100 ? '#ffd700' : '#22c55e';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Engraved Fill-Level Badge on Bottom Lip
      ctx.beginPath();
      ctx.ellipse(0, ry * 0.92, 42, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = '700 9.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = thaliFullness >= 100 ? '#ffd700' : '#fff2a3';
      ctx.shadowColor = '#ffb703';
      ctx.shadowBlur = 6;
      ctx.fillText(`THALI ${Math.round(thaliFullness)}%`, 0, ry * 0.92);
      ctx.restore();
    }

    ctx.restore();
  }

  // ==========================================================
  //  ANKUSHA POWER: SACRED ELEPHANT GOAD SWEEP & TRAIL
  // ==========================================================

  /**
   * Draw Ganesha's sacred Ankusha (curved elephant goad) vector shape.
   * Orientated along the drag vector with soft golden aura and fine metallic details.
   */
  function drawAnkusha(ctx, x, y, angle, scale = 1, opacity = 1) {
    if (opacity <= 0.02) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    // Soft Golden Divine Glow
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 18;

    // 1. Radiant Aura Around Ankusha Head
    const auraGrad = ctx.createRadialGradient(0, -6, 2, 0, -6, 26);
    auraGrad.addColorStop(0, 'rgba(255, 235, 160, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(255, 183, 3, 0.2)');
    auraGrad.addColorStop(1, 'rgba(255, 183, 3, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, -6, 26, 0, Math.PI * 2);
    ctx.fill();

    // 2. Shaft / Handle (Extends backward along negative X)
    const handleGrad = ctx.createLinearGradient(-32, -3, 6, 3);
    handleGrad.addColorStop(0, '#8c5310');
    handleGrad.addColorStop(0.4, '#ffd166');
    handleGrad.addColorStop(0.8, '#d48b00');
    handleGrad.addColorStop(1, '#8c5310');

    ctx.beginPath();
    ctx.rect(-32, -2.5, 36, 5);
    ctx.fillStyle = handleGrad;
    ctx.fill();
    ctx.strokeStyle = '#d48b00';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pommel sphere at handle base
    ctx.beginPath();
    ctx.arc(-32, 0, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#b57600';
    ctx.stroke();

    // Ornamental grip bands
    ctx.strokeStyle = '#fff5b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, -2.5); ctx.lineTo(-20, 2.5);
    ctx.moveTo(-10, -2.5); ctx.lineTo(-10, 2.5);
    ctx.stroke();

    // 3. Central Gem Collar
    ctx.beginPath();
    ctx.ellipse(4, 0, 4.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#b57600';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Auspicious Ruby Core
    ctx.beginPath();
    ctx.arc(4, 0, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.fill();

    // 4. Forward Spear Blade (Piercing tip pointing along positive X)
    const spearGrad = ctx.createLinearGradient(4, -5, 28, 0);
    spearGrad.addColorStop(0, '#ffd166');
    spearGrad.addColorStop(0.4, '#fffde0');
    spearGrad.addColorStop(1, '#ffb703');

    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.lineTo(28, 0); // sharp front point
    ctx.lineTo(4, 4);
    ctx.closePath();
    ctx.fillStyle = spearGrad;
    ctx.fill();
    ctx.strokeStyle = '#d48b00';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Spear blade center ridge
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(25, 0);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Curved Goad Hook (Classic Ankusha crescent hook)
    const hookGrad = ctx.createLinearGradient(4, -3, -16, -26);
    hookGrad.addColorStop(0, '#ffd166');
    hookGrad.addColorStop(0.5, '#fff6bd');
    hookGrad.addColorStop(1, '#f77f00');

    ctx.beginPath();
    ctx.moveTo(4, -3);
    // Outer sweeping goad curve curving upward and backward
    ctx.bezierCurveTo(8, -14, 2, -26, -15, -24);
    // Inner return curve forming sharp backward hook barb
    ctx.bezierCurveTo(-11, -18, 0, -12, 2, -3);
    ctx.closePath();
    ctx.fillStyle = hookGrad;
    ctx.fill();
    ctx.strokeStyle = '#d48b00';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner cutting edge gleam
    ctx.beginPath();
    ctx.bezierCurveTo(-15, -24, -9, -17, 1, -4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render the Ankusha Power sweep along the player's drag path.
   * Uses the exact underlying drag coordinate path (preserving slice detection mechanics)
   * while rendering a luminous golden ribbon and the divine Ankusha weapon.
   */
  let lastAnkushaAngle = -Math.PI / 4;

  function drawAnkushaTrail() {
    // Update age of recorded drag slice points
    for (let i = bladePoints.length - 1; i >= 0; i--) {
      bladePoints[i].age++;
      if (bladePoints[i].age > bladePoints[i].maxAge) {
        bladePoints.splice(i, 1);
      }
    }

    // Render luminous golden sweep ribbon along the swipe path
    if (bladePoints.length > 1) {
      ctx.save();
      for (let i = 1; i < bladePoints.length; i++) {
        const p1 = bladePoints[i - 1];
        const p2 = bladePoints[i];
        const progress = 1 - p2.age / p2.maxAge;
        const ribbonWidth = progress * 9;

        // Outer soft golden glow arc
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 183, 3, ${progress * 0.4})`;
        ctx.lineWidth = ribbonWidth * 1.8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Inner bright golden-amber core arc
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(255, 245, 180, ${progress * 0.95})`;
        ctx.lineWidth = ribbonWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 14 * progress;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render Ankusha weapon sweeping along the drag path
    if (bladePoints.length > 0) {
      const pHead = bladePoints[bladePoints.length - 1];
      let angle = lastAnkushaAngle;

      if (bladePoints.length > 1) {
        const pPrev = bladePoints[Math.max(0, bladePoints.length - 3)];
        const dx = pHead.x - pPrev.x;
        const dy = pHead.y - pPrev.y;
        if (Math.hypot(dx, dy) > 2) {
          angle = Math.atan2(dy, dx);
          lastAnkushaAngle = angle;
        }
      }

      const headProgress = Math.max(0, 1 - pHead.age / pHead.maxAge);
      const isDraggingNow = isPointerDown && headProgress > 0.4;
      const ankushaAlpha = isDraggingNow ? 1.0 : headProgress;

      // Draw subtle luminous motion echo if actively swiping
      if (bladePoints.length > 4 && isDraggingNow) {
        const pEcho = bladePoints[bladePoints.length - 4];
        const echoProgress = (1 - pEcho.age / pEcho.maxAge) * 0.4;
        drawAnkusha(ctx, pEcho.x, pEcho.y, angle, 0.82, echoProgress);
      }

      // Draw the primary golden Ankusha weapon at the leading drag tip
      drawAnkusha(ctx, pHead.x, pHead.y, angle, 1.0, ankushaAlpha);
    }

    // Update and render sacred golden spark particles & colored shards
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.isShard) {
        p.vx *= 0.94; // Air resistance on shards
        p.vy += 0.18; // Subtle gravity drop
        p.rot = (p.rot || 0) + (p.vRot || 0) * 0.05;
      }

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.fillStyle = p.color;

      if (p.isShard) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        const sw = p.size * (p.life / (p.initialLife || 1.0));
        const sl = sw * (p.aspect || 2.2);
        // Diamond / sharp triangular faceted shard
        ctx.moveTo(0, -sl);
        ctx.lineTo(sw, 0);
        ctx.lineTo(0, sl * 0.5);
        ctx.lineTo(-sw, 0);
        ctx.closePath();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * p.life), 0, Math.PI * 2);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // ==========================================================
  //  OBJECT RENDERING (MODAK, LADDOO, FLOWER, VIGHNA)
  // ==========================================================

  function drawModak(ctx, half = null) {
    ctx.save();
    if (half === 'left') {
      ctx.beginPath();
      ctx.rect(-30, -32, 30, 64);
      ctx.clip();
    } else if (half === 'right') {
      ctx.beginPath();
      ctx.rect(0, -32, 30, 64);
      ctx.clip();
    }

    // Outer pleated dumpling
    const modakGrad = ctx.createLinearGradient(0, -22, 0, 18);
    modakGrad.addColorStop(0, '#fffbe6');
    modakGrad.addColorStop(0.6, '#fde293');
    modakGrad.addColorStop(1, '#ea9933');

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.bezierCurveTo(-12, -10, -20, 4, -16, 16);
    ctx.quadraticCurveTo(0, 22, 16, 16);
    ctx.bezierCurveTo(20, 4, 12, -10, 0, -22);
    ctx.closePath();
    ctx.fillStyle = modakGrad;
    ctx.fill();
    ctx.strokeStyle = '#d48822';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Saffron pleated folds
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -22); ctx.quadraticCurveTo(-6, 2, -7, 18);
    ctx.moveTo(0, -22); ctx.quadraticCurveTo(6, 2, 7, 18);
    ctx.stroke();

    // Saffron Kesar pinch on tip
    ctx.beginPath();
    ctx.arc(0, -20, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // If sliced half, show cardamom jaggery filling
    if (half !== null) {
      ctx.beginPath();
      ctx.ellipse(0, 2, 8, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawLaddoo(ctx, half = null) {
    ctx.save();
    if (half === 'left') {
      ctx.beginPath();
      ctx.rect(-30, -30, 30, 60);
      ctx.clip();
    } else if (half === 'right') {
      ctx.beginPath();
      ctx.rect(0, -30, 30, 60);
      ctx.clip();
    }

    // Golden boondi sphere
    const laddooGrad = ctx.createRadialGradient(-4, -6, 2, 0, 0, 20);
    laddooGrad.addColorStop(0, '#fef08a');
    laddooGrad.addColorStop(0.5, '#f59e0b');
    laddooGrad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fillStyle = laddooGrad;
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pistachio flecks & boondi pearls
    const flecks = [
      { x: -5, y: -6, c: '#15803d' },
      { x: 4, y: 5, c: '#15803d' },
      { x: 6, y: -7, c: '#ffffff' }, // silver varak
      { x: -7, y: 7, c: '#ffffff' }
    ];
    for (const f of flecks) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = f.c;
      ctx.fill();
    }

    ctx.restore();
  }

  function drawFlower(ctx, half = null) {
    ctx.save();
    if (half === 'left') {
      ctx.beginPath();
      ctx.rect(-32, -32, 32, 64);
      ctx.clip();
    } else if (half === 'right') {
      ctx.beginPath();
      ctx.rect(0, -32, 32, 64);
      ctx.clip();
    }

    // 5-Petal Sacred Hibiscus (Gudhal)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, -13, 8.5, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#e11d48';
      ctx.fill();
      ctx.strokeStyle = '#9f1239';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Petal crease line
      ctx.beginPath();
      ctx.moveTo(0, -5); ctx.lineTo(0, -18);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    // Prominent golden-yellow center stamen
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pollen dots
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 3, Math.sin(a) * 3, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    ctx.restore();
  }

  function drawDiya(ctx, half = null) {
    ctx.save();
    if (half === 'left') {
      ctx.beginPath();
      ctx.rect(-32, -34, 32, 68);
      ctx.clip();
    } else if (half === 'right') {
      ctx.beginPath();
      ctx.rect(0, -34, 32, 68);
      ctx.clip();
    }

    // 1. Dancing Flame Glowing Aura
    const flameAura = ctx.createRadialGradient(0, -14, 2, 0, -14, 22);
    flameAura.addColorStop(0, 'rgba(254, 240, 138, 0.65)');
    flameAura.addColorStop(0.5, 'rgba(249, 115, 22, 0.25)');
    flameAura.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = flameAura;
    ctx.beginPath();
    ctx.arc(0, -14, 22, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tear-shaped Sacred Golden Flame
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.bezierCurveTo(-6, -18, -8, -8, 0, -3);
    ctx.bezierCurveTo(8, -8, 6, -18, 0, -26);
    ctx.closePath();

    const flameGrad = ctx.createLinearGradient(0, -26, 0, -3);
    flameGrad.addColorStop(0, '#ffffff'); // White hot tip
    flameGrad.addColorStop(0.3, '#fde047'); // Bright yellow
    flameGrad.addColorStop(0.7, '#f97316'); // Saffron orange
    flameGrad.addColorStop(1, '#ef4444');   // Deep red base
    ctx.fillStyle = flameGrad;
    ctx.fill();

    // White core spark
    ctx.beginPath();
    ctx.ellipse(0, -10, 2.5, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // 3. Cotton Wick
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, -5);
    ctx.stroke();

    // 4. Terracotta Clay Lamp Base (Mitti ka Diya)
    const diyaGrad = ctx.createLinearGradient(-18, 0, 18, 16);
    diyaGrad.addColorStop(0, '#ea580c');
    diyaGrad.addColorStop(0.5, '#c2410c');
    diyaGrad.addColorStop(1, '#7c2d12');

    ctx.beginPath();
    ctx.moveTo(-18, 3);
    ctx.quadraticCurveTo(-16, 17, 0, 17);
    ctx.quadraticCurveTo(16, 17, 18, 3);
    ctx.quadraticCurveTo(0, 6, -18, 3);
    ctx.closePath();
    ctx.fillStyle = diyaGrad;
    ctx.fill();
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Flared clay rim lip
    ctx.beginPath();
    ctx.ellipse(0, 3, 18, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fb923c';
    ctx.fill();
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Diya fragrant oil pool
    ctx.beginPath();
    ctx.ellipse(0, 3.5, 14, 3.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#b45309';
    ctx.fill();

    // Ornamental etching dots on clay rim
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(i * 4.5, 4.2, 1, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd166';
      ctx.fill();
    }

    // Sliced half interior
    if (half !== null) {
      ctx.beginPath();
      ctx.ellipse(0, 6, 8, 8, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7c2d12';
      ctx.fill();
    }

    ctx.restore();
  }

  function drawDurva(ctx, half = null) {
    ctx.save();
    if (half === 'left') {
      ctx.beginPath();
      ctx.rect(-30, -32, 30, 64);
      ctx.clip();
    } else if (half === 'right') {
      ctx.beginPath();
      ctx.rect(0, -32, 30, 64);
      ctx.clip();
    }

    // 1. Multiple Emerald Grass Blades fanning outward (Durvankur)
    // Left outer blade
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.quadraticCurveTo(-14, 4, -18, -8);
    ctx.quadraticCurveTo(-11, 6, 0, 13);
    ctx.fillStyle = '#4ade80';
    ctx.fill();

    // Right outer blade
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.quadraticCurveTo(14, 4, 18, -8);
    ctx.quadraticCurveTo(11, 6, 0, 13);
    ctx.fillStyle = '#4ade80';
    ctx.fill();

    // Left inner blade
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.quadraticCurveTo(-10, -2, -14, -18);
    ctx.quadraticCurveTo(-6, 0, 0, 13);
    ctx.fillStyle = '#16a34a';
    ctx.fill();

    // Right inner blade
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.quadraticCurveTo(10, -2, 14, -18);
    ctx.quadraticCurveTo(6, 0, 0, 13);
    ctx.fillStyle = '#15803d';
    ctx.fill();

    // Tall central sacred blade
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.quadraticCurveTo(2, -4, 0, -24);
    ctx.quadraticCurveTo(-2, -4, 0, 13);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // Central vein highlights
    ctx.strokeStyle = '#bbf7d0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(0, -22);
    ctx.stroke();

    // 2. Auspicious Red & Gold Thread (Mauli / Kalava) Knot
    ctx.beginPath();
    ctx.ellipse(0, 13, 7, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Golden thread bindings
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, 12); ctx.lineTo(6, 12);
    ctx.moveTo(-6, 14); ctx.lineTo(6, 14);
    ctx.stroke();

    // Sacred knot tassels
    ctx.beginPath();
    ctx.arc(2, 18, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, 18, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb703';
    ctx.fill();

    ctx.restore();
  }

  function drawVighnaObstacle(ctx, time) {
    ctx.save();
    // 1. Pulsating Dark Ominous Aura (never deity, strictly abstract hazard)
    const pulse = 1 + Math.sin(time * 6) * 0.08;
    const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 36 * pulse);
    auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
    auraGrad.addColorStop(0.55, 'rgba(220, 38, 38, 0.3)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 36 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged Spiky Coal / Thorn Silhouette (10 sharp irregular thorns)
    const spikeCount = 10;
    ctx.beginPath();
    for (let i = 0; i < spikeCount * 2; i++) {
      const a = (i / (spikeCount * 2)) * Math.PI * 2;
      const isSpike = i % 2 === 0;
      const baseR = isSpike ? ((i % 4 === 0) ? 28 : 24) : 15;
      const px = Math.cos(a) * baseR;
      const py = Math.sin(a) * baseR;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Dark obsidian charcoal gradient
    const coalGrad = ctx.createRadialGradient(-5, -5, 2, 0, 0, 26);
    coalGrad.addColorStop(0, '#4b5563');
    coalGrad.addColorStop(0.5, '#1f2937');
    coalGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = coalGrad;
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 3. Glowing Ominous Fissure Veins
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-10, -8); ctx.lineTo(-15, -14);
    ctx.moveTo(0, 0); ctx.lineTo(8, 7); ctx.lineTo(16, 12);
    ctx.moveTo(0, 0); ctx.lineTo(-6, 9); ctx.lineTo(-12, 15);
    ctx.moveTo(0, 0); ctx.lineTo(9, -7); ctx.lineTo(15, -12);
    ctx.stroke();

    // 4. Burning Malicious Core
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();

    ctx.restore();
  }

  // ==========================================================
  //  SPAWNER & SLICING LOGIC
  // ==========================================================

  function spawnObject(forcedType = null, waveId = null) {
    let type = forcedType;
    if (!type) {
      // Difficulty: higher Vighna obstacle ratio in later rounds & over elapsed time
      const timeRamp = Math.min(0.12, gameTime * 0.0015);
      const vighnaChance = Math.min(0.48, 0.16 + (currentRound - 1) * 0.10 + timeRamp);
      const rand = Math.random();
      if (rand < vighnaChance) {
        type = 'vighna';
      } else {
        const goodOfferings = ['modak', 'laddoo', 'flower', 'diya', 'durva'];
        type = goodOfferings[Math.floor(Math.random() * goodOfferings.length)];
      }
    }

    const isGood = type !== 'vighna';
    let radius = 24;
    let points = 10;
    if (type === 'modak') { radius = 26; points = 10; }
    else if (type === 'laddoo') { radius = 22; points = 12; }
    else if (type === 'flower') { radius = 24; points = 15; }
    else if (type === 'diya') { radius = 23; points = 18; }
    else if (type === 'durva') { radius = 21; points = 20; }
    else if (type === 'vighna') { radius = 26; points = 0; }

    // Difficulty: faster falling speed and higher launch gravity in later rounds & over elapsed time
    const timeSpeedBoost = Math.min(0.45, gameTime * 0.003);
    const speedMultiplier = 1 + (currentRound - 1) * 0.22 + timeSpeedBoost;
    const gravity = 460 * speedMultiplier;

    // Launch from bottom - bounded so widescreen desktop monitors have a balanced central play zone
    const maxPlayWidth = Math.min(width, Math.max(760, height * 1.4));
    const playStartX = (width - maxPlayWidth) / 2;
    const x = playStartX + maxPlayWidth * 0.15 + Math.random() * (maxPlayWidth * 0.7);
    const y = height + 35;
    // Parabolic velocity to arc gracefully near mid-upper screen
    const vx = ((width * 0.5 - x) * 0.0035 + (Math.random() - 0.5) * 2.8) * Math.sqrt(speedMultiplier);
    const peakY = height * (0.18 + Math.random() * 0.22);
    const vy = -Math.sqrt(2 * gravity * (y - peakY));

    const obj = {
      x,
      y,
      vx,
      vy,
      gravity,
      rot: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3,
      radius,
      type,
      category: isGood ? 'good' : 'obstacle',
      points,
      isSliced: false,
      waveId: waveId
    };

    gameObjects.push(obj);
    return obj;
  }

  // ==========================================================
  //  VIGHNASURA ESCALATING OBSTACLE WAVES & CLEAN DAMAGE
  // ==========================================================

  /**
   * Periodically launches dense escalating waves during the boss encounter.
   * Health decreases only when a wave is cleared cleanly without any misses.
   */
  function spawnBossWave(forcedWaveNum = null) {
    if (isGameOver || isOfferingAnimation || !isGameStarted || isBossIntro || isBossDefeated) return null;
    if (activeWave && forcedWaveNum === null) return null;

    bossWaveNumber = forcedWaveNum !== null ? forcedWaveNum : (bossWaveNumber + 1);
    const waveId = nextWaveId++;

    // Escalating wave patterns:
    // Wave 1: 3 items (2 Vighnas, 1 Good offering)
    // Wave 2: 4 items (3 Vighnas, 1 Good offering)
    // Wave 3: 5 items (3 Vighnas, 2 Good offerings)
    // Wave 4+: 6 items (4 Vighnas, 2 Good offerings)
    let vighnaCount = 2;
    let goodCount = 1;
    if (bossWaveNumber === 2) {
      vighnaCount = 3;
      goodCount = 1;
    } else if (bossWaveNumber === 3) {
      vighnaCount = 3;
      goodCount = 2;
    } else if (bossWaveNumber >= 4) {
      vighnaCount = 4;
      goodCount = 2;
    }

    const itemsToSpawn = [];
    for (let i = 0; i < vighnaCount; i++) itemsToSpawn.push('vighna');
    const goodTypes = ['modak', 'laddoo', 'flower', 'diya', 'durva'];
    for (let i = 0; i < goodCount; i++) {
      itemsToSpawn.push(goodTypes[Math.floor(Math.random() * goodTypes.length)]);
    }

    // Shuffle items so good offerings appear in varied positions within the wave
    for (let i = itemsToSpawn.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemsToSpawn[i], itemsToSpawn[j]] = [itemsToSpawn[j], itemsToSpawn[i]];
    }

    const totalCount = itemsToSpawn.length;
    activeWave = {
      id: waveId,
      waveNumber: bossWaveNumber,
      totalCount: totalCount,
      resolvedCount: 0,
      hadMiss: false
    };

    // Coordinated formation launch across horizontal coordinates
    for (let i = 0; i < totalCount; i++) {
      const itemType = itemsToSpawn[i];
      spawnWaveItem(itemType, waveId, i, totalCount);
    }

    floatingTexts.push({
      text: `⚡ OBSTACLE WAVE ${bossWaveNumber} ⚡`,
      x: width * 0.5,
      y: Math.min(height * 0.38, 230),
      color: '#f87171',
      life: 1.4,
      scale: 1.5
    });

    return activeWave;
  }

  function spawnWaveItem(type, waveId, index, totalCount) {
    const obj = spawnObject(type, waveId);
    if (!obj) return null;
    obj.waveId = waveId;
    const maxPlayWidth = Math.min(width, Math.max(760, height * 1.4));
    const playStartX = (width - maxPlayWidth) / 2;
    const xSpan = maxPlayWidth * 0.74;
    const startX = playStartX + maxPlayWidth * 0.13;
    const spreadFraction = totalCount > 1 ? index / (totalCount - 1) : 0.5;
    obj.x = startX + spreadFraction * xSpan + (Math.random() - 0.5) * (maxPlayWidth * 0.05);
    // Varied launch trajectory & peak height for wave formation
    const speedMultiplier = 1 + (currentRound - 1) * 0.22;
    obj.gravity = 460 * speedMultiplier;
    obj.y = height + 35 + (index % 3) * 32; // Staggered launch height for wave curvature & readable paths
    const peakY = height * (0.16 + (index / totalCount) * 0.08 + Math.random() * 0.08);
    obj.vy = -Math.sqrt(2 * obj.gravity * (obj.y - peakY));
    obj.vx = ((width * 0.5 - obj.x) * 0.0035 + (Math.random() - 0.5) * 2.2);
    return obj;
  }

  function handleWaveItemResolution(waveId, wasMiss) {
    if (!activeWave || activeWave.id !== waveId) return;

    activeWave.resolvedCount++;
    if (wasMiss) {
      activeWave.hadMiss = true;
    }

    if (activeWave.resolvedCount >= activeWave.totalCount) {
      const isClean = !activeWave.hadMiss;
      completeWave(isClean);
    }
  }

  function completeWave(isClean) {
    if (isClean) {
      // Clean play reward: Vighnasura loses health!
      bossHp = Math.max(0, bossHp - bossDamagePerCleanWave);
      bossFlinchTimer = 0.65;
      screenShake = 14;

      floatingTexts.push({
        text: `✨ OBSTACLE OVERCOME! -${bossDamagePerCleanWave} HP ✨`,
        x: width * 0.5,
        y: Math.min(height * 0.34, 210),
        color: '#ffd700',
        life: 2.0,
        scale: 1.6
      });

      // Golden particle burst around Vighnasura
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        particles.push({
          x: width * 0.5,
          y: vighnasuraY + 20,
          vx: Math.cos(a) * (Math.random() * 6 + 3),
          vy: Math.sin(a) * (Math.random() * 6 + 3),
          size: Math.random() * 4 + 2,
          life: 1.2,
          decay: 0.025,
          color: Math.random() > 0.4 ? '#ffd700' : '#fff3b0'
        });
      }

      // Bonus divine energy for clean wave mastery!
      streakMeter = Math.min(100, streakMeter + 15);

      updateHUD();

      if (bossHp <= 0) {
        triggerBossDefeat();
        activeWave = null;
        return;
      }
    } else {
      floatingTexts.push({
        text: 'WAVE MISSED! STAY FOCUSED',
        x: width * 0.5,
        y: Math.min(height * 0.34, 210),
        color: '#f87171',
        life: 1.6,
        scale: 1.3
      });
    }

    activeWave = null;
    bossWaveTimer = 2.4;

    // After every 2 waves, Vighnasura briefly exposes a glowing weak point for ~2 seconds!
    if (bossWaveNumber % 2 === 0 && !isBossDefeated) {
      exposeWeakPoint();
    }
  }

  function exposeWeakPoint() {
    if (!isBossEncounter || isBossDefeated) return;
    isWeakPointExposed = true;
    weakPointTimer = weakPointDuration; // 2.0s
    weakPointSliced = false;
    bossWaveTimer = weakPointDuration + 1.8; // Pause spawning subsequent waves until after weak point window

    floatingTexts.push({
      text: '✦ WEAK POINT EXPOSED! STRIKE THE CORE! ✦',
      x: width * 0.5,
      y: Math.min(height * 0.38, 230),
      color: '#38bdf8',
      life: 1.9,
      scale: 1.5
    });

    // Ring of bright spark particles around Vighnasura's core
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      particles.push({
        x: weakPointX + Math.cos(a) * 30,
        y: weakPointY + Math.sin(a) * 30,
        vx: Math.cos(a) * 3.5,
        vy: Math.sin(a) * 3.5,
        size: 3,
        life: 1.0,
        decay: 0.03,
        color: '#67e8f9'
      });
    }
  }

  function sliceWeakPoint(sliceAngle = 0) {
    if (!isWeakPointExposed || weakPointSliced || isBossDefeated) return false;
    weakPointSliced = true;

    // Bonus damage to Vighnasura's health bar
    const bonusDmg = bossWeakPointBonusDamage; // 20 HP
    bossHp = Math.max(0, bossHp - bonusDmg);
    bossFlinchTimer = 0.75;
    screenShake = 16;

    // Fissure shatter particle burst
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: weakPointX,
        y: weakPointY,
        vx: Math.cos(a) * (Math.random() * 8 + 3),
        vy: Math.sin(a) * (Math.random() * 8 + 3),
        size: Math.random() * 4 + 2,
        life: 1.2,
        decay: 0.025,
        color: Math.random() > 0.5 ? '#ffd700' : '#38bdf8'
      });
    }

    floatingTexts.push({
      text: `⚡ CRACK SHATTERED! -${bonusDmg} HP ⚡`,
      x: weakPointX,
      y: weakPointY - 30,
      color: '#38bdf8',
      life: 1.8,
      scale: 1.6
    });

    updateHUD();

    if (bossHp <= 0) {
      triggerBossDefeat();
    }

    return true;
  }

  function drawWeakPoint(ctx, x, y, radius, timer, duration, time) {
    ctx.save();
    ctx.translate(x, y);

    const progress = Math.max(0, Math.min(1, timer / duration));
    const pulse = 1 + Math.sin(time * 12) * 0.12;

    // 1. Radiant azure-gold warning aura
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, radius * 1.4 * pulse);
    aura.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
    aura.addColorStop(0.5, 'rgba(254, 240, 138, 0.45)');
    aura.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Concentric countdown energy ring shrinking towards center
    const ringRadius = radius * (0.6 + 0.6 * progress);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;
    ctx.stroke();

    // Crosshair ticks
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + time * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (ringRadius - 5), Math.sin(a) * (ringRadius - 5));
      ctx.lineTo(Math.cos(a) * (ringRadius + 6), Math.sin(a) * (ringRadius + 6));
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 3. Bright jagged fault-line fissure crack in Vighnasura's form
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(-7, -11);
    ctx.lineTo(8, -3);
    ctx.lineTo(-6, 9);
    ctx.lineTo(4, 22);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 20;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Inner bright core crack
    ctx.beginPath();
    ctx.moveTo(-1, -20);
    ctx.lineTo(-6, -11);
    ctx.lineTo(7, -3);
    ctx.lineTo(-5, 9);
    ctx.lineTo(3, 20);
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Floating indicator badge
    ctx.font = '900 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.fillText('⚡ STRIKE CORE! ⚡', 0, -radius - 8);

    ctx.restore();
  }

  function triggerBossDefeat() {
    if (isBossDefeated) return;
    isBossDefeated = true;
    isBossResolutionAnim = true;
    bossResolutionTimer = 0;
    activeWave = null;
    bossWaveTimer = 9999; // Halts any wave spawning
    isWeakPointExposed = false;

    // Remove all remaining active flying obstacles immediately
    gameObjects.length = 0;
    screenFlash = 1.0;
    screenShake = 22;

    if (bossHealthContainer) bossHealthContainer.classList.add('hidden');
    if (roundBanner) roundBanner.classList.add('hidden');

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 160,
        y: vighnasuraY + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7 - 2,
        size: Math.random() * 5 + 3,
        life: 2.5,
        decay: 0.015,
        color: Math.random() > 0.5 ? '#ffd700' : '#ff758f'
      });
    }

    floatingTexts.push({
      text: '✨ OBSTACLES DISSOLVING INTO PEACE ✨',
      x: width * 0.5,
      y: Math.min(height * 0.35, 210),
      color: '#ffd700',
      life: 2.8,
      scale: 1.6
    });

    updateHUD();
  }

  function showVictoryScreen() {
    isGameOver = true;
    isGameStarted = false;
    if (streak > bestStreak) bestStreak = streak;

    if (victoryScoreDisplay) victoryScoreDisplay.textContent = score;
    if (victoryRoundsDisplay) victoryRoundsDisplay.textContent = `${Math.max(1, currentRound - 1)} + BOSS`;
    if (victoryStreakDisplay) victoryStreakDisplay.textContent = `${bestStreak}x`;
    if (victoryComboDisplay) victoryComboDisplay.textContent = `${bestCombo}x`;

    if (victoryModal) victoryModal.classList.remove('hidden');
    if (roundBanner) roundBanner.classList.add('hidden');
    if (bossHealthContainer) bossHealthContainer.classList.add('hidden');
    if (ultimateBtn) ultimateBtn.classList.add('hidden');
  }

  function sliceObject(obj, sliceAngle = 0) {
    if (obj.isSliced) return;
    obj.isSliced = true;

    if (obj.category === 'good') {
      if (obj.waveId) {
        handleWaveItemResolution(obj.waveId, false);
      }

      currentStrokeSlices++;
      if (currentStrokeSlices > bestCombo) {
        bestCombo = currentStrokeSlices;
      }

      // Award score with streak multiplier bonus & drag stroke combo multiplier
      const streakMultiplier = 1 + Math.min(Math.floor(streak / 5), 3);
      const strokeComboMultiplier = Math.max(1, currentStrokeSlices);
      const earned = obj.points * streakMultiplier * strokeComboMultiplier;
      score += earned;
      streak++;
      const meterGain = isBossEncounter ? 35 : 14;
      streakMeter = Math.min(100, streakMeter + meterGain);

      // Floating score popup & combo announcement
      let popupLabel = `+${earned}`;
      let popupColor = '#ffb703';
      let popupScale = 1.2;

      if (strokeComboMultiplier >= 2) {
        popupLabel = `${strokeComboMultiplier}x COMBO! +${earned}`;
        popupColor = strokeComboMultiplier >= 3 ? '#ff007f' : '#fbbf24';
        popupScale = 1.5;

        // Extra celebratory multi-slice particles
        for (let k = 0; k < 6 * strokeComboMultiplier; k++) {
          particles.push({
            x: obj.x,
            y: obj.y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            size: Math.random() * 3.5 + 2,
            life: 0.9,
            decay: 0.04,
            color: Math.random() > 0.5 ? '#ffd700' : '#ff758f'
          });
        }
      }

      floatingTexts.push({
        text: popupLabel,
        x: obj.x,
        y: obj.y,
        color: popupColor,
        life: strokeComboMultiplier >= 2 ? 1.3 : 1.1,
        initialLife: strokeComboMultiplier >= 2 ? 1.3 : 1.1,
        scale: popupScale,
        isScore: true
      });

      playSliceSound(currentStrokeSlices);

      // Split cleanly into two halves heading down toward the thali plate
      const sepSpeed = 2.0;
      const tX = width / 2;
      const tRx = Math.min(width * 0.36, 145);
      const tRy = tRx * 0.40;
      const tY = height - tRy - Math.max(14, height * 0.02);

      slicedHalves.push({
        x: obj.x,
        y: obj.y,
        vx: -sepSpeed,
        vy: Math.min(obj.vy * 0.25, 0) - 2.0,
        rot: obj.rot,
        vRot: -1.8,
        type: obj.type,
        half: 'left',
        gravity: 580,
        targetX: tX + (Math.random() - 0.5) * (tRx * 1.1),
        targetY: tY + (Math.random() - 0.5) * (tRy * 0.7),
        life: 1.0
      }, {
        x: obj.x,
        y: obj.y,
        vx: sepSpeed,
        vy: Math.min(obj.vy * 0.25, 0) - 2.0,
        rot: obj.rot,
        vRot: 1.8,
        type: obj.type,
        half: 'right',
        gravity: 580,
        targetX: tX + (Math.random() - 0.5) * (tRx * 1.1),
        targetY: tY + (Math.random() - 0.5) * (tRy * 0.7),
        life: 1.0
      });

      // Particle burst: small colored shards matching the sacred offering
      const shardPalettes = {
        modak: ['#fdfbf7', '#fef3c7', '#fde68a', '#f59e0b', '#fffbeb'],
        laddoo: ['#fb923c', '#f59e0b', '#fbbf24', '#fef08a', '#ea580c'],
        flower: ['#ef4444', '#f43f5e', '#fb7185', '#ffd700', '#fda4af'],
        diya: ['#ea580c', '#f59e0b', '#fef08a', '#ca8a04', '#ffffff'],
        durva: ['#22c55e', '#16a34a', '#86efac', '#4ade80', '#fef08a']
      };
      const colors = shardPalettes[obj.type] || ['#ffb703', '#ffd166', '#ffffff'];
      const shardCount = 18;
      for (let i = 0; i < shardCount; i++) {
        const a = Math.random() * Math.PI * 2;
        const burstSpeed = Math.random() * 6.5 + 3.2;
        particles.push({
          x: obj.x,
          y: obj.y,
          vx: Math.cos(a) * burstSpeed,
          vy: Math.sin(a) * burstSpeed - 1.2,
          size: Math.random() * 4 + 2.5,
          life: 1.0,
          initialLife: 1.0,
          decay: 0.036 + Math.random() * 0.02,
          color: colors[Math.floor(Math.random() * colors.length)],
          isShard: true,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 14,
          aspect: 2.2 + Math.random() * 1.2
        });
      }
      if (particles.length > 180) particles.splice(0, particles.length - 180);
    } else {
      // Sliced Vighna Obstacle: Penalty & Miss!
      if (obj.waveId) {
        handleWaveItemResolution(obj.waveId, true);
      }

      currentStrokeSlices = 0; // Clears the current combo!
      streak = 0;
      streakMeter = Math.max(0, streakMeter - 35);
      screenShake = 18;
      screenFlashRed = 0.65; // Red screen flash on hit!
      playMissSound(true);

      // Dark smoke burst
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({
          x: obj.x,
          y: obj.y,
          vx: Math.cos(a) * (Math.random() * 6 + 1),
          vy: Math.sin(a) * (Math.random() * 6 + 1),
          size: Math.random() * 5 + 3,
          life: 1,
          decay: 0.03,
          color: Math.random() > 0.5 ? '#7f1d1d' : '#374151'
        });
      }

      recordMiss('vighna', obj.x, obj.y);
    }

    updateHUD();
  }

  // ==========================================================
  //  ULTIMATE POWER: GANESHA'S BLESSING
  // ==========================================================

  function triggerUltimate() {
    // Strictly verify game is active and meter is full (100%)
    if (isGameOver || streakMeter < 100) return false;

    // Trigger full-screen divine golden light flash
    screenFlash = 1.0;

    let clearedCount = 0;

    // Clear all currently active good objects on screen
    for (let i = 0; i < gameObjects.length; i++) {
      const obj = gameObjects[i];
      // CRITICAL: Only good objects! Vighna obstacles are completely unaffected.
      if (obj.category === 'good' && !obj.isSliced) {
        clearedCount++;
        obj.isSliced = true;
        if (obj.waveId) {
          handleWaveItemResolution(obj.waveId, false);
        }

        const earned = obj.points * 2; // Bonus score for ultimate clear
        score += earned;

        // Divine golden particle rays
        for (let j = 0; j < 12; j++) {
          const a = (j / 12) * Math.PI * 2;
          particles.push({
            x: obj.x,
            y: obj.y,
            vx: Math.cos(a) * 6.5,
            vy: Math.sin(a) * 6.5,
            size: 4,
            life: 1.0,
            decay: 0.025,
            color: '#fff2a3'
          });
        }

        floatingTexts.push({
          text: `+${earned}`,
          x: obj.x,
          y: obj.y - 10,
          color: '#ffd166',
          life: 1.1,
          scale: 1.3
        });

        // Split halves falling cleanly toward thali
        const sepSpeed = 2.0;
        const tX = width / 2;
        const tRx = Math.min(width * 0.36, 145);
        const tRy = tRx * 0.40;
        const tY = height - tRy - Math.max(14, height * 0.02);

        slicedHalves.push({
          x: obj.x,
          y: obj.y,
          vx: -sepSpeed,
          vy: -2.8,
          rot: obj.rot,
          vRot: -1.8,
          type: obj.type,
          half: 'left',
          gravity: 580,
          targetX: tX + (Math.random() - 0.5) * (tRx * 1.1),
          targetY: tY + (Math.random() - 0.5) * (tRy * 0.7),
          life: 1.0
        }, {
          x: obj.x,
          y: obj.y,
          vx: sepSpeed,
          vy: -2.8,
          rot: obj.rot,
          vRot: 1.8,
          type: obj.type,
          half: 'right',
          gravity: 580,
          targetX: tX + (Math.random() - 0.5) * (tRx * 1.1),
          targetY: tY + (Math.random() - 0.5) * (tRy * 0.7),
          life: 1.0
        });
      }
    }

    // If Ganesha's Blessing (Ultimate) is triggered while Vighnasura's weak point is exposed:
    // Deals a massive chunk of damage (50 HP) directly to his health bar!
    if (isBossEncounter && isWeakPointExposed && !weakPointSliced && !isBossDefeated) {
      weakPointSliced = true;
      isWeakPointExposed = false;
      const smiteDamage = bossUltimateDamage; // 50 HP
      bossHp = Math.max(0, bossHp - smiteDamage);
      bossFlinchTimer = 1.1;
      screenShake = 24;

      // Divine beam & particle surge between Ganesha and Vighnasura
      for (let i = 0; i < 36; i++) {
        const pFrac = Math.random();
        particles.push({
          x: width * 0.5 + (Math.random() - 0.5) * 60,
          y: height * 0.7 - pFrac * (height * 0.45),
          vx: (Math.random() - 0.5) * 7,
          vy: -Math.random() * 8 - 4,
          size: Math.random() * 5 + 3,
          life: 1.4,
          decay: 0.02,
          color: Math.random() > 0.4 ? '#38bdf8' : '#ffd700'
        });
      }

      floatingTexts.push({
        text: `𑁍 DIVINE SMITE! -${smiteDamage} HP 𑁍`,
        x: width * 0.5,
        y: weakPointY - 35,
        color: '#38bdf8',
        life: 2.2,
        scale: 1.8
      });

      updateHUD();

      if (bossHp <= 0) {
        triggerBossDefeat();
      }
    }

    // Divine Announcement Text
    floatingTexts.push({
      text: "𑁍 GANESHA'S BLESSING! 𑁍",
      x: width * 0.5,
      y: height * 0.32,
      color: '#fff2a3',
      life: 1.6,
      scale: 1.8
    });

    // Reset streak meter to 0
    streakMeter = 0;
    updateHUD();

    return true;
  }

  // Bind Ultimate Button
  if (ultimateBtn) {
    ultimateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerUltimate();
    });
  }

  // Keyboard shortcut: Space activates ultimate when ready
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      triggerUltimate();
    }
  });

  // ==========================================================
  //  MAIN GAME / ANIMATION LOOP
  // ==========================================================

  function gameLoop(timestamp) {
    const time = timestamp / 1000;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // --- Performance / FPS Counter ---
    frameCount++;
    fpsTimer += dt;
    if (fpsTimer >= 0.5) {
      currentFps = Math.round(frameCount / fpsTimer);
      if (fpsDisplay) {
        fpsDisplay.textContent = `FPS: ${currentFps}`;
        fpsDisplay.style.color = currentFps >= 50 ? '#22c55e' : '#eab308';
      }
      frameCount = 0;
      fpsTimer = 0;
    }

    // --- Smooth Screen Shake (Capped Against Jank) ---
    ctx.save();
    if (screenShake > 0) {
      // Hard-cap maximum shake amplitude so it never feels janky or disorienting
      const cappedShake = Math.min(screenShake, 16);
      // Damped harmonic 2D oscillation for organic impact feel
      const sx = Math.sin(time * 26) * cappedShake * 0.72;
      const sy = Math.cos(time * 34) * cappedShake * 0.72;
      ctx.translate(sx, sy);
      screenShake = Math.max(0, screenShake - 32 * dt);
    }

    // --- Subtle Indian Dhol Percussion Loop ---
    updateDhol(dt);

    // 1. Clear Canvas each frame
    ctx.clearRect(0, 0, width, height);

    // Render warm pandal-style background (marigold gradient, decorative canopy, twinkling fairy lights)
    drawPandalBackground(ctx, width, height, time);

    // 2. Compute Responsive Layout for Ganesha & Thali Plate
    const isPortrait = height > width;
    const baseDimension = isPortrait ? width : Math.min(width, height * 1.3);
    const ganeshaScale = Math.min(Math.max(baseDimension / 620, 0.62), 1.15);

    // Thali plate dimensions at bottom-center
    const thaliX = width / 2;
    const thaliRx = Math.min(width * 0.36, 145);
    const thaliRy = thaliRx * 0.40;
    const thaliY = height - thaliRy - Math.max(14, height * 0.02);

    // Ganesha position: seated presiding right behind the thali plate
    const ganeshaX = width / 2;
    const ganeshaY = thaliY - thaliRy - (48 * ganeshaScale);

    // --- Offering Ceremony Animation Routine ---
    if (isOfferingAnimation) {
      offeringAnimTimer += dt;
      const targetRise = (ganeshaY - thaliY + 38);

      if (offeringAnimTimer < 0.9) {
        // Phase 1: Thali smoothly moves up to Ganesha
        const p = offeringAnimTimer / 0.9;
        const ease = 0.5 - Math.cos(p * Math.PI) / 2;
        thaliAnimOffsetY = targetRise * ease;
      } else if (offeringAnimTimer < 2.0) {
        // Phase 2: Thali rests by Ganesha, Ganesha acknowledges with happy bounce & golden glow!
        thaliAnimOffsetY = targetRise;
        const ackTime = offeringAnimTimer - 0.9;
        ganeshaHappyBounce = Math.sin(ackTime * Math.PI * 4) * 12;
        ganeshaAuraBoost = Math.sin(ackTime * Math.PI * 2) * 1.5;

        // Dissolve / absorb offerings into divine light
        if (offeringAnimTimer >= 1.3 && thaliOfferings.length > 0) {
          for (let o of thaliOfferings) {
            for (let k = 0; k < 2; k++) {
              particles.push({
                x: thaliX + o.relX,
                y: (thaliY + thaliAnimOffsetY) + o.relY,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 4 - 2,
                size: 3,
                life: 0.7,
                decay: 0.04,
                color: '#ffd166'
              });
            }
          }
          thaliOfferings.length = 0; // Emptied into Ganesha's blessing
        }

        if (ackTime >= 0.05 && ackTime < 0.12) {
          floatingTexts.push({
            text: '✨ OFFERING ACCEPTED! ✨',
            x: width / 2,
            y: ganeshaY - 95,
            color: '#ffd700',
            life: 1.5,
            scale: 1.6
          });
        }
      } else if (offeringAnimTimer < 2.8) {
        // Phase 3: Empty thali returns back down to bottom position
        const p = (offeringAnimTimer - 2.0) / 0.8;
        const easeReturn = 1 - (0.5 - Math.cos(p * Math.PI) / 2);
        thaliAnimOffsetY = targetRise * easeReturn;
        ganeshaHappyBounce *= 0.85;
        ganeshaAuraBoost *= 0.85;
      } else {
        // Phase 4: Animation Complete -> Next Round or Boss Encounter starts!
        isOfferingAnimation = false;
        thaliAnimOffsetY = 0;
        ganeshaHappyBounce = 0;
        ganeshaAuraBoost = 0;
        thaliFullness = 0; // Empty thali ready to fill again!

        if (currentRound === 3) {
          // After 3rd thali completed (end of Level 3): Trigger Boss Encounter!
          currentRound = 4;
          triggerBossIntro();
        } else {
          currentRound++;
          updateHUD();

          // Display Round Banner
          if (roundBanner) {
            if (roundBannerBadge) roundBannerBadge.textContent = `ROUND ${currentRound}`;
            if (roundBannerTitle) roundBannerTitle.textContent = 'DIFFICULTY INCREASED';
            if (roundBannerSub) roundBannerSub.textContent = 'Faster Offerings • More Vighna Obstacles';
            roundBanner.classList.remove('hidden');
            setTimeout(() => {
              if (roundBanner && !isGameOver) roundBanner.classList.add('hidden');
            }, 2400);
          }
        }
      }
    }

    // --- Boss Encounter Routine & Vighnasura Animation ---
    if (isBossEncounter) {
      if (isBossIntro) {
        bossIntroTimer += dt;
        bossDarkness = Math.min(0.72, bossIntroTimer * 0.42);

        // Smooth descent from above canvas into top half
        const targetY = Math.min(height * 0.25, 170);
        const p = Math.min(1, bossIntroTimer / 2.0);
        const ease = 0.5 - Math.cos(p * Math.PI) / 2;
        vighnasuraY = -280 + (targetY - (-280)) * ease;

        if (bossIntroTimer >= 3.6) {
          isBossIntro = false;
          bossWaveTimer = 1.6;
          updateHUD();
        }
      } else if (isBossResolutionAnim) {
        bossResolutionTimer += dt;
        const crumbleProgress = Math.min(1, bossResolutionTimer / 2.8);
        const vAlpha = Math.max(0, 1 - crumbleProgress);

        // Background darkness eases back down to 0 (warm festive sanctuary lighting)
        bossDarkness = Math.max(0, 0.72 * (1 - bossResolutionTimer / 2.4));

        // Ganesha radiates serene blessing glow
        ganeshaBlessingGlow = Math.min(1.2, Math.sin(bossResolutionTimer * 2.0) * 0.3 + 0.9);

        // Continuously spawn gentle dissolving motes and flower petals
        if (bossResolutionTimer < 2.8 && Math.random() < 0.6) {
          for (let k = 0; k < 3; k++) {
            particles.push({
              x: width * 0.5 + (Math.random() - 0.5) * (140 * (1 - crumbleProgress * 0.5)),
              y: vighnasuraY + (Math.random() - 0.5) * (90 * (1 - crumbleProgress * 0.5)),
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2.5 - 0.6,
              size: Math.random() * 4 + 2,
              life: 1.6,
              decay: 0.02,
              color: Math.random() > 0.4 ? '#ffd700' : (Math.random() > 0.5 ? '#ff758f' : '#ffffff')
            });
          }
        }

        // Render Vighnasura gently crumbling / dissolving into light
        if (vAlpha > 0.01) {
          drawVighnasura(ctx, width * 0.5, vighnasuraY, ganeshaScale * (1 + crumbleProgress * 0.08), time, 0, vAlpha);
        }

        // Once resolution animation finishes -> transition to Victory screen!
        if (bossResolutionTimer >= bossResolutionDuration) {
          isBossResolutionAnim = false;
          showVictoryScreen();
        }
      } else if (isBossDefeated) {
        bossDarkness = 0;
      } else {
        bossDarkness = 0.72;
      }

      if (!isBossResolutionAnim && !isBossDefeated) {
        // Render Vighnasura floating in the top half of the screen
        if (bossFlinchTimer > 0) bossFlinchTimer = Math.max(0, bossFlinchTimer - dt);
        const vHover = Math.sin(time * 2.2) * 7;
        drawVighnasura(ctx, width * 0.5, vighnasuraY + vHover, ganeshaScale * 1.05, time, bossFlinchTimer, 1.0);

        // Update dynamic weak point coordinates locked to Vighnasura's chest core
        weakPointX = width * 0.5;
        weakPointY = vighnasuraY + vHover + (8 * ganeshaScale * 1.05);
        weakPointRadius = 38 * ganeshaScale;

        if (isWeakPointExposed) {
          weakPointTimer -= dt;
          if (weakPointTimer <= 0) {
            isWeakPointExposed = false;
          } else if (!weakPointSliced) {
            drawWeakPoint(ctx, weakPointX, weakPointY, weakPointRadius, weakPointTimer, weakPointDuration, time);
          }
        }
      }
    }

    // 3. Render Ganesha Character with idle animation
    drawGanesha(ctx, ganeshaX, ganeshaY, ganeshaScale, time);

    // 4. Render Bottom-Center Thali Plate
    drawThali(ctx, thaliX, thaliY, thaliRx, thaliRy);

    // 5. Spawn & Update Flying Game Objects
    if (!isGameOver && !isOfferingAnimation && isGameStarted && !isBossIntro && !isBossDefeated && !isBossResolutionAnim) {
      if (isBossEncounter) {
        if (!isBossDefeated) {
          if (!activeWave) {
            bossWaveTimer -= dt;
            if (bossWaveTimer <= 0) {
              spawnBossWave();
            }
          }
        }
      } else {
        gameTime += dt;
        if (!hasShownControlHint && isGameStarted && gameTime > 5.0) {
          dismissControlHint();
        }
        const timeRamp = Math.min(0.45, gameTime * 0.0035);
        const currentSpawnInterval = Math.max(0.95, spawnInterval - (currentRound - 1) * 0.18 - timeRamp);
        spawnTimer += dt;
        if (spawnTimer >= currentSpawnInterval) {
          spawnTimer = 0;
          const count = Math.random() > 0.4 ? 2 : 1;
          for (let i = 0; i < count; i++) {
            setTimeout(() => { if (!isGameOver && !isOfferingAnimation && isGameStarted && !isBossEncounter) spawnObject(); }, i * 220);
          }
        }
      }
    }

    // Update & Render Game Objects
    for (let i = gameObjects.length - 1; i >= 0; i--) {
      const obj = gameObjects[i];
      if (!obj) continue;

      // Physics
      obj.vy += obj.gravity * dt;
      obj.x += obj.vx * 60 * dt;
      obj.y += obj.vy * dt;
      obj.rot += obj.vRot * dt;

      // Check drop past bottom
      if (obj.y > height + 70) {
        if (obj.category === 'good' && !obj.isSliced) {
          // Miss penalty: resets combo, reduces streak meter by 20% & records a miss
          currentStrokeSlices = 0;
          streak = 0;
          streakMeter = Math.max(0, streakMeter - 20);
          screenShake = 10;
          screenFlashRed = 0.35; // Red screen flash on hit!
          recordMiss('dropped', obj.x, height - 40);
          if (obj.waveId) {
            handleWaveItemResolution(obj.waveId, true);
          }
          updateHUD();
        } else if (obj.category === 'obstacle' && !obj.isSliced) {
          // Obstacle avoided safely!
          if (obj.waveId) {
            handleWaveItemResolution(obj.waveId, false);
          }
        }
        gameObjects.splice(i, 1);
        continue;
      }

      if (obj.isSliced) {
        gameObjects.splice(i, 1);
        continue;
      }

      // Render Object
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rot);

      if (obj.type === 'modak') drawModak(ctx);
      else if (obj.type === 'laddoo') drawLaddoo(ctx);
      else if (obj.type === 'flower') drawFlower(ctx);
      else if (obj.type === 'diya') drawDiya(ctx);
      else if (obj.type === 'durva') drawDurva(ctx);
      else if (obj.type === 'vighna') drawVighnaObstacle(ctx, time);

      ctx.restore();
    }

    // 6. Update & Render Sliced Halves
    for (let i = slicedHalves.length - 1; i >= 0; i--) {
      const h = slicedHalves[i];
      h.vy += h.gravity * dt;

      // Clean natural trajectory without any zigzag/oscillation:
      // Air resistance smoothly dampens the outward separation burst
      h.vx *= Math.max(0, 1 - 2.0 * dt);
      // Smooth monotonic easing toward thali landing position (no overshoot, zero zigzag)
      if (h.targetX !== undefined) {
        h.x += (h.targetX - h.x) * Math.min(1, 2.0 * dt);
      }

      h.x += h.vx * 60 * dt;
      h.y += h.vy * dt;
      h.rot += h.vRot * dt;

      // Check landing into thali plate
      if (h.targetY !== undefined && h.y >= h.targetY) {
        // Collect into thali! +5% fullness per half (= +10% per whole sliced item)
        thaliFullness = Math.min(100, thaliFullness + 5);

        // Add to persistent resting offerings on thali plate
        if (thaliOfferings.length < 35) {
          thaliOfferings.push({
            type: h.type,
            half: h.half,
            relX: Math.max(-thaliRx * 0.72, Math.min(thaliRx * 0.72, h.targetX - thaliX)),
            relY: Math.max(-thaliRy * 0.55, Math.min(thaliRy * 0.55, h.targetY - thaliY)),
            rot: h.rot,
            scale: 0.72,
            bounce: 5
          });
        }

        // Small golden landing splash sparks
        for (let s = 0; s < 4; s++) {
          particles.push({
            x: h.x,
            y: h.y,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 2.5,
            size: 2.5,
            life: 0.5,
            decay: 0.05,
            color: '#ffd166'
          });
        }

        updateHUD();
        playThaliDropSound();

        // Check if thali became full (100%) -> Trigger Offering Animation!
        if (thaliFullness >= 100 && !isOfferingAnimation && !isGameOver) {
          triggerOfferingAnimation();
        }

        slicedHalves.splice(i, 1);
        continue;
      }

      if (h.y > height + 80) {
        slicedHalves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.rot);

      if (h.type === 'modak') drawModak(ctx, h.half);
      else if (h.type === 'laddoo') drawLaddoo(ctx, h.half);
      else if (h.type === 'flower') drawFlower(ctx, h.half);
      else if (h.type === 'diya') drawDiya(ctx, h.half);
      else if (h.type === 'durva') drawDurva(ctx, h.half);

      ctx.restore();
    }

    // 7. Render Interactive Ankusha Power Trail & FX
    drawAnkushaTrail();

    // 8. Render Floating Texts (Score & Alerts with Spring Pop-Up Animation)
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      const maxLife = ft.initialLife || 1.1;
      const progress = Math.max(0, Math.min(1, 1 - (ft.life / maxLife)));

      // Upward floating physics with gentle deceleration
      ft.y -= (38 * (1 - progress * 0.45)) * dt;
      ft.life -= dt * 1.1;

      if (ft.life <= 0) {
        floatingTexts.splice(i, 1);
        continue;
      }

      // Spring pop-up scale curve: starts with a punchy bounce and settles
      const springFactor = Math.sin(Math.min(1, progress * 3.2) * Math.PI * 0.5);
      const popBounce = Math.sin(Math.min(1, progress * 2.8) * Math.PI) * 0.42;
      const currentScale = (ft.scale || 1.0) * (springFactor + popBounce);

      ctx.save();
      ctx.font = `900 ${Math.max(12, Math.round(18 * currentScale))}px Outfit, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color || '#ffb703';
      const alpha = progress > 0.7 ? (1 - progress) / 0.3 : 1.0;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.shadowColor = ft.color || '#ffb703';
      ctx.shadowBlur = 12;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 9. Render Divine Ultimate Screen Flash Overlay
    if (screenFlash > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 220, 100, ${screenFlash * 0.55})`;
      fillSafeRect(ctx, 0, 0, width, height);
      screenFlash = Math.max(0, screenFlash - dt * 1.8);
      ctx.restore();
    }

    // Render Red Damage / Miss Screen Flash Overlay
    if (screenFlashRed > 0) {
      ctx.save();
      ctx.fillStyle = `rgba(239, 68, 68, ${screenFlashRed * 0.45})`;
      fillSafeRect(ctx, 0, 0, width, height);
      screenFlashRed = Math.max(0, screenFlashRed - dt * 2.2);
      ctx.restore();
    }

    ctx.restore(); // Restore screen shake

    // 10. Request next frame
    requestAnimationFrame(gameLoop);
  }

  // Initial HUD update
  updateHUD();

  // Expose engine controls for testing & verification
  window.gameEngine = {
    getScore: () => score,
    getStreak: () => streak,
    getStreakMeter: () => streakMeter,
    setStreakMeter: (val) => { streakMeter = Math.min(100, Math.max(0, val)); updateHUD(); },
    getMisses: () => misses,
    isGameOver: () => isGameOver,
    isGameStarted: () => isGameStarted,
    startGame: () => startGame(),
    getBestCombo: () => bestCombo,
    getCurrentStrokeSlices: () => currentStrokeSlices,
    getGameTime: () => gameTime,
    recordMiss: (reason, x, y) => recordMiss(reason, x, y),
    restartGame: () => restartGame(),
    getCurrentRound: () => currentRound,
    isOfferingAnimation: () => isOfferingAnimation,
    getThaliAnimOffsetY: () => thaliAnimOffsetY,
    triggerOfferingAnimation: () => triggerOfferingAnimation(),
    getThaliFullness: () => thaliFullness,
    getThaliOfferings: () => thaliOfferings,
    setThaliFullness: (val) => {
      thaliFullness = Math.min(100, Math.max(0, val));
      updateHUD();
      if (thaliFullness >= 100 && !isOfferingAnimation && !isGameOver) {
        triggerOfferingAnimation();
      }
    },
    triggerUltimate: () => triggerUltimate(),
    getGameObjects: () => gameObjects,
    getSlicedHalves: () => slicedHalves,
    spawnObject: (type) => spawnObject(type),
    sliceObject: (obj, angle) => sliceObject(obj, angle),
    isUltimateReady: () => streakMeter >= 100,
    isBossEncounter: () => isBossEncounter,
    isBossIntro: () => isBossIntro,
    getBossDarkness: () => bossDarkness,
    getVighnasuraY: () => vighnasuraY,
    triggerBossIntro: (isRetry) => triggerBossIntro(isRetry),
    retryBossCheckpoint: () => retryBossCheckpoint(),
    getBossCheckpoint: () => bossCheckpoint,
    hasBossCheckpoint: () => bossCheckpoint !== null,
    triggerGameOver: () => triggerGameOver(),
    getBossHp: () => bossHp,
    getBossMaxHp: () => bossMaxHp,
    getBossWaveNumber: () => bossWaveNumber,
    getActiveWave: () => activeWave,
    spawnBossWave: (w) => spawnBossWave(w),
    isBossDefeated: () => isBossDefeated,
    setBossHp: (val) => { bossHp = val; updateHUD(); },
    isWeakPointExposed: () => isWeakPointExposed,
    getWeakPointTimer: () => weakPointTimer,
    exposeWeakPoint: () => exposeWeakPoint(),
    sliceWeakPoint: (angle) => sliceWeakPoint(angle),
    getWeakPointPos: () => ({ x: weakPointX, y: weakPointY, radius: weakPointRadius }),
    isBossResolutionAnim: () => isBossResolutionAnim,
    getBossResolutionTimer: () => bossResolutionTimer,
    showVictoryScreen: () => showVictoryScreen(),
    triggerBossDefeat: () => triggerBossDefeat(),
    drawVighnasura: (c, x, y, s, t, f, o) => drawVighnasura(c, x, y, s, t, f, o),
    drawPandalBackground: (c, w, h, t) => drawPandalBackground(c, w, h, t),
    initAudio: () => initAudio(),
    toggleSound: () => toggleSound(),
    isSoundMuted: () => isSoundMuted,
    playSliceSound: (c) => playSliceSound(c),
    playMissSound: (v) => playMissSound(v),
    playThaliDropSound: () => playThaliDropSound(),
    dismissControlHint: () => dismissControlHint(),
    hasShownControlHint: () => hasShownControlHint,
    getControlHintNote: () => controlHintNote,
    handleResize: () => handleResize(),
    getViewportDimensions: () => ({ width, height, dpr })
  };

  // Start the engine loop
  requestAnimationFrame(gameLoop);
})();
