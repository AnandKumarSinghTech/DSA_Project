#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <cstdlib>

using namespace std;

// Check if placing queen at (row, col) is safe
bool isSafe(const vector<vector<int>>& board, int row, int col, int N) {
    // Check row on left side
    for (int i = 0; i < col; i++) {
        if (board[row][i] == 1) return false;
    }
    // Check upper diagonal on left side
    for (int i = row, j = col; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 1) return false;
    }
    // Check lower diagonal on left side
    for (int i = row, j = col; i < N && j >= 0; i++, j--) {
        if (board[i][j] == 1) return false;
    }
    return true;
}

// Backtracking solver
bool solveNQUtil(vector<vector<int>>& board, int col, int N) {
    if (col >= N) return true;

    // Check if column already has a pre-placed queen
    bool colHasQueen = false;
    int queenRow = -1;
    for (int r = 0; r < N; r++) {
        if (board[r][col] == 1) {
            colHasQueen = true;
            queenRow = r;
            break;
        }
    }

    if (colHasQueen) {
        // Verify if pre-placed queen is safe with respect to columns 0..col-1
        board[queenRow][col] = 0; // temp clear to test isSafe
        if (isSafe(board, queenRow, col, N)) {
            board[queenRow][col] = 1; // restore
            if (solveNQUtil(board, col + 1, N)) return true;
        } else {
            board[queenRow][col] = 1; // restore
            return false;
        }
        return false;
    }

    for (int i = 0; i < N; i++) {
        if (isSafe(board, i, col, N)) {
            board[i][col] = 1;
            if (solveNQUtil(board, col + 1, N)) return true;
            board[i][col] = 0; // Backtrack
        }
    }
    return false;
}

// Validate current board state
bool validateBoard(const vector<vector<int>>& board, int N, vector<pair<int,int>>& conflicts) {
    bool valid = true;
    vector<pair<int,int>> queens;
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < N; j++) {
            if (board[i][j] == 1) {
                queens.push_back({i, j});
            }
        }
    }

    for (size_t i = 0; i < queens.size(); i++) {
        for (size_t j = i + 1; j < queens.size(); j++) {
            int r1 = queens[i].first, c1 = queens[i].second;
            int r2 = queens[j].first, c2 = queens[j].second;
            if (r1 == r2 || c1 == c2 || abs(r1 - r2) == abs(c1 - c2)) {
                valid = false;
                conflicts.push_back(queens[i]);
                conflicts.push_back(queens[j]);
            }
        }
    }
    return valid;
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        cout << "{\"error\": \"Missing argument size N\"}" << endl;
        return 1;
    }

    int N = atoi(argv[1]);
    if (N < 4 || N > 16) {
        // Fallback default
        N = 8;
    }

    vector<vector<int>> board(N, vector<int>(N, 0));

    // Optional mode: mode arg argv[2] -> 'solve' or 'validate'
    string mode = (argc >= 3) ? argv[2] : "solve";

    // Optional board input as flat string of N*N chars '0'/'1'
    if (argc >= 4) {
        string boardStr = argv[3];
        if ((int)boardStr.length() >= N * N) {
            for (int i = 0; i < N; i++) {
                for (int j = 0; j < N; j++) {
                    board[i][j] = (boardStr[i * N + j] == '1') ? 1 : 0;
                }
            }
        }
    }

    if (mode == "validate") {
        vector<pair<int,int>> conflicts;
        bool isValid = validateBoard(board, N, conflicts);
        cout << "{\"status\": \"" << (isValid ? "valid" : "invalid") << "\", \"N\": " << N << ", \"conflicts\": [";
        for (size_t i = 0; i < conflicts.size(); i++) {
            cout << "{\"row\": " << conflicts[i].first << ", \"col\": " << conflicts[i].second << "}";
            if (i + 1 < conflicts.size()) cout << ",";
        }
        cout << "]}" << endl;
        return 0;
    }

    // Solve mode
    bool success = solveNQUtil(board, 0, N);

    cout << "{";
    if (success) {
        cout << "\"status\": \"success\", \"N\": " << N << ", \"board\": [";
        for (int i = 0; i < N; i++) {
            cout << "[";
            for (int j = 0; j < N; j++) {
                cout << board[i][j];
                if (j < N - 1) cout << ",";
            }
            cout << "]";
            if (i < N - 1) cout << ",";
        }
        cout << "]";
    } else {
        cout << "\"status\": \"no_solution\", \"N\": " << N;
    }
    cout << "}" << endl;

    return 0;
}
