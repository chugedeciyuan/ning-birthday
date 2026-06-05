const letterLines = [
  "其实想了很久该写些什么。",
  "后来发现，比起漂亮的话，",
  "我更想认真地祝你一句生日快乐。",
  "最近发生了一些事情，",
  "但今天不想说那些。",
  "只希望未来的日子里，",
  "你能过得轻松一点，",
  "自由一点，",
  "愿 22 岁的你,",
  "拥有比 21 岁更多的幸运。",
  "生日快乐，宁宁。"
];

const signatureText = "—— 景轩";
const typingSpeed = 88;
const linePause = 380;
const letterAppearDelay = 1540;
const typingStartDelay = 2560;

const pageShell = document.getElementById("page-shell");
const sceneLetter = document.getElementById("scene-letter");
const sceneRoom = document.getElementById("scene-room");
const envelope = document.getElementById("envelope");
const message = document.getElementById("message");
const signature = document.getElementById("signature");
const letterReader = document.getElementById("letter-reader");
const letterScroll = document.getElementById("letter-scroll");
const scrollIndicator = document.querySelector(".scroll-indicator");
const scrollThumb = document.getElementById("scroll-thumb");
const letterAction = document.getElementById("letter-action");
const letterClose = document.getElementById("letter-close");
const peekButton = document.getElementById("peek-button");
const petalsContainer = document.getElementById("petals");
const musicToggle = document.getElementById("music-toggle");
const roomPrompt = document.getElementById("room-prompt");
const jasmine = document.getElementById("jasmine");
const lampBulbButton = document.getElementById("lamp-bulb-button");
const candleButton = document.getElementById("candle-button");
const cake = document.querySelector(".cake");
const giftBoxToggle = document.getElementById("gift-box-toggle");
const deskLetterToggle = document.getElementById("desk-letter-toggle");
const giftModal = document.getElementById("gift-modal");
const giftShowcase = document.getElementById("gift-showcase");
const giftPrompt = document.getElementById("gift-prompt");
const watchHandHour = document.getElementById("watch-hand-hour");
const watchHandMinute = document.getElementById("watch-hand-minute");
const watchHandSecond = document.getElementById("watch-hand-second");
const confettiCanvas = document.getElementById("confetti-canvas");
const birthdayFinale = document.getElementById("birthday-finale");
const initialScene = new URLSearchParams(window.location.search).get("scene");

const duplicateDeskVase = document.querySelector(".desk > .desk-vase");
if (duplicateDeskVase && duplicateDeskVase !== jasmine) {
  duplicateDeskVase.remove();
}

if (jasmine) {
  jasmine.setAttribute("aria-label", "点击茉莉花");
  const jasmineNote = jasmine.querySelector(".jasmine-note");
  if (jasmineNote) {
    jasmineNote.textContent = "我是茉莉花哦~";
  }
}

let hasOpenedLetter = false;
let letterCanNavigate = false;
let roomSceneEntered = false;
let roomStep = "lamp";

const letterTimers = [];
const roomTimers = [];
let letterSequenceId = 0;
let jasmineNoteTimer = 0;
const confettiState = {
  ctx: confettiCanvas.getContext("2d"),
  particles: [],
  rafId: 0,
  burstUntil: 0
};

const musicState = {
  desired: true,
  isRunning: false,
  audio: null,
  context: null,
  masterGain: null,
  loopTimer: null
};

const composition = [
  {
    chord: [57, 60, 64, 67],
    melody: [
      [72, 0.0, 0.95],
      [74, 1.1, 0.7],
      [76, 2.15, 0.65],
      [79, 3.0, 1.2]
    ]
  },
  {
    chord: [55, 59, 62, 67],
    melody: [
      [71, 0.0, 0.75],
      [72, 0.95, 0.65],
      [74, 2.05, 0.8],
      [76, 3.1, 0.95]
    ]
  },
  {
    chord: [53, 57, 60, 64],
    melody: [
      [69, 0.0, 0.75],
      [72, 1.1, 0.7],
      [74, 2.1, 0.65],
      [76, 3.15, 1.0]
    ]
  },
  {
    chord: [55, 59, 62, 67],
    melody: [
      [67, 0.0, 0.85],
      [71, 1.0, 0.7],
      [72, 2.1, 0.6],
      [74, 3.0, 1.1]
    ]
  }
];

createPetals(18);
syncLetterScroll();
updateScrollIndicator();
updateMusicButton();
resizeConfettiCanvas();
setRoomStep("lamp");
setRoomPrompt("先关灯吧");
updateWatchHands();
window.setInterval(updateWatchHands, 80);

if (initialScene === "room") {
  letterCanNavigate = true;
  enterRoomScene();
}

window.addEventListener("load", () => {
  void setMusicEnabled(true);
});

window.addEventListener("resize", () => {
  resizeConfettiCanvas();
  updateScrollIndicator();
});

document.addEventListener("pointerdown", (event) => {
  if (event.target instanceof Node && musicToggle.contains(event.target)) {
    return;
  }

  void tryResumeMusic();
}, { passive: true });

musicToggle.addEventListener("click", async () => {
  await setMusicEnabled(!musicState.desired);
});

letterScroll.addEventListener("scroll", updateScrollIndicator, { passive: true });

envelope.addEventListener("click", () => {
  if (hasOpenedLetter) {
    return;
  }

  startLetterSequence();
});

peekButton.addEventListener("click", enterRoomScene);
message.addEventListener("click", enterRoomScene);
signature.addEventListener("click", enterRoomScene);
letterClose.addEventListener("click", closeDeskLetterView);
deskLetterToggle.addEventListener("click", openDeskLetterView);
giftBoxToggle.addEventListener("click", toggleGiftModal);
giftShowcase.addEventListener("click", handleGiftShowcaseClick);
jasmine.addEventListener("click", showJasmineNote);

lampBulbButton.addEventListener("click", () => {
  if (!roomSceneEntered || roomStep !== "lamp") {
    return;
  }

  sceneRoom.classList.add("lights-off");
  setRoomStep("candle");
  setRoomPrompt("点蜡烛吧");
});

candleButton.addEventListener("click", handleCandleInteraction);
cake.addEventListener("click", handleCandleInteraction);

function handleCandleInteraction() {
  if (roomStep === "candle") {
    igniteCandle();
    return;
  }

  if (roomStep === "blow") {
    blowOutCandle();
  }
}

function igniteCandle() {
  if (!roomSceneEntered || roomStep !== "candle") {
    return;
  }

  sceneRoom.classList.add("candle-lit");
  setRoomStep("wish");
  setRoomPrompt("闭上眼，许个愿吧");

  scheduleTimer(() => {
    if (!roomSceneEntered || roomStep !== "wish") {
      return;
    }

    setRoomStep("blow");
    setRoomPrompt("点击吹灭蜡烛吧");
  }, 7000);
}

function blowOutCandle() {
  if (!roomSceneEntered || roomStep !== "blow") {
    return;
  }

  sceneRoom.classList.remove("lights-off", "candle-lit");
  sceneRoom.classList.add("celebrating");
  setRoomStep("done");
  setRoomPrompt("快拆开你的生日礼物吧~");
  giftBoxToggle.classList.add("is-nudging");
  birthdayFinale.setAttribute("aria-hidden", "false");
  startConfettiBurst();
}

function enterRoomScene() {
  if (!letterCanNavigate || roomSceneEntered) {
    return;
  }

  roomSceneEntered = true;
  pageShell.classList.add("room-active");
  sceneLetter.setAttribute("aria-hidden", "true");
  sceneRoom.setAttribute("aria-hidden", "false");
  sceneRoom.classList.remove("lights-off", "candle-lit", "celebrating");
  giftBoxToggle.classList.remove("is-nudging");
  pageShell.classList.remove("desk-letter-open", "desk-letter-closing", "gift-open", "gift-opened");
  setRoomStep("lamp");
  setRoomPrompt("先关灯吧");
  birthdayFinale.setAttribute("aria-hidden", "true");
  void tryResumeMusic();
  resizeConfettiCanvas();
}

function openDeskLetterView() {
  if (!roomSceneEntered || !letterCanNavigate) {
    return;
  }

  hideJasmineNote();
  closeGiftModal();
  pageShell.classList.remove("desk-letter-closing");
  pageShell.classList.add("desk-letter-open");
  sceneLetter.setAttribute("aria-hidden", "false");
  startLetterSequence({ preserveNavigation: true, autoplay: true });
}

function closeDeskLetterView() {
  if (!pageShell.classList.contains("desk-letter-open")) {
    return;
  }

  cancelLetterSequence();
  pageShell.classList.remove("desk-letter-open");
  pageShell.classList.add("desk-letter-closing");

  scheduleLetterTimer(() => {
    pageShell.classList.remove("desk-letter-closing");
    sceneLetter.setAttribute("aria-hidden", "true");
    resetLetterScene({ preserveNavigation: true });
  }, 620);
}

function toggleGiftModal() {
  if (!roomSceneEntered) {
    return;
  }

  if (pageShell.classList.contains("gift-open")) {
    closeGiftModal();
    return;
  }

  hideJasmineNote();
  closeDeskLetterView();
  giftBoxToggle.classList.remove("is-nudging");
  hideRoomPrompt();
  pageShell.classList.remove("gift-opened");
  pageShell.classList.add("gift-open");
  giftModal.setAttribute("aria-hidden", "false");
  if (giftPrompt) {
    giftPrompt.textContent = "打开它吧";
  }
  giftShowcase.setAttribute("aria-label", "打开礼物盒");
}

function handleGiftShowcaseClick() {
  if (!pageShell.classList.contains("gift-open")) {
    return;
  }

  if (!pageShell.classList.contains("gift-opened")) {
    pageShell.classList.add("gift-opened");
    if (giftPrompt) {
      giftPrompt.textContent = "";
    }
    giftShowcase.setAttribute("aria-label", "关闭礼物盒");
    return;
  }

  closeGiftModal();
}

function closeGiftModal() {
  pageShell.classList.remove("gift-opened");
  pageShell.classList.remove("gift-open");
  giftModal.setAttribute("aria-hidden", "true");
  if (giftPrompt) {
    giftPrompt.textContent = "打开它吧";
  }
  giftShowcase.setAttribute("aria-label", "打开礼物盒");
}

function showJasmineNote() {
  if (!roomSceneEntered) {
    return;
  }

  hideJasmineNote();
  jasmine.classList.add("is-reacting");
  jasmineNoteTimer = window.setTimeout(() => {
    jasmine.classList.remove("is-reacting");
    jasmineNoteTimer = 0;
  }, 1700);
}

function hideJasmineNote() {
  if (jasmineNoteTimer) {
    window.clearTimeout(jasmineNoteTimer);
    jasmineNoteTimer = 0;
  }

  jasmine.classList.remove("is-reacting");
}

function setRoomStep(step) {
  roomStep = step;
  sceneRoom.dataset.step = step;
}

function setRoomPrompt(text) {
  roomPrompt.textContent = text;
  roomPrompt.classList.remove("is-hidden", "is-visible");
  void roomPrompt.offsetWidth;
  roomPrompt.classList.add("is-visible");
}

function hideRoomPrompt() {
  roomPrompt.classList.remove("is-visible");
  roomPrompt.classList.add("is-hidden");
}

function scheduleTimer(callback, delay) {
  const timerId = window.setTimeout(callback, delay);
  roomTimers.push(timerId);
  return timerId;
}

function scheduleLetterTimer(callback, delay) {
  const timerId = window.setTimeout(callback, delay);
  letterTimers.push(timerId);
  return timerId;
}

function clearTimers(timerStore) {
  while (timerStore.length > 0) {
    window.clearTimeout(timerStore.pop());
  }
}

function cancelLetterSequence() {
  letterSequenceId += 1;
  clearTimers(letterTimers);
}

function resetLetterScene(options = {}) {
  const { preserveNavigation = false } = options;

  cancelLetterSequence();
  hasOpenedLetter = false;

  if (!preserveNavigation) {
    letterCanNavigate = false;
  }

  sceneLetter.classList.remove("opening", "revealed", "reading", "writing", "route-ready");
  message.textContent = "";
  signature.textContent = "";
  message.classList.remove("is-navigable");
  signature.classList.remove("is-navigable");
  letterScroll.scrollTop = 0;
  updateScrollIndicator();
}

function startLetterSequence(options = {}) {
  const { preserveNavigation = false, autoplay = false } = options;

  resetLetterScene({ preserveNavigation });
  const sequenceId = ++letterSequenceId;

  const beginSequence = () => {
    if (sequenceId !== letterSequenceId) {
      return;
    }

    hasOpenedLetter = true;
    sceneLetter.classList.add("opening");
    void tryResumeMusic();

    scheduleLetterTimer(() => {
      if (sequenceId !== letterSequenceId) {
        return;
      }

      sceneLetter.classList.add("revealed");
    }, letterAppearDelay);

    scheduleLetterTimer(async () => {
      if (sequenceId !== letterSequenceId) {
        return;
      }

      sceneLetter.classList.add("reading");
      const completed = await runTypewriter(letterLines, message, typingSpeed, linePause, sequenceId);

      if (!completed || sequenceId !== letterSequenceId) {
        return;
      }

      signature.textContent = signatureText;
      sceneLetter.classList.add("writing", "route-ready");
      message.classList.add("is-navigable");
      signature.classList.add("is-navigable");
      letterCanNavigate = true;
      syncLetterScroll();
    }, typingStartDelay);
  };

  if (autoplay) {
    scheduleLetterTimer(beginSequence, 120);
    return;
  }

  beginSequence();
}

function updateWatchHands() {
  if (!watchHandHour || !watchHandMinute || !watchHandSecond) {
    return;
  }

  const now = new Date();
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  const hourRotation = hours * 30;
  const minuteRotation = minutes * 6;
  const secondRotation = seconds * 6;

  watchHandHour.style.transform = `translateX(-50%) rotate(${hourRotation}deg)`;
  watchHandMinute.style.transform = `translateX(-50%) rotate(${minuteRotation}deg)`;
  watchHandSecond.style.transform = `translateX(-50%) rotate(${secondRotation}deg)`;
}

function createPetals(count) {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < count; index += 1) {
    const petal = document.createElement("span");
    const fallDuration = random(12, 22);
    const swayDuration = random(4, 7);
    const spinDuration = random(7, 12);

    petal.className = "petal";
    petal.style.left = `${random(-8, 108)}vw`;
    petal.style.animationDuration = `${fallDuration}s, ${swayDuration}s, ${spinDuration}s`;
    petal.style.animationDelay = `${random(-18, 0)}s, ${random(-8, 0)}s, ${random(-6, 0)}s`;
    petal.style.opacity = `${random(0.34, 0.76)}`;
    petal.style.width = `${random(12, 20)}px`;
    petal.style.height = `${random(18, 28)}px`;

    fragment.appendChild(petal);
  }

  petalsContainer.appendChild(fragment);
}

async function runTypewriter(lines, target, speed, pause, sequenceId = letterSequenceId) {
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  target.textContent = "";
  target.appendChild(cursor);
  updateScrollIndicator();

  for (const line of lines) {
    for (const char of line) {
      if (sequenceId !== letterSequenceId) {
        cursor.remove();
        return false;
      }

      cursor.insertAdjacentText("beforebegin", char);
      syncLetterScroll();
      await wait(speed);
    }

    if (sequenceId !== letterSequenceId) {
      cursor.remove();
      return false;
    }

    cursor.insertAdjacentText("beforebegin", "\n");
    syncLetterScroll();
    await wait(pause);
  }

  if (sequenceId !== letterSequenceId) {
    cursor.remove();
    return false;
  }

  cursor.remove();
  syncLetterScroll();
  return true;
}

async function setMusicEnabled(shouldPlay) {
  musicState.desired = shouldPlay;

  if (!shouldPlay) {
    stopMusic();
    updateMusicButton();
    return;
  }

  await startMusic();
  updateMusicButton();
}

async function startMusic() {
  const audio = getMusicAudio();

  if (!audio) {
    return;
  }

  audio.autoplay = true;
  audio.muted = false;

  try {
    await audio.play();
    musicState.isRunning = true;
  } catch (error) {
    musicState.isRunning = false;
  }
}

function stopMusic() {
  const audio = musicState.audio;

  if (audio) {
    audio.pause();
  }

  musicState.isRunning = false;
}

async function tryResumeMusic() {
  if (!musicState.desired || musicState.isRunning) {
    return;
  }

  await startMusic();
  updateMusicButton();
}

function getMusicAudio() {
  if (musicState.audio) {
    return musicState.audio;
  }

  const audio = new Audio("Rousseau.mp3");
  audio.loop = true;
  audio.preload = "auto";
  audio.playsInline = true;
  audio.volume = 0.72;
  audio.addEventListener("play", () => {
    musicState.isRunning = true;
  });
  audio.addEventListener("pause", () => {
    musicState.isRunning = false;
  });
  musicState.audio = audio;
  return audio;
}

function getAudioContext() {
  if (musicState.context) {
    return musicState.context;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  musicState.context = new AudioContextClass();
  return musicState.context;
}

function startCompositionLoop() {
  if (!musicState.context || !musicState.masterGain) {
    return;
  }

  const context = musicState.context;
  const beat = 60 / 74;
  const barLength = beat * 4;
  let barIndex = 0;

  const scheduleNextBar = () => {
    if (!musicState.isRunning || !musicState.desired || context.state !== "running") {
      return;
    }

    const bar = composition[barIndex % composition.length];
    const startAt = context.currentTime + 0.08;

    playPadChord(bar.chord, startAt, barLength);
    playBassTone(bar.chord[0] - 12, startAt, barLength);
    playBellLine(bar.melody, startAt, beat);

    barIndex += 1;
    musicState.loopTimer = window.setTimeout(scheduleNextBar, barLength * 1000);
  };

  scheduleNextBar();
}

function playPadChord(chord, when, duration) {
  const context = musicState.context;

  chord.forEach((midi, index) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = index % 2 === 0 ? "sine" : "triangle";
    oscillator.frequency.value = midiToFrequency(midi);
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    filter.Q.value = 0.4;

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(musicState.masterGain);

    gainNode.gain.setValueAtTime(0.0001, when);
    gainNode.gain.linearRampToValueAtTime(0.035 / chord.length, when + 0.8);
    gainNode.gain.linearRampToValueAtTime(0.016 / chord.length, when + duration * 0.72);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.55);

    oscillator.start(when);
    oscillator.stop(when + duration + 0.7);
  });
}

function playBassTone(midi, when, duration) {
  const context = musicState.context;
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "sine";
  oscillator.frequency.value = midiToFrequency(midi);
  filter.type = "lowpass";
  filter.frequency.value = 680;
  filter.Q.value = 0.5;

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(musicState.masterGain);

  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(0.026, when + 0.55);
  gainNode.gain.linearRampToValueAtTime(0.013, when + duration * 0.74);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.35);

  oscillator.start(when);
  oscillator.stop(when + duration + 0.45);
}

function playBellLine(notes, startAt, beat) {
  notes.forEach(([midi, beatOffset, length]) => {
    const when = startAt + beatOffset * beat;
    playBellTone(midi, when, length);
  });
}

function playBellTone(midi, when, duration) {
  const context = musicState.context;
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "triangle";
  overtone.type = "sine";
  oscillator.frequency.value = midiToFrequency(midi);
  overtone.frequency.value = midiToFrequency(midi + 12);

  oscillator.connect(gainNode);
  overtone.connect(gainNode);
  gainNode.connect(musicState.masterGain);

  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.linearRampToValueAtTime(0.024, when + 0.12);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.6);

  oscillator.start(when);
  overtone.start(when);
  oscillator.stop(when + duration + 0.72);
  overtone.stop(when + duration + 0.72);
}

function updateMusicButton() {
  const isOn = musicState.desired;

  musicToggle.classList.toggle("is-playing", isOn);
  musicToggle.classList.toggle("is-muted", !isOn);
  musicToggle.setAttribute("aria-pressed", String(isOn));
  musicToggle.setAttribute("aria-label", isOn ? "关闭背景音乐" : "开启背景音乐");
}

function syncLetterScroll() {
  letterScroll.scrollTop = letterScroll.scrollHeight;
  updateScrollIndicator();
}

function updateScrollIndicator() {
  const trackHeight = Math.max(scrollIndicator.clientHeight, 0);
  const scrollableDistance = Math.max(letterScroll.scrollHeight - letterScroll.clientHeight, 0);
  const isScrollable = scrollableDistance > 2;

  letterReader.classList.toggle("is-scrollable", isScrollable);

  if (!isScrollable || trackHeight === 0) {
    scrollThumb.style.height = "26px";
    scrollThumb.style.transform = "translateY(0)";
    return;
  }

  const thumbHeight = Math.max(trackHeight * (letterScroll.clientHeight / letterScroll.scrollHeight), 26);
  const travel = trackHeight - thumbHeight;
  const progress = letterScroll.scrollTop / scrollableDistance;
  const offset = travel * progress;

  scrollThumb.style.height = `${thumbHeight}px`;
  scrollThumb.style.transform = `translateY(${offset}px)`;
}

function resizeConfettiCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = confettiCanvas.clientWidth;
  const height = confettiCanvas.clientHeight;

  confettiCanvas.width = Math.max(1, Math.floor(width * dpr));
  confettiCanvas.height = Math.max(1, Math.floor(height * dpr));
  confettiState.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function startConfettiBurst() {
  const colors = ["#ffd166", "#ff7a8a", "#6dd3ff", "#7be495", "#caa6ff", "#ffb347", "#fff2d8", "#ff5fa2", "#8ee3ef"];
  const width = confettiCanvas.clientWidth;
  const height = confettiCanvas.clientHeight;

  confettiState.particles = Array.from({ length: 148 }, () => ({
    x: randomNumber(0, width),
    y: randomNumber(-height * 0.24, height * 0.18),
    vx: randomNumber(-1.9, 1.9),
    vy: randomNumber(1.7, 4.1),
    width: randomNumber(5, 9),
    height: randomNumber(16, 34),
    angle: randomNumber(0, Math.PI * 2),
    spin: randomNumber(-0.16, 0.16),
    wobble: randomNumber(0, Math.PI * 2),
    sway: randomNumber(0.6, 1.8),
    color: colors[Math.floor(randomNumber(0, colors.length))],
    life: randomNumber(140, 220),
    opacity: randomNumber(0.68, 1)
  }));

  confettiState.burstUntil = performance.now() + 5200;

  if (!confettiState.rafId) {
    confettiState.rafId = window.requestAnimationFrame(renderConfetti);
  }
}

function renderConfetti(timestamp) {
  const ctx = confettiState.ctx;
  const width = confettiCanvas.clientWidth;
  const height = confettiCanvas.clientHeight;

  ctx.clearRect(0, 0, width, height);

  confettiState.particles = confettiState.particles.filter((particle) => {
    particle.x += particle.vx + Math.sin(particle.wobble) * particle.sway * 0.18;
    particle.y += particle.vy;
    particle.angle += particle.spin;
    particle.wobble += 0.08;
    particle.life -= 1;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.angle);
    ctx.globalAlpha = Math.max(0, particle.opacity * (particle.life / 220));
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
    ctx.restore();

    return particle.life > 0 && particle.y < height + 40;
  });

  if (timestamp < confettiState.burstUntil || confettiState.particles.length > 0) {
    confettiState.rafId = window.requestAnimationFrame(renderConfetti);
  } else {
    ctx.clearRect(0, 0, width, height);
    confettiState.rafId = 0;
  }
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function rampGain(param, targetValue, startTime, duration) {
  param.cancelScheduledValues(startTime);
  param.setValueAtTime(Math.max(param.value, 0.0001), startTime);

  if (targetValue <= 0.0001) {
    param.exponentialRampToValueAtTime(0.0001, startTime + duration);
    return;
  }

  param.exponentialRampToValueAtTime(targetValue, startTime + duration);
}

function wait(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function random(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
