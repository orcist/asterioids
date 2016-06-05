TIME_PER_FRAME = 1000 / 30 // 30 fps
ASTEROID_PEN = {
  fill: '#000',
  stroke: {
    color: '#fff',
    width: 1
  }
}
PLAYER_PEN = {
  fill: '#000',
  stroke: {
    color: '#fff',
    width: 2
  }
}

// Game class ----------------------------------------------------------
function Game(){
  this.rootElement = document.createElement('div')
  this.rootElement.style.position = 'absolute'
  this.rootElement.style.width = '640px'
  this.rootElement.style.height = '640px'
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
  this.canvas.setAttribute('tabindex', '1')
  this.rootElement.appendChild(this.canvas)

  this.ctx = this.canvas.getContext('2d')
  this.keyPressed = { 'up' : false, 'left': false, 'right': false }
  var keyMappings = {
    38: 'up', 87: 'up',
    37: 'left', 65: 'left',
    39: 'right', 68: 'right'
  }
  var self = this
  this.canvas.addEventListener('keydown', function(event){
    if (keyMappings.hasOwnProperty(event.keyCode))
      self.keyPressed[keyMappings[event.keyCode]] = true
  }, false)

  this.canvas.addEventListener('keyup', function(event){
    if (keyMappings.hasOwnProperty(event.keyCode))
      self.keyPressed[keyMappings[event.keyCode]] = false
  })

  this.resize()
  this.state = {
    alive_time: 0,
    asteroids_destroyed: 0,
    asteroids_info: [],
    player_info: []
  }
  this.start()
}

AsteroidsGame.prototype = Object.create(Game.prototype)
AsteroidsGame.prototype.constructor = Game

AsteroidsGame.prototype.resize = function(){
  this.canvas.setAttribute('width', this.rootElement.style.width)
  this.canvas.setAttribute('height', this.rootElement.style.height)

  this.screenWidth = parseInt(this.canvas.getAttribute('width'))
  this.screenHeight = parseInt(this.canvas.getAttribute('height'))
}

AsteroidsGame.prototype.setState = function(gameState){
  this.alive = gameState.alive_time
  this.destroyed = gameState.asteroids_destroyed
  this.asteroids = gameState.asteroids_info
  this.player = gameState.player_info
}
AsteroidsGame.prototype.getState = function(){
  return {
    alive_time: this.alive,
    asteroids_destroyed: this.destroyed,
    asteroids_info: this.asteroids,
    player_info: this.player
  }
}

AsteroidsGame.prototype.start = function(){
  this.alive = 0
  this.destroyed = 0
  this.asteroids = []
  this.asteroids.push(new Asteroid(3))
  this.player = new Player()

  var self = this
  this.loopTimer = setInterval(
    function(){ self.gameLoop() },
    TIME_PER_FRAME
  )
}
AsteroidsGame.prototype.stop = function(){
  // stops game and shows game menu overlay
  clearInterval(this.loopTimer)
}

AsteroidsGame.prototype.gameLoop = function(){
  if (this.keyPressed['up'])
    console.log('up')
  if (this.keyPressed['left'])
    this.player.rotate(-5 / 180 * Math.PI)
  if (this.keyPressed['right'])
    this.player.rotate(5 / 180 * Math.PI)

  // increase time counter
  this.alive += TIME_PER_FRAME / 10

  // move asteroids and player (destroy asteroids on 'out of screen')
  outOfScreen = []
  for (var i = 0; i < this.asteroids.length; i++) {
    this.asteroids[i].move(this.screenWidth, this.screenHeight)
    if (!this.asteroids[i].onScreen(this.screenWidth, this.screenHeight))
      outOfScreen.push(i)
  }
  for (var i = 0; i < outOfScreen.length; i++)
    this.asteroids.splice(outOfScreen[i]-i, 1)

  this.score = computeScore(null, this.getState())
  // add new asteroids if needed
  for (var i = 0; i < (baseLog(5, this.score+1) - this.asteroids.length + 1); i++) {
    this.asteroids.push(new Asteroid(baseLog(15, this.score+1)))
  }

  // compute and resolve collisions

  this.redraw()
}

AsteroidsGame.prototype.redraw = function(){
  // black background
  this.ctx.fillStyle = '#000'
  this.ctx.fillRect(0, 0, this.screenWidth, this.screenHeight)

  // asteroids
  for (var i = 0; i < this.asteroids.length; i++) {
    draw(
      this.asteroids[i], this.ctx,
      this.screenWidth, this.screenHeight, ASTEROID_PEN
    )
  }

  // explosions

  // player
  draw(this.player, this.ctx, this.screenWidth, this.screenHeight, PLAYER_PEN)
}

function computeScore(cfg, gameState){
  try {
    return gameState.alive_time + gameState.asteroids_destroyed * 50
  } catch (error) {
    console.error(error)
    return -1
  }
}

// Asteroid class ------------------------------------------------------
function Asteroid(speed){
  this.speed = speed
  this.direction = (
    25 + Math.random() * 40 + parseInt(Math.random() * 4) * 90
  ) / 180 * Math.PI
  this.reach = 0.025 + Math.random() * 0.025

  if (this.direction < 0.5 * Math.PI)
    this.position = (Math.random() >= 0.5) ?
      new Vector(-this.reach, 0.5 + Math.random() * 0.5) :
      new Vector(Math.random() * 0.5, 1 + this.reach)
  else if (this.direction < 1 * Math.PI)
    this.position = (Math.random() >= 0.5) ?
      new Vector(0.5 + Math.random() * 0.5, 1 + this.reach) :
      new Vector(1 + this.reach, 0.5 + Math.random() * 0.5)
  else if (this.direction < 1.5 * Math.PI)
    this.position = (Math.random() >= 0.5) ?
      new Vector(1 + this.reach, Math.random() * 0.5) :
      new Vector(0.5 + Math.random() * 0.5, -this.reach)
  else
    this.position = (Math.random() >= 0.5) ?
      new Vector(Math.random() * 0.5, -this.reach) :
      new Vector(-this.reach, Math.random() * 0.5)

  var start = Math.random() * 2 * Math.PI
  this.surface = [new Vector(Math.cos(start), Math.sin(start))]
  for (var i = 1; i < 360; i++){
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

Asteroid.prototype.move = function(screenWidth, screenHeight){
  this.position = this.position.add(
    new Vector(
      Math.cos(this.direction) / screenWidth,
      -Math.sin(this.direction) / screenHeight
    ).multiply(this.speed)
  )
}

Asteroid.prototype.onScreen = function(width, height){
  var checks = [
    function(p, r, w, h){ return p.x + r.x > 0 },
    function(p, r, w, h){ return p.x - r.x < w },
    function(p, r, w, h){ return p.y + r.y > 0 },
    function(p, r, w, h){ return p.y - r.y < h }
  ]
  var position = this.position.multiply(1)
  position.x *= width
  position.y *= height
  var reach = new Vector(width, height).multiply(this.reach)

  for (var i = 0; i < checks.length; i++)
    if (!checks[i](position, reach, width, height))
      return false
  return true
}

Asteroid.prototype.explode = function(projectile){
  surface = []
  for (var i = 0; i < this.surface; i += 5)
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
function Player(){
  this.speed = 0.001
  this.position = new Vector(0.5, 0.5)
  this.reach = 0.05
  this.lives = 3

  var self = this
  this.surface = [
    new Vector(0.35, 0), new Vector(-0.25, 0.25), new Vector(-0.25, -0.25)
  ].map(function(v){ return v.multiply(self.reach) })
}

Player.prototype.collision = function(object){
  if (this.position.distance(object.position) > Math.max(this.reach, object.reach))
    return false

  var self = this
  surface = this.surface.map(function(v){ return v.add(self.position) })
  a = surface[0]; b = surface[1]; c = surface[2]
  for (var i = 0; i < this.surface; i += 5) { // @todo test this
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

Player.prototype.rotate = function(degrees) {
  this.surface = this.surface.map(function(v) {
    return new Vector(
      v.x * Math.cos(degrees) - v.y * Math.sin(degrees),
      v.x * Math.sin(degrees) + v.y * Math.cos(degrees)
    )
  })
}

// Utility functions ---------------------------------------------------
function draw(object, ctx, screenWidth, screenHeight, pen) {
  surface = object.surface.map(function(v){
    var u = v.add(object.position)
    u.x *= screenWidth
    u.y *= screenHeight
    return u
  })

  ctx.beginPath()
  ctx.moveTo(surface[0].x, surface[0].y)
  for (var i = 1; i < surface.length; i++) {
    ctx.lineTo(surface[i].x, surface[i].y)
  }
  ctx.closePath()

  if (pen.fill) {
    ctx.fillStyle = pen.fill
    ctx.fill()
  }
  if (pen.stroke){
    ctx.strokeStyle = pen.stroke.color
    ctx.lineWidth = pen.stroke.width
    ctx.stroke()
  }
}

function baseLog(x, y) {
  return Math.log(y) / Math.log(x)
}

// Vector class --------------------------------------------------------
function Vector(x, y){
  this.x = x
  this.y = y
}

Vector.prototype.length = function(){
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