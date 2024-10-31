import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import { capturePayment, createOrder } from './services/paypal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse URL-encoded bodies (from HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'dist' directory relative to the project root
const distPath = path.join(process.cwd(), 'dist');
console.log('Serving static files from:', distPath);
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

// Redirect here when donation process was canceled
app.get('/cancel-order', (req, res) => {
  res.redirect('/'); // Serves index.html from 'dist'
});

// Redirect here when donation was successful
app.get('/complete-order', async (req, res) => {
  try {
    const orderId = req.query.token;
    console.log('Order ID:', orderId); // Log the order ID

    if (!orderId) {
      console.error('No order ID provided in the query parameters.');
      return res.status(400).send('Order ID is missing.');
    }

    const captureData = await capturePayment(orderId);
    console.log('Capture Data:', captureData); // Log the capture data

    res.send('Spende erfolgreich');
  } catch (error) {
    console.error('Error in /complete-order route:', error.message);
    res.status(500).send('Error: ' + error.message);
  }
});

// For all other routes, serve index.html from the 'dist' directory
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
