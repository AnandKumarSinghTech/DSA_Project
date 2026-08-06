# DSA Game Suite (Full-Stack C++ & Gemini AI)

An interactive full-stack web application featuring four classic games: **Sudoku**, **N-Queens**, **Tower of Hanoi**, and **Tic-Tac-Toe**.

## 🌟 Architecture & Tech Stack

- **Frontend**: React (Next.js 16 App Router) with Tailwind CSS, Lucide Icons, Canvas Confetti, and synthesized Web Audio API sound effects.
- **Backend & DSA Bridge**: 
  - **Node.js (Express & Next.js API Routes)** executing compiled C++ binaries via `child_process.execFile`.
  - **C++ Core Algorithms**:
    - **N-Queens**: Backtracking Search Engine ($O(N!)$).
    - **Sudoku**: Backtracking with MRV (Minimum Remaining Values) heuristic & Constraint Propagation.
    - **Tower of Hanoi**: Recursive Divide & Conquer Algorithm ($T(N) = 2^n - 1$).
    - **Tic-Tac-Toe**: Unbeatable Minimax Algorithm with Alpha-Beta Pruning.
- **AI Integration**: Google Gemini API (`@google/generative-ai`) providing **Smart Hints** analyzing game board state and explaining DSA logic behind recommendations.
- **Database**: PostgreSQL with Drizzle ORM storing game sessions, completion times, and leaderboard scores.

## 📁 Project Structure

```text
.
├── cpp/                     # C++ DSA Source Files
│   ├── nqueens.cpp
│   ├── sudoku.cpp
│   ├── hanoi.cpp
│   └── tictactoe.cpp
├── bin/                     # Compiled C++ Executables
├── backend/                 # Express Bridge Server
│   └── server.js
├── src/
│   ├── app/                 # Next.js App Router & API Route Handlers
│   │   ├── api/
│   │   │   ├── dsa/         # C++ binary execution endpoints
│   │   │   ├── hint/        # Gemini AI Smart Hint endpoint
│   │   │   └── scores/      # PostgreSQL Leaderboard endpoint
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/          # React Game Components
│   │   ├── Dashboard.tsx
│   │   ├── NQueens.tsx
│   │   ├── Sudoku.tsx
│   │   ├── TowerOfHanoi.tsx
│   │   ├── TicTacToe.tsx
│   │   └── LeaderboardModal.tsx
│   ├── db/                  # Drizzle ORM Schema & PostgreSQL connection
│   │   ├── schema.ts
│   │   └── index.ts
│   └── lib/                 # DSA Runner & Web Audio synth utilities
```

## 🚀 Environment Setup

1. Configure `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
GEMINI_API_KEY=your_gemini_api_key_here
```

2. Compile C++ Binaries:
```bash
mkdir -p bin
g++ -O3 cpp/nqueens.cpp -o bin/nqueens
g++ -O3 cpp/sudoku.cpp -o bin/sudoku
g++ -O3 cpp/hanoi.cpp -o bin/hanoi
g++ -O3 cpp/tictactoe.cpp -o bin/tictactoe
```

3. Run Server:
```bash
npm run build
npm run start
# Or run standalone Express backend:
node backend/server.js
```
