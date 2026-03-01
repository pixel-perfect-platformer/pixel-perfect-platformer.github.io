// Advanced Anti-Cheat Validation System
export class AntiCheatValidator {
    static PHYSICS_CONSTANTS = {
        MAX_SPEED: 12,
        GRAVITY: 0.8,
        JUMP_SPEED: -10,
        ACCEL: 0.5,
        FRICTION: 0.8,
        PLAYER_WIDTH: 25,
        PLAYER_HEIGHT: 20
    };

    static validateReplay(replayData, levelData, submittedTime, submittedJumps) {
        try {
            const replay = JSON.parse(replayData);
            const validation = {
                isValid: true,
                errors: [],
                suspiciousPatterns: []
            };

            // Basic structure validation
            if (!replay.inputs || !Array.isArray(replay.inputs)) {
                validation.isValid = false;
                validation.errors.push('Invalid replay structure');
                return validation;
            }

            // Simulate physics and validate
            const physicsValidation = this.validatePhysicsSimulation(replay, levelData);
            if (!physicsValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...physicsValidation.errors);
            }

            // Validate timing consistency
            const timingValidation = this.validateTiming(replay, submittedTime);
            if (!timingValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...timingValidation.errors);
            }

            // Check for suspicious input patterns
            const patternValidation = this.detectSuspiciousPatterns(replay.inputs);
            validation.suspiciousPatterns.push(...patternValidation);

            // Validate jump count
            const jumpCount = replay.inputs.filter(input => input.type === 'jump').length;
            if (Math.abs(jumpCount - submittedJumps) > 1) {
                validation.isValid = false;
                validation.errors.push(`Jump count mismatch: recorded ${jumpCount}, submitted ${submittedJumps}`);
            }

            return validation;
        } catch (error) {
            return {
                isValid: false,
                errors: [`Replay parsing error: ${error.message}`],
                suspiciousPatterns: []
            };
        }
    }

    static validatePhysicsSimulation(replay, levelData) {
        const validation = { isValid: true, errors: [] };
        
        // Simulate player movement based on inputs
        let player = {
            x: Math.floor(800 / 2) - Math.floor(this.PHYSICS_CONSTANTS.PLAYER_WIDTH / 2),
            y: 600 - 150 - this.PHYSICS_CONSTANTS.PLAYER_HEIGHT,
            lateral_speed: 0,
            vertical_speed: 0,
            onGround: false
        };

        let currentTime = 0;
        let inputIndex = 0;
        const timeStep = 16.67; // ~60fps

        while (currentTime < replay.duration && inputIndex < replay.inputs.length) {
            // Process inputs at current time
            while (inputIndex < replay.inputs.length && replay.inputs[inputIndex].t <= currentTime) {
                const input = replay.inputs[inputIndex];
                this.processInput(player, input);
                inputIndex++;
            }

            // Update physics
            this.updatePlayerPhysics(player, levelData);
            
            // Check for impossible movements
            if (Math.abs(player.lateral_speed) > this.PHYSICS_CONSTANTS.MAX_SPEED * 1.1) {
                validation.isValid = false;
                validation.errors.push(`Impossible lateral speed: ${player.lateral_speed}`);
            }

            if (player.vertical_speed < -15) { // Jump speed with some tolerance
                validation.isValid = false;
                validation.errors.push(`Impossible vertical speed: ${player.vertical_speed}`);
            }

            currentTime += timeStep;
        }

        return validation;
    }

    static processInput(player, input) {
        switch (input.type) {
            case 'jump':
                if (player.onGround) {
                    player.vertical_speed = this.PHYSICS_CONSTANTS.JUMP_SPEED;
                    player.onGround = false;
                }
                break;
            case 'left':
                player.lateral_speed -= this.PHYSICS_CONSTANTS.ACCEL;
                break;
            case 'right':
                player.lateral_speed += this.PHYSICS_CONSTANTS.ACCEL;
                break;
        }
    }

    static updatePlayerPhysics(player, levelData) {
        // Apply gravity
        player.vertical_speed += this.PHYSICS_CONSTANTS.GRAVITY;
        
        // Clamp lateral speed
        player.lateral_speed = Math.max(-this.PHYSICS_CONSTANTS.MAX_SPEED, 
            Math.min(player.lateral_speed, this.PHYSICS_CONSTANTS.MAX_SPEED));
        
        // Update position
        player.x += player.lateral_speed;
        player.y += player.vertical_speed;
        
        // Simple ground collision (floor at y=450)
        if (player.y + this.PHYSICS_CONSTANTS.PLAYER_HEIGHT > 450) {
            player.y = 450 - this.PHYSICS_CONSTANTS.PLAYER_HEIGHT;
            player.vertical_speed = 0;
            player.onGround = true;
        }
        
        // Apply friction
        player.lateral_speed *= this.PHYSICS_CONSTANTS.FRICTION;
        if (Math.abs(player.lateral_speed) < 0.1) player.lateral_speed = 0;
    }

    static validateTiming(replay, submittedTime) {
        const validation = { isValid: true, errors: [] };
        
        const replayDuration = replay.duration / 1000; // Convert to seconds
        const timeDifference = Math.abs(replayDuration - submittedTime);
        
        // Allow 0.1 second tolerance
        if (timeDifference > 0.1) {
            validation.isValid = false;
            validation.errors.push(`Time mismatch: replay ${replayDuration}s, submitted ${submittedTime}s`);
        }

        // Check for time manipulation (inputs after completion)
        const lastInputTime = replay.inputs.length > 0 ? 
            Math.max(...replay.inputs.map(input => input.t)) : 0;
        
        if (lastInputTime > replay.duration + 100) { // 100ms tolerance
            validation.isValid = false;
            validation.errors.push('Inputs recorded after level completion');
        }

        return validation;
    }

    static detectSuspiciousPatterns(inputs) {
        const patterns = [];
        
        // Check for inhuman input timing (too precise)
        const jumpInputs = inputs.filter(input => input.type === 'jump');
        if (jumpInputs.length > 1) {
            const intervals = [];
            for (let i = 1; i < jumpInputs.length; i++) {
                intervals.push(jumpInputs[i].t - jumpInputs[i-1].t);
            }
            
            // Check for suspiciously consistent timing
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((sum, interval) => 
                sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
            
            if (variance < 10 && intervals.length > 5) {
                patterns.push('Suspiciously consistent jump timing');
            }
        }

        // Check for impossible input frequency
        const inputsPerSecond = inputs.length / (inputs[inputs.length - 1]?.t / 1000 || 1);
        if (inputsPerSecond > 30) {
            patterns.push(`Excessive input frequency: ${inputsPerSecond.toFixed(1)} inputs/second`);
        }

        return patterns;
    }

    static generateSecurityHash(levelIndex, time, jumps, timestamp, uid) {
        // Simple hash for additional validation
        const data = `${levelIndex}-${time}-${jumps}-${timestamp}-${uid}`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }
}