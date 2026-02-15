class CollisionDetector {
    static checkHorizontalCollision(player, newX, blocks) {
        for (let b of blocks) {
            if (player.y < b.y + b.height && player.y + player.height > b.y) {
                if (newX < b.x + b.width && newX + player.width > b.x) {
                    if (player.lateral_speed > 0) return b.x - player.width;
                    if (player.lateral_speed < 0) return b.x + b.width;
                }
            }
        }
        return newX;
    }

    static checkVerticalCollision(player, oldY, newY, blocks) {
        let landed = false;
        let finalY = newY;

        for (let b of blocks) {
            if (player.x < b.x + b.width && player.x + player.width > b.x) {
                if (oldY + player.height <= b.y && newY + player.height >= b.y && player.vertical_speed > 0) {
                    finalY = b.y - player.height;
                    player.vertical_speed = 0;
                    landed = true;
                } else if (oldY >= b.y + b.height && newY <= b.y + b.height && player.vertical_speed < 0) {
                    finalY = b.y + b.height;
                    player.vertical_speed = 0;
                }
            }
        }

        return { y: finalY, landed };
    }

    static checkSweptCollision(oldX, oldY, newX, newY, playerWidth, playerHeight, block) {
        const sweepTop = Math.min(oldY, newY);
        const sweepBottom = Math.max(oldY + playerHeight, newY + playerHeight);
        const vertOverlap = sweepBottom >= block.y && sweepTop <= block.y + block.height;
        
        const sweepLeft = Math.min(oldX, newX);
        const sweepRight = Math.max(oldX + playerWidth, newX + playerWidth);
        const horizOverlap = Math.min(sweepRight, block.x + block.width) >= Math.max(sweepLeft, block.x);
        
        return vertOverlap && horizOverlap;
    }
}

export default CollisionDetector;
