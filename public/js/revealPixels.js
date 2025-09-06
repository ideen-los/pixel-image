document.addEventListener('DOMContentLoaded', () => {
  // Paths to your images
  const overlayPath = '../img/eulenmuehle-pixelbild_overlay-min.jpg';
  const imgPath = '../img/eulenmuehle-pixelbild.jpg';

  // Get canvas elements and contexts
  const canvas = document.getElementById('imageCanvas');
  const renderingContext = canvas.getContext('2d');

  const offscreenCanvas = document.getElementById('offscreenCanvas');
  const offscreenRenderingContext = offscreenCanvas.getContext('2d');

  /* Variables for revealing pixels. */
  let currentPixelIndex = 0; // how many REAL pixels we have drawn so far
  let totalPixelsMax = 100000; // will be updated after images are loaded (real canvas pixel count)
  let totalPixelsToReveal = 0; // from euros -> real pixels
  let originalImageData = null;

  // Animation control
  let rafId = null;

  // Precomputed biased order (top-left priority + noise)
  let revealOrder = [];

  // --- Tunables ---------------------------------------------------------------
  // Bias/noise for initial ordering:
  const BIAS_X = 2.0; // stronger pull to left
  const BIAS_Y = 2.0; // stronger pull to top
  const NOISE = 0.35; // 0..1 (adds chaos to ordering)
  const NOISE_DECAYS_TOWARD_BR = true; // noise strongest near top-left

  // Sliding-window sprinkle (THIS makes sprinkles move with the front):
  // NOTE: Window is computed after image load (depends on width/height).
  let WINDOW_SIZE = 5000; // fallback; will be recalculated
  const WINDOW_MIN = 1500; // minimum window for visible sprinkles
  const WINDOW_MAX = 25000; // cap to prevent huge random jumps

  function displaySuccessMessage() {
    const barWrapper = document.querySelector('.progress-bar-wrapper');
    const barLabel = document.querySelector('.counter-label');

    if (barWrapper && barLabel) {
      barWrapper.classList.add('completed');
      barLabel.textContent = 'Es wurden alle Pixel aufgedeckt!';
    }
  }

  /* Build a biased random order over ALL pixels with spatially decaying noise:
     score = biasX*(x/width) + biasY*(y/height) + noise*decay(x,y)*rand
     Sort ascending by score -> strong top-left priority but still noisy. */
  function buildBiasedOrder(width, height, biasX, biasY, noise, noiseDecay) {
    const total = width * height;
    const arr = new Array(total);

    for (let idx = 0; idx < total; idx++) {
      const x = idx % width;
      const y = (idx / width) | 0;
      const nx = x / width; // 0..1 left->right
      const ny = y / height; // 0..1 top->bottom
      const decay = noiseDecay ? Math.max(0, 1 - 0.5 * (nx + ny)) : 1;
      const score = biasX * nx + biasY * ny + noise * decay * Math.random();
      arr[idx] = { idx, score };
    }

    arr.sort((a, b) => a.score - b.score);

    const order = new Array(total);
    for (let i = 0; i < total; i++) order[i] = arr[i].idx;
    return order;
  }

  /* Reveal pixels using a SLIDING WINDOW around the current front.
     NOTE: This keeps the pixel-by-pixel look, but sprinkles move with the frontier. */
  function revealPixels(count) {
    const remaining = totalPixelsToReveal - currentPixelIndex;
    const take = Math.max(0, Math.min(count, remaining));
    if (take <= 0) return;

    for (let i = 0; i < take; i++) {
      if (currentPixelIndex >= totalPixelsMax) break;

      // Compute local window end near the target/front:
      const frontEnd = Math.min(
        totalPixelsToReveal - 1,
        currentPixelIndex + WINDOW_SIZE
      );

      // Randomly pick an index inside [currentPixelIndex, frontEnd]
      const range = Math.max(0, frontEnd - currentPixelIndex + 1);
      const j =
        currentPixelIndex + (range > 0 ? (Math.random() * range) | 0 : 0);

      // Swap picked index to the front (in-place partial shuffle)
      const tmp = revealOrder[currentPixelIndex];
      revealOrder[currentPixelIndex] = revealOrder[j];
      revealOrder[j] = tmp;

      const idx = revealOrder[currentPixelIndex];

      // (x, y) from linear index
      const x = idx % canvas.width;
      const y = (idx / canvas.width) | 0;

      // Get pixel data
      const dataIndex = idx * 4;
      const r = originalImageData.data[dataIndex];
      const g = originalImageData.data[dataIndex + 1];
      const b = originalImageData.data[dataIndex + 2];
      const a = originalImageData.data[dataIndex + 3] / 255;

      // Draw single pixel
      renderingContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      renderingContext.fillRect(x, y, 1, 1);

      currentPixelIndex++;
    }
  }

  /* Animate pixel revelation */
  function animateReveal() {
    const animationDuration = 5000; // ms
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const targetNow = Math.floor(progress * totalPixelsToReveal);
      const need = targetNow - currentPixelIndex;
      if (need > 0) revealPixels(need);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        if (currentPixelIndex >= totalPixelsMax) displaySuccessMessage();
      }
    }

    rafId = requestAnimationFrame(step);
  }

  /* Load image as Promise */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
  }

  /* Euros -> real pixels (cap: 100k €) */
  function updateTotalPixelsFromEuros(euros) {
    const eurosNumber =
      typeof euros === 'number' ? euros : parseFloat(euros) || 0;
    const newTotalPixels = Math.min(
      Math.floor(eurosNumber * (totalPixelsMax / 100000)),
      totalPixelsMax
    );
    totalPixelsToReveal = newTotalPixels;

    if (rafId) cancelAnimationFrame(rafId);
    if (
      currentPixelIndex < totalPixelsMax &&
      totalPixelsToReveal > currentPixelIndex
    ) {
      animateReveal();
    }
  }

  /* Load both images and set up canvases */
  Promise.all([loadImage(overlayPath), loadImage(imgPath)])
    .then(([overlay, image]) => {
      // Size canvases
      canvas.width = image.width;
      canvas.height = image.height;
      offscreenCanvas.width = image.width;
      offscreenCanvas.height = image.height;

      // Draw overlay
      renderingContext.drawImage(overlay, 0, 0, canvas.width, canvas.height);

      // Draw source to offscreen
      offscreenRenderingContext.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Grab pixels
      originalImageData = offscreenRenderingContext.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Real pixel count
      totalPixelsMax = canvas.width * canvas.height;

      // Compute a good sliding-window size (depends on image scale)
      // NOTE: Base on width to keep patches sizable but local to frontier.
      WINDOW_SIZE = Math.max(
        WINDOW_MIN,
        Math.min(WINDOW_MAX, Math.floor(canvas.width * 6)) // e.g., ~6600 for width ≈ 1100
      );

      // Precompute top-left-biased order
      revealOrder = buildBiasedOrder(
        canvas.width,
        canvas.height,
        BIAS_X,
        BIAS_Y,
        NOISE,
        NOISE_DECAYS_TOWARD_BR
      );

      // Start animation from EURO amount
      updateTotalPixelsFromEuros(window.pixelsRevealed || 0);
    })
    .catch((err) => {
      console.error('Image loading error:', err);
    });
});
