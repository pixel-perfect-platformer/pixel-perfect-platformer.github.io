import Constants from './constants.js'
import Input from './input.js';
import State from './state.js'

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
        const wasOnGround = this.onGround;

        // Horizontal input affects lateral speed
        if (State.leftPressed) this.lateral_speed -= this.accel;
        if (State.rightPressed) this.lateral_speed += this.accel;

        // Clamp lateral speed and apply friction later
        this.lateral_speed = Math.max(-this.max_speed, Math.min(this.lateral_speed, this.max_speed));

        // --- Horizontal move + collision resolution (separate axis) ---
        const oldX = this.x, oldY = this.y;
        let newX = this.x + this.lateral_speed;
        for (let b of State.blocks) {
            // horizontal swept check: does horizontal move cause overlap with block while vertically overlapping
            if (this.y < b.y + b.height && this.y + this.height > b.y) {
                if (newX < b.x + b.width && newX + this.width > b.x) {
                    if (this.lateral_speed > 0) newX = b.x - this.width;
                    else if (this.lateral_speed < 0) newX = b.x + b.width;
                    this.lateral_speed = 0;
                }
            }
        }
        this.x = newX;

        // Apply gravity to vertical speed
        this.vertical_speed += this.gravity;

        // --- Vertical move + swept collision resolution ---
        let newY = this.y + this.vertical_speed;
        let landed = false;
        for (let b of State.blocks) {
            // horizontal overlap at any point during move? check current x against block
            if (this.x < b.x + b.width && this.x + this.width > b.x) {
                // falling onto block (crossing its top between oldY and newY)
                if (oldY + this.height <= b.y && newY + this.height >= b.y && this.vertical_speed > 0) {
                    newY = b.y - this.height;
                    this.vertical_speed = 0;
                    landed = true;
                }
                // hitting head on block (crossing its bottom)
                else if (oldY >= b.y + b.height && newY <= b.y + b.height && this.vertical_speed < 0) {
                    newY = b.y + b.height;
                    this.vertical_speed = 0;
                }
            }
            // If block is an end block, also check swept intersection between old and new positions (broad phase)
            // end block swept check
            if ((b.type === 'end' || b.end === true) && !State.levelCompleted) {
                const sweepTop = Math.min(oldY, newY);
                const sweepBottom = Math.max(oldY + this.height, newY + this.height);
                const vertOverlap = sweepBottom >= b.y && sweepTop <= b.y + b.height;
                const sweepLeft = Math.min(oldX, newX);
                const sweepRight = Math.max(oldX + this.width, newX + this.width);
                const horizOverlap = (Math.min(sweepRight, b.x + b.width) >= Math.max(sweepLeft, b.x));
                if (vertOverlap && horizOverlap) {
                    State.levelCompleted = true;
                    State.onLevelComplete();
                }
            }
            // kill block swept check (player dies)
            if ((b.type === 'kill' || b.kill === true)) {
                const sweepTopK = Math.min(oldY, newY);
                const sweepBottomK = Math.max(oldY + this.height, newY + this.height);
                const vertOverlapK = sweepBottomK >= b.y && sweepTopK <= b.y + b.height;
                const sweepLeftK = Math.min(oldX, newX);
                const sweepRightK = Math.max(oldX + this.width, newX + this.width);
                const horizOverlapK = (Math.min(sweepRightK, b.x + b.width) >= Math.max(sweepLeftK, b.x));
                if (vertOverlapK && horizOverlapK) {
                    State.onPlayerKilled();
                }
            }
            // Start can only be on ground

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
        // Draw outer color (border)
        ctx.fillStyle = State.currentPlayerOuterColor;
        if (State.currentPlayerIcon === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (State.currentPlayerIcon === 'triangle') {
            ctx.beginPath();;
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw inner color
        ctx.fillStyle = State.currentPlayerColor;
        const inset = 3;
        if (State.currentPlayerIcon === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 - inset, 0, Math.PI * 2);
            ctx.fill();
        } else if (State.currentPlayerIcon === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + inset);
            ctx.lineTo(this.x + inset, this.y + this.height - inset);
            ctx.lineTo(this.x + this.width - inset, this.y + this.height - inset);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(this.x + inset, this.y + inset, this.width - inset * 2, this.height - inset * 2);
        }

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