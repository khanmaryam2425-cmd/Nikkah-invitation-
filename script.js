/* ==========================================
   CONFIG & INITIALIZATION
   ========================================== */
const config = {
  eventISO: "2026-10-24T20:00:00"
};

// Deployed Google Apps Script Web App Endpoint
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzaVw3oY6QNGvmQ1gJdQ1QKC8yCW0Ux0BUPI4VpJJZO8jgigQ3oHIqMBZlVGfa2FdjSKw/exec";

// Global Voice Note Variables
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  initGuestPersonalization();
  initEnvelopeUnboxing();
  startCountdown();
  initPetals();

  // Calendar .ICS Download Button Listener
  const calBtn = document.getElementById("calBtn");
  if (calBtn) calBtn.addEventListener("click", generateICS);

  // RSVP Form Submission Listener
  const rsvpForm = document.getElementById("rsvpForm");
  if (rsvpForm) rsvpForm.addEventListener("submit", handleRSVPSubmit);

  // Voice Blessing Recorder Setup
  initVoiceRecorder();

  // Music Button Setup
  initMusicToggle();

  // Global Audio Unlock Listener for Mobile Browsers
  initGlobalAudioUnlock();
});

/* ==========================================
   GUEST PERSONALIZATION (URL QUERY PARSER)
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
   ROBUST AUDIO PLAYBACK HELPER
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
  }).catch(err => {
    console.log("Autoplay restricted. Waiting for user interaction:", err);
    if (musicToggleBtn) {
      musicToggleBtn.classList.add("paused");
      musicToggleBtn.classList.remove("playing");
    }
  });
}

/* ==========================================
   GLOBAL AUDIO UNLOCK (FOR ANY INITIAL TAP)
   ========================================== */
function initGlobalAudioUnlock() {
  const music = document.getElementById("bgMusic");
  if (!music) return;

  function unlock() {
    if (music.paused) {
      playAudioSafe();
    }
    // Remove listeners after first interaction
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  }

  document.addEventListener("click", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true });
}

/* ==========================================
   ENVELOPE UNBOXING & MUSIC TOUCH UNLOCK
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

    // Direct audio play attempt on user's envelope touch
    playAudioSafe();

    setTimeout(() => {
      if (envelope) envelope.style.display = "none";
    }, 1200);
  }

  // Handle both mobile touch and desktop click seamlessly
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
   MUSIC TOGGLE LOGIC
   ========================================== */
function initMusicToggle() {
  const musicBtn = document.getElementById("musicToggleBtn");
  const bgMusic = document.getElementById("bgMusic");
  if (!musicBtn || !bgMusic) return;

  const iconOn = musicBtn.querySelector(".icon-on");
  const iconOff = musicBtn.querySelector(".icon-off");

  function toggleHandler(e) {
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
  }

  musicBtn.addEventListener("click", toggleHandler);
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
   RSVP SUBMISSION TO GOOGLE SHEETS
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

  if (typeof recordedAudioBlob !== "undefined" && recordedAudioBlob) {
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
   SHOW MATCHING POPUP MODAL
   ========================================== */
function showRSVPModal(formElement, attendanceValue) {
  const isDeclining = attendanceValue && attendanceValue.toLowerCase().includes("decline");

  const targetModalId = isDeclining ? "declineModal" : "thankYouModal";
  const targetBtnId = isDeclining ? "closeDeclineModal" : "closeModal";

  const modal = document.getElementById(targetModalId);
  const closeModalBtn = document.getElementById(targetBtnId);

  if (modal) {
    modal.classList.remove("hidden");
  }

  if (closeModalBtn) {
    closeModalBtn.onclick = () => {
      modal.classList.add("hidden");
    };
  }

  window.onclick = (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  };

  // Reset form and recording controls
  formElement.reset();
  if (typeof recordedAudioBlob !== "undefined") {
    recordedAudioBlob = null;
  }
  
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
   CALENDAR (.ICS) FILE GENERATOR
   ========================================== */
function generateICS() {
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Nikkah - Maryam & Hamid\nLOCATION:Shahi Ballroom, First Floor, Opposite Imtiaz, Nazimabad\nDTSTART:20261024T150000Z\nEND:VEVENT\nEND:VCALENDAR`;
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Maryam_Hamid_Nikkah.ics';
  a.click();
}

/* ==========================================
   GOLDEN DUST CANVAS ANIMATION
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

  const particles = Array.from({ length: 18 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2 + 1,
    sy: Math.random() * 0.6 + 0.2
  }));

  function render() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.y += p.sy;
      if (p.y > h) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(197, 160, 89, 0.35)";
      ctx.fill();
    });
    requestAnimationFrame(render);
  }
  render();
}

/* ==========================================
   3D TILT PARALLAX FOR STAGE PAGE
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