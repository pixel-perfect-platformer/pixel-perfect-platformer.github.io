import Constants from "./constants.js";
class Canvas {
    static scale = 1;
    static scaleX = this.scale;
    static scaleY = this.scale;
    static canvas = null;
    static ctx = null;

    constructor() {
        this.canvas = document.getElementById("game");
        this.ctx = this.canvas.getContext("2d");
        this.resize();
    }

    resize() {
        if (!this.canvas) return;
        
        const displayWidth = this.canvas.clientWidth;      // ✅ Fixed
        const displayHeight = this.canvas.clientHeight;    // ✅ Fixed
        
        Constants.scaleX = displayWidth / Constants.SCREEN_WIDTH;
        Constants.scaleY = displayHeight / Constants.SCREEN_HEIGHT;
        window.renderScale = Math.min(Constants.scaleX, Constants.scaleY);

        this.canvas.width = displayWidth;       // ✅ Fixed  
        this.canvas.height = displayHeight;     // ✅ Fixed

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(Constants.scaleX, Constants.scaleY);
        this.ctx.translate(0, 0);
    }
}
export default Canvas;