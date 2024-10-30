import dotenv from 'dotenv';
import express from 'express';
import { createOrder, generateAccessToken } from './services/paypal.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Donation App is running!');
});

generateAccessToken();
createOrder();

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
