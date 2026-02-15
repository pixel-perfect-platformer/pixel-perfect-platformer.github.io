import State from './state.js';

class PlayerRenderer {
    static drawPlayer(ctx, player, inset = 3) {
        ctx.fillStyle = State.currentPlayerOuterColor;
        this._drawShape(ctx, player, 0);
        
        ctx.fillStyle = State.currentPlayerColor;
        this._drawShape(ctx, player, inset);
    }

    static drawWithAnimation(ctx, player, scale, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-(player.x + player.width / 2), -(player.y + player.height / 2));
        
        this.drawPlayer(ctx, player);
        
        ctx.restore();
    }

    static _drawShape(ctx, player, inset) {
        if (State.currentPlayerIcon === 'circle') {
            ctx.beginPath();
            ctx.arc(
                player.x + player.width / 2, 
                player.y + player.height / 2, 
                player.width / 2 - inset, 
                0, 
                Math.PI * 2
            );
            ctx.fill();
        } else if (State.currentPlayerIcon === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(player.x + player.width / 2, player.y + inset);
            ctx.lineTo(player.x + inset, player.y + player.height - inset);
            ctx.lineTo(player.x + player.width - inset, player.y + player.height - inset);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillRect(
                player.x + inset, 
                player.y + inset, 
                player.width - inset * 2, 
                player.height - inset * 2
            );
        }
    }
}

export default PlayerRenderer;
