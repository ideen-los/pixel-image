function hearts() {
  // Helper function to generate a random integer between min and max (inclusive)
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Select all elements with both 'particletext' and 'hearts' classes
  const elements = document.querySelectorAll('.particletext.hearts');

  // Iterate over each selected element
  elements.forEach((element) => {
    // Optionally clear existing particles to prevent duplicates
    const existingParticles = element.querySelectorAll('.particle');
    existingParticles.forEach((particle) => particle.remove());

    // Get the width of the current element
    const width = element.offsetWidth;

    // Calculate the number of heart particles based on width
    const heartCount = Math.floor((width / 50) * 3);

    // Create a document fragment to improve performance
    const fragment = document.createDocumentFragment();

    // Create and append heart particles
    for (let i = 0; i <= heartCount; i++) {
      // Generate random size between 6.0px and 12.0px
      const size = rand(60, 120) / 10;

      // Generate random positions and animation delay
      const top = `${rand(20, 80)}%`;
      const left = `${rand(0, 95)}%`;
      const animationDelay = `${rand(0, 30) / 10}s`;

      // Create a new span element
      const span = document.createElement('span');
      span.classList.add('particle');

      // Set inline styles
      span.style.top = top;
      span.style.left = left;
      span.style.width = `${size}px`;
      span.style.height = `${size}px`;
      span.style.animationDelay = animationDelay;

      // Append the span to the fragment
      fragment.appendChild(span);
    }

    // Append all particles to the element at once
    element.appendChild(fragment);
  });
}

// Call the hearts function to generate particles
hearts();

// Re-generate particles on window resize to adapt to new widths
window.addEventListener('resize', hearts);
