document.addEventListener('DOMContentLoaded', () => {
  const counters = document.querySelectorAll('.counter');
  const wrapper = document.querySelector('.meter');
  const bar = document.querySelector('.meter > span');

  if (!wrapper || !bar) {
    console.error('Meter or bar element not found!');
    return;
  }

  const getProgress = parseFloat(window.pixelsRevealed);
  const wrapperWidth = wrapper.offsetWidth;
  const targetWidth = (getProgress / 1000000) * wrapperWidth; // Adjust denominator based on your scaling

  // Animate the progress bar based on time
  const animationDuration = 3700; // Duration in milliseconds

  const animateBar = () => {
    const startTime = performance.now();

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1); // Progress from 0 to 1

      const currentWidth = progress * targetWidth;
      bar.style.width = `${currentWidth}px`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  };

  animateBar();

  // Function to update counters based on time
  const updateCounter = (counter) => {
    const startTime = performance.now();
    const target = getProgress;
    const counterDuration = animationDuration * 1.4; // Increase duration by 20%

    function step(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / counterDuration, 1);

      const count = Math.floor(progress * target);
      counter.innerText = count.toLocaleString('de-DE');

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        counter.innerText = target.toLocaleString('de-DE');
      }
    }

    requestAnimationFrame(step);
  };

  // Initialize counters
  counters.forEach((counter) => {
    counter.innerText = '0';
    updateCounter(counter);
  });
});
