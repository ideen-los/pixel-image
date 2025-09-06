document.addEventListener('DOMContentLoaded', () => {
  const pixelDataElement = document.getElementById('pixel-data');

  if (pixelDataElement) {
    const pixelsRevealed = 100000;

    // Make donation amount value globally available
    window.pixelsRevealed = pixelsRevealed;
  } else {
    console.error('Pixels data element not found.');
  }
});
