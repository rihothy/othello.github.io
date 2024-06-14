let cur_type = 'white';
let cur_role = 'player';
let board = undefined;
let gameOver = false;
let playing = false;
let chesses = [];

function checkResult() {
    let notCanMove = !board.hasNext('white') && !board.hasNext('black');
    let [white, black] = board.count();

    if (white + black == 64 || !white || !black || notCanMove) {
        document.body.firstElementChild.style.filter = 'blur(2px)';
        document.getElementsByClassName('mask-end')[0].style.display = 'block';

        if (white == black) {
            document.getElementById('end-text').innerHTML = 'Draw!';
        } else if (white > black && (cur_role == 'player' && cur_type == 'white' || cur_role == 'AI' && cur_type == 'black')) {
            document.getElementById('end-text').innerHTML = 'Player Win!';
        } else if (white < black && (cur_role == 'player' && cur_type == 'black' || cur_role == 'AI' && cur_type == 'white')) {
            document.getElementById('end-text').innerHTML = 'Player Win!';
        } else {
            document.getElementById('end-text').innerHTML = 'AI Win!';
        }

        gameOver = true;

        return true;
    }

    return false;
}

function flip() {
    cur_type = cur_type == 'white' ? 'black' : 'white';
    cur_role = cur_role == 'player' ? 'AI' : 'player';
}

async function playerPlay(i, j) {
    if (playing) {
        let next = board.getNext(i, j, cur_type);

        if (next !== undefined) {
            await board.move(i, j, next, cur_type, true);
            flip();
            playing = false;

            if (checkResult()) {
                return;
            }

            if (!board.hasNext(cur_type)) {
                playing = true;
                flip();
                return;
            }

            document.getElementById('role-text').innerHTML = `AI Turn(${cur_type == 'white' ? 'White' : 'Black'})`;
            setTimeout(() => {
                AIPlay();
            }, 100);
        }
    }
}

async function AIPlay() {
    let [i, j] = await miniMax(board, cur_type);
    let next = board.getNext(i, j, cur_type);

    if (next !== undefined) {
        await board.move(i, j, next, cur_type, true);
        flip();

        if (checkResult()) {
            return;
        }

        if (!board.hasNext(cur_type)) {
            flip();
            AIPlay();
            return;
        }

        document.getElementById('role-text').innerHTML = `Player Turn(${cur_type == 'white' ? 'White' : 'Black'})`;
        playing = true;
    } else {
        alert('Error!');
    }
}

window.addEventListener('load', (ev) => {
    let name = window.localStorage.getItem('name');
    let table = document.createElement('table');

    if (name === null) {
        do {
            name = prompt('请输入你的昵称（后续不可修改）');

            if (name.length > 10 || name.indexOf(',') != -1) {
                name = null;
                alert('昵称不符号要求！');
            }
        } while (!name);

        window.localStorage.setItem('name', name);
    }

    document.title = `Othello-${name}`;

    for (let i = 0; i < 8; ++i) {
        let tr = document.createElement('tr');

        for (let j = 0; j < 8; ++j) {
            let td = document.createElement('td');

            td.innerHTML = '<div class="cell"><div></div></div>';
            tr.appendChild(td);

            let chess = td.firstElementChild.firstElementChild;

            chesses.push(chess);

            if (i == 3 && j == 3 || i == 4 && j == 4) {
                chess.className = 'white-chess';
            } else if (i == 3 && j == 4 || i == 4 && j == 3) {
                chess.className = 'black-chess';
            }

            td.addEventListener('click', (ev) => {
                playerPlay(i, j);
            });
        }

        table.appendChild(tr);
    }

    board = new Board(chesses);
    document.body.firstElementChild.firstElementChild.appendChild(table);

    document.getElementById('play-game-btn').addEventListener('click', (ev) => {
        document.body.firstElementChild.style.filter = 'blur(0px)';
        document.body.firstElementChild.nextElementSibling.style.display = 'none';

        if (document.getElementById('AI-first-check').checked) {
            cur_role = 'AI';
            document.getElementById('role-text').innerHTML = 'AI Turn(White)';
            AIPlay();
        } else {
            playing = true;
        }
    });

    document.body.addEventListener('click', (ev) => {
        if (gameOver) {
            location.reload();
        }
    });
});