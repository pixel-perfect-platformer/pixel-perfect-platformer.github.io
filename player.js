import Constants from './constants.js'
import Input from './input.js';
import State from './state.js'
import CollisionDetector from './collision.js'
import PlayerRenderer from './player-renderer.js'

class Player {
    constructor() {
        this.width = 25;
        this.height = 20;
        // Start centered horizontally and standing on the ground
        this.x = Math.floor(Constants.SCREEN_WIDTH / 2) - Math.floor(this.width / 2);
        this.y = Constants.SCREEN_HEIGHT - 150 - this.height;
        this.lateral_speed = 0.0;
        this.vertical_speed = 0.0;
        this.accel = 0.5;
        this.friction = 0.8;
        this.max_speed = 12;
        this.gravity = 0.8;
        this.onGround = false;
    }

    update() {
        if (!State.isRunning) return true;
        
        const wasOnGround = this.onGround;

        // Horizontal input affects lateral speed
        if (State.leftPressed) this.lateral_speed -= this.accel;
        if (State.rightPressed) this.lateral_speed += this.accel;

        // Clamp lateral speed and apply friction later
        this.lateral_speed = Math.max(-this.max_speed, Math.min(this.lateral_speed, this.max_speed));

        // Horizontal collision
        const oldX = this.x, oldY = this.y;
        let newX = this.x + this.lateral_speed;
        newX = CollisionDetector.checkHorizontalCollision(this, newX, State.blocks);
        if (newX !== this.x + this.lateral_speed) this.lateral_speed = 0;
        this.x = newX;

        // Apply gravity to vertical speed
        this.vertical_speed += this.gravity;

        // Vertical collision
        let newY = this.y + this.vertical_speed;
        const collision = CollisionDetector.checkVerticalCollision(this, oldY, newY, State.blocks);
        newY = collision.y;
        let landed = collision.landed;

        for (let b of State.blocks) {

            if (b.type === 'kill' || b.kill === true) {
                if (CollisionDetector.checkSweptCollision(oldX, oldY, newX, newY, this.width, this.height, b)) {
                    State.isRunning = false;
                    State.deathAnimationStartTime = Date.now();
                    State.deathTime = State.levelStartTime > 0 ? ((Date.now() - State.levelStartTime) / 1000).toFixed(2) : 0;
                }
            }
            else if ((b.type === 'end' || b.end === true) && !State.levelCompleted) {
                if (CollisionDetector.checkSweptCollision(oldX, oldY, newX, newY, this.width, this.height, b)) {
                    State.levelCompleted = true;
                    State.isRunning = false;
                    State.completionAnimationStartTime = Date.now();
                    State.completionTime = State.levelStartTime > 0 ? ((Date.now() - State.levelStartTime) / 1000).toFixed(2) : 0;
                    return true;
                }
            }
        }

        // Floor collision (prevent entering gray box)
        const grayRectangleTop = Constants.SCREEN_HEIGHT - 140;
        if (newY + this.height > grayRectangleTop) {
            newY = grayRectangleTop - this.height;
            this.vertical_speed = 0;
            landed = true;
        }
        if (newY < 0) {
            newY = 0;
            this.vertical_speed = 0;
        }

        this.y = newY;
        this.onGround = landed;

        // Reset jumpUsed when landing, so next press-hold can jump
        if (landed) Input.jumpUsed = false;

        // If player is holding jump and the player's Y is not changing (stable),
        // trigger a jump (buffered). Prevent repeated jumps while the key remains held.
        const yDelta = Math.abs(newY - oldY);
        if (State.jumpBuffered && !Input.jumpUsed && yDelta === 0) {
            this.vertical_speed = -10;
            Input.jumpUsed = true;
            this.onGround = false;
            State.jumpCount++;
            if (window.ReplayRecorder) window.ReplayRecorder.recordInput('jump', Date.now());
        }

        // Apply friction: reduce lateral speed when no input
        const frictionFactor = (State.leftPressed || State.rightPressed) ? 0.95 : this.friction;
        this.lateral_speed *= frictionFactor;
        // Physics
        // Stop micro-coasting
        if (Math.abs(this.lateral_speed) < 0.1) this.lateral_speed = 0;
        if (Math.abs(this.vertical_speed) < 0.1) this.vertical_speed = 0;

        // Clamp boundaries (x and y already mostly handled by collision resolution)
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > Constants.SCREEN_WIDTH) this.x = Constants.SCREEN_WIDTH - this.width;
        if (this.y < 0) {
            this.y = 0;
            this.vertical_speed = 0;
        }
        if (this.y + this.height > Constants.SCREEN_HEIGHT) {
            this.y = Constants.SCREEN_HEIGHT - this.height;
            this.vertical_speed = 0;
            this.onGround = true;
        }
        return true;
    }

    draw(ctx) {
        if (State.deathAnimationStartTime > 0 && !State.showDeathScreen) {
            const elapsed = Date.now() - State.deathAnimationStartTime;
            const progress = Math.min(elapsed / State.deathAnimationDuration, 1);
            PlayerRenderer.drawWithAnimation(ctx, this, 1 - progress, 1 - progress);
            if (progress >= 1) State.showDeathScreen = true;
            return;
        }
        
        if (State.completionAnimationStartTime > 0 && !State.showCompletionScreen) {
            const elapsed = Date.now() - State.completionAnimationStartTime;
            const progress = Math.min(elapsed / State.deathAnimationDuration, 1);
            PlayerRenderer.drawWithAnimation(ctx, this, 1 + progress, 1 - progress);
            
            if (progress >= 1 && !State.showCompletionScreen) {
                State.showCompletionScreen = true;
                const key = `level_${State.currentLevelIndex}`;
                State.levelCompletions[key] = true;
                localStorage.setItem('platformer_completions', JSON.stringify(State.levelCompletions));
            }
            return;
        }
        
        PlayerRenderer.drawPlayer(ctx, this);

        if (State.showHitboxes) {
            ctx.save();
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
    get rect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
}
export default Player;