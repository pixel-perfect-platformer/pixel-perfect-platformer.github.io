class Constants {
    // Maintain 500x500 logical size but scale to fullscreen
    static SCREEN_WIDTH = 500;
    static SCREEN_HEIGHT = 500;


    static WHITE = '#FFFFFF';
    static BLACK = '#000000'

    static keys = {};


    // UI elements
    static startBtn = document.getElementById('startBtn');

    static editorBtn = document.getElementById('editorBtn');
    static clearBtn = document.getElementById('clearBtn');
    static saveBtn = document.getElementById('saveBtn');
    static publishBtn = document.getElementById('publishBtn');
    static loadBtn = document.getElementById('loadBtn');
    static levelSelect = document.getElementById('levelSelect');
    static newLevelBtn = document.getElementById('newLevelBtn');
    static blockTypeSelect = document.getElementById('blockTypeSelect');
    static exportBtn = document.getElementById('exportBtn');

    static importCode = document.getElementById('importCode');
    static importBtn = document.getElementById('importBtn');
    static nextLevelBtn = document.getElementById('nextLevelBtn');
    static restartBtn = document.getElementById('restartBtn');
    static deleteLevelBtn = document.getElementById('deleteLevelBtn');
    static levelNameInput = document.getElementById('levelNameInput');
    static renameLevelBtn = document.getElementById('renameLevelBtn');
    static textInput = document.getElementById('textInput');
    static addTextBtn = document.getElementById('addTextBtn');
    static toggleHitboxBtn = document.getElementById('toggleHitboxBtn');
    static editorHint = document.getElementById('editorHint');
    static titleMusic = document.getElementById('titleMusic');

    static githubImg = new Image();

    static animationDuration = 1000; // 1 seconds
}
export default Constants;