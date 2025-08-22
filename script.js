/* TIC TAC TOE – mobile-friendly, supports vs Friend or CPU (minimax) */

const boardEl = document.getElementById('board');
const turnEl = document.getElementById('turn');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const newGameBtn = document.getElementById('newGame');
const resetAllBtn = document.getElementById('resetAll');

const resultDialog = document.getElementById('resultDialog');
const resultText = document.getElementById('resultText');
const nextRoundBtn = document.getElementById('nextRound');
const closeDialogBtn = document.getElementById('closeDialog');

let board = Array(9).fill(null);
let current = 'X';
let mode = 'human'; // 'human' | 'cpu'
let scores = { X: 0, O: 0 };
let gameOver = false;

// Generate 9 accessible buttons
function buildBoard() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.className = 'cell';
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `Cell ${i + 1}`);
    btn.dataset.index = i;
    btn.addEventListener('click', onCellClick, { passive: true });
    boardEl.appendChild(btn);
  }
}
buildBoard();

function setModeFromUI() {
  const inputs = document.querySelectorAll('input[name="mode"]');
  inputs.forEach(r => r.addEventListener('change', () => {
    mode = document.querySelector('input[name="mode"]:checked').value;
    startRound(true);
  }));
  mode = document.querySelector('input[name="mode"]:checked').value;
}
setModeFromUI();

function startRound(keepTurn = false) {
  board = Array(9).fill(null);
  gameOver = false;
  [...boardEl.children].forEach(c => {
    c.disabled = false;
    c.textContent = '';
    c.classList.remove('x', 'o', 'win');
  });
  if (!keepTurn) current = 'X';
  updateTurnUI();

  // If CPU plays first (not in this setup), could move here
  if (mode === 'cpu' && current === 'O') cpuMove();
}

function updateTurnUI() {
  turnEl.textContent = current;
}

function onCellClick(e) {
  if (gameOver) return;
  const i = +e.currentTarget.dataset.index;
  if (board[i]) return;

  makeMove(i, current);
  if (gameOver) return;

  if (mode === 'cpu') {
    // Small delay for nicer UX
    setTimeout(cpuMove, 120);
  } else {
    current = current === 'X' ? 'O' : 'X';
    updateTurnUI();
  }
}

function makeMove(i, player) {
  board[i] = player;
  const btn = boardEl.children[i];
  btn.textContent = player;
  btn.classList.add(player.toLowerCase());
  btn.disabled = true;

  const result = getResult(board);
  if (result.status !== 'playing') {
    endRound(result);
  }
}

function getResult(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (const [a,b2,c] of lines) {
    if (b[a] && b[a] === b[b2] && b[a] === b[c]) {
      return { status: 'win', winner: b[a], line: [a,b2,c] };
    }
  }
  if (b.every(Boolean)) return { status: 'draw' };
  return { status: 'playing' };
}

function endRound(result) {
  gameOver = true;

  if (result.status === 'win') {
    result.line.forEach(i => boardEl.children[i].classList.add('win'));
    scores[result.winner]++;
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    resultText.textContent = `${result.winner} wins!`;
  } else {
    resultText.textContent = `It's a draw.`;
  }

  // Disable remaining cells
  [...boardEl.children].forEach((c, idx) => c.disabled = true);

  try { resultDialog.showModal(); } catch { resultDialog.show(); }
}

nextRoundBtn.addEventListener('click', () => {
  resultDialog.close();
  // Alternate who starts next round if playing with a friend
  if (mode === 'human') current = current === 'X' ? 'O' : 'X';
  startRound(true);
});
closeDialogBtn.addEventListener('click', () => resultDialog.close());

newGameBtn.addEventListener('click', () => startRound(false));
resetAllBtn.addEventListener('click', () => {
  scores = { X: 0, O: 0 };
  scoreXEl.textContent = '0';
  scoreOEl.textContent = '0';
  current = 'X';
  startRound(false);
});

/* ---------------- CPU (unbeatable) ---------------- */
function cpuMove() {
  if (gameOver) return;

  // CPU is 'O', human is 'X'
  const best = minimax(board, 'O');
  if (best.index != null) {
    makeMove(best.index, 'O');
    if (!gameOver) {
      current = 'X';
      updateTurnUI();
    }
  }
}

function minimax(b, player) {
  const result = getResult(b);
  if (result.status === 'win') {
    if (result.winner === 'O') return { score: 10 };
    if (result.winner === 'X') return { score: -10 };
  } else if (result.status === 'draw') {
    return { score: 0 };
  }

  const moves = [];
  for (let i = 0; i < 9; i++) {
    if (!b[i]) {
      b[i] = player;
      const next = minimax(b, player === 'O' ? 'X' : 'O');
      moves.push({ index: i, score: next.score });
      b[i] = null;
    }
  }

  // Choose best move for current player
  let bestMove = null;
  if (player === 'O') {
    let bestScore = -Infinity;
    for (const m of moves) {
      if (m.score > bestScore) { bestScore = m.score; bestMove = m; }
    }
  } else {
    let bestScore = Infinity;
    for (const m of moves) {
      if (m.score < bestScore) { bestScore = m.score; bestMove = m; }
    }
  }
  return bestMove;
}

// Start first round
startRound(false);

// Keyboard support (optional)
boardEl.addEventListener('keydown', (e) => {
  const focusable = [...boardEl.querySelectorAll('.cell')];
  const idx = focusable.indexOf(document.activeElement);
  if (idx === -1) return;
  const row = Math.floor(idx / 3), col = idx % 3;

  const nav = {
    ArrowUp: (row > 0) ? idx - 3 : idx,
    ArrowDown: (row < 2) ? idx + 3 : idx,
    ArrowLeft: (col > 0) ? idx - 1 : idx,
    ArrowRight: (col < 2) ? idx + 1 : idx,
  }[e.key];

  if (nav != null) {
    e.preventDefault();
    focusable[nav].focus();
  }
});
