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
        speedIncrease: 0.3
    },
    medium: {
        ballSpeed: 6,
        maxBallSpeed: 15,
        paddleSpeed: 8,
        speedIncrease: 0.5
    },
    fast: {
        ballSpeed: 9,
        maxBallSpeed: 20,
        paddleSpeed: 12,
        speedIncrease: 0.7
    }
};

// Current speed setting
let currentSpeed = 'medium';

// Game variables (set based on speed)
let PADDLE_SPEED;
let INITIAL_BALL_SPEED;
let BALL_SPEED_INCREASE;
let MAX_BALL_SPEED;

function applySpeedSettings() {
    const settings = SPEED_SETTINGS[currentSpeed];
    PADDLE_SPEED = settings.paddleSpeed;
    INITIAL_BALL_SPEED = settings.ballSpeed;
    BALL_SPEED_INCREASE = settings.speedIncrease;
    MAX_BALL_SPEED = settings.maxBallSpeed;
}

applySpeedSettings();

// Colors
const COLOR_BG = '#1a1a1a';
const COLOR_WHITE = '#ffffff';
const COLOR_GREEN = '#00ff00';

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
    height: PADDLE_HEIGHT
};

const rightPaddle = {
    x: CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
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

// Speed button handling
const speedButtons = document.querySelectorAll('.speed-btn');
speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        speedButtons.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
        // Update speed setting
        currentSpeed = btn.dataset.speed;
        applySpeedSettings();
        // Reset ball speed if in menu
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
    messageEl.textContent = '';
    resetBall();
}

function pauseGame() {
    currentState = GameState.PAUSED;
    messageEl.textContent = 'PAUSED - Press SPACE';
}

function resumeGame() {
    currentState = GameState.PLAYING;
    messageEl.textContent = '';
}

function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.speed = INITIAL_BALL_SPEED;

    // Random direction
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4; // -45 to 45 degrees
    const direction = Math.random() > 0.5 ? 1 : -1;

    ball.vx = Math.cos(angle) * ball.speed * direction;
    ball.vy = Math.sin(angle) * ball.speed;
}

function updatePaddles() {
    // Left paddle (W/S)
    if (keys.w && leftPaddle.y > 0) {
        leftPaddle.y -= PADDLE_SPEED;
    }
    if (keys.s && leftPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        leftPaddle.y += PADDLE_SPEED;
    }

    // Right paddle (ArrowUp/ArrowDown)
    if (keys.ArrowUp && rightPaddle.y > 0) {
        rightPaddle.y -= PADDLE_SPEED;
    }
    if (keys.ArrowDown && rightPaddle.y < CANVAS_HEIGHT - PADDLE_HEIGHT) {
        rightPaddle.y += PADDLE_SPEED;
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

        // Calculate hit position (-1 to 1, where 0 is center)
        const hitPos = (ball.y - (leftPaddle.y + leftPaddle.height / 2)) / (leftPaddle.height / 2);
        const angle = hitPos * (Math.PI / 4); // Max 45 degree angle

        increaseBallSpeed();
        ball.vx = Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;

        // Push ball outside paddle to prevent sticking
        ball.x = leftPaddle.x + leftPaddle.width + ball.size / 2 + 1;
    }

    // Paddle collision - Right
    if (ball.x + ball.size / 2 >= rightPaddle.x &&
        ball.x - ball.size / 2 <= rightPaddle.x + rightPaddle.width &&
        ball.y >= rightPaddle.y &&
        ball.y <= rightPaddle.y + rightPaddle.height &&
        ball.vx > 0) {

        // Calculate hit position (-1 to 1, where 0 is center)
        const hitPos = (ball.y - (rightPaddle.y + rightPaddle.height / 2)) / (rightPaddle.height / 2);
        const angle = hitPos * (Math.PI / 4); // Max 45 degree angle

        increaseBallSpeed();
        ball.vx = -Math.cos(angle) * ball.speed;
        ball.vy = Math.sin(angle) * ball.speed;

        // Push ball outside paddle to prevent sticking
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
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line (dashed)
    ctx.strokeStyle = COLOR_GREEN;
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = COLOR_WHITE;
    ctx.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    ctx.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

    // Draw ball (circle)
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = COLOR_WHITE;
    ctx.fill();
    ctx.closePath();
}

function gameLoop() {
    updatePaddles();
    updateBall();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
