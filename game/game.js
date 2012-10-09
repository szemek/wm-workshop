/**
 * Create the main Game
 *
 * @param {HTMLElement} element Main element to create game on.
 * @param {Object} options Configuration options
 *  param {Number} options.tilesize The size of a single game tile in pixels
 *  param {Number} options.moveEnergy How much of a player energu will be used during one step
 *  param {Number} options.startEnergy How much energy has the player that is starting.
 */
function Game(element, options) {

  options = options || {};

  this.gamebody = element;

  this.players = [];
  this.goodies = [];

  this.playersList = document.querySelector('#players');
  this.activePlayer = null;

  this.moveEnergy = options.moveEnergy || 20;
  this.startEnergy = options.startEnergy || 100;

  this.grid = {
    tilesize: options.tilesize || 50,
    x: 20,
    y: 10,
    tiles: {}
  };

  this.gamebody.style.backgroundSize = this.grid.tilesize + 'px ' + this.grid.tilesize + 'px';
}


/**
 * Creates the game board with given dimensions
 * NOTE: the dimensions should be given as a number of tiles NOT pixels
 *
 * @param {Number} width How many tiles wide?
 * @param {Number} height How many tiles tall?
 */
Game.prototype.createBoard = function(width, height) {
  this.grid.x = width;
  this.grid.y = height;

  this.gamebody.style.width = (this.grid.x * this.grid.tilesize + 1) + 'px';
  this.gamebody.style.height = (this.grid.y * this.grid.tilesize + 1) + 'px';

  this.gamebody.classList.add('active');

  for (var i = 0; i < this.grid.x; i++) {

    this.grid.tiles[i] = {};

    for (var j = 0; j < this.grid.y; j++) {
      this.grid.tiles[i][j] = false;
    }
  }
};

/**
 * Adds given number of goodies to the board
 *
 * @param {Number} howMuch How many elements should be added to the board.
 * @param {Object} options Additional configuration parameters
 *  param {Number} options.energy What is the goodie influence on the player object
 *  param {HTMLElement} options.sound Optional audio element with the sound for the goodie.
 */
Game.prototype.addGoodies = function(howMuch, options) {
  var goodie,
      position,
      type = options.type || '';
      energy = options.energy || 40,
      sound = options.sound || null;

  for (var i = 0; i < howMuch; i++) {
    goodie = new Block('food', this.grid.tilesize, { type: type, energy: energy, sound: sound });

    position = this._getFreeRandomTile();

    goodie.x = position.x;
    goodie.y = position.y;

    this.grid.tiles[position.x][position.y] = goodie;

    goodie.create();
    this.gamebody.appendChild(goodie.element);
  }
};

/**
 * Add player to the game
 *
 * @param {String} name Player's name.
 * @param {String} type Player's type - defines his/her appearance.
 * @param {Object} position Where should the player be added (NOTE: this is
 * in tiles not in pixels), index is zero based.
 */
Game.prototype.addPlayer = function(name, type, position) {
  if (!position || this.grid.tiles[position.x][position.y]) {
    position = this._getFreeRandomTile();
  }

  var player = new Player(name, type, this.grid.tilesize, { position: position });

  this.players.push(player);

  this.playersList.appendChild(player.element);
  // this.grid.tiles[position.x][position.y] = player;

  this.activePlayer = player;
};

Game.prototype.setActivePlayer = function(index) {
  this.players.forEach(function(el) {
    el.element.classList.remove('active');
  });

  this.activePlayer = this.players[index];
  this.activePlayer.element.classList.add('active');
};

/**
 * Move player by given number of tiles
 * NOTE: this is the change in position not the coordinations
 *
 * @param {Number} x How many tiles horizontally (-1 move left, 1 move right).
 * @param {Number} y How many tiles vertically (-1 move up, 1 move down).
 */
Game.prototype.movePlayer = function(x, y) {
  var player = this.activePlayer;

  this.movePlayerTo(player.x + x, player.y + y);
};

/**
 * Move player to the given position on the board
 * NOTE: in tiles not in pixels
 * NOTE: the parametrs should be coordinates
 *
 * @param {Number} whereToX
 * @param {Number} whereToY
 */
Game.prototype.movePlayerTo = function(whereToX, whereToY) {
  console.log(whereToX, whereToY);

  var player = this.activePlayer;
  var block;

  if (whereToX >= 0 && whereToX < this.grid.x &&
      whereToY >= 0 && whereToY < this.grid.y &&
      player.health > 0) {

    block = this.grid.tiles[whereToX][whereToY];

    if (block) {

      switch (block.type) {
        case 'food':
          player.health -= this.moveEnergy;

          player.health += block.value;

          player.move(whereToX, whereToY);

          if (block.sound) {
            block.sound.play();
          }

          this.grid.tiles[whereToX][whereToY] = false;

          window.setTimeout(function() {
            block.remove();
          }, 300);
          break;
      }

    } else {
      player.health -= this.moveEnergy;
      player.move(whereToX, whereToY);
    }
  }
};

/**
 * Moves the player one tile right
 */
Game.prototype.moveRight = function() {
  this.activePlayer.element.dataset.direction = 'right';
  this.movePlayer(1, 0);
};

/**
 * Moves the player one tile left
 */
Game.prototype.moveLeft = function() {
  this.activePlayer.element.dataset.direction = 'left';
  this.movePlayer(-1, 0);
};

/**
 * Moves the player one tile up
 */
Game.prototype.moveUp = function() {
  this.activePlayer.element.dataset.direction = 'up';
  this.movePlayer(0, -1);
};

/**
 * Moves the player one tile down
 */
Game.prototype.moveDown = function() {
  this.activePlayer.element.dataset.direction = 'down';
  this.movePlayer(0, 1);
};

Game.prototype.loadGameState = function() {
  var state = localStorage.getItem('gameState');
  var data;

  if (state) {
    data = JSON.parse(state);
    for (var i = 0, l = data.length; i < l; i++) {
      for (var j = 0, m = data[i].length; j < m; j++) {
        if (data[i][j] !== false) {
          if (data[i][j].item === 'block') {

          }
        }
      }
    }
  }
};

Game.prototype.saveGameState = function() {
  var stateData = this.grid.tiles;
  var stateStr = JSON.stringify(stateData);

  localStorage.setItem('gameState', stateStr);
};

/**
 * Util function to get the free tile (to put goodie)
 * The underscore is customary way to show that method
 * is private and is supposed to use only within the object
 * (it shouldn't be called from the main script)
 */
Game.prototype._getFreeRandomTile = function() {
  var x = 0;
  var y = 0;

  do {
    x = parseInt(Math.random() * this.grid.x, 10),
    y = parseInt(Math.random() * this.grid.y, 10);
  } while (this.grid.tiles[x][y] !== false);

  return {
    x: x,
    y: y
  };
};

/** PLAYER OBJECT **/

function Player(name, type, tilesize, options) {
  this.type = type;
  this.name = name;
  this.element = null;

  this.health = 100;

  this.x = options.position.x || 0;
  this.y = options.position.y || 0;
  this.tilesize = tilesize || 50;

  this.create();
  this.move(this.x, this.y);
}

Player.prototype.create = function() {
  var node = document.createElement('li');
  var name = document.createElement('span');

  node.dataset.health = this.health;
  node.classList.add(this.type);
  name.innerHTML = this.name;
  node.appendChild(name);

  this.element = node;
};

Player.prototype.move = function(x, y) {
  this.x = x;
  this.y = y;

  this.update();
};

Player.prototype.update = function() {
  this.element.dataset.health = this.health;
  this.element.style.left = (this.x * this.tilesize) + 'px';
  this.element.style.top = (this.y * this.tilesize) + 'px';
};

Player.prototype.toJSON = function() {
  return {
    item: 'player',
    name: this.name,
    type: this.type
  };
};

/** GOODIE OBJECT **/
function Block(type, tilesize, options) {
  if (!tilesize) {
    throw new Error('You need to specify tilesize');
  }

  this.type = type;

  this.visual = options.type || '';
  this.value = options.energy || 0;
  this.sound = options.sound || null;
  this.tilesize = tilesize || 50;

  this.element = null;

  this.x = 0;
  this.y = 0;

  this.create();
}

Block.prototype.create = function() {
  var sprite = document.createElement('div');
  sprite.classList.add('sprite');
  sprite.classList.add(this.type);
  sprite.classList.add(this.visual);

  this.element = sprite;

  this.update();
};

Block.prototype.remove = function() {
  this.element.parentNode.removeChild(this.element);
};

Block.prototype.update = function() {
  this.element.dataset.value = this.value;
  this.element.style.left = (this.x * this.tilesize) + 'px';
  this.element.style.top = (this.y * this.tilesize) + 'px';
};

Block.prototype.toJSON = function() {
  return {
    item: 'block'
  };
};
