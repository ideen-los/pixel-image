import { router } from './router.js';
import './style.scss';

// Browser navigation
window.onpopstate = router();

// Initial lod
window.onload = router();
