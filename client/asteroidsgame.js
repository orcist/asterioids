// Game class ----------------------------------------------------------
function Game(){
  this.rootElement = document.createElement('div')
  this.rootElement.style.position = 'absolute'
  this.rootElement.style.width = '480px'
  this.rootElement.style.height = '480px'
}

Game.prototype.show = function(){
  document.body.appendChild(this.rootElement)
};

Game.prototype.hide = function(){
  document.body.removeChild(this.rootElement)
};

// AsteroidsGame class -------------------------------------------------
function AsteroidsGame(cfg){
  Game.call(this)
  this.canvas = document.createElement('canvas')
  this.rootElement.appendChild(this.canvas)

  this.resize()
  // additional constructor code
}

AsteroidsGame.prototype = Object.create(Game.prototype)
AsteroidsGame.prototype.constructor = Game

AsteroidsGame.prototype.resize = function(){
  this.canvas.setAttribute('width', this.rootElement.style.width)
  this.canvas.setAttribute('height', this.rootElement.style.height)
  // recalculate graphical stuff
}

AsteroidsGame.prototype.setState = function(gameState){
  // set client game state from game state object
}
AsteroidsGame.prototype.getState = function(){
  // return single game state object
}

AsteroidsGame.prototype.start = function(){
  // hides game menu overlay and starts game
}
AsteroidsGame.prototype.stop = function(){
  // stops game and shows game menu overlay
}

function computeScore(cfg, gameState){
  // if unable to calculate score => -1
  // else => time spent alive + asteroids destroyed * multiplier (5?)
}

// Asteroid class ------------------------------------------------------
function Asteroid(speed){
  this.speed = speed
  this.direction = Math.random() * 360
  // find appropriate position for asteroid
  this.position = new Vector(0.5, 0.5)
  this.reach = 0.025 + Math.random() * 0.025

  var start = Math.random() * 360 / 180 * Math.PI
  this.surface = [new Vector(Math.cos(start), Math.sin(start))]
  for (i = 1; i < 360; i++){
    var offset = this.surface[this.surface.length-1].length()
    offset += (Math.random() - 0.5) * 0.1

    offset = Math.min(1, offset)
    offset = Math.max(0.4, offset)
    var d = start + (i / 180 * Math.PI)
    this.surface.push(new Vector(Math.cos(d), Math.sin(d)).multiply(offset))
  }
  var self = this
  this.surface = this.surface.map(function(v){
    return v.multiply(self.reach)
  })
}

Asteroid.prototype.onScreen = function(width, height){
  var p = this.position.multiply(size)
  var checks = [
    function(position, reach){
      return position.x + reach > 0
    },
    function(position, reach){
      return position.x - reach < size
    },
    function(position, reach){
      return position.y + reach > 0
    },
    function(position, reach){
      return position.y - reach < size
    }
  ]

  for (i = 0; i < checks.length; i++)
    if (!checks[i](p, this.reach))
      return false
  return true
}

Asteroid.prototype.explode = function(projectile){
  surface = []
  for (i = 0; i < this.surface; i += 5)
    surface.push(this.surface[i])

  return new Explosion(
    this.speed.add(projectile.speed),
    surface
  )
}

// Explosion class -----------------------------------------------------
function Explosion(speed, surface){
  this.speed = speed
  this.surface = surface
}

// Player class --------------------------------------------------------
function Player() {
  this.speed = 0.001
  this.position = new Vector(0.5, 0.5)
  this.reach = 0.05

  var self = this
  this.surface = [
    new Vector(0.5, 0), new Vector(-0.5, 0.3), new Vector(-0.5, -0.3)
  ].map(function(v){ return v.multiply(self.reach) })
}

Player.prototype.collision = function(object){
  if (this.position.distance(object.position) > Math.max(this.reach, object.reach))
    return false

  var self = this
  surface = this.surface.map(function(v){ return v.add(self.position) })
  a = surface[0]; b = surface[1]; c = surface[2]
  for (i = 0; i < this.surface; i += 5) { // @todo test this
    var p = this.surface[i]
    var v0 = c.add(a.multiply(-1)),
        v1 = b.add(a.multiply(-1)),
        v2 = p.add(a.multiply(-1))

    var dot00 = v0.multiply(v0),
        dot01 = v0.multiply(v1),
        dot02 = v0.multiply(v2),
        dot11 = v1.multiply(v1),
        dot12 = v1.multiply(v2)

    var invDenom = 1 / (dot00 * dot11 - dot01 * dot01)

    var u = (dot11 * dot02 - dot01 * dot12) * invDenom,
        v = (dot00 * dot12 - dot01 * dot02) * invDenom

    if ((u >= 0) && (v >= 0) && (u + v < 1))
      return true
    // credits go to http://www.blackpawn.com/texts/pointinpoly/default.html
  }
  return false
}

// Utility functions ---------------------------------------------------
function draw(object, ctx, size, color, width) {
  surface = object.surface.map(function(v){
    return v.add(object.position).multiply(size)
  })

  ctx.beginPath()
  ctx.moveTo(surface[0].x, surface[0].y)
  for (i = 1; i < surface.length; i++) {
    ctx.lineTo(surface[i].x, surface[i].y)
  }
  ctx.closePath()

  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
}

// Vector class --------------------------------------------------------
function Vector(x, y){
  this.x = x
  this.y = y
}

Vector.prototype.length = function() {
  return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
}

Vector.prototype.distance = function(other){
  return other.add(this.multiply(-1)).length()
}

Vector.prototype.add = function(other) {
  if (other.constructor == Vector)
    return new Vector(this.x + other.x, this.y + other.y)
  else
    console.error('Cannot add a variable of type ' + typeof(other) + ' to a Vector.')
}

Vector.prototype.multiply = function(other){
  if (typeof(other) == 'number')
    return new Vector(this.x * other, this.y * other)
  else if (other.constructor == Vector)
    return new Vector(this.x * other.x + this.y * other.y)
  else
    console.error('Cannot multiply Vector with a variable of type ' + typeof(other) +  '.')
}

// Execution -----------------------------------------------------------
g = new AsteroidsGame()
g.show()
var ctx = g.canvas.getContext('2d')
ctx.beginPath()
ctx.rect(0, 0, parseInt(g.canvas.getAttribute('width')), parseInt(g.canvas.getAttribute('height')))
ctx.fillStyle = '#000'
ctx.fill()

a = new Asteroid(10)
draw(a, ctx, 480, '#fff', 1)

p = new Player()
// draw(p, ctx, 480, '#fff', 1.5)