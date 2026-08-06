#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>

using namespace std;

#define GRID_SIZE 9

bool isValid(const vector<vector<int>>& board, int row, int col, int num) {
    for (int i = 0; i < GRID_SIZE; i++) {
        if (board[row][i] == num && i != col) return false;
        if (board[i][col] == num && i != row) return false;
    }

    int startRow = row - row % 3;
    int startCol = col - col % 3;
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            int r = startRow + i;
            int c = startCol + j;
            if (board[r][c] == num && (r != row || c != col)) return false;
        }
    }
    return true;
}

// Find unassigned cell with minimum remaining values (MRV)
bool findBestEmptyCell(const vector<vector<int>>& board, int& bestRow, int& bestCol) {
    int minCandidates = 10;
    bestRow = -1;
    bestCol = -1;

    for (int r = 0; r < GRID_SIZE; r++) {
        for (int c = 0; c < GRID_SIZE; c++) {
            if (board[r][c] == 0) {
                int candidates = 0;
                for (int num = 1; num <= 9; num++) {
                    if (isValid(board, r, c, num)) candidates++;
                }
                if (candidates < minCandidates) {
                    minCandidates = candidates;
                    bestRow = r;
                    bestCol = c;
                }
            }
        }
    }
    return (bestRow != -1);
}

bool solveSudoku(vector<vector<int>>& board) {
    int row, col;
    if (!findBestEmptyCell(board, row, col)) {
        return true; // All filled
    }

    for (int num = 1; num <= 9; num++) {
        if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0; // Backtrack
        }
    }
    return false;
}

int main(int argc, char* argv[]) {
    string mode = "solve";
    string boardStr = "";

    if (argc >= 2) mode = argv[1];
    if (argc >= 3) boardStr = argv[2];

    vector<vector<int>> board(GRID_SIZE, vector<int>(GRID_SIZE, 0));

    if (boardStr.length() >= 81) {
        for (int i = 0; i < 81; i++) {
            char ch = boardStr[i];
            if (ch >= '1' && ch <= '9') {
                board[i / 9][i % 9] = ch - '0';
            } else {
                board[i / 9][i % 9] = 0;
            }
        }
    }

    if (mode == "validate") {
        vector<string> conflicts;
        bool valid = true;
        int emptyCount = 0;

        for (int r = 0; r < GRID_SIZE; r++) {
            for (int c = 0; c < GRID_SIZE; c++) {
                int val = board[r][c];
                if (val == 0) {
                    emptyCount++;
                } else {
                    if (!isValid(board, r, c, val)) {
                        valid = false;
                        conflicts.push_back("{\"row\":" + to_string(r) + ",\"col\":" + to_string(c) + ",\"val\":" + to_string(val) + "}");
                    }
                }
            }
        }

        cout << "{\"status\":\"" << (valid ? (emptyCount == 0 ? "completed" : "valid") : "invalid") << "\",";
        cout << "\"emptyCount\":" << emptyCount << ",";
        cout << "\"conflicts\":[";
        for (size_t i = 0; i < conflicts.size(); i++) {
            cout << conflicts[i];
            if (i + 1 < conflicts.size()) cout << ",";
        }
        cout << "]}" << endl;
        return 0;
    }

    // Solve mode or Hint mode
    vector<vector<int>> solvedBoard = board;
    bool success = solveSudoku(solvedBoard);

    if (mode == "hint") {
        int bestR = -1, bestC = -1;
        // Find first empty or incorrect cell
        for (int r = 0; r < GRID_SIZE && bestR == -1; r++) {
            for (int c = 0; c < GRID_SIZE && bestC == -1; c++) {
                if (board[r][c] == 0) {
                    bestR = r;
                    bestC = c;
                } else if (success && board[r][c] != solvedBoard[r][c]) {
                    // Invalid cell placed by user
                    cout << "{\"status\":\"mistake\",\"row\":" << r << ",\"col\":" << c 
                         << ",\"currentVal\":" << board[r][c] 
                         << ",\"correctVal\":" << solvedBoard[r][c] 
                         << ",\"explanation\":\"The value " << board[r][c] << " at row " << (r+1) << ", col " << (c+1) << " conflicts with Sudoku backtracking solution.\"}" << endl;
                    return 0;
                }
            }
        }

        if (bestR != -1 && success) {
            cout << "{\"status\":\"hint\",\"row\":" << bestR << ",\"col\":" << bestC 
                 << ",\"suggestedValue\":" << solvedBoard[bestR][bestC] 
                 << ",\"explanation\":\"In row " << (bestR+1) << ", column " << (bestC+1) << ", placing " << solvedBoard[bestR][bestC] << " satisfies row, column, and 3x3 block constraints.\"}" << endl;
        } else {
            cout << "{\"status\":\"no_hint\",\"explanation\":\"Board is fully solved or invalid.\"}" << endl;
        }
        return 0;
    }

    // Solve mode
    cout << "{";
    if (success) {
        cout << "\"status\":\"success\",\"solution\":[";
        for (int r = 0; r < GRID_SIZE; r++) {
            cout << "[";
            for (int c = 0; c < GRID_SIZE; c++) {
                cout << solvedBoard[r][c];
                if (c < GRID_SIZE - 1) cout << ",";
            }
            cout << "]";
            if (r < GRID_SIZE - 1) cout << ",";
        }
        cout << "]";
    } else {
        cout << "\"status\":\"no_solution\"";
    }
    cout << "}" << endl;

    return 0;
}
