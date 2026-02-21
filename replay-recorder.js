import State from './state.js';

export class ReplayRecorder {
    static inputs = [];
    static startTime = 0;
    static frameCount = 0;
    static lastFrameTime = 0;

    static start() {
        this.inputs = [];
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastFrameTime = this.startTime;
    }

    static recordInput(type, value) {
        if (!State.isRunning) return;
        
        const currentTime = Date.now();
        this.inputs.push({
            t: currentTime - this.startTime,
            type,
            value,
            frame: this.frameCount
        });
    }

    static recordFrame() {
        if (!State.isRunning) return;
        
        const currentTime = Date.now();
        this.frameCount++;
        this.lastFrameTime = currentTime;
    }

    static getReplay() {
        const duration = Date.now() - this.startTime;
        const avgFrameTime = this.frameCount > 0 ? duration / this.frameCount : 0;
        
        return JSON.stringify({
            inputs: this.inputs,
            duration,
            levelIndex: State.currentLevelIndex,
            frameCount: this.frameCount,
            avgFrameTime,
            startTimestamp: this.startTime,
            endTimestamp: Date.now(),
            version: '1.0.0'
        });
    }
}
