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
  let currentPixelIndex = 0;
  let totalPixelsMax = 1000000; // Will be updated after images are loaded
  let totalPixelsToReveal = window.pixelsRevealed; // Number of pixels to reveal
  let originalImageData = null;

  /* Array to hold shuffled pixel indices. */
  let shuffledIndices = [];

  function displaySuccessMessage() {
    const barWrapper = document.querySelector('.progress-bar-wrapper');
    const barLabel = document.querySelector('.counter-label');

    barWrapper.classList.add('completed');
    barLabel.textContent = 'Es wurden alle Pixel aufgedeckt!';
  }

  /* Function to generate a shuffled array of pixel indices using Fisher-Yates shuffle. */
  function generateShuffledIndices(total) {
    const indices = Array.from({ length: total }, (_, index) => index);

    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    return indices;
  }

  /* Function to reveal pixels in random order. */
  function revealPixels(count) {
    // Determine how many pixels to reveal in this call
    const pixelsToReveal = Math.min(
      count,
      totalPixelsMax - currentPixelIndex // Ensure we don't exceed totalPixelsMax
    );

    for (let i = 0; i < pixelsToReveal; i++) {
      if (currentPixelIndex >= shuffledIndices.length) {
        break; // All pixels have been revealed
      }

      // Get the shuffled index
      const shuffledIndex = shuffledIndices[currentPixelIndex];

      // Calculate (x, y) from shuffledIndex
      const x = shuffledIndex % canvas.width;
      const y = Math.floor(shuffledIndex / canvas.width);

      // Get pixel data from the offscreen canvas
      const index = shuffledIndex * 4;
      const r = originalImageData.data[index];
      const g = originalImageData.data[index + 1];
      const b = originalImageData.data[index + 2];
      const a = originalImageData.data[index + 3] / 255;

      // Reveal the pixel on the visible canvas
      renderingContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      renderingContext.fillRect(x, y, 1, 1);

      // Move to the next pixel
      currentPixelIndex++;
    }
  }

  /* Function to animate pixel revelation. */
  function animateReveal() {
    const animationDuration = 5000; // Duration in milliseconds
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1); // Progress from 0 to 1

      const pixelsToRevealNow =
        Math.floor(progress * totalPixelsToReveal) - currentPixelIndex;
      if (pixelsToRevealNow > 0) {
        revealPixels(pixelsToRevealNow);
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Check if all pixels have been revealed
        if (currentPixelIndex >= totalPixelsMax) {
          displaySuccessMessage();
        }
      }
    }

    requestAnimationFrame(step);
  }

  /* Function to load an image and return a promise */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    });
  }

  /* Function to update totalPixelsToReveal */
  function updateTotalPixels(newTotal) {
    totalPixelsToReveal = newTotal; // Set to desired total, even if it exceeds totalPixelsMax
    console.log(`Total pixels to reveal updated to: ${totalPixelsToReveal}`);

    // Start revealing pixels based on the new total
    if (currentPixelIndex < totalPixelsMax) {
      animateReveal(); // Start the time-based animation
    }
  }

  /* Load both images and set up canvases */
  Promise.all([loadImage(overlayPath), loadImage(imgPath)])
    .then(([overlay, image]) => {
      // Set canvas sizes to match the images
      canvas.width = image.width;
      canvas.height = image.height;
      offscreenCanvas.width = image.width;
      offscreenCanvas.height = image.height;

      // Draw the overlay on the visible canvas
      renderingContext.drawImage(overlay, 0, 0, canvas.width, canvas.height);

      // Draw the main image on the offscreen canvas
      offscreenRenderingContext.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Get the image data from the offscreen canvas
      originalImageData = offscreenRenderingContext.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Update totalPixelsMax based on canvas size
      totalPixelsMax = canvas.width * canvas.height;

      // Generate and store shuffled pixel indices
      shuffledIndices = generateShuffledIndices(totalPixelsMax);

      // Start revealing pixels based on the initial pixelsRevealed value
      updateTotalPixels(totalPixelsToReveal);
    })
    .catch((err) => {
      console.error('Image loading error:', err);
    });
});
