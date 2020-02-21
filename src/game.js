import Piece from "./piece";
import * as GameUtils from "./utils";
import allTetrominos from "./tetromino";

class Game {
  constructor(ctx, controller) {
    this.ctx = ctx;
    this.pieces = [];
    this.gameOver = false;
    this.controller = controller;
    // this.score = 0;

    this.dimX = GameUtils.DIM_X;
    this.dimY = GameUtils.DIM_Y;
    this.numCols = GameUtils.NUM_COLS;
    this.numRows = GameUtils.NUM_ROWS;
    this.gridColor = GameUtils.BG_COLOR;
    this.tileSize = GameUtils.TILE_SIZE;

    // Keep track of the tiles currently occupied on the grid using booleans
    // A Piece is comprised of 16 tiles, but only 4 tiles will be true
    this.tilesOccupied = new Array(this.numCols).fill(0).map(() => {
      return new Array(this.numRows).fill(false);
    });

    // Keep track of Pieces by pushing them into a matrix of arrays using the
    // Piece's position (all tiles are offset relative to the top left tile)
    this.pieceMatrix = new Array(this.numCols).fill(0).map(() => {
      return new Array(this.numRows).fill(0).map(() => {
        return new Array();
      });
    });

    this.generatedPieces = this.generatePieces();
    this.currPiece = this.generatePiece();
  }
  
  // Generates a set of random tetrominos stored in `this.generatedPieces`
  generatePieces() {
    const allTetrominoKeys = Object.keys(allTetrominos);

    // Shuffle the keys obtained from `allTetrominoKeys`
    for (let idx = allTetrominoKeys.length - 1; idx > 0; idx--) {
      const jdx = Math.floor(Math.random() * idx);
      const tempKey = allTetrominoKeys[idx];
      allTetrominoKeys[idx] = allTetrominoKeys[jdx];
      allTetrominoKeys[jdx] = tempKey;
    }

    // Map all of the keys in `allTetrominoKeys` into Piece objects
    return allTetrominoKeys.map(key => {
      return JSON.parse(JSON.stringify(allTetrominos[key]));
    });
  }

  // Returns a new and random Piece by sampling from `this.generatedPieces`
  generatePiece() {
    if (!this.generatedPieces.length) {
      this.generatedPieces = this.generatePieces();
    }
    let randTetromino = this.generatedPieces.pop();
    // const allTetrominoKeys = Object.keys(allTetrominos);
    // const randTetrominoKey = allTetrominoKeys[Math.floor(Math.random() * allTetrominoKeys.length)];
    // const randTetromino = JSON.parse(JSON.stringify(allTetrominos[randTetrominoKey]));

    // Used for specific piece testing
    // const randTetromino = JSON.parse(JSON.stringify(allTetrominos["tetrominoI"]));

    return new Piece(randTetromino, this);
  }

  // Draws the game board, locked pieces, and current piece
  draw() {
    // Background for the grid
    this.ctx.clearRect(0, 0, this.dimX, this.dimY);
    this.ctx.fillStyle = this.gridColor;
    this.ctx.fillRect(0, 0, this.dimX, this.dimY);
    
    // Construct the vertical lines for the grid
    this.ctx.strokeStyle = "#777777";
    for (let idx = 0; idx < this.numCols; idx++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.tileSize * idx, 0);
      this.ctx.lineTo(this.tileSize * idx, this.tileSize * this.numRows);
      this.ctx.stroke();
    }

    // Construct the horizontal lines for the grid
    for (let idx = 0; idx < this.numRows; idx++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.tileSize * idx)
      this.ctx.lineTo(this.dimX, this.tileSize * idx);
      this.ctx.stroke();
    }

    // Rendering a Piece
    for (let idx = 0; idx < this.pieces.length; idx++) {
      let fixedPiece = this.pieces[idx];
      fixedPiece.draw(this.ctx);
    }

    this.currPiece.draw(this.ctx);
  }

  // Move the current piece to the right 1 block
  stepRight() {
    if (this.currPiece.validHorizontal(1)) {
      this.currPiece.moveRight();
    }
  }

  // Move the current piece to the left 1 block
  stepLeft() {
    if (this.currPiece.validHorizontal(-1)) {
      this.currPiece.moveLeft();
    }
  }

  // Move the current piece down 1 block
  stepDown() {
    if (this.currPiece.validVertical()) {
      this.currPiece.moveDown();
      return true;
    } else {
      // this.currPiece.color = "#444444"; // Change color on drop
      this.pieces.push(this.currPiece);
      this.currPiece.recordPiece();
      this.clearRows();
      this.currPiece = this.generatePiece();
      return false;
    }
  }

  // Continuously move the current piece down until collision
  dropPiece() {
    let validStep = this.stepDown();
    while (validStep) {
      validStep = this.stepDown();
    }
  }

  // Rotates the current piece
  rotatePiece() {
    let nextOrientation = (this.currPiece.orientation + 1) % 4;
    if (this.currPiece.validOrientation(nextOrientation)) {
      this.currPiece.rotate();
    }
  }

  // If there exists a row to clear, return that row's index, and -1 otherwise
  findRowToClear() {
    for (let rowIdx = this.numRows - 1; rowIdx >= 0; rowIdx--) {
      let row = this.tilesOccupied.map((col, colIdx) => this.tilesOccupied[colIdx][rowIdx]);
      if (row.reduce((a, b) => a + b, 0) === this.numCols) return rowIdx;
    }
    return -1;
  }

  // Update `this.tilesOccupied` by shifting every entry down by 1 if its rowIdx
  // is less than (higher on the grid) `rowToClear`, starting from rowToClear
  updateTilesOccupied(rowToClear) {
    for (let colIdx = 0; colIdx < this.numCols; colIdx++) {
      for (let rowIdx = rowToClear; rowIdx >= 0; rowIdx--) {
        // Accounts for the top row pulling from a negative index
        this.tilesOccupied[colIdx][rowIdx] = this.tilesOccupied[colIdx][rowIdx - 1] || false;
      }
    }
  }

  clearRows() {
    let rowToClear = this.findRowToClear();

    while (rowToClear >= 0) {
      this.updateTilesOccupied(rowToClear);

      // Update piece orientations for drawing logic
      for (let pieceMatrixCol = 0; pieceMatrixCol < this.numCols; pieceMatrixCol++) {
        for (let pieceMatrixRow = rowToClear; pieceMatrixRow >= 0; pieceMatrixRow--) {
          let piecesArr = this.pieceMatrix[pieceMatrixCol][pieceMatrixRow];
          if (piecesArr.length) {
            let trackIdxs = [];
            for (let pieceIdx = piecesArr.length - 1; pieceIdx >= 0; pieceIdx--) {
              let piece = piecesArr[pieceIdx];
             
              // Handles if cyan piece is guaranteed to be above `rowToClear`
              if (piece.color === "#00FFFF" && piece.pos[1] + 4 < rowToClear) {
                piece.pos[1] += 1;
                trackIdxs.push(pieceIdx);

              // Handles any other piece guaranteed to be above `rowToClear`
              } else if (piece.pos[1] + 3 < rowToClear) {
                piece.pos[1] += 1;
                trackIdxs.push(pieceIdx);

              // The `rowToClear` is within the bounds of the considered piece
              // Delete that portion of the piece's orientation and update the
              // piece's orientation array to reflect the change
              } else {
                let [colPos, rowPos] = piece.pos;
                let currOrientation = piece.orientations[piece.orientation];
                let currOrientationStr = currOrientation.toString(2).padStart(16, "0");
                for (let shiftAmt = 15; shiftAmt >= 0; shiftAmt--) {
                  let [colShift, rowShift] = piece.calculateShift(shiftAmt);
                  let newRowPos = rowPos + rowShift;
                  if (newRowPos === rowToClear) {
                    currOrientationStr = (currOrientationStr.slice(0, 15 - shiftAmt) + currOrientationStr.slice(15 - shiftAmt + 1)).padStart(16, "0");
                  }
                }
                let binaryOrientation = parseInt(currOrientationStr, 2);
                piece.orientations[piece.orientation] = binaryOrientation;
              }
            }

            // `trackIdxs` will be an array of piece indices within `piecesArr`
            // in decreasing order that needs to be shifted down by 1
            for (let idx = 0; idx < trackIdxs.length; idx++) {
              let trackIdx = trackIdxs[idx];
              let trackPiece = piecesArr[trackIdx];
              this.pieceMatrix[pieceMatrixCol][pieceMatrixRow + 1].push(trackPiece);
            }

            // Remove the tracked pieces from the current `piecesArr`
            for (let idx = 0; idx < trackIdxs.length; idx++) {
              let trackIdx = trackIdxs[idx];
              piecesArr.splice(trackIdx, 1);
            }
          }
        }
      }

      rowToClear = this.findRowToClear();
    }
  }

//   gameOver() {
//     if (this.filledTiles[3][0] || this.filledTiles[4][0] || this.filledTiles[5][0] || this.filledTiles[6][0]) {
//       return true;
//     }
//     return false;
//   }
}

export default Game;