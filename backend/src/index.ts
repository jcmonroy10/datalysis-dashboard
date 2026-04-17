import express from 'express';
import { kpisHandler } from './adapters/http/kpis.controller';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/kpis', kpisHandler);