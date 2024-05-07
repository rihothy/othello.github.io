function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function playFlip(board, chess, type) {
    let [white, black] = board.count();

    if (chess.className !== '') {
        chess.style.animation = 'disappear 0.15s ease-in-out';
        await sleep(150);
    }

    document.getElementById('white-score').innerHTML = `${white}`;
    document.getElementById('black-score').innerHTML = `${black}`;

    chess.className = type + '-chess';
    chess.style.animation = 'appear 0.2s ease-in-out';
    await sleep(150);
}

let dir = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]];
let weight = [
    [90, -60, 10, 10, 10, 10, -60, 90],
    [-60, -80, 5, 5, 5, 5, -80, -60],
    [10, 5, 1, 1, 1, 1, 5, 10],
    [10, 5, 1, 1, 1, 1, 5, 10],
    [10, 5, 1, 1, 1, 1, 5, 10],
    [10, 5, 1, 1, 1, 1, 5, 10],
    [-60, -80, 5, 5, 5, 5, -80, -60],
    [90, -60, 10, 10, 10, 10, -60, 90]
];

{
    let sum = 0;

    for (let line of weight) {
        for (let val of line) {
            sum += val;
        }
    }

    for (let i = 0; i < 8; ++i) {
        for (let j = 0; j < 8; ++j) {
            weight[i][j] /= sum;
        }
    }
}

class Board {
    constructor(chesses) {
        this.data = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 2, 0, 0, 0], [0, 0, 0, 2, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]];
        this.chesses = chesses;
    }

    copy(board) {
        for (let i = 0; i < 8; ++i) {
            for (let j = 0; j < 8; ++j) {
                this.data[i][j] = board.data[i][j];
            }
        }
    }

    getType(i, j) {
        if (this.data[i][j] == 1) {
            return 'white';
        } else if (this.data[i][j] == 2) {
            return 'black';
        } else {
            return 'empty';
        }
    }

    getNext(i, j, cur_type) {
        let next = [0, 0, 0, 0, 0, 0, 0, 0], found = false;

        if (this.getType(i, j) == 'empty') {
            for (let k = 0; k < 8; ++k) {
                for (let ti = i + dir[k][0], tj = j + dir[k][1], first = true; ti >= 0 && ti < 8 && tj >= 0 && tj < 8; ti += dir[k][0], tj += dir[k][1], first = false) {
                    let type = this.getType(ti, tj);

                    if (type == 'empty') {
                        break;
                    } else if (type == cur_type) {
                        if (!first) {
                            next[k] = 1;
                            found = true;
                        }

                        break;
                    }
                }
            }
        }

        return found ? next : undefined;
    }

    hasNext(cur_type) {
        for (let i = 0; i < 8; ++i) {
            for (let j = 0; j < 8; ++j) {
                if (this.getNext(i, j, cur_type) !== undefined) {
                    return true;
                }
            }
        }

        return false;
    }

    count() {
        let white = 0, black = 0;

        for (let i = 0; i < 8; ++i) {
            for (let j = 0; j < 8; ++j) {
                let type = this.getType(i, j);

                if (type == 'white') {
                    ++white;
                } else if (type == 'black') {
                    ++black;
                }
            }
        }

        return [white, black];
    }

    eval(cur_type) {
        let [white, black] = this.count();
        let val = 0;
        let cnt = 0;

        for (let i = 0; i < 8; ++i) {
            for (let j = 0; j < 8; ++j) {
                let type = this.getType(i, j);

                if (type != 'empty') {
                    if (type == cur_type) {
                        ++cnt;
                        val += weight[i][j];
                    } else {
                        ++cnt;
                        val -= weight[i][j];
                    }
                }
            }
        }

        val /= cnt;

        if (cur_type == 'white') {
            val += (white - black) / (white + black);
        } else {
            val += (black - white) / (white + black);
        }

        return val;
    }

    async move(i, j, next, cur_type, display) {
        this.data[i][j] = cur_type == 'white' ? 1 : 2;

        if (display) {
            await playFlip(this, this.chesses[i * 8 + j], cur_type);
        }

        for (let k = 0; k < 8; ++k) {
            if (next[k]) {
                for (let ti = i + dir[k][0], tj = j + dir[k][1]; ti >= 0 && ti < 8 && tj >= 0 && tj < 8; ti += dir[k][0], tj += dir[k][1]) {
                    let type = this.getType(ti, tj);

                    if (type != cur_type) {
                        this.data[ti][tj] = cur_type == 'white' ? 1 : 2;

                        if (display) {
                            await playFlip(this, this.chesses[ti * 8 + tj], cur_type);
                        }
                    } else {
                        break;
                    }
                }
            }
        }
    }
}

async function miniMax(board, ai_type) {
    let cnt = 0;
    let maxDepth = 7;
    let hasDepth = false;
    let player_type = ai_type == 'white' ? 'black' : 'white';
    let dfs = async (board, depth, alpha, beta) => {
        let val = depth % 2 ? 1000 : -1000;
        let i = -1, j = -1;

        ++cnt;

        if (depth < maxDepth) {
            for (let ti = 0; ti < 8 && alpha < beta; ++ti) {
                for (let tj = 0; tj < 8 && alpha < beta; ++tj) {
                    let next = board.getNext(ti, tj, depth % 2 ? player_type : ai_type);
    
                    if (next !== undefined) {
                        let tboard = new Board(board.chesses);
    
                        tboard.copy(board);
                        await tboard.move(ti, tj, next, depth % 2 ? player_type : ai_type, false);
    
                        let [tti, ttj, tval] = await dfs(tboard, depth + 1, alpha, beta);

                        if (true) {
                            if (depth % 2) {
                                beta = Math.min(beta, tval);
                            } else {
                                alpha = Math.max(alpha, tval);
                            }
                        }

                        if (depth % 2 == 1 && tval < val) {
                            val = tval, i = ti, j = tj;
                        } else if (depth % 2 == 0 && tval > val) {
                            val = tval, i = ti, j = tj;
                        } else if (tval == val && Math.random() < 0.5) {
                            i = ti, j = tj;
                        }
                    }
                }
            }
        } else {
            hasDepth = true;
        }

        if (i == -1) {
            val = board.eval(ai_type);
        }

        // console.log('iter', depth, val);

        return [i, j, val];
    };

    while (true) {
        cnt = 0;
        hasDepth = false;

        let [i, j, val] = await dfs(board, 0, -1000, 1000);

        // console.log('--------------');

        // return [i, j];

        if (cnt < 100000 && hasDepth) {
            ++maxDepth;
        } else {
            console.log('cnt', cnt, maxDepth);

            return [i, j];
        }
    }
}