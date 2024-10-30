import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import { createOrder, generateAccessToken } from './services/paypal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded bodies (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'dist' directory relative to the project root
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

/* ROUTES */
// Paypal URL when donating
app.post('/pay', async (req, res) => {
  try {
    const url = await createOrder();

    res.redirect(url);
  } catch (error) {
    res.send('Error: ' + error);
  }
});
// Redirect here when donation was successful
app.get('/complete-order', (req, res) => {
  res.send('Thank you for your donation!');
});

// Redirect here when donation process was canceled
app.get('/cancel-order', (req, res) => {
  res.redirect('/'); // Serves index.html from 'dist'
});

// For all other routes, serve index.html from the 'dist' directory
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
