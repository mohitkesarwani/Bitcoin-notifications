const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello from fallback template!');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.get('/health', (req, res) => res.send('OK'));
