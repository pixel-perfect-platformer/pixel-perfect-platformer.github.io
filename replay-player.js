import State from './state.js';
import Constants from './constants.js';
import CollisionDetector from './collision.js';

export class ReplayPlayer {
    static isPlaying = false;
    static isPaused = false;
    static replayData = null;
    static currentTime = 0;
    static inputIndex = 0;
    static startTime = 0;
    static pauseTime = 0;
    static speed = 1;
    static playerState = {
        x: 0, y: 0, 
        lateral_speed: 0, vertical_speed: 0, 
        onGround: false,
        width: 25, height: 20
    };
    static inputState = { left: false, right: false };

    static startReplay(replayString, levelIndex) {
        try {
            this.replayData = JSON.parse(replayString);
            this.isPlaying = true;
            this.isPaused = false;
            this.currentTime = 0;
            this.inputIndex = 0;
            this.startTime = Date.now();
            this.pauseTime = 0;
            this.speed = 1;
            this.inputState = { left: false, right: false };
            
            // Set up level for replay
            State.currentLevelIndex = levelIndex;
            State.isRunning = false;
            State.editorMode = false;
            State.showReplayScreen = true;
            
            // Initialize player position
            const level = State.levels[levelIndex];
            if (level && level.blocks) {
                State.blocks = [...level.blocks];
                State.texts = [...(level.texts || [])];
                this.resetPlayerToStart();
            }
        } catch (error) {
            console.error('Failed to start replay:', error);
            this.stopReplay();
        }
    }

    static stopReplay() {
        this.isPlaying = false;
        this.isPaused = false;
        this.replayData = null;
        State.showReplayScreen = false;
    }

    static pauseReplay() {
        if (!this.isPlaying) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseTime = Date.now();
        } else {
            this.startTime += Date.now() - this.pauseTime;
        }
    }

    static setSpeed(speed) {
        this.speed = Math.max(0.25, Math.min(4, speed));
    }

    static seekTo(timePercent) {
        if (!this.replayData) return;
        
        const targetTime = this.replayData.duration * timePercent;
        this.currentTime = targetTime;
        this.inputIndex = 0;
        this.inputState = { left: false, right: false };
        
        this.resetPlayerToStart();
        this.simulateToTime(targetTime);
        
        // Reset timing
        this.startTime = Date.now() - targetTime / this.speed;
    }

    static update() {
        if (!this.isPlaying || this.isPaused || !this.replayData) return;
        
        const elapsed = (Date.now() - this.startTime) * this.speed;
        this.currentTime = elapsed;
        
        // Process inputs up to current time
        while (this.inputIndex < this.replayData.inputs.length) {
            const input = this.replayData.inputs[this.inputIndex];
            if (input.t > this.currentTime) break;
            
            this.processInput(input);
            this.inputIndex++;
        }
        
        // Update player physics (match real game physics)
        this.updatePlayerPhysics();
        
        // Check if replay finished
        if (this.currentTime >= this.replayData.duration) {
            this.stopReplay();
        }
    }

    static processInput(input) {
        switch (input.type) {
            case 'keydown':
                if (input.key === 'ArrowLeft' || input.key === 'KeyA') {
                    this.inputState.left = true;
                } else if (input.key === 'ArrowRight' || input.key === 'KeyD') {
                    this.inputState.right = true;
                } else if (input.key === 'Space' || input.key === 'ArrowUp' || input.key === 'KeyW') {
                    if (this.playerState.onGround) {
                        this.playerState.vertical_speed = -10;
                        this.playerState.onGround = false;
                    }
                }
                break;
            case 'keyup':
                if (input.key === 'ArrowLeft' || input.key === 'KeyA') {
                    this.inputState.left = false;
                } else if (input.key === 'ArrowRight' || input.key === 'KeyD') {
                    this.inputState.right = false;
                }
                break;
        }
    }

    static updatePlayerPhysics() {
        // Match the real player physics exactly
        const accel = 0.5;
        const friction = 0.8;
        const max_speed = 12;
        const gravity = 0.8;
        
        // Horizontal input affects lateral speed
        if (this.inputState.left) this.playerState.lateral_speed -= accel;
        if (this.inputState.right) this.playerState.lateral_speed += accel;
        
        // Clamp lateral speed
        this.playerState.lateral_speed = Math.max(-max_speed, Math.min(this.playerState.lateral_speed, max_speed));
        
        // Horizontal collision
        const oldX = this.playerState.x;
        const oldY = this.playerState.y;
        let newX = this.playerState.x + this.playerState.lateral_speed;
        newX = CollisionDetector.checkHorizontalCollision(this.playerState, newX, State.blocks);
        if (newX !== this.playerState.x + this.playerState.lateral_speed) {
            this.playerState.lateral_speed = 0;
        }
        this.playerState.x = newX;
        
        // Apply gravity
        this.playerState.vertical_speed += gravity;
        
        // Vertical collision
        let newY = this.playerState.y + this.playerState.vertical_speed;
        const collision = CollisionDetector.checkVerticalCollision(this.playerState, oldY, newY, State.blocks);
        newY = collision.y;
        let landed = collision.landed;
        
        // Floor collision (gray rectangle)
        const grayRectangleTop = 500 - 140;
        if (newY + this.playerState.height > grayRectangleTop) {
            newY = grayRectangleTop - this.playerState.height;
            this.playerState.vertical_speed = 0;
            landed = true;
        }
        if (newY < 0) {
            newY = 0;
            this.playerState.vertical_speed = 0;
        }
        
        this.playerState.y = newY;
        this.playerState.onGround = landed;
        
        // Apply friction
        const frictionFactor = (this.inputState.left || this.inputState.right) ? 0.95 : friction;
        this.playerState.lateral_speed *= frictionFactor;
        
        // Stop micro-coasting
        if (Math.abs(this.playerState.lateral_speed) < 0.1) this.playerState.lateral_speed = 0;
        if (Math.abs(this.playerState.vertical_speed) < 0.1) this.playerState.vertical_speed = 0;
        
        // Clamp boundaries
        if (this.playerState.x < 0) this.playerState.x = 0;
        if (this.playerState.x + this.playerState.width > 500) {
            this.playerState.x = 500 - this.playerState.width;
        }
        if (this.playerState.y < 0) {
            this.playerState.y = 0;
            this.playerState.vertical_speed = 0;
        }
        if (this.playerState.y + this.playerState.height > 500) {
            this.playerState.y = 500 - this.playerState.height;
            this.playerState.vertical_speed = 0;
            this.playerState.onGround = true;
        }
    }

    static resetPlayerToStart() {
        this.playerState = {
            x: Math.floor(500 / 2) - 12.5, // Center horizontally
            y: 500 - 150 - 20, // Match player start position
            lateral_speed: 0,
            vertical_speed: 0,
            onGround: false,
            width: 25,
            height: 20
        };
    }

    static simulateToTime(targetTime) {
        const step = 16.67; // 60fps
        let simTime = 0;
        let inputIdx = 0;
        
        while (simTime < targetTime) {
            // Process inputs for this frame
            while (inputIdx < this.replayData.inputs.length && 
                   this.replayData.inputs[inputIdx].t <= simTime) {
                this.processInput(this.replayData.inputs[inputIdx]);
                inputIdx++;
            }
            
            this.updatePlayerPhysics();
            simTime += step;
        }
        
        this.inputIndex = inputIdx;
    }

    static draw(ctx) {
        if (!this.isPlaying) return;
        
        // Draw replay player (match real player appearance)
        ctx.fillStyle = State.currentPlayerColor || '#000000';
        ctx.fillRect(this.playerState.x, this.playerState.y, this.playerState.width, this.playerState.height);
        
        // Draw outline
        ctx.strokeStyle = State.currentPlayerOuterColor || '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.playerState.x, this.playerState.y, this.playerState.width, this.playerState.height);
        
        // Draw replay UI
        this.drawReplayUI(ctx);
    }

    static drawReplayUI(ctx) {
        const progress = this.replayData ? Math.min(this.currentTime / this.replayData.duration, 1) : 0;
        
        // Semi-transparent background for UI
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 500 - 80, 500, 80);
        
        // Progress bar
        const barY = 500 - 60;
        const barWidth = 500 - 100;
        const barHeight = 8;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(50, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(50, barY, barWidth * progress, barHeight);
        
        // Progress bar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, barY, barWidth, barHeight);
        
        // Time display
        const currentTimeStr = (this.currentTime / 1000).toFixed(1);
        const totalTimeStr = this.replayData ? (this.replayData.duration / 1000).toFixed(1) : '0.0';
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentTimeStr}s / ${totalTimeStr}s`, 500 / 2, barY - 10);
        
        // Speed indicator
        ctx.textAlign = 'right';
        ctx.fillText(`${this.speed.toFixed(2)}x`, 500 - 20, barY - 10);
        
        // Pause indicator
        if (this.isPaused) {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 16px Arial';
            ctx.fillText('PAUSED', 20, barY - 10);
        }
        
        // Controls
        ctx.textAlign = 'left';
        ctx.font = '12px Arial';
        ctx.fillStyle = '#cccccc';
        ctx.fillText('Space: Pause | ←/→: Seek | +/-: Speed | Esc: Exit', 20, 500 - 20);
    }
}