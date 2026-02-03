// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const leftScoreEl = document.getElementById('left-score');
const rightScoreEl = document.getElementById('right-score');
const messageEl = document.getElementById('message');

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const PADDLE_OFFSET = 20;
const BALL_SIZE = 15;

// Speed settings
const SPEED_SETTINGS = {
    slow: {
        ballSpeed: 4,
        maxBallSpeed: 10,
        paddleSpeed: 5,
        speedIncrease: 0.3,
        aiSpeed: 3,
        aiReactionDelay: 15
    },
    medium: {
        ballSpeed: 6,
        maxBallSpeed: 15,
        paddleSpeed: 8,
        speedIncrease: 0.5,
        aiSpeed: 5,
        aiReactionDelay: 8
    },
    fast: {
        ballSpeed: 9,
        maxBallSpeed: 20,
        paddleSpeed: 12,
        speedIncrease: 0.7,
        aiSpeed: 7,
        aiReactionDelay: 3
    },
    insane: {
        ballSpeed: 15,
        maxBallSpeed: 30,
        paddleSpeed: 12,
        speedIncrease: 1.5,
        aiSpeed: 50, // Impossible to beat
        aiReactionDelay: 0 // Instant reaction
    }
};

// Current settings
let currentSpeed = 'medium';
let currentMode = '1p'; // '1p' or '2p'

// Game variables (set based on speed)
let PADDLE_SPEED;
let INITIAL_BALL_SPEED;
let BALL_SPEED_INCREASE;
let MAX_BALL_SPEED;
let AI_SPEED;
let AI_REACTION_DELAY;

function applySpeedSettings() {
    const settings = SPEED_SETTINGS[currentSpeed];
    PADDLE_SPEED = settings.paddleSpeed;
    INITIAL_BALL_SPEED = settings.ballSpeed;
    BALL_SPEED_INCREASE = settings.speedIncrease;
    MAX_BALL_SPEED = settings.maxBallSpeed;
    AI_SPEED = settings.aiSpeed;
    AI_REACTION_DELAY = settings.aiReactionDelay;
}

applySpeedSettings();

// Colors
const COLOR_BG = '#1a1a1a';
const COLOR_WHITE = '#ffffff';
const COLOR_GREEN = '#00ff00';
const COLOR_INSANE = '#ff0000';

// Game state
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused'
};

let currentState = GameState.MENU;

// Paddle objects
const leftPaddle = {
    x: PADDLE_OFFSET,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    targetY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
};

const rightPaddle = {
    x: CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    targetY: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2
};

// Ball object
const ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    size: BALL_SIZE,
    vx: 0,
    vy: 0,
    speed: INITIAL_BALL_SPEED
};

// Scores
let leftScore = 0;
let rightScore = 0;

// Input tracking
const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};

// Mode button handling
const modeButtons = document.querySelectorAll('.mode-btn');
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
    });
});

// Speed button handling
const speedButtons = document.querySelectorAll('.speed-btn');
speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        speedButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSpeed = btn.dataset.speed;
        applySpeedSettings();
        if (currentState === GameState.MENU) {
            ball.speed = INITIAL_BALL_SPEED;
        }
    });
});

// Event listeners for keyboard input
document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
        e.preventDefault();
    }
    if (e.code === 'Space') {
        e.preventDefault();
        handleSpaceBar();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

function handleSpaceBar() {
    if (currentState === GameState.MENU) {
        startGame();
    } else if (currentState === GameState.PLAYING) {
        pauseGame();
    } else if (currentState === GameState.PAUSED) {
        resumeGame();
    }
}

function startGame() {
    currentState = GameState.PLAYING;
    updateMessage();
    resetBall();
}

function pauseGame() {
    currentState = GameState.PAUSED;
    messageEl.textContent = 'PAUSED - Press SPACE';
}

function resumeGame() {
    currentState = GameState.PLAYING;
    updateMessage();
}

function updateMessage() {
    if (currentMode === '1p') {
        messageEl.textContent = currentSpeed === 'insane' ? '☠️ SURVIVE IF YOU CAN ☠️' : '1 Player - Good Luck!';
    } else {
        messageEl.textContent = '';
    }
}

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = INITIAL_BALL_SPEED;

    // Random direction
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
    const direction = Math.random() > 0.5 ? 1 : -1;

    ball.vx = Math.cos(angle) * ball.speed * direction;
    ball.vy = Math.sin(angle) * ball.speed;

    // Reset AI paddle target
    rightPaddle.targetY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
}

// AI paddle logic
function updateAIPaddle() {
    if (currentMode !== '1p') return;

    // Only track ball when it's moving towards AI (right side)
    if (ball.vx > 0) {
        // Predict where ball will be
        const timeToReach = (rightPaddle.x - ball.x) / ball.vx;
        let predictedY = ball.y + ball.vy * timeToReach;

        // Account for bounces (simplified)
        while (predictedY < 0 || predictedY > CANVAS_HEIGHT) {
            if (predictedY < 0) predictedY = -predictedY;
            if (predictedY > CANVAS_HEIGHT) predictedY = 2 * CANVAS_HEIGHT - predictedY;
        }

        // Set target (center paddle on ball)
        rightPaddle.targetY = predictedY - PADDLE_HEIGHT / 2;
    } else {
        // Return to center when ball moving away
        rightPaddle.targetY = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    }

    // Clamp target to canvas bounds
    rightPaddle.targetY = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, rightPaddle.targetY));

    // Move towards target with AI speed
    const diff = rightPaddle.targetY - rightPaddle.y;

    if (Math.abs(diff) > AI_SPEED) {
        rightPaddle.y += Math.sign(diff) * AI_SPEED;
    } else {
        rightPaddle.y = rightPaddle.targetY;
    }
}

function updatePaddles() {
    // Left paddle (W/S) - always player controlled
    if (keys.w && leftPaddle.y > 0) {
        leftPaddle.y -= PADDLE_SPEED;
    }
    if (keys.s && leftPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        leftPaddle.y += PADDLE_SPEED;
    }

    // Right paddle - player or AI based on mode
    if (currentMode === '2p') {
        if (keys.ArrowUp && rightPaddle.y > 0) {
            rightPaddle.y -= PADDLE_SPEED;
        }
        if (keys.ArrowDown && rightPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
            rightPaddle.y += PADDLE_SPEED;
        }
    } else {
        updateAIPaddle();
    }
}

function updateBall() {
    if (currentState !== GameState.PLAYING) return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top and bottom wall collision
    if (ball.y - ball.size / 2 <= 0) {
        ball.y = ball.size / 2;
        ball.vy *= -1;
    }
    if (ball.y + ball.size / 2 >= CANVAS_HEIGHT) {
        ball.y = CANVAS_HEIGHT - ball.size / 2;
        ball.vy *= -1;
    }

    // Paddle collision - Left
    if (ball.x - ball.size / 2 <= leftPaddle.x + leftPaddle.width &&
        ball.x + ball.size / 2 >= leftPaddle.x &&
        ball.y >= leftPaddle.y &&
        ball.y <= leftPaddle.y + leftPaddle.height &&
        ball.vx < 0) {

        const hitPos = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
        const angle = hitPos * (Math.PI / 4);

        increaseBallSpeed();
        ball.vx = Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;

        ball.x = leftPaddle.x + leftPaddle.width + ball.size / 2 + 1;
    }

    // Paddle collision - Right
    if (ball.x + ball.size / 2 >= rightPaddle.x &&
        ball.x - ball.size / 2 <= rightPaddle.x + rightPaddle.width &&
        ball.y >= rightPaddle.y &&
        ball.y <= rightPaddle.y + rightPaddle.height &&
        ball.vx > 0) {

        const hitPos = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
        const angle = hitPos * (Math.PI / 4);

        increaseBallSpeed();
        ball.vx = -Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;

        ball.x = rightPaddle.x - ball.size / 2 - 1;
    }

    // Scoring
    if (ball.x < 0) {
        rightScore++;
        rightScoreEl.textContent = rightScore;
        resetBall();
    }
    if (ball.x > CANVAS_WIDTH) {
        leftScore++;
        leftScoreEl.textContent = leftScore;
        resetBall();
    }
}

function increaseBallSpeed() {
    if (ball.speed < MAX_BALL_SPEED) {
        ball.speed += BALL_SPEED_INCREASE;
    }
}

function draw() {
    // Clear canvas
    const bgColor = currentSpeed === 'insane' ? '#0a0000' : COLOR_BG;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line (dashed)
    const lineColor = currentSpeed === 'insane' ? COLOR_INSANE : COLOR_GREEN;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = currentSpeed === 'insane' ? '#ff3333' : COLOR_WHITE;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillStyle = currentSpeed === 'insane' ? '#ff0000' : COLOR_WHITE;
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball (circle)
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = currentSpeed === 'insane' ? '#ffff00' : COLOR_WHITE;
    ctx.fill();
    ctx.closePath();

    // Draw fire trail in insane mode
    if (currentSpeed === 'insane' && currentState === GameState.PLAYING) {
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x - ball.vx * 3, ball.y - ball.vy * 3);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = ball.size / 2;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
}

function gameLoop() {
    updatePaddles();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
