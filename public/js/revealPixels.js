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
let totalPixelsMax = 1000000; // Total number of pixels on the canvas
let totalPixelsToReveal = 0; // Number of pixels to reveal, can be updated dynamically
let originalImageData = null;
let animationId = null;

/* Array to hold shuffled pixel indices. */
let shuffledIndices = [];

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
    totalPixelsToReveal - currentPixelIndex
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
function animateReveal(pixelsPerFrame) {
  function step() {
    // Check if there are more pixels to reveal based on totalPixelsToReveal
    if (
      currentPixelIndex < totalPixelsToReveal &&
      currentPixelIndex < shuffledIndices.length
    ) {
      revealPixels(pixelsPerFrame);
      animationId = requestAnimationFrame(step);
    } else {
      console.log('Current reveal target reached!');
      // If totalPixelsToReveal has increased, continue the loop
      if (
        currentPixelIndex < shuffledIndices.length &&
        totalPixelsToReveal > currentPixelIndex
      ) {
        animationId = requestAnimationFrame(step);
      } else {
        console.log('All pixels have been revealed!');
        cancelAnimationFrame(animationId);
      }
    }
  }

  // Start the animation if it's not already running
  if (!animationId) {
    step();
  }
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

/* Function to update totalPixelsToReveal dynamically */
function updateTotalPixels(newTotal) {
  // Ensure newTotal does not exceed totalPixelsMax
  totalPixelsToReveal = Math.min(newTotal, totalPixelsMax);

  // If the new total is greater than currentPixelIndex, continue revealing
  if (totalPixelsToReveal > currentPixelIndex) {
    animateReveal(1000); // You can adjust pixelsPerFrame as needed
  }

  console.log(`Total pixels to reveal updated to: ${totalPixelsToReveal}`);
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

    // Optionally, set an initial number of pixels to reveal
    // For example, reveal the first 1000 pixels
    updateTotalPixels(1000000);

    // Now, you can update totalPixelsToReveal later based on database data
    // Example:
    /*
  setInterval(() => {
    // Fetch newTotal from the database
    const newTotal = fetchNewTotalFromDatabase();
    updateTotalPixels(newTotal);
  }, 5000); // Update every 5 seconds
  */
  })
  .catch((err) => {
    console.error('Image loading error:', err);
  });

/* Example Function to Simulate Database Updates */
// This is just for demonstration. Replace this with your actual data fetching logic.
function simulateDatabaseUpdates() {
  let currentTotal = 100000;
  const maxTotal = totalPixelsMax;

  const intervalId = setInterval(() => {
    // Increment the totalPixelsToReveal by 1000 every 3 seconds
    currentTotal += 1000;
    if (currentTotal > maxTotal) {
      currentTotal = maxTotal;
      clearInterval(intervalId);
    }
    updateTotalPixels(currentTotal);
  }, 3000);
}

// Uncomment the line below to start simulation
/* simulateDatabaseUpdates(); */
