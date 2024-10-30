import img from './img/indian-food.jpg';

const canvas = document.getElementById('imageCanvas');
const renderingContext = canvas.getContext('2d');

const offscreenCanvas = document.getElementById('offscreenCanvas');
const offscreenRenderingContext = offscreenCanvas.getContext('2d');

// Variables for revealing pixels
let currentPixelIndex = 0;
let totalPixels = 0;
let originalImageData = null;
let animationId = null;

// Array to hold shuffled pixel indices
let shuffledIndices = [];

// Function to cover the canvas/hide the image
function coverCanvas() {
  renderingContext.fillStyle = '#fff';
  renderingContext.fillRect(0, 0, canvas.width, canvas.height);
}

// Function to generate a shuffled array of pixel indices using Fisher-Yates shuffle
function generateShuffledIndices(total) {
  const indices = Array.from({ length: total }, (_, index) => index);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices;
}

// Function to reveal pixels in random order
function revealPixels(count) {
  // Determine how many pixels to reveal in this call
  const pixelsToReveal = Math.min(count, totalPixels - currentPixelIndex);

  for (let i = 0; i < pixelsToReveal; i++) {
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

// Function to animate pixel revelation
function animateReveal(totalToReveal, pixelsPerFrame) {
  function step() {
    // Determine how many pixels to reveal in this step
    const count = Math.min(
      pixelsPerFrame,
      totalToReveal - currentPixelIndex,
      totalPixels - currentPixelIndex
    );

    if (count > 0) {
      revealPixels(count); // Reveal a batch of pixels
      requestAnimationFrame(step); // Schedule the next batch
    } else {
      console.log('All pixels have been revealed!');
      cancelAnimationFrame(animationId);
    }
  }

  step(); // Start the animation
}

// Load the image and set up canvases
const image = new Image();
image.src = img;
image.onload = () => {
  // Draw the image on the offscreen canvas
  offscreenRenderingContext.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Get the image data from the offscreen canvas
  originalImageData = offscreenRenderingContext.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Update totalPixels based on canvas size
  totalPixels = canvas.width * canvas.height;

  // Generate and store shuffled pixel indices
  shuffledIndices = generateShuffledIndices(totalPixels);

  // Cover the visible canvas with white
  coverCanvas();

  // Start the animation
  animateReveal(1000000, 1000); // Reveal 1,000 pixels per frame
};

// Optional: Handle image load errors
image.onerror = () => {
  console.error('Failed to load the image.');
};
