#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <climits>
#include <cstdlib>

using namespace std;

// Board representation: 'X', 'O', or '_'
int sizeN = 3;
int winLength = 3;

char checkWinner(const vector<vector<char>>& board) {
    int N = board.size();

    // Check rows and columns
    for (int i = 0; i < N; i++) {
        for (int j = 0; j <= N - winLength; j++) {
            // Row check
            char first = board[i][j];
            if (first != '_') {
                bool match = true;
                for (int k = 1; k < winLength; k++) {
                    if (board[i][j + k] != first) { match = false; break; }
                }
                if (match) return first;
            }
            // Column check
            char colFirst = board[j][i];
            if (colFirst != '_') {
                bool match = true;
                for (int k = 1; k < winLength; k++) {
                    if (board[j + k][i] != colFirst) { match = false; break; }
                }
                if (match) return colFirst;
            }
        }
    }

    // Diagonals
    for (int r = 0; r <= N - winLength; r++) {
        for (int c = 0; c <= N - winLength; c++) {
            // Top-left to bottom-right
            char d1 = board[r][c];
            if (d1 != '_') {
                bool match = true;
                for (int k = 1; k < winLength; k++) {
                    if (board[r + k][c + k] != d1) { match = false; break; }
                }
                if (match) return d1;
            }
        }
    }

    for (int r = 0; r <= N - winLength; r++) {
        for (int c = winLength - 1; c < N; c++) {
            // Top-right to bottom-left
            char d2 = board[r][c];
            if (d2 != '_') {
                bool match = true;
                for (int k = 1; k < winLength; k++) {
                    if (board[r + k][c - k] != d2) { match = false; break; }
                }
                if (match) return d2;
            }
        }
    }

    // Check draw or in progress
    bool hasEmpty = false;
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            if (board[i][j] == '_') { hasEmpty = true; break; }
        }
    }

    if (!hasEmpty) return 'D'; // Draw
    return 'P'; // In progress
}

// Simple heuristic evaluation for larger boards / depth limits
int evaluateBoard(const vector<vector<char>>& board, char aiPlayer) {
    char opponent = (aiPlayer == 'X') ? 'O' : 'X';
    char winner = checkWinner(board);
    if (winner == aiPlayer) return 1000;
    if (winner == opponent) return -1000;
    if (winner == 'D') return 0;
    return 0;
}

int minimax(vector<vector<char>>& board, int depth, bool isMax, char aiPlayer, int alpha, int beta, int maxDepth) {
    char opponent = (aiPlayer == 'X') ? 'O' : 'X';
    char winner = checkWinner(board);

    if (winner == aiPlayer) return 100 - depth;
    if (winner == opponent) return -100 + depth;
    if (winner == 'D') return 0;
    if (depth >= maxDepth) return 0;

    int N = board.size();

    if (isMax) {
        int maxEval = -10000;
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (board[r][c] == '_') {
                    board[r][c] = aiPlayer;
                    int eval = minimax(board, depth + 1, false, aiPlayer, alpha, beta, maxDepth);
                    board[r][c] = '_';
                    maxEval = max(maxEval, eval);
                    alpha = max(alpha, eval);
                    if (beta <= alpha) break;
                }
            }
        }
        return maxEval;
    } else {
        int minEval = 10000;
        for (int r = 0; r < N; r++) {
            for (int c = 0; c < N; c++) {
                if (board[r][c] == '_') {
                    board[r][c] = opponent;
                    int eval = minimax(board, depth + 1, true, aiPlayer, alpha, beta, maxDepth);
                    board[r][c] = '_';
                    minEval = min(minEval, eval);
                    beta = min(beta, eval);
                    if (beta <= alpha) break;
                }
            }
        }
        return minEval;
    }
}

int main(int argc, char* argv[]) {
    // Usage: ./tictactoe <N> <player mark X/O> <board string length N*N> [mode]
    sizeN = 3;
    char player = 'O'; // AI player by default
    string boardStr = "_________";
    string mode = "move";

    if (argc >= 2) sizeN = atoi(argv[1]);
    if (argc >= 3) player = argv[2][0];
    if (argc >= 4) boardStr = argv[3];
    if (argc >= 5) mode = argv[4];

    if (sizeN < 3) sizeN = 3;
    if (sizeN > 5) sizeN = 5;
    winLength = (sizeN == 3) ? 3 : 4; // 3-in-a-row for 3x3, 4-in-a-row for 4x4 or 5x5

    vector<vector<char>> board(sizeN, vector<char>(sizeN, '_'));
    if ((int)boardStr.length() >= sizeN * sizeN) {
        for (int i = 0; i < sizeN * sizeN; i++) {
            char c = boardStr[i];
            if (c == 'X' || c == 'O') {
                board[i / sizeN][i % sizeN] = c;
            } else {
                board[i / sizeN][i % sizeN] = '_';
            }
        }
    }

    char currentStatus = checkWinner(board);

    if (mode == "validate") {
        string statusStr = "in_progress";
        if (currentStatus == 'X') statusStr = "X_wins";
        else if (currentStatus == 'O') statusStr = "O_wins";
        else if (currentStatus == 'D') statusStr = "draw";

        cout << "{\"status\":\"" << statusStr << "\",\"winner\":\"" << (currentStatus == 'X' || currentStatus == 'O' ? string(1, currentStatus) : "none") << "\"}" << endl;
        return 0;
    }

    if (currentStatus != 'P') {
        cout << "{\"status\":\"game_over\",\"winner\":\"" << currentStatus << "\"}" << endl;
        return 0;
    }

    int bestVal = -10000;
    int bestRow = -1, bestCol = -1;
    int maxDepth = (sizeN == 3) ? 9 : 4; // search depth

    for (int r = 0; r < sizeN; r++) {
        for (int c = 0; c < sizeN; c++) {
            if (board[r][c] == '_') {
                board[r][c] = player;
                int moveVal = minimax(board, 0, false, player, -10000, 10000, maxDepth);
                board[r][c] = '_';
                if (moveVal > bestVal) {
                    bestVal = moveVal;
                    bestRow = r;
                    bestCol = c;
                }
            }
        }
    }

    cout << "{\"status\":\"success\",\"bestRow\":" << bestRow << ",\"bestCol\":" << bestCol << ",\"evalScore\":" << bestVal << "}" << endl;
    return 0;
}
