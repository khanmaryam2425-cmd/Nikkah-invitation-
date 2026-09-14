/* ==========================================
   CONFIG & INITIALIZATION
   ========================================== */
const config = {
  eventISO: "2026-10-24T20:00:00"
};

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzaVw3oY6QNGvmQ1gJdQ1QKC8yCW0Ux0BUPI4VpJJZO8jgigQ3oHIqMBZlVGfa2FdjSKw/exec";

let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initGuestPersonalization();
  initEnvelopeUnboxing();
  startCountdown();
  initPetals();

  const rsvpForm = document.getElementById("rsvpForm");
  if (rsvpForm) rsvpForm.addEventListener("submit", handleRSVPSubmit);

  initVoiceRecorder();
  initMusicToggle();
  initGlobalAudioUnlock();
});

/* ==========================================
   GUEST PERSONALIZATION
   ========================================== */
function initGuestPersonalization() {
  const urlParams = new URLSearchParams(window.location.search);
  const guestParam = urlParams.get("guest");
  const displayEl = document.getElementById("displayGuestName");
  
  if (displayEl) {
    if (guestParam && guestParam.trim() !== "") {
      displayEl.textContent = decodeURIComponent(guestParam.replace(/\+/g, " "));
    } else {
      displayEl.textContent = "Valued Guest";
    }
  }
}

/* ==========================================
   AUDIO PLAYBACK HELPER
   ========================================== */
function playAudioSafe() {
  const music = document.getElementById("bgMusic");
  const musicToggleBtn = document.getElementById("musicToggleBtn");

  if (!music) return;

  music.play().then(() => {
    if (musicToggleBtn) {
      musicToggleBtn.classList.add("playing");
      musicToggleBtn.classList.remove("paused");
      const iconOn = musicToggleBtn.querySelector(".icon-on");
      const iconOff = musicToggleBtn.querySelector(".icon-off");
      if (iconOn) iconOn.classList.remove("hidden");
      if (iconOff) iconOff.classList.add("hidden");
    }
  }).catch(() => {
    if (musicToggleBtn) {
      musicToggleBtn.classList.add("paused");
      musicToggleBtn.classList.remove("playing");
    }
  });
}

function initGlobalAudioUnlock() {
  const music = document.getElementById("bgMusic");
  if (!music) return;

  function unlock() {
    if (music.paused) playAudioSafe();
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  }

  document.addEventListener("click", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true });
}

/* ==========================================
   MUSIC TOGGLE LOGIC
   ========================================== */
function initMusicToggle() {
  const musicBtn = document.getElementById("musicToggleBtn");
  const bgMusic = document.getElementById("bgMusic");
  if (!musicBtn || !bgMusic) return;

  const iconOn = musicBtn.querySelector(".icon-on");
  const iconOff = musicBtn.querySelector(".icon-off");

  musicBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!bgMusic.paused) {
      bgMusic.pause();
      musicBtn.classList.remove("playing");
      musicBtn.classList.add("paused");
      if (iconOn) iconOn.classList.add("hidden");
      if (iconOff) iconOff.classList.remove("hidden");
    } else {
      playAudioSafe();
    }
  });
}

/* ==========================================
   COUNTDOWN TIMER
   ========================================== */
function startCountdown() {
  const target = new Date(config.eventISO).getTime();

  const timer = setInterval(() => {
    const diff = target - new Date().getTime();
    if (diff <= 0) {
      clearInterval(timer);
      return;
    }

    const cdDays = document.getElementById("cdDays");
    const cdHours = document.getElementById("cdHours");
    const cdMins = document.getElementById("cdMins");
    const cdSecs = document.getElementById("cdSecs");

    if (cdDays) cdDays.textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
    if (cdHours) cdHours.textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    if (cdMins) cdMins.textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    if (cdSecs) cdSecs.textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
  }, 1000);
}

/* ==========================================
   SCROLL REVEAL OBSERVER
   ========================================== */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("active");
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".reveal-element").forEach(el => observer.observe(el));
}

/* ==========================================
   VOICE RECORDER LOGIC
   ========================================== */
function initVoiceRecorder() {
  const recordBtn = document.getElementById("recordBtn");
  const recordIcon = document.getElementById("recordIcon");
  const recordText = document.getElementById("recordText");
  const timerDisplay = document.getElementById("recordingTimer");
  const audioPreview = document.getElementById("audioPreview");

  if (!recordBtn) return;

  recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(recordedAudioBlob);
          if (audioPreview) {
            audioPreview.src = audioUrl;
            audioPreview.classList.remove("hidden");
          }
        };

        mediaRecorder.start();
        if (recordIcon) recordIcon.textContent = "⏹️";
        if (recordText) recordText.textContent = "Stop";
        
        let seconds = 0;
        if (timerDisplay) timerDisplay.textContent = "00:00";
        
        recordTimer = setInterval(() => {
          seconds++;
          const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
          const secs = String(seconds % 60).padStart(2, '0');
          if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);

      } catch (err) {
        alert("Microphone access is required to record a voice blessing.");
      }
    } else if (mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      clearInterval(recordTimer);
      if (recordIcon) recordIcon.textContent = "🔴";
      if (recordText) recordText.textContent = "Re-record";
    }
  });
}

/* ==========================================
   RSVP SUBMISSION
   ========================================== */
async function handleRSVPSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById("submitRsvpBtn");
  if (submitBtn) {
    submitBtn.innerText = "SENDING...";
    submitBtn.disabled = true;
  }

  const name = document.getElementById("rsvpName").value;
  const attending = document.getElementById("rsvpAttendance").value;
  const message = document.getElementById("rsvpMessage").value;

  let audioBase64 = "";

  if (recordedAudioBlob) {
    try {
      audioBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(recordedAudioBlob);
      });
    } catch (err) {
      console.warn("Audio conversion skipped:", err);
    }
  }

  const payload = {
    name: name,
    attending: attending,
    message: message,
    audioBase64: audioBase64
  };

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    showRSVPModal(e.target, attending);
  } catch (err) {
    console.error("Submission Error:", err);
    showRSVPModal(e.target, attending);
  } finally {
    if (submitBtn) {
      submitBtn.innerText = "Send RSVP & Blessings";
      submitBtn.disabled = false;
    }
  }
}

/* ==========================================
   MODAL POPUP LOGIC
   ========================================== */
function showRSVPModal(formElement, attendanceValue) {
  const isDeclining = attendanceValue && attendanceValue.toLowerCase().includes("decline");
  const targetModalId = isDeclining ? "declineModal" : "thankYouModal";
  const targetBtnId = isDeclining ? "closeDeclineModal" : "closeModal";

  const modal = document.getElementById(targetModalId);
  const closeModalBtn = document.getElementById(targetBtnId);

  if (modal) modal.classList.remove("hidden");

  if (closeModalBtn) {
    closeModalBtn.onclick = () => modal.classList.add("hidden");
  }

  window.onclick = (event) => {
    if (event.target === modal) modal.classList.add("hidden");
  };

  formElement.reset();
  recordedAudioBlob = null;
  
  const audioPreview = document.getElementById("audioPreview");
  if (audioPreview) audioPreview.classList.add("hidden");

  const recordIcon = document.getElementById("recordIcon");
  const recordText = document.getElementById("recordText");
  const timerDisplay = document.getElementById("recordingTimer");

  if (recordIcon) recordIcon.textContent = "🔴";
  if (recordText) recordText.textContent = "Record";
  if (timerDisplay) timerDisplay.textContent = "00:00";
}

/* ==========================================
   PARALLAX STAGE EFFECT
   ========================================== */
const stageContainer = document.querySelector('.card-viewport');
const groom = document.querySelector('.groom-layer');
const bride = document.querySelector('.bride-layer');
const arch = document.querySelector('.arch-layer');

if (stageContainer) {
  stageContainer.addEventListener('mousemove', (e) => {
    const rect = stageContainer.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    if (arch) arch.style.transform = `translateX(-50%) translate(${x * 0.02}px, ${y * 0.02}px)`;
    if (groom) groom.style.transform = `translate(${x * 0.04}px, ${y * 0.03}px)`;
    if (bride) bride.style.transform = `translate(${x * 0.04}px, ${y * 0.03}px)`;
  });

  stageContainer.addEventListener('mouseleave', () => {
    if (arch) arch.style.transform = `translateX(-50%) translate(0, 0)`;
    if (groom) groom.style.transform = `translate(0, 0)`;
    if (bride) bride.style.transform = `translate(0, 0)`;
  });
}

/* ==========================================
   PARTICLE CANVAS (FLOATING ROSE PETALS)
   ========================================== */
function initPetals() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const petals = Array.from({ length: 25 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 5 + 4,
    sy: Math.random() * 1.2 + 0.5,
    sx: Math.random() * 0.8 - 0.4,
    angle: Math.random() * 360,
    spin: (Math.random() - 0.5) * 0.02,
    opacity: Math.random() * 0.5 + 0.3
  }));

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-p.size, -p.size * 1.5, -p.size * 1.5, p.size, 0, p.size * 1.8);
    ctx.bezierCurveTo(p.size * 1.5, p.size, p.size, -p.size * 1.5, 0, 0);
    ctx.fillStyle = `rgba(122, 18, 40, ${p.opacity})`;
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, w, h);
    petals.forEach(p => {
      p.y += p.sy;
      p.x += p.sx;
      p.angle += p.spin;

      if (p.y > h + 10) {
        p.y = -10;
        p.x = Math.random() * w;
      }
      if (p.x > w + 10 || p.x < -10) {
        p.x = Math.random() * w;
      }

      drawPetal(p);
    });
    requestAnimationFrame(render);
  }
  render();
}

/* ==========================================
   ENVELOPE UNBOXING & REVEAL EFFECT
   ========================================== */
function initEnvelopeUnboxing() {
  const seal = document.getElementById("sealTrigger");
  const openBtn = document.getElementById("openBtn");
  const envelope = document.getElementById("envelopeCover");
  const content = document.getElementById("invitationContent");

  function triggerOpen(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (content) {
      content.classList.remove("hidden");
      content.style.display = "block";
    }

    if (envelope) {
      envelope.classList.add("open");
    }

    initScrollReveal();
    playAudioSafe();

    triggerAestheticBurst();

    setTimeout(() => {
      if (envelope) envelope.style.display = "none";
    }, 1200);
  }

  if (seal) {
    seal.addEventListener("touchend", triggerOpen, { passive: false });
    seal.addEventListener("click", triggerOpen);
  }
  if (openBtn) {
    openBtn.addEventListener("touchend", triggerOpen, { passive: false });
    openBtn.addEventListener("click", triggerOpen);
  }
}

/* ==========================================
   AESTHETIC FLOWER PETALS & CONFETTI BURST
   ========================================== */
function triggerAestheticBurst() {
  if (typeof confetti !== "function") return;

  const count = 200;
  const defaults = {
    origin: { y: 0.6 }
  };

  function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
      particleCount: Math.floor(count * particleRatio)
    }));
  }

  const roseColors = ['#7A1228', '#C5A059', '#E8DBCA', '#AA771C', '#FFB7C5'];

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: roseColors,
    scalar: 1.2
  });
  fire(0.2, {
    spread: 60,
    colors: roseColors,
    scalar: 0.9
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: roseColors
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: roseColors,
    scalar: 1.1
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: roseColors
  });
}