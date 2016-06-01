function Game() {
  this.rootElement = document.createElement('div')
  this.rootElement.style.position = 'absolute'
  this.rootElement.style.width = 640
  this.rootElement.style.height = 480
}

Game.prototype.show = function() {
  document.body.appendChild(this.rootElement)
};

Game.prototype.hide = function() {
  document.body.removeChild(this.rootElement)
};

function Asteroids(cfg) {
  Game.call(this)
  // additional constructor code
}

Asteroids.prototype = Object.create(Game.prototype)
Asteroids.prototype.constructor = Game

Asteroids.prototype.resize = function() {
  // recalculate graphical stuff
}

Asteroids.prototype.setState = function(gameState) {
  // set client game state from game state object
}
Asteroids.prototype.getState = function() {
  // return single game state object
}

Asteroids.prototype.start = function() {
  // hides game menu overlay and starts game
}
Asteroids.prototype.stop = function() {
  // stops game and shows game menu overlay
}

function computeScore(cfg, gameState) {
  // if unable to calculate score => -1
  // else => time spent alive + asteroids destroyed * multiplier (5)
}