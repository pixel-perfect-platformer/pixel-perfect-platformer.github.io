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
    static showLevelMenu = false;
    static showLevelsScreen = false;
    static selectingForEditor = false;
    static currentLevelView = 0;
    static levelCategory = 'official'; // 'official' or 'community'
    static levelHoverLeft = false;
    static levelHoverRight = false;
    static levelSlideOffset = 0;
    static levelSlideTarget = 0;
    static levelSlideVelocity = 0;
    static isLevelAnimating = false;
    static mouseDistanceToArrow = 999;
    static isAnimatingLevelStart = false;
    static animationStartTimeLevelStart = 0;
    static backFromLevel = false;
    static levelCompletions = {}; // Track which levels have been completed
    static currentUser = null; // Current logged in user
    static showCreditsScreen = false;
    static isAnimatingCredits = false;
    static animationStartTimeCredits = 0;
    static isAnimatingSignIn = false;
    static animationStartTimeSignIn = 0;
    static showSignInScreen = false;
    static levelListPage = 0;
}
export default State;