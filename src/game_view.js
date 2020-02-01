import Game from "./game";

class GameView {
  constructor(ctx) {
    this.controller = {
      keyListener: event => {
        switch (event.code) {
          case "ArrowLeft":
            this.game.stepLeft();
            break;

          case "ArrowRight":
            this.game.stepRight();
            break;
          
          // Up Arrow (Rotate Piece Clockwise)
          case "ArrowUp":
            this.game.rotatePiece();
            break;
          
          // Space (Drop Immediately)
          case "Space":
            this.game.dropPiece();
        }
      }
    };
    this.ctx = ctx;
    this.game = new Game(this.ctx, this.controller);
    this.animate = this.animate.bind(this);
    window.addEventListener("keydown", this.controller.keyListener.bind(this));
  }

  animate() {
    setTimeout(() => {
      this.game.stepDown();
      this.game.draw(this.ctx);
      if (this.game.gameOver()) {
        return this.stop();
      } else {
        requestAnimationFrame(this.animate);
      }
    }, 1000);
  }

  start() {
    this.game.draw(this.ctx);
    this.animation = requestAnimationFrame(this.animate);
  }

  stop() {
    this.ctx.fillStyle = "white";
    this.ctx.font = "30px Arial";
    this.ctx.fillText(this.game.score, 200, 830);
    cancelAnimationFrame(this.animation);
  }
}

export default GameView;