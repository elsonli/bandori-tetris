import Piece from "./piece";
import * as GameUtils from "./utils";
import allTetrominos from "./tetromino";

class Game {
  constructor(ctx, controller) {
    this.ctx = ctx;
    this.pieces = [];
    this.controller = controller;

    this.gridWidth = GameUtils.GRID_WIDTH;
    this.gridHeight = GameUtils.GRID_HEIGHT;
    this.tileSize = GameUtils.TILE_SIZE;

    this.generateNextPiece();

    this.checkTile = this.checkTile.bind(this);
    this.applyToBlocks = this.applyToBlocks.bind(this);
    this.filledTiles = new Array(10).fill(0).map(() => new Array(20).fill(false));
  }
  
  generateNextPiece() {
    const allTetrominoKeys = Object.keys(allTetrominos);
    const randKey = allTetrominoKeys[Math.floor(Math.random() * allTetrominoKeys.length)];
    const randTetromino = JSON.parse(JSON.stringify(allTetrominos[randKey]))
    this.currPiece = new Piece(randTetromino, this);
    return this.currPiece;
  }

  applyToBlocks(func) {
    const { block1, block2, block3, block4 } = this.currPiece;
    const blocks = [block1, block2, block3, block4];
    return blocks.map(block => func(block));
  }

  // Checks if a block is occupied, within bounds, not necessarily an integer
  checkTile(block) {
    let [xPos, yPos] = block;
    // [xPos, yPos] = [Math.round(xPos), Math.round(yPos)];
    if (xPos >= 0 && xPos <= GameUtils.GRID_WIDTH - 1) {
      return this.filledTiles[xPos][yPos + 1] || yPos >= GameUtils.GRID_HEIGHT - 1;
    }
    return false;
  }

  checkCollisions() {
    if (this.applyToBlocks(this.checkTile).some(ele => ele)) {
      this.applyToBlocks(block => this.filledTiles[block[0]][block[1]] = true);
      this.pieces.push(this.currPiece);
      this.generateNextPiece();
      return true;
    }
    return false;
  }

  draw() {
    // Background for the Grid
    this.ctx.clearRect(0, 0, GameUtils.DIM_X, GameUtils.DIM_Y);
    this.ctx.fillStyle = GameUtils.BG_COLOR;
    this.ctx.fillRect(0, 0, GameUtils.DIM_X, GameUtils.DIM_Y);
    
    // Constructing the Grid
    this.ctx.strokeStyle = "#777777";
    for (let idx = 0; idx < this.gridWidth; idx++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.tileSize * idx, 0);
      this.ctx.lineTo(this.tileSize * idx, GameUtils.DIM_Y);
      this.ctx.stroke();
    }
    for (let idx = 0; idx < this.gridHeight; idx++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.tileSize * idx)
      this.ctx.lineTo(GameUtils.DIM_X, this.tileSize * idx);
      this.ctx.stroke();
    }

    // Rendering a Piece
    for (let idx = 0; idx < this.pieces.length; idx++) {
      const currPiece = this.pieces[idx];
      currPiece.draw(this.ctx);
    }
    this.currPiece.draw(this.ctx);
  }

  stepRight() {
    if (!this.checkCollisions()) { this.currPiece.move(this.filledTiles, 0, 1) }
  }

  stepLeft() {
    if (!this.checkCollisions()) { this.currPiece.move(this.filledTiles, 0, -1) }
  }

  stepDown() {
    if (!this.checkCollisions()) { this.currPiece.move(this.filledTiles, 1, 0.5) }
  }
}

export default Game;