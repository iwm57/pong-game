# Pong Web Game - Implementation Plan

## Overview
Build a classic Pong game using vanilla HTML, CSS, and JavaScript with Canvas rendering.

## File Structure
```
/workspace/pong-game/
├── index.html    # Main HTML structure
├── style.css     # Styling and layout
└── script.js     # Game logic and rendering
```

## Implementation Steps

### Step 1: HTML Structure (index.html)
- Create HTML5 boilerplate
- Add `<canvas>` element for the game
- Add score display elements
- Add start/pause controls (optional enhancement)
- Link to external CSS and JS files

### Step 2: CSS Styling (style.css)
- Dark background color
- Center the canvas on screen
- Style score display (top center, large font)
- Add basic hover effects for buttons
- Ensure responsive-ish layout (canvas fixed but centered)

### Step 3: JavaScript Setup (script.js)
- Get canvas context and set dimensions
- Define game constants:
  - Canvas width/height (e.g., 800x600)
  - Paddle dimensions (width, height)
  - Ball size
  - Paddle speed
  - Initial ball speed
- Define game state object:
  - Ball position (x, y) and velocity (vx, vy)
  - Left paddle position
  - Right paddle position
  - Scores (left, right)
  - Game state (menu, playing, paused)

### Step 4: Input Handling
- Track keyboard state with a Set or object
- Listen for `keydown` events:
  - W/S for left paddle
  - ArrowUp/ArrowDown for right paddle
  - Space for pause/start
- Listen for `keyup` events to stop movement

### Step 5: Game Logic - Update Loop
- Move paddles based on input (constrain to canvas bounds)
- Move ball by its velocity
- Bounce ball off top/bottom walls (invert Y velocity)
- Check paddle collisions:
  - Left paddle: ball.x < paddle.right && ball.y within paddle height
  - Right paddle: ball.x > paddle.left && ball.y within paddle height
  - On hit: invert X velocity and add angle variation based on hit position
- Check scoring:
  - Ball past left edge → right player scores
  - Ball past right edge → left player scores
  - Reset ball to center on score
- (Optional) Increase ball speed slightly after each paddle hit

### Step 6: Game Logic - Render Loop
- Clear canvas (fill with dark background)
- Draw center line (dashed)
- Draw left paddle (white rectangle)
- Draw right paddle (white rectangle)
- Draw ball (white circle/square)
- Draw scores on canvas or update DOM elements

### Step 7: Game Loop Integration
- Use `requestAnimationFrame` for smooth 60 FPS
- Separate `update()` and `draw()` functions
- Handle delta time for consistent movement (or use fixed timestep)

### Step 8: Polish
- Add "Press Space to Start" message
- Add visual feedback for scoring
- Ensure ball doesn't get stuck inside paddles
- Add angle variation on paddle hit (hit center = straight, hit edges = angled)

## Technical Details

### Canvas Dimensions
- Width: 800px
- Height: 600px

### Paddle Specifications
- Width: 15px
- Height: 100px
- Speed: 8 pixels/frame
- Offset from edge: 20px

### Ball Specifications
- Size: 15px (radius or side length)
- Initial speed: 6 pixels/frame
- Speed increase: +0.5 per paddle hit (optional)

### Colors
- Background: #1a1a1a (dark gray)
- Paddles/Ball: #ffffff (white)
- Accent: #00ff00 (green for center line)

## Collision Detection
- AABB (Axis-Aligned Bounding Box) for paddle-ball
- Wall collision: check ball edges against canvas bounds

## Success Criteria
- [ ] Game loads and displays canvas
- [ ] Paddles move smoothly with keyboard
- [ ] Ball bounces correctly off walls
- [ ] Ball bounces correctly off paddles with angle variation
- [ ] Scoring works correctly
- [ ] Ball resets after scoring
- [ ] Game runs at 60 FPS
- [ ] No console errors
