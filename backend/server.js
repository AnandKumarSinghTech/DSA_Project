const express = require('express');
const { execFile } = require('child_process');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const binDir = path.join(__dirname, '../bin');
const executable = (name) => path.join(binDir, `${name}${process.platform === 'win32' ? '.exe' : ''}`);

// Route for N-Queens C++ execution
app.post(['/api/solve-nqueens', '/api/dsa/nqueens'], (req, res) => {
  const { size = 8, boardStr = '', mode = 'solve' } = req.body;
  const binary = executable('nqueens');

  if (!fs.existsSync(binary)) {
    // Attempt to log for debugging on Vercel
    console.error('Binary not found at:', binary);
    return res.status(500).json({ error: 'C++ nqueens binary not compiled. Run npm run build or node build script.' });
  }

  execFile(binary, [String(size), mode, boardStr], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }
    try {
      res.json(JSON.parse(stdout.trim()));
    } catch (e) {
      res.json({ output: stdout.trim() });
    }
  });
});

// Route for Sudoku C++ execution
app.post(['/api/solve-sudoku', '/api/dsa/sudoku'], (req, res) => {
  const { boardStr = '', mode = 'solve' } = req.body;
  const binary = executable('sudoku');

  if (!fs.existsSync(binary)) {
    return res.status(500).json({ error: 'C++ sudoku binary not compiled.' });
  }

  execFile(binary, [mode, boardStr], (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr || error.message });
    try {
      res.json(JSON.parse(stdout.trim()));
    } catch (e) {
      res.json({ output: stdout.trim() });
    }
  });
});

// Route for Hanoi C++ execution
app.post(['/api/solve-hanoi', '/api/dsa/hanoi'], (req, res) => {
  const { size = 3 } = req.body;
  const binary = executable('hanoi');

  if (!fs.existsSync(binary)) {
    return res.status(500).json({ error: 'C++ hanoi binary not compiled.' });
  }

  execFile(binary, [String(size)], (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: stderr || error.message });
    try {
      res.json(JSON.parse(stdout.trim()));
    } catch (e) {
      res.json({ output: stdout.trim() });
    }
  });
});


// Route for Gemini AI Hint
app.post('/api/hint', async (req, res) => {
  const { gameState, gameName, extraInfo } = req.body;

  if (!genAI) {
    return res.json({
      hint: `Smart DSA Engine Hint for ${gameName}: Review your move options carefully according to constraint rules. (Note: Configure GEMINI_API_KEY in .env to enable full Gemini LLM explanations).`,
      source: 'dsa_fallback'
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `I am playing ${gameName}. The current board state / info is: ${JSON.stringify(gameState)}. Additional details: ${JSON.stringify(extraInfo || {})}. 
Provide a concise (2-3 sentences), friendly, and direct hint for my next best move or point out any mistakes I have made. Explain the core DSA principle (e.g. Backtracking, Recursion, Minimax) behind the suggestion.`;

    const result = await model.generateContent(prompt);
    const hintText = result.response.text();
    res.json({ hint: hintText, source: 'gemini' });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.json({
      hint: `Smart Hint for ${gameName}: Keep logical constraints in mind. Ensure no duplicate numbers or overlapping attack paths.`,
      source: 'fallback_error'
    });
  }
});

// Serve frontend static files in production if not on Vercel
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  const distPath = path.join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

if (process.env.VERCEL) {
  module.exports = app;
} else {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`DSA Backend Server running on port ${PORT}`));
}
