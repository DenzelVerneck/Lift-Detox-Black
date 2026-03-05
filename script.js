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

  // ---- Preload frames with buffer support ----
  function preloadFrames(onBufferReached) {
    let bufferMet = false;
    const BUFFER_SIZE = 12; // Start after ~0.5s of footage is ready

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      // Use a "promise-like" approach for each image
      img.onload = () => {
        loadedCount++;

        // Update loader text
        if (loaderText) {
          const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);
          loaderText.textContent = `Carregando... ${pct}%`;
        }

        // Trigger buffer callback once
        if (!bufferMet && (loadedCount >= BUFFER_SIZE || loadedCount >= TOTAL_FRAMES)) {
          bufferMet = true;
          if (onBufferReached) onBufferReached();
        }

        // Hide loader completely when 100%
        if (loadedCount === TOTAL_FRAMES && loader) {
          loader.classList.add('hidden');
        }
      };

      img.onerror = () => {
        console.warn(`Failed to load frame ${i}`);
        loadedCount++;
        if (!bufferMet && (loadedCount >= BUFFER_SIZE || loadedCount >= TOTAL_FRAMES)) {
          bufferMet = true;
          if (onBufferReached) onBufferReached();
        }
      };

      img.src = framePath(i);
      frames[i] = img;
    }
  }

  // ---- Resize canvas to match image aspect ratio ----
  function sizeCanvas() {
    const first = frames[0];
    if (!first) return;

    // Wait for first image load to get dimensions if needed
    if (!first.naturalWidth) {
      first.onload = () => sizeCanvas();
      return;
    }

    const container = canvas.parentElement;
    const containerW = container.clientWidth;

    const aspect = first.naturalHeight / first.naturalWidth;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = containerW * dpr;
    canvas.height = (containerW * aspect) * dpr;

    canvas.style.width = containerW + 'px';
    canvas.style.height = (containerW * aspect) + 'px';
  }

  // ---- Draw a single frame ----
  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }

  // ---- Animation loop ----
  let isRunning = false;
  function animate(timestamp) {
    if (!isRunning) return;

    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;

    if (elapsed >= frameDuration) {
      lastFrameTime = timestamp - (elapsed % frameDuration);

      // Only draw if the image is actually loaded
      if (frames[currentFrame] && frames[currentFrame].complete) {
        drawFrame(currentFrame);
      }

      // Advance frame
      currentFrame += direction;

      // Loop logic
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
  function init() {
    // Start preloading
    preloadFrames(() => {
      // Buffer reached! Start the show.
      if (loader) {
        // We can hide the spinner or the whole loader early if we want
        // For smoother feel, let's just make it semi-transparent or fade
        loader.style.opacity = '0.4';
        loader.style.pointerEvents = 'none';
      }

      sizeCanvas();
      window.addEventListener('resize', sizeCanvas);

      isRunning = true;
      requestAnimationFrame(animate);
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
