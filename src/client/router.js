import { completeOrder } from './completeOrder.js';
import { home } from './home.js';

export const renderView = function (view) {
  const content = document.getElementById('content');

  content.innerHTML = ' ';
  content.innerHTML = view();
};

export const router = function () {
  const path = window.location.pathname; // Get current URL
  const queryParams = new URLSearchParams(window.location.search); // Get query parameters

  switch (path) {
    case '/':
      renderView(home);
      break;
    default:
      renderView(home);
      break;
  }
};
