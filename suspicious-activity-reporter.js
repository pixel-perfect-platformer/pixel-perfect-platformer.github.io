// Suspicious Activity Reporter
import { firebaseService } from './firebase-service.js';
import State from './state.js';

export class SuspiciousActivityReporter {
    static async reportSuspiciousActivity(type, details) {
        if (!State.currentUser) return;
        
        try {
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
            
            const report = {
                uid: State.currentUser.uid,
                username: State.currentUser.email?.replace('@platformer.local', '') || 'Anonymous',
                type,
                details,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };
            
            await addDoc(collection(db, 'suspicious_activity'), report);
            console.warn(`Suspicious activity reported: ${type}`, details);
        } catch (error) {
            console.error('Failed to report suspicious activity:', error);
        }
    }
    
    static reportInvalidScore(scoreData, validationErrors) {
        this.reportSuspiciousActivity('invalid_score_submission', {
            scoreData,
            validationErrors,
            levelIndex: scoreData.levelIndex
        });
    }
    
    static reportSuspiciousPatterns(patterns, replayData) {
        this.reportSuspiciousActivity('suspicious_input_patterns', {
            patterns,
            replayLength: replayData.length,
            levelIndex: State.currentLevelIndex
        });
    }
    
    static reportPhysicsViolation(violation, playerState) {
        this.reportSuspiciousActivity('physics_violation', {
            violation,
            playerState,
            levelIndex: State.currentLevelIndex
        });
    }
    
    static reportTimingAnomaly(expectedTime, actualTime, tolerance) {
        this.reportSuspiciousActivity('timing_anomaly', {
            expectedTime,
            actualTime,
            difference: Math.abs(expectedTime - actualTime),
            tolerance,
            levelIndex: State.currentLevelIndex
        });
    }
}