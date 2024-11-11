const counters = document.querySelectorAll('.counter');
const wrapper = document.querySelector('.meter');
const bar = document.querySelector('.meter > span');

window.onload = () => {
  let wrapperWidth = wrapper.offsetWidth;
  let getProgress = parseFloat(bar.dataset.progress);
  let targetWidth = (getProgress / 1000000) * wrapperWidth;

  // Incrementally animate the bar width
  let currentWidth = 0;
  const animateBar = () => {
    if (currentWidth < targetWidth) {
      currentWidth += targetWidth / 110; // Adjust division for smoother/slower animations
      bar.style.width = `${currentWidth}px`;
      requestAnimationFrame(animateBar);
    } else {
      bar.style.width = `${targetWidth}px`; // Ensure it completes exactly at the target
    }
  };

  requestAnimationFrame(animateBar);
};

const updateCounter = (counter) => {
  const target = +counter.getAttribute('data-target');
  const count = +counter.innerText;
  const increment = target / 200;
  if (count < target) {
    counter.innerText = `${Math.ceil(count + increment)}`;
    requestAnimationFrame(() => updateCounter(counter));
  } else {
    counter.innerText = target.toLocaleString('de-DE');
  }
};

counters.forEach((counter) => {
  counter.innerText = '0';
  updateCounter(counter);
});
