const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3001;

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJoYXJpc21pdGEuMjJhZEBrY3QuYWMuaW4iLCJleHAiOjE3NTA0ODI0MjQsImlhdCI6MTc1MDQ4MjEyNCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjM4ZGZkOGU2LWUxMGUtNGMzOC05ZGEzLTIyNmE4OTEwMmMwYSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImhhcmlzbWl0YSBrIiwic3ViIjoiNzliOWE1MTMtODFjZS00YjhhLThhZDQtNzY2NjQwMDg1YTQ5In0sImVtYWlsIjoiaGFyaXNtaXRhLjIyYWRAa2N0LmFjLmluIiwibmFtZSI6ImhhcmlzbWl0YSBrIiwicm9sbE5vIjoiMjJiYWQwMzQiLCJhY2Nlc3NDb2RlIjoiV2NUU0t2IiwiY2xpZW50SUQiOiI3OWI5YTUxMy04MWNlLTRiOGEtOGFkNC03NjY2NDAwODVhNDkiLCJjbGllbnRTZWNyZXQiOiJKbUN0Y1lXdFVyR0ZqWmZ3In0.ON8EYdmnk4hxkQrZDDghhAU3Wvj6IviyOQc568Bcu6s";
 // Replace with your actual token
const BASE_URL = "http://20.244.56.144/evaluation-service";

// Helper: Pearson Correlation
function calculateCorrelation(pricesX, pricesY) {
  const n = Math.min(pricesX.length, pricesY.length);

  const x = pricesX.slice(-n).map(p => p.price);
  const y = pricesY.slice(-n).map(p => p.price);

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0, denomX = 0, denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return Number((numerator / denominator).toFixed(4));
}

// ✅ API 1: Get average stock price for ticker
app.get('/stocks/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const { minutes, aggregation } = req.query;

  if (!minutes || aggregation !== 'average') {
    return res.status(400).json({ error: 'Please provide ?minutes=m&aggregation=average' });
  }

  try {
    const response = await axios.get(`${BASE_URL}/stocks/${ticker}/${minutes}`, {
      headers: {
        Authorization: ACCESS_TOKEN
      }
    });

    const prices = response.data || [];

    const priceHistory = prices.map(p => ({
      price: p.price,
      lastUpdatedAt: p.lastUpdatedAt
    }));

    const average =
      priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length || 0;

    return res.json({
      averageStockPrice: Number(average.toFixed(6)),
      priceHistory
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch stock data',
      detail: error.message
    });
  }
});

// ✅ API 2: Correlation between two tickers
app.get('/stockcorrelation', async (req, res) => {
  const { minutes, ticker } = req.query;

  const [t1, t2] = Array.isArray(ticker) ? ticker : [ticker];

  if (!t1 || !t2) {
    return res.status(400).json({ error: 'Please provide exactly two tickers' });
  }

  try {
    const [res1, res2] = await Promise.all([
      axios.get(`${BASE_URL}/stocks/${t1}/${minutes}`, {
        headers: { Authorization: ACCESS_TOKEN }
      }),
      axios.get(`${BASE_URL}/stocks/${t2}/${minutes}`, {
        headers: { Authorization: ACCESS_TOKEN }
      })
    ]);

    const prices1 = res1.data || [];
    const prices2 = res2.data || [];

    const avg1 = prices1.reduce((sum, p) => sum + p.price, 0) / prices1.length || 0;
    const avg2 = prices2.reduce((sum, p) => sum + p.price, 0) / prices2.length || 0;

    const correlation = calculateCorrelation(prices1, prices2);

    return res.json({
      correlation,
      stocks: {
        [t1]: {
          averagePrice: Number(avg1.toFixed(6)),
          priceHistory: prices1
        },
        [t2]: {
          averagePrice: Number(avg2.toFixed(6)),
          priceHistory: prices2
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch stock data',
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Stock Price Aggregator running on http://localhost:${PORT}`);
});
