
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

const WINDOW_SIZE = 10;
let window = [];

// ✅ Your Bearer Token
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJoYXJpc21pdGEuMjJhZEBrY3QuYWMuaW4iLCJleHAiOjE3NTA0ODI0MjQsImlhdCI6MTc1MDQ4MjEyNCwiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6IjM4ZGZkOGU2LWUxMGUtNGMzOC05ZGEzLTIyNmE4OTEwMmMwYSIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImhhcmlzbWl0YSBrIiwic3ViIjoiNzliOWE1MTMtODFjZS00YjhhLThhZDQtNzY2NjQwMDg1YTQ5In0sImVtYWlsIjoiaGFyaXNtaXRhLjIyYWRAa2N0LmFjLmluIiwibmFtZSI6ImhhcmlzbWl0YSBrIiwicm9sbE5vIjoiMjJiYWQwMzQiLCJhY2Nlc3NDb2RlIjoiV2NUU0t2IiwiY2xpZW50SUQiOiI3OWI5YTUxMy04MWNlLTRiOGEtOGFkNC03NjY2NDAwODVhNDkiLCJjbGllbnRTZWNyZXQiOiJKbUN0Y1lXdFVyR0ZqWmZ3In0.ON8EYdmnk4hxkQrZDDghhAU3Wvj6IviyOQc568Bcu6s";

// ✅ Allowed types
const isValidId = (id) => ['p', 'f', 'e', 'r'].includes(id);

// ✅ Endpoints for types
const thirdPartyURLs = {
  p: 'http://20.244.56.144/test/primes',
  f: 'http://20.244.56.144/test/fibo',
  e: 'http://20.244.56.144/test/even',
  r: 'http://20.244.56.144/test/rand'
};

app.get('/numbers/:numberid', async (req, res) => {
  const id = req.params.numberid;

  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid number id' });
  }

  const prevWindow = [...window];
  let numbers = [];

  try {
    const source = axios.CancelToken.source();
    const timeout = setTimeout(() => source.cancel(), 500);

    const response = await axios.get(thirdPartyURLs[id], {
      cancelToken: source.token,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    clearTimeout(timeout);
    numbers = response.data.numbers || [];

    // Store unique numbers with sliding window logic
    for (let num of numbers) {
      if (!window.includes(num)) {
        if (window.length >= WINDOW_SIZE) {
          window.shift(); // Remove oldest
        }
        window.push(num);
      }
    }

    const avg = window.reduce((a, b) => a + b, 0) / window.length || 0;

    res.json({
      windowPrevState: prevWindow,
      windowCurrState: window,
      numbers: numbers,
      avg: Number(avg.toFixed(2))
    });

  } catch (error) {
    res.json({
      windowPrevState: prevWindow,
      windowCurrState: window,
      numbers: [],
      avg: Number((window.reduce((a, b) => a + b, 0) / window.length || 0).toFixed(2)),
      error: 'Failed to fetch from third-party or timeout'
    });
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
