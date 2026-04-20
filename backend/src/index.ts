import express from 'express';
import { kpisHandler } from './adapters/http/kpis.controller';
import { topProductsHandler } from './adapters/http/topProducts.controller';
import { salesByStateHandler } from './adapters/http/salesByState.controller';
import { revenueTrendHandler } from './adapters/http/revenueTrend.controller';
import { filterOptionsHandler } from './adapters/http/filterOptions.controller';

import { validateDateRange } from './adapters/http/middlewares/validateQuery';
import { errorHandler } from './adapters/http/middlewares/errorHandler';
import { asyncHandler } from './adapters/http/middlewares/asyncHandler';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/filters/options', asyncHandler(filterOptionsHandler));
app.get('/kpis', validateDateRange, asyncHandler(kpisHandler));
app.get('/top-products', validateDateRange, asyncHandler(topProductsHandler));
app.get('/sales-by-state', validateDateRange, asyncHandler(salesByStateHandler));
app.get('/revenue-trend', validateDateRange, asyncHandler(revenueTrendHandler));

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});