/* ===========================================================
   CONFIG
   =========================================================== */
const AUDIO_SRC = "./audio/Yaar Anmulle   Sharry Mann  Team Punjabi Song.mp3" ;

const SPEED_THRESHOLD = 25.0;          // px/ms — speed required to trigger audio
const SPEED_COOLDOWN_MS = 2500;        // cooldown before next speed trigger
const FFT_SIZE = 128;                  // lower FFT size → bigger visible bars

/* ===========================================================
   CANVAS SETUP
   =========================================================== */
const canvas = document.getElementById("dot-grid-canvas");
const ctx = canvas.getContext("2d");

let width = window.innerWidth;
let height = window.innerHeight;

let dots = [];
let mouse = { x: -9999, y: -9999 };

const dotSize = 3;
const gap = 20;
const influence = 120;
const returnSpeed = 0.1;

/* ---------- Spectrum Rectangle ---------- */
const spectrum = {
    x: width / 2 - 300,
    y: height / 2 - 80,
    w: 600,
    h: 160,
    bars: [],
    barCount: 40
};

/* ---------- Audio ---------- */
let audioCtx = null;
let analyser = null;
let freqData = null;

let audioElem = new Audio(AUDIO_SRC);
audioElem.preload = "auto";

let audioUnlocked = false;
let audioTriggered = false;

let globalBeat = 0;

/* ===========================================================
   BUILD GRID
   =========================================================== */
function buildGrid() {
    dots = [];

    const cols = Math.floor(width / (dotSize + gap));
    const rows = Math.floor(height / (dotSize + gap));

    for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
            const px = x * (dotSize + gap) + gap / 2;
            const py = y * (dotSize + gap) + gap / 2;

            dots.push({
                x: px,
                y: py,
                baseX: px,
                baseY: py,
                vx: 0,
                vy: 0,
                color: "#888"
            });
        }
    }

    // Build spectrum bars
    spectrum.bars = [];
    for (let i = 0; i < spectrum.barCount; i++) {
        const barWidth = (spectrum.w / spectrum.barCount) * 0.8;

        spectrum.bars.push({
            x: spectrum.x + i * (spectrum.w / spectrum.barCount),
            y: spectrum.y + spectrum.h,
            w: barWidth,
            h: 0
        });
    }
}

/* ===========================================================
   CANVAS RESIZE
   =========================================================== */
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    spectrum.x = width / 2 - spectrum.w / 2;
    spectrum.y = height / 2 - spectrum.h / 2;

    buildGrid();
}
window.addEventListener("resize", resizeCanvas);

/* ===========================================================
   DRAW LOOP
   =========================================================== */
function draw() {
    ctx.clearRect(0, 0, width, height);

    /* ----- Draw Dots ----- */
    for (let dot of dots) {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Mouse influence effect
        if (dist < influence) {
            const force = ((influence - dist) / influence) * 2;
            const nx = dist === 0 ? 0 : dx / dist;
            const ny = dist === 0 ? 0 : dy / dist;

            dot.vx += nx * force;
            dot.vy += ny * force;
            dot.color = "#a05fffff";
        } else {
            dot.color = "#888";
        }

        // Return to original position
        dot.vx += (dot.baseX - dot.x) * returnSpeed;
        dot.vy += (dot.baseY - dot.y) * returnSpeed;

        dot.vx *= 0.85;
        dot.vy *= 0.85;

        dot.x += dot.vx;
        dot.y += dot.vy;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.fill();
    }

    /* ----- Spectrum Bars ----- */
    if (audioTriggered && analyser && freqData) {
        analyser.getByteFrequencyData(freqData);

        for (let i = 0; i < spectrum.barCount; i++) {
            const bin = Math.floor(i * (freqData.length / spectrum.barCount));
            const magnitude = freqData[bin] / 255;

            spectrum.bars[i].h = magnitude * spectrum.h;
        }
    }

    ctx.fillStyle = "#0ab3ff";
    for (let bar of spectrum.bars) {
        ctx.fillRect(bar.x, bar.y - bar.h, bar.w, bar.h);
    }

    requestAnimationFrame(draw);
}

/* ===========================================================
   MOUSE TRACKING
   =========================================================== */
window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener("mouseout", () => {
    mouse.x = -9999;
    mouse.y = -9999;
});

/* ===========================================================
   AUDIO SETUP
   =========================================================== */
function setupAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        const source = audioCtx.createMediaElementSource(audioElem);

        analyser = audioCtx.createAnalyser();
        analyser.fftSize = FFT_SIZE;

        freqData = new Uint8Array(analyser.frequencyBinCount);

        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
}

/* ===========================================================
   UNLOCK OVERLAY (FIRST CLICK REQUIRED)
   =========================================================== */
(function createUnlockOverlay() {
    if (audioUnlocked) return;

    const overlay = document.createElement("div");
    overlay.id = "unlock-overlay-js";

    Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(0,0,0,0.78)",
        zIndex: "999999",
        backdropFilter: "blur(4px)"
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "26px 36px",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#ffffffff",
        textAlign: "center",
        gap: "12px"
    });

    const heading = document.createElement("h2");
    heading.innerText = "Welcome to HashUtility";
    Object.assign(heading.style, {
        margin: "0",
        fontSize: "20px",
        fontWeight: "700"
    });

    const desc = document.createElement("p");
    desc.innerText = "BE FAST BOiiiiii!!!!!";
    Object.assign(desc.style, {
        margin: "0",
        fontSize: "13px",
        opacity: "0.95"
    });

    const btn = document.createElement("button");
    btn.id = "unlock-btn-js";
    btn.innerText = "Enter";
    Object.assign(btn.style, {
        padding: "10px 18px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        background: "#0ab3ff",
        color: "#02121a",
        fontWeight: "700",
        fontSize: "14px"
    });

    box.appendChild(heading);
    box.appendChild(desc);
    box.appendChild(btn);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    btn.addEventListener("click", async () => {
        setupAudio();
        if (audioCtx.state === "suspended") await audioCtx.resume();

        audioUnlocked = true;
        overlay.remove();
    });
})();

/* ===========================================================
   POINTER SPEED DETECTION (EASTER EGG TRIGGER)
   =========================================================== */
let lastX = 0, lastY = 0, lastT = performance.now();
let speedCooldown = false;

window.addEventListener("pointermove", e => {
    const now = performance.now();
    const dt = now - lastT || 1;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const speed = dist / dt;

    lastX = e.clientX;
    lastY = e.clientY;
    lastT = now;

    if (!audioUnlocked || audioTriggered || speedCooldown) return;

    if (speed >= SPEED_THRESHOLD) {
        audioTriggered = true;
        speedCooldown = true;

        setTimeout(() => {
            speedCooldown = false;
        }, SPEED_COOLDOWN_MS);

        audioElem.currentTime = 0;
        audioElem.play().catch(() => console.warn("Audio play blocked"));
    }
});

/* ===========================================================
   INIT
   =========================================================== */
resizeCanvas();
draw();


// -----------------------------
// Smooth Scroll
// -----------------------------
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (e) => {
        const target = link.getAttribute("href");
        if (!target.startsWith("#")) return;
        e.preventDefault();
        document.querySelector(target).scrollIntoView({ behavior: "smooth" });
    });
});

// -----------------------------
// Discover Tool Button
// -----------------------------
const discoverBtn = document.querySelector(".cta-btn");
if (discoverBtn) {
    discoverBtn.addEventListener("click", () => {
        window.location.href = "tool.html"; 
    });
}

// -----------------------------
// Newsletter Form
// -----------------------------
const form = document.querySelector(".newsletter-form");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector("input");
        const email = emailInput.value.trim();
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!valid.test(email)) {
            alert("❌ Invalid email format.");
            return;
        }
        try {
            const res = await fetch("/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Subscribed successfully!");
                emailInput.value = "";
            } else {
                alert("❌ Subscription failed: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            alert("❌ Could not connect to server.");
            console.error(err);
        }
    });
};

/* =========================
   SCROLL FADE-IN (AFTER USER START)
========================= */

let animationsEnabled = false;

// Enable animations only after user interaction
function enableAnimations() {
    if (animationsEnabled) return;
    animationsEnabled = true;
    initFadeObserver();
}

// Listen for first user interaction
["click", "keydown", "scroll"].forEach(event => {
    window.addEventListener(event, enableAnimations, { once: true });
});

function initFadeObserver() {
    const fadeElements = document.querySelectorAll(".fade");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15,
            rootMargin: "0px 0px -80px 0px"
        }
    );

    fadeElements.forEach(el => observer.observe(el));
}

