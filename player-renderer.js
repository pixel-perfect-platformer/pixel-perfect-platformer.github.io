import State from './state.js';

class PlayerRenderer {
    static drawPlayer(ctx, player) {
        ctx.fillStyle = State.currentPlayerOuterColor;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = State.currentPlayerColor;
        ctx.fillRect(player.x + 2, player.y + 2, player.width - 4, player.height - 4);
    }

    static drawWithAnimation(ctx, player, scaleX, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(scaleX, 1);
        ctx.translate(-player.x - player.width / 2, -player.y - player.height / 2);
        this.drawPlayer(ctx, player);
        ctx.restore();
    }
}
export default PlayerRenderer;
