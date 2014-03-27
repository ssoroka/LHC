function NPCPlayerInputManager() {
  this.events = {};
  this.intervalId = null;

  this.listen();
  var self = this;

  var playMoveHook = function() {
    if (self.gameManager && self.gameManager.over)
      self.stop();

    self.playMove()
  };

  startStopBtn = document.querySelector(".startStop");

  this.start = function() {
    startStopBtn.innerText = 'Stop';
    self.intervalId = setInterval(playMoveHook, 300);
  }

  this.stop = function() {
    startStopBtn.innerText = 'Start';
    clearInterval(self.intervalId);
  }

  startStopBtn.addEventListener("click", function (event) {
    startStopBtn.innerText == "Start" ? self.start() : self.stop();
  })
}


Grid.prototype.sumSingleTiles = function() {
  var set = [];
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.cellContent({ x: x, y: y });
      if (tile) {
        if (set.indexOf(tile.value) == -1) {
          set.push(tile.value);
        }
      }
    }
  }
  var sum = set.reduce(function(sum, i){return sum + i}, 0);
  // console.log("sumSingleTiles: " + sum);
  return sum;
}

Grid.prototype.loadFromBoard = function() {
  var self = this;
  var i;
  container = document.querySelector(".tile-container");
  if (container && container.children) {
    for (i = 0; i < container.children.length; i++) {
      tile = container.children[i];
      c = tile.attributes['class'].value;
      if (c) {
        x = parseInt(c.split(' ')[2].split('-')[2])-1;
        y = parseInt(c.split(' ')[2].split('-')[3])-1;
        value = parseInt(c.split(' ')[1].split('-')[1]);
        // console.log("setting "+ x + ", " + y+ " to " + value);
        self.cells[x][y] = new Tile({x: x, y: y}, value);
      }
    }
  }
};

Grid.prototype.dup = function() {
  g2 = new Grid(this.size);
  this.eachCell(function(x, y, tile){
    g2.cells[x][y] = tile;
  })
  return g2;
};

NPCPlayerInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

NPCPlayerInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

NPCPlayerInputManager.prototype.playMove = function() {
  var gm, score, move;
  // read board
  grid = new Grid(4);
  grid.loadFromBoard();
  // consider each available move
  var best_move = 0;
  var best_score = 0;
  for (move = 0; move < 4; move++){
    // if (move != this.last_move){
      // // dup board
      // grid2 = grid.dup();
      // gm = new GameManager(4, null, null, null);
      // gm.grid = grid2;
      // gm.score       = 0;
      // gm.over        = false;
      // gm.won         = false;
      // gm.keepPlaying = false;
      // // simulate move
      // gm.move(move);
      // console.log(gm.score);
      score = this.scoreFromPosition(this.gameManager, grid, move, 1);
      score += this.scoreFromPosition(this.gameManager, grid, move, 1);
      score += this.scoreFromPosition(this.gameManager, grid, move, 1);
      score += this.scoreFromPosition(this.gameManager, grid, move, 1);
      score += this.scoreFromPosition(this.gameManager, grid, move, 1);
      score = score / 5;
      // count points
      if (score > best_score) {
        best_move = move;
        best_score = score;
      }
    // }
  }
  // play winner.
  if (best_score == 0){
      // we have no idea; make a random move
      console.log("random move");
      move = Math.floor(Math.random() * 4);
      this.emit("move", move);
      this.last_move = move;
  }else {
    console.log("planned move " + best_move + "; " + best_score);
    this.emit("move", best_move);
    this.last_move = best_move;
  }
};

NPCPlayerInputManager.prototype.scoreFromPosition = function(gameManager, grid, move, depth) {
  var score, new_score, next_move;
  var grid2 = grid.dup();
  var gm = new GameManager(4);
  gm.grid = grid2;
  gm.score       = gameManager.score + 0;
  gm.over        = false;
  gm.won         = false;
  gm.keepPlaying = false;
  gm.move(move);
  // score = gm.over ? 0 : (17 - gm.grid.availableCells().length) * gm.tileMatchesAvailableCount() * gm.grid.sumSingleTiles();
  // using tileMatchesAvailableCount() gives the wrong motivation for the game.
  score = gm.over ? -2 : Math.log(17 - gm.grid.availableCells().length) * Math.log(gm.grid.sumSingleTiles());
  // score = gm.over ? -2 : Math.log(gm.grid.sumSingleTiles());

  // consider working in reduced distance to high-value pairs in to algorithm

  if (depth > 0) {
    for (next_move = 0; next_move < 4; next_move++){
      new_score = this.scoreFromPosition(gm, gm.grid, next_move, depth - 1);
      new_score += this.scoreFromPosition(gm, gm.grid, next_move, depth - 1);
      new_score += this.scoreFromPosition(gm, gm.grid, next_move, depth - 1);
      new_score += this.scoreFromPosition(gm, gm.grid, next_move, depth - 1);
      new_score += this.scoreFromPosition(gm, gm.grid, next_move, depth - 1);
      // score = new_score > score ? new_score : score;
      score += new_score / 5
    }
  }
  return score;
}

NPCPlayerInputManager.prototype.playRandomMove = function() {
  this.emit("move", Math.floor(Math.random() * 4));
};

NPCPlayerInputManager.prototype.listen = function () {};

NPCPlayerInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};

NPCPlayerInputManager.prototype.keepPlaying = function (event) {
  event.preventDefault();
  this.emit("keepPlaying");
};

