/* ===========================
   Lift Detox — Image Sequence Engine
   Auto-play forward/reverse loop
   =========================== */

(function () {
  'use strict';

  // ---- Configuration ----
  const TOTAL_FRAMES = 80;       // frames 000 → 079
  const TARGET_FPS = 24;       // smooth cinematic playback
  const IMAGE_FOLDER = 'imagem'; // relative path to frame images
  const FILE_PREFIX = 'Animação_de_Vidro_Explodindo_e_Fechando_';
  const FILE_EXT = '.jpg';

  // ---- State ----
  const frames = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let direction = 1;        // 1 = forward, -1 = reverse
  let lastFrameTime = 0;
  const frameDuration = 1000 / TARGET_FPS;

  // ---- DOM references ----
  const canvas = document.getElementById('sequence-canvas');
  const ctx = canvas.getContext('2d');
  const loader = document.getElementById('hero-loader');
  const loaderText = document.getElementById('loader-progress');

  // ---- Helpers ----
  function padNumber(n) {
    return String(n).padStart(3, '0');
  }

  function framePath(index) {
    return `${IMAGE_FOLDER}/${FILE_PREFIX}${padNumber(index)}${FILE_EXT}`;
  }

  // ---- Preload all frames ----
  function preloadFrames() {
    return new Promise((resolve) => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = framePath(i);

        img.onload = () => {
          loadedCount++;
          if (loaderText) {
            const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
            loaderText.textContent = `Carregando... ${pct}%`;
          }
          if (loadedCount === TOTAL_FRAMES) resolve();
        };

        img.onerror = () => {
          console.warn(`Failed to load frame ${i}: ${img.src}`);
          loadedCount++;
          if (loadedCount === TOTAL_FRAMES) resolve();
        };

        frames[i] = img;
      }
    });
  }

  // ---- Resize canvas to match image aspect ratio ----
  function sizeCanvas() {
    const first = frames[0];
    if (!first || !first.naturalWidth) return;

    const container = canvas.parentElement;
    const containerW = container.clientWidth;

    // Maintain aspect ratio
    const aspect = first.naturalHeight / first.naturalWidth;
    canvas.width = containerW * window.devicePixelRatio;
    canvas.height = canvas.width * aspect;

    canvas.style.width = containerW + 'px';
    canvas.style.height = (containerW * aspect) + 'px';
  }

  // ---- Draw a single frame ----
  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.naturalWidth) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  // ---- Animation loop (forward → reverse → loop) ----
  function animate(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;

    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameDuration) {
      lastFrameTime = timestamp - (elapsed % frameDuration);

      drawFrame(currentFrame);

      // Advance frame
      currentFrame += direction;

      // Bounce at ends
      if (currentFrame >= TOTAL_FRAMES) {
        currentFrame = TOTAL_FRAMES - 1;
        direction = -1;
      } else if (currentFrame < 0) {
        currentFrame = 0;
        direction = 1;
      }
    }

    requestAnimationFrame(animate);
  }

  // ---- Init ----
  async function init() {
    await preloadFrames();

    // Hide loader
    if (loader) loader.classList.add('hidden');

    // Setup canvas size
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    // Draw first frame and start loop
    drawFrame(0);
    requestAnimationFrame(animate);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
