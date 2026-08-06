"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureCppBinaries = ensureCppBinaries;
exports.runCppBinary = runCppBinary;
exports.fallbackNQueens = fallbackNQueens;
exports.fallbackSudokuSolve = fallbackSudokuSolve;
exports.fallbackSudokuValidate = fallbackSudokuValidate;
exports.fallbackHanoi = fallbackHanoi;
var child_process_1 = require("child_process");
var path_1 = require("path");
var fs_1 = require("fs");
var projectRoot = process.cwd();
var binDir = path_1.default.join(projectRoot, "bin");
var cppDir = path_1.default.join(projectRoot, "cpp");
var executableName = function (name) { return "".concat(name).concat(process.platform === "win32" ? ".exe" : ""); };
// Helper to ensure C++ binaries are compiled
function ensureCppBinaries() {
    try {
        if (!fs_1.default.existsSync(binDir)) {
            fs_1.default.mkdirSync(binDir, { recursive: true });
        }
        var binaries = ["nqueens", "sudoku", "hanoi", "tictactoe"];
        for (var _i = 0, binaries_1 = binaries; _i < binaries_1.length; _i++) {
            var bin = binaries_1[_i];
            var binPath = path_1.default.join(binDir, executableName(bin));
            var cppPath = path_1.default.join(cppDir, "".concat(bin, ".cpp"));
            if (!fs_1.default.existsSync(binPath) && fs_1.default.existsSync(cppPath)) {
                try {
                    (0, child_process_1.execSync)("g++ -O3 \"".concat(cppPath, "\" -o \"").concat(binPath, "\""), { stdio: "ignore" });
                }
                catch (e) {
                    console.warn("Could not compile C++ binary ".concat(bin, ":"), e);
                }
            }
        }
    }
    catch (e) {
        console.warn("ensureCppBinaries error:", e);
    }
}
// Execute C++ binary
function runCppBinary(binaryName, args) {
    return new Promise(function (resolve) {
        ensureCppBinaries();
        var binPath = path_1.default.join(binDir, executableName(binaryName));
        if (!fs_1.default.existsSync(binPath)) {
            resolve({ error: "Binary ".concat(binaryName, " not found") });
            return;
        }
        (0, child_process_1.execFile)(binPath, args, { timeout: 8000 }, function (error, stdout, stderr) {
            if (error) {
                console.error("Error executing C++ binary ".concat(binaryName, ":"), stderr || error.message);
                resolve({ error: stderr || error.message });
                return;
            }
            try {
                var json = JSON.parse(stdout.trim());
                resolve(json);
            }
            catch (e) {
                resolve({ rawOutput: stdout.trim() });
            }
        });
    });
}
/* ============================================================
   TYPESCRIPT FALLBACK ALGORITHMS
   ============================================================ */
function fallbackNQueens(N, boardStr) {
    var board = Array(N).fill(0).map(function () { return Array(N).fill(0); });
    if (boardStr && boardStr.length >= N * N) {
        for (var i = 0; i < N; i++) {
            for (var j = 0; j < N; j++) {
                board[i][j] = boardStr[i * N + j] === "1" ? 1 : 0;
            }
        }
    }
    function isSafe(b, row, col) {
        for (var i = 0; i < col; i++)
            if (b[row][i] === 1)
                return false;
        for (var i = row, j = col; i >= 0 && j >= 0; i--, j--)
            if (b[i][j] === 1)
                return false;
        for (var i = row, j = col; i < N && j >= 0; i++, j--)
            if (b[i][j] === 1)
                return false;
        return true;
    }
    function solve(col) {
        if (col >= N)
            return true;
        for (var i = 0; i < N; i++) {
            if (isSafe(board, i, col)) {
                board[i][col] = 1;
                if (solve(col + 1))
                    return true;
                board[i][col] = 0;
            }
        }
        return false;
    }
    var success = solve(0);
    return success ? { status: "success", N: N, board: board } : { status: "no_solution", N: N };
}
function fallbackSudokuSolve(boardStr) {
    var grid = Array(9).fill(0).map(function () { return Array(9).fill(0); });
    for (var i = 0; i < 81; i++) {
        var val = parseInt(boardStr[i] || "0", 10);
        grid[Math.floor(i / 9)][i % 9] = isNaN(val) ? 0 : val;
    }
    function isValid(r, c, num) {
        for (var i = 0; i < 9; i++) {
            if (grid[r][i] === num && i !== c)
                return false;
            if (grid[i][c] === num && i !== r)
                return false;
        }
        var boxR = Math.floor(r / 3) * 3;
        var boxC = Math.floor(c / 3) * 3;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                var nr = boxR + i, nc = boxC + j;
                if (grid[nr][nc] === num && (nr !== r || nc !== c))
                    return false;
            }
        }
        return true;
    }
    function solve() {
        for (var r = 0; r < 9; r++) {
            for (var c = 0; c < 9; c++) {
                if (grid[r][c] === 0) {
                    for (var num = 1; num <= 9; num++) {
                        if (isValid(r, c, num)) {
                            grid[r][c] = num;
                            if (solve())
                                return true;
                            grid[r][c] = 0;
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }
    var success = solve();
    return success ? { status: "success", solution: grid } : { status: "no_solution" };
}
function fallbackSudokuValidate(boardStr) {
    var grid = Array.from({ length: 9 }, function (_, row) {
        return Array.from({ length: 9 }, function (_, col) { return Number.parseInt(boardStr[row * 9 + col] || "0", 10) || 0; });
    });
    var conflicts = [];
    var recordDuplicates = function (cells) {
        var values = new Map();
        cells.forEach(function (_a) {
            var _b;
            var row = _a.row, col = _a.col;
            var value = grid[row][col];
            if (value)
                values.set(value, __spreadArray(__spreadArray([], ((_b = values.get(value)) !== null && _b !== void 0 ? _b : []), true), [{ row: row, col: col }], false));
        });
        values.forEach(function (positions, value) {
            if (positions.length > 1)
                positions.forEach(function (position) { return conflicts.push(__assign(__assign({}, position), { val: value })); });
        });
    };
    var _loop_1 = function (index) {
        recordDuplicates(Array.from({ length: 9 }, function (_, col) { return ({ row: index, col: col }); }));
        recordDuplicates(Array.from({ length: 9 }, function (_, row) { return ({ row: row, col: index }); }));
    };
    for (var index = 0; index < 9; index++) {
        _loop_1(index);
    }
    var _loop_2 = function (boxRow) {
        var _loop_3 = function (boxCol) {
            recordDuplicates(Array.from({ length: 9 }, function (_, index) { return ({ row: boxRow + Math.floor(index / 3), col: boxCol + (index % 3) }); }));
        };
        for (var boxCol = 0; boxCol < 9; boxCol += 3) {
            _loop_3(boxCol);
        }
    };
    for (var boxRow = 0; boxRow < 9; boxRow += 3) {
        _loop_2(boxRow);
    }
    var uniqueConflicts = conflicts.filter(function (cell, index, all) {
        return all.findIndex(function (other) { return other.row === cell.row && other.col === cell.col; }) === index;
    });
    var emptyCount = grid.flat().filter(function (value) { return value === 0; }).length;
    return {
        status: uniqueConflicts.length ? "invalid" : emptyCount ? "valid" : "completed",
        emptyCount: emptyCount,
        conflicts: uniqueConflicts,
    };
}
function fallbackHanoi(disks) {
    var moves = [];
    var step = 1;
    function solve(n, src, dst, aux) {
        if (n <= 0)
            return;
        solve(n - 1, src, aux, dst);
        moves.push({ step: step++, disk: n, from: src, to: dst });
        solve(n - 1, aux, dst, src);
    }
    solve(disks, "A", "C", "B");
    return { disks: disks, minMoves: Math.pow(2, disks) - 1, moves: moves };
}
