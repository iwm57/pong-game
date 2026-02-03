// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const PADDLE_OFFSET = 20;
const BALL_SIZE = 15;
const POWERUP_SIZE = 25;

// Speed settings
const SPEED_SETTINGS = {
    slow: { ballSpeed: 4, maxBallSpeed: 10, paddleSpeed: 5, speedIncrease: 0.3, aiSpeed: 3 },
    medium: { ballSpeed: 6, maxBallSpeed: 15, paddleSpeed: 8, speedIncrease: 0.5, aiSpeed: 5 },
    fast: { ballSpeed: 9, maxBallSpeed: 20, paddleSpeed: 12, speedIncrease: 0.7, aiSpeed: 7 },
    insane: { ballSpeed: 15, maxBallSpeed: 30, paddleSpeed: 12, speedIncrease: 1.5, aiSpeed: 50 }
};

// Power-up types
const POWERUPS = {
    BIG_PADDLE: { name: 'BIG', color: '#00aaff', duration: 8000 },
    SMALL_OPPONENT: { name: 'SHRINK', color: '#ff00ff', duration: 8000 },
    SLOW_BALL: { name: 'SLOW', color: '#ffff00', duration: 6000 },
    FAST_BALL: { name: 'FAST', color: '#ff6600', duration: 5000 },
    EXTRA_POINT: { name: '+1', color: '#00ff00', duration: 0 }
};

// Current settings
let currentSpeed = 'medium';
let currentMode = '1p';

// Game variables
let PADDLE_SPEED, INITIAL_BALL_SPEED, BALL_SPEED_INCREASE, MAX_BALL_SPEED, AI_SPEED;

function applySpeedSettings() {
    const s = SPEED_SETTINGS[currentSpeed];
    PADDLE_SPEED = s.paddleSpeed;
    INITIAL_BALL_SPEED = s.ballSpeed;
    BALL_SPEED_INCREASE = s.speedIncrease;
    MAX_BALL_SPEED = s.maxBallSpeed;
    AI_SPEED = s.aiSpeed;
}
applySpeedSettings();

// Colors
const COLOR_BG = '#1a1a1a';
const COLOR_WHITE = '#ffffff';
const COLOR_GREEN = '#00ff00';
const COLOR_INSANE = '#ff0000';
const COLOR_BTN = '#222';
const COLOR_BTN_HOVER = '#333';
const COLOR_BTN_ACTIVE = '#00ff00';

// Game state
const GameState = { MENU: 'menu', PLAYING: 'playing', PAUSED: 'paused', GAMEOVER: 'gameover' };
let currentState = GameState.MENU;

// Paddle objects
const leftPaddle = { x: PADDLE_OFFSET, y: 250, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, baseHeight: PADDLE_HEIGHT, effectTimer: 0 };
const rightPaddle = { x: 765, y: 250, width: PADDLE_WIDTH, height: PADDLE_HEIGHT, baseHeight: PADDLE_HEIGHT, effectTimer: 0 };

// Ball object
const ball = { x: 400, y: 300, size: BALL_SIZE, vx: 0, vy: 0, speed: INITIAL_BALL_SPEED };

// Scores
let leftScore = 0;
let rightScore = 0;

// Power-ups
let activePowerUp = null;
let powerUpSpawnTimer = 0;
const POWERUP_SPAWN_INTERVAL = 10000; // 10 seconds

// UI buttons
const buttons = [
    { id: 'mode1p', x: 250, y: 350, w: 100, h: 40, text: '1 PLAYER', action: () => currentMode = '1p', selected: true },
    { id: 'mode2p', x: 450, y: 350, w: 100, h: 40, text: '2 PLAYER', action: () => currentMode = '2p', selected: false },
    { id: 'speedSlow', x: 150, y: 410, w: 80, h: 35, text: 'SLOW', action: () => { currentSpeed = 'slow'; applySpeedSettings(); }, selected: false },
    { id: 'speedMedium', x: 250, y: 410, w: 80, h: 35, text: 'MEDIUM', action: () => { currentSpeed = 'medium'; applySpeedSettings(); }, selected: true },
    { id: 'speedFast', x: 350, y: 410, w: 80, h: 35, text: 'FAST', action: () => { currentSpeed = 'fast'; applySpeedSettings(); }, selected: false },
    { id: 'speedInsane', x: 450, y: 410, w: 80, h: 35, text: 'INSANE', action: () => { currentSpeed = 'insane'; applySpeedSettings(); }, selected: false, insane: true },
    { id: 'start', x: 300, y: 480, w: 200, h: 50, text: 'START', action: startGame, selected: false, primary: true }
];

// Input tracking
const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };
let mouseX = 0, mouseY = 0;

// Event listeners
document.addEventListener('keydown', (e) => {
    if (e.key in keys) { keys[e.key] = true; e.preventDefault(); }
    if (e.code === 'Space') handleSpaceBar();
});
document.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});
canvas.addEventListener('click', handleClick);

function handleClick() {
    if (currentState === GameState.MENU) {
        buttons.forEach(btn => {
            if (isMouseOver(btn)) {
                btn.action();
                if (btn.id.startsWith('mode')) {
                    buttons.find(b => b.id.startsWith('mode') && b.id !== btn.id).selected = false;
                    btn.selected = true;
                }
                if (btn.id.startsWith('speed')) {
                    buttons.filter(b => b.id.startsWith('speed')).forEach(b => b.selected = false);
                    btn.selected = true;
                }
            }
        });
    }
}

function isMouseOver(btn) {
    return mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h;
}

function handleSpaceBar() {
    if (currentState === GameState.MENU) startGame();
    else if (currentState === GameState.PLAYING) currentState = GameState.PAUSED;
    else if (currentState === GameState.PAUSED) currentState = GameState.PLAYING;
}

function startGame() {
    currentState = GameState.PLAYING;
    leftScore = 0;
    rightScore = 0;
    leftPaddle.height = PADDLE_HEIGHT;
    leftPaddle.y = 250;
    rightPaddle.height = PADDLE_HEIGHT;
    rightPaddle.y = 250;
    activePowerUp = null;
    powerUpSpawnTimer = Date.now();
    resetBall();
}

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = INITIAL_BALL_SPEED;
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
    const dir = Math.random() > 0.5 ? 1 : -1;
    ball.vx = Math.cos(angle) * ball.speed * dir;
    ball.vy = Math.sin(angle) * ball.speed;
}

function spawnPowerUp() {
    const types = Object.keys(POWERUPS);
    const type = types[Math.floor(Math.random() * types.length)];
    const x = 200 + Math.random() * 400;
    const y = 100 + Math.random() * 400;
    activePowerUp = { type, x, y, spawned: Date.now() };
}

function updatePaddles() {
    // Left paddle
    if (keys.w && leftPaddle.y > 50) leftPaddle.y -= PADDLE_SPEED;
    if (keys.s && leftPaddle.y < CANVAS_HEIGHT - 50 - leftPaddle.height) leftPaddle.y += PADDLE_SPEED;

    // Right paddle
    if (currentMode === '2p') {
        if (keys.ArrowUp && rightPaddle.y > 50) rightPaddle.y -= PADDLE_SPEED;
        if (keys.ArrowDown && rightPaddle.y < CANVAS_HEIGHT - 50 - rightPaddle.height) rightPaddle.y += PADDLE_SPEED;
    } else {
        updateAIPaddle();
    }

    // Update power-up effects
    const now = Date.now();
    [leftPaddle, rightPaddle].forEach(p => {
        if (p.effectTimer && now > p.effectTimer) {
            p.height = p.baseHeight;
            p.effectTimer = 0;
        }
    });
}

function updateAIPaddle() {
    if (ball.vx > 0) {
        const timeToReach = (rightPaddle.x - ball.x) / ball.vx;
        let predictedY = ball.y + ball.vy * timeToReach;
        while (predictedY < 50 || predictedY > CANVAS_HEIGHT - 50) {
            if (predictedY < 50) predictedY = 100 - predictedY;
            if (predictedY > CANVAS_HEIGHT - 50) predictedY = 2 * (CANVAS_HEIGHT - 50) - predictedY;
        }
        rightPaddle.targetY = predictedY - rightPaddle.height / 2;
    } else {
        rightPaddle.targetY = 250;
    }
    rightPaddle.targetY = Math.max(50, Math.min(CANVAS_HEIGHT - 50 - rightPaddle.height, rightPaddle.targetY));
    const diff = rightPaddle.targetY - rightPaddle.y;
    if (Math.abs(diff) > AI_SPEED) rightPaddle.y += Math.sign(diff) * AI_SPEED;
    else rightPaddle.y = rightPaddle.targetY;
}

function updateBall() {
    if (currentState !== GameState.PLAYING) return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collision
    if (ball.y - ball.size / 2 <= 50 || ball.y + ball.size / 2 >= CANVAS_HEIGHT - 50) {
        ball.y = ball.y < 300 ? 50 + ball.size / 2 : CANVAS_HEIGHT - 50 - ball.size / 2;
        ball.vy *= -1;
    }

    // Paddle collision
    const paddles = [
        { p: leftPaddle, xDir: 1 }, { p: rightPaddle, xDir: -1 }
    ];

    for (const { p, xDir } of paddles) {
        const paddleLeft = p === leftPaddle ? p.x : p.x;
        const paddleRight = p === leftPaddle ? p.x + p.width : p.x + p.width;
        if (ball.x - ball.size / 2 <= paddleRight && ball.x + ball.size / 2 >= paddleLeft &&
            ball.y >= p.y && ball.y <= p.y + p.height &&
            (xDir === 1 ? ball.vx < 0 : ball.vx > 0)) {
            const hitPos = (ball.y - (p.y + p.height / 2)) / (p.height / 2);
            const angle = hitPos * (Math.PI / 4);
            if (ball.speed < MAX_BALL_SPEED) ball.speed += BALL_SPEED_INCREASE;
            ball.vx = Math.cos(angle) * ball.speed * xDir;
            ball.vy = Math.sin(angle) * ball.speed;
            ball.x = xDir === 1 ? paddleRight + ball.size / 2 + 1 : paddleLeft - ball.size / 2 - 1;
        }
    }

    // Power-up collision
    if (activePowerUp) {
        const dx = ball.x - activePowerUp.x;
        const dy = ball.y - activePowerUp.y;
        if (Math.sqrt(dx * dx + dy * dy) < ball.size / 2 + POWERUP_SIZE / 2) {
            applyPowerUp(activePowerUp.type, ball.vx > 0 ? 'left' : 'right');
            activePowerUp = null;
        }
    }

    // Spawn power-ups
    if (!activePowerUp && Date.now() - powerUpSpawnTimer > POWERUP_SPAWN_INTERVAL) {
        spawnPowerUp();
        powerUpSpawnTimer = Date.now();
    }

    // Scoring
    if (ball.x < 0) { rightScore++; resetBall(); }
    if (ball.x > CANVAS_WIDTH) { leftScore++; resetBall(); }
}

function applyPowerUp(type, collector) {
    const config = POWERUPS[type];
    const paddle = collector === 'left' ? leftPaddle : rightPaddle;
    const opponent = collector === 'left' ? rightPaddle : leftPaddle;

    switch (type) {
        case 'BIG_PADDLE':
            paddle.height = paddle.baseHeight * 1.5;
            paddle.effectTimer = Date.now() + config.duration;
            break;
        case 'SMALL_OPPONENT':
            opponent.height = opponent.baseHeight * 0.6;
            opponent.effectTimer = Date.now() + config.duration;
            break;
        case 'SLOW_BALL':
            ball.speed = Math.max(3, ball.speed * 0.6);
            const ratio1 = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = (ball.vx / ratio1) * ball.speed;
            ball.vy = (ball.vy / ratio1) * ball.speed;
            setTimeout(() => { ball.speed = Math.min(MAX_BALL_SPEED, ball.speed * 1.5); }, config.duration);
            break;
        case 'FAST_BALL':
            ball.speed = Math.min(MAX_BALL_SPEED, ball.speed * 1.3);
            const ratio2 = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            ball.vx = (ball.vx / ratio2) * ball.speed;
            ball.vy = (ball.vy / ratio2) * ball.speed;
            break;
        case 'EXTRA_POINT':
            if (collector === 'left') leftScore++;
            else rightScore++;
            break;
    }
}

function draw() {
    // Clear
    const isInsane = currentSpeed === 'insane';
    ctx.fillStyle = isInsane ? '#0a0000' : COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Top border
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 50);
    ctx.fillStyle = isInsane ? COLOR_INSANE : COLOR_GREEN;
    ctx.fillRect(0, 46, CANVAS_WIDTH, 4);

    // Bottom border
    ctx.fillStyle = '#333';
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
    ctx.fillStyle = isInsane ? COLOR_INSANE : COLOR_GREEN;
    ctx.fillRect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 4);

    // Center line
    ctx.strokeStyle = isInsane ? COLOR_INSANE : COLOR_GREEN;
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 50);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(leftScore, 200, 35);
    ctx.fillText(rightScore, 600, 35);

    // Paddles
    ctx.fillStyle = isInsane ? '#ff3333' : COLOR_WHITE;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillStyle = isInsane ? '#ff0000' : COLOR_WHITE;
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = isInsane ? '#ffff00' : COLOR_WHITE;
    ctx.fill();

    // Ball trail in insane mode
    if (isInsane && currentState === GameState.PLAYING) {
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x - ball.vx * 2, ball.y - ball.vy * 2);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = ball.size / 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }

    // Power-up
    if (activePowerUp) {
        const config = POWERUPS[activePowerUp.type];
        const pulse = Math.sin(Date.now() / 200) * 3;
        ctx.beginPath();
        ctx.arc(activePowerUp.x, activePowerUp.y, POWERUP_SIZE / 2 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = config.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 12px Courier New';
        ctx.fillText(config.name, activePowerUp.x, activePowerUp.y + 4);
    }

    // Menu overlay
    if (currentState === GameState.MENU) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Title
        ctx.fillStyle = COLOR_GREEN;
        ctx.font = 'bold 72px Courier New';
        ctx.fillText('PONG', CANVAS_WIDTH / 2, 120);

        ctx.fillStyle = '#888';
        ctx.font = '14px Courier New';
        ctx.fillText('Select mode and difficulty, then click START', CANVAS_WIDTH / 2, 170);
        ctx.fillText('Controls: W/S (left) | Arrow keys (right) | Space (pause)', CANVAS_WIDTH / 2, 195);

        // Mode label
        ctx.fillStyle = '#aaa';
        ctx.font = '16px Courier New';
        ctx.fillText('MODE', CANVAS_WIDTH / 2, 330);

        // Draw buttons
        buttons.forEach(btn => drawButton(btn));
    }

    // Pause overlay
    if (currentState === GameState.PAUSED) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = COLOR_GREEN;
        ctx.font = 'bold 48px Courier New';
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_WIDTH / 2);
        ctx.font = '20px Courier New';
        ctx.fillText('Press SPACE to continue', CANVAS_WIDTH / 2, CANVAS_WIDTH / 2 + 40);
    }

    // Active power-up indicators
    [leftPaddle, rightPaddle].forEach((p, i) => {
        if (p.effectTimer && p.effectTimer > Date.now()) {
            const remaining = Math.ceil((p.effectTimer - Date.now()) / 1000);
            ctx.fillStyle = i === 0 ? '#00aaff' : '#ff00ff';
            ctx.font = 'bold 14px Courier New';
            ctx.textAlign = i === 0 ? 'left' : 'right';
            ctx.fillText(remaining + 's', i === 0 ? 60 : 740, CANVAS_HEIGHT - 15);
        }
    });
}

function drawButton(btn) {
    const hover = isMouseOver(btn);
    let bgColor = COLOR_BTN;
    let textColor = '#888';

    if (btn.primary) {
        bgColor = hover ? '#00cc00' : COLOR_BTN_ACTIVE;
        textColor = '#000';
    } else if (btn.insane) {
        bgColor = `rgb(${160 + Math.sin(Date.now() / 100) * 40}, 0, 0)`;
        textColor = '#fff';
    } else if (btn.selected) {
        bgColor = COLOR_BTN_ACTIVE;
        textColor = '#000';
    } else if (hover) {
        bgColor = COLOR_BTN_HOVER;
        textColor = '#aaa';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2 + 5);
}

function gameLoop() {
    updatePaddles();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
