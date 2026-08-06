#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>
#include <cmath>

using namespace std;

struct Move {
    int disk;
    char fromPeg;
    char toPeg;
};

void solveHanoi(int n, char source, char destination, char auxiliary, vector<Move>& moves) {
    if (n <= 0) return;
    solveHanoi(n - 1, source, auxiliary, destination, moves);
    moves.push_back({n, source, destination});
    solveHanoi(n - 1, auxiliary, destination, source, moves);
}

int main(int argc, char* argv[]) {
    int numDisks = 3;
    if (argc >= 2) {
        numDisks = atoi(argv[1]);
    }

    if (numDisks < 1) numDisks = 1;
    if (numDisks > 10) numDisks = 10; // keep reasonable

    vector<Move> moves;
    solveHanoi(numDisks, 'A', 'C', 'B', moves);

    long long minMoves = (1LL << numDisks) - 1;

    cout << "{\"disks\":" << numDisks << ",\"minMoves\":" << minMoves << ",\"moves\":[";
    for (size_t i = 0; i < moves.size(); i++) {
        cout << "{\"step\":" << (i + 1)
             << ",\"disk\":" << moves[i].disk 
             << ",\"from\":\"" << moves[i].fromPeg << "\""
             << ",\"to\":\"" << moves[i].toPeg << "\"}";
        if (i + 1 < moves.size()) cout << ",";
    }
    cout << "]}" << endl;

    return 0;
}
