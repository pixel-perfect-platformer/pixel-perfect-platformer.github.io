class State {
    // Game/editor state
    static blocks = [];
    static isRunning = false;
    static editorMode = false;
    static showTitleScreen = true;
    static showCustomizationScreen = false;
    static pressedTitleButton = null;
    static titleButtonIsDown = false;
    static isAnimating = false;
    static animationStartTime = 0;
    static isAnimatingEditor = false;
    static animationStartTimeEditor = 0;
    static isAnimatingCustomize = false;
    static animationStartTimeCustomize = 0;
    static isAnimatingBack = false;
    static animationStartTimeBack = 0;
    static fadeOpacity = 1; // 1 for title screen, 0 for game screen
    static texts = []; // placed text objects {x,y,text}
    static levelCompleted = false;
    static showHitboxes = false;
    // Level stats
    static levelStartTime = 0;
    static levelCompletionTime = 0;
    static jumpCount = 0;
    static showCompletionScreen = false;
    static showDeathScreen = false;
    static completionScreenStartTime = 0;
    static deathAnimationStartTime = 0;
    static deathAnimationDuration = 250; // 0.25 seconds
    static deathTime = 0;
    static completionAnimationStartTime = 0;
    static completionTime = 0;
    // Text dragging state
    static draggingTextIndex = -1;
    static dragging = false;
    static dragOffsetX = 0;
    static dragOffsetY = 0;
    // Painting state for click-drag block placement/removal
    static isPainting = false;
    static paintingMode = null; // 'add' or 'remove'
    // Editor mode: 'build', 'edit', 'delete'
    static editorToolMode = 'build';
    // Selected block for editing
    static selectedBlockIndex = -1;
    static draggingBlockIndex = -1;
    static dragBlockOffsetX = 0;
    static dragBlockOffsetY = 0;
    // Levels: array of {name, blocks}
    static levels = [];
    static currentLevelIndex = 0;
    static currentBlockType = 'solid';
    static currentPlayerColor = '#000000';
    static currentPlayerOuterColor = '#000000';
    static customizeColorMode = 'inner'; // 'inner' or 'outer'
}
export default State;