// Game class ----------------------------------------------------------
function Game(){
  this.rootElement = document.createElement('div')
  this.rootElement.style.position = 'absolute'
  this.rootElement.style.width = '640px'
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
  this.canvas.setAttribute('tabindex', '1')
  this.rootElement.appendChild(this.canvas)

  this.ctx = this.canvas.getContext('2d')
  this.keyPressed = { 'up' : false, 'left': false, 'right': false, 'fire': false }
  var keyMappings = {
    38: 'up', 87: 'up',
    37: 'left', 65: 'left',
    39: 'right', 68: 'right',
    32: 'fire', 13: 'fire'
  }
  this.time = 0

  var self = this
  this.canvas.addEventListener('keydown', function(event){
    if (keyMappings.hasOwnProperty(event.keyCode))
      self.keyPressed[keyMappings[event.keyCode]] = true
  }, false)

  this.canvas.addEventListener('keyup', function(event){
    if (keyMappings.hasOwnProperty(event.keyCode))
      self.keyPressed[keyMappings[event.keyCode]] = false
  })

  this.TIME_PER_FRAME = 1000 / 30 // 30 fps
  this.PEN = {
    ASTEROID: {
      fill: '#000',
      stroke: {
        color: '#fff',
        width: 1
      }
    },
    PLAYER: {
      fill: '#000',
      stroke: {
        color: '#fff',
        width: 2
      }
    },
    PROJECTILE: {
      fill: '#fff',
      stroke: {
        color: '#fff',
        width: 1
      }
    }
  }

  this.adjustSize()
  this.start()
}

AsteroidsGame.prototype = Object.create(Game.prototype)
AsteroidsGame.prototype.constructor = Game

AsteroidsGame.prototype.resize = function(){
  // divide everything (pos+surf) by former scale
  // asteroids, player, projectiles, explosions,
  this.adjustSize()
  // multiply everything by new scale
}

AsteroidsGame.prototype.adjustSize = function(){
  this.canvas.setAttribute('width', this.rootElement.style.width)
  this.canvas.setAttribute('height', this.rootElement.style.height)

  this.screen = {
    width: parseInt(this.canvas.getAttribute('width')),
    height: parseInt(this.canvas.getAttribute('height'))
  }
  this.screen.scale = Math.min(this.screen.width, this.screen.height)
}

AsteroidsGame.prototype.setState = function(gameState){
  this.destroyed = gameState.asteroids_destroyed
  this.asteroids = gameState.asteroids_info
  this.player = gameState.player_info
}

AsteroidsGame.prototype.getState = function(){
  return {
    asteroids_destroyed: this.destroyed,
    asteroids_info: this.asteroids,
    player_info: this.player
  }
}

AsteroidsGame.prototype.start = function(){
  this.destroyed = []
  this.asteroids = []
  this.player = new Player(this.screen)
  this.projectiles = []

  var self = this
  this.loopTimer = setInterval(
    function(){ self.gameLoop() },
    this.TIME_PER_FRAME
  )
  // setTimeout(function(){ self.stop() }, 5000) // @todo remove this
}

AsteroidsGame.prototype.stop = function(){
  // stops game and shows game menu overlay
  clearInterval(this.loopTimer)
}

AsteroidsGame.prototype.gameLoop = function(){
  this.time += this.TIME_PER_FRAME

  this.handleInput()
  this.simulatePhysics()

  // compute and resolve collisions
  // for (var i = 0; i < this.asteroids.length; i++)
  //   if (collides(this.player, this.asteroids[i]))
  //     console.log('collision with asteroid', this.asteroids[i])

  this.redraw()
}

AsteroidsGame.prototype.handleInput = function(){
  if (this.keyPressed['up']){
    this.player.speed = this.player.speed.add(
      new Vector(
        Math.cos(this.player.direction),
        Math.sin(this.player.direction)
      ).multiply(this.player.force)
    )

    if (this.player.speed.magnitude() > this.player.maxForce)
      this.player.speed = this.player.speed.normalized().multiply(this.player.maxForce)
  }
  if (this.player.position.x < 0 || this.player.position.x > 1)
    this.player.position.x = 1 - this.player.position.x
  if (this.player.position.y < 0 || this.player.position.y > 1)
    this.player.position.y = 1 - this.player.position.y

  if (this.keyPressed['left']){
    this.player.direction -= 10 / 180 * Math.PI
    this.player.rotate(-10 / 180 * Math.PI, this.screen)
  }
  if (this.keyPressed['right']){
    this.player.direction += 10 / 180 * Math.PI
    this.player.rotate(10 / 180 * Math.PI, this.screen)
  }

  if (this.keyPressed['fire'] && this.projectiles.length < 10){
    this.projectiles.push(new Projectile(
      this.player.position.add(this.player.surface[0]),
      -this.player.direction,
      this.screen
    ))
  }
}

AsteroidsGame.prototype.simulatePhysics = function(){
  offScreen = []
  for (var i = 0; i < this.asteroids.length; i++){
    move(this.asteroids[i], this.screen)
    if (!this.asteroids[i].onScreen())
      offScreen.push(i)
  }
  for (var i = 0; i < offScreen.length; i++)
    this.asteroids.splice(offScreen[i]-i, 1)

  this.score = computeScore(null, this.getState())
  // add new asteroids if needed
  for (var i = 0; i < (baseLog(5, this.score+1) - this.asteroids.length + 1); i++)
    this.asteroids.push(new Asteroid(baseLog(15, this.score+1) + 3, this.screen))

  move(this.player, this.screen)

  offScreen = []
  for (var i = 0; i < this.projectiles.length; i++){
    move(this.projectiles[i], this.screen)
    if (!this.projectiles[i].onScreen())
      offScreen.push(i)
  }
  for (var i = 0; i < offScreen.length; i++)
    this.projectiles.splice(offScreen[i]-i, 1)
}

AsteroidsGame.prototype.redraw = function(){
  // black background
  this.ctx.fillStyle = '#000'
  this.ctx.fillRect(0, 0, this.screen.width, this.screen.height)

  // asteroids
  for (var i = 0; i < this.asteroids.length; i++)
    draw(this.asteroids[i], this.ctx, this.PEN.ASTEROID)

  // player
  draw(this.player, this.ctx, this.PEN.PLAYER)

  // projectiles
  for (var i = 0; i < this.projectiles.length; i++)
    draw(this.projectiles[i], this.ctx, this.PEN.PROJECTILE)

  // explosions

}

function computeScore(cfg, gameState){
  try {
    return gameState.asteroids_destroyed * 50 // @todo remake this
  } catch (error){
    console.error(error)
    return -1
  }
}

// Asteroid class ------------------------------------------------------
function Asteroid(speed, screen){
  this.speed = speed
  this.direction = (
    20 + Math.random() * 50 + parseInt(Math.random() * 4) * 90
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
    var offset = this.surface[this.surface.length-1].magnitude()
    offset += (Math.random() - 0.5) * 0.1

    offset = Math.min(1, offset)
    offset = Math.max(0.4, offset)
    var d = start + (i / 180 * Math.PI)
    this.surface.push(new Vector(Math.cos(d), Math.sin(d)).multiply(offset))
  }
  var reach = this.reach
  this.surface = this.surface.map(function(v){
    return v.multiply(reach)
  })

  this.render = getRender(this, screen)
}

Asteroid.prototype.onScreen = function(){
  var checks = [
    function(p, r){ return p.x + r > 0 },
    function(p, r){ return p.x - r < 1 },
    function(p, r){ return p.y + r > 0 },
    function(p, r){ return p.y - r < 1 }
  ]

  for (var i = 0; i < checks.length; i++)
    if (!checks[i](this.position, this.reach))
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
function Player(screen){
  this.speed = new Vector(0, 0)
  this.maxForce = 0.01
  this.force = 0.001

  this.reach = 0.05
  this.direction = 0
  this.position = new Vector(0.5, 0.5)
  var reach = this.reach
  this.surface = [
    new Vector(0.35, 0), new Vector(-0.25, 0.25), new Vector(-0.25, -0.25)
  ].map(function(v){ return v.multiply(reach) })

  this.render = getRender(this, screen)
}

Player.prototype.rotate = function(degrees, screen){
  this.surface = this.surface.map(function(v){
    return new Vector(
      v.x * Math.cos(degrees) - v.y * Math.sin(degrees),
      v.x * Math.sin(degrees) + v.y * Math.cos(degrees)
    )
  })

  this.render = getRender(this, screen)
}

// Projectile class ----------------------------------------------------
function Projectile(position, direction, screen){
  this.position = position
  this.direction = direction
  this.speed = 4

  this.reach = 0.0015
  this.surface = []
  var angle
  for (var i = 0; i < 8; i++){
    angle = i / 8 * 2 * Math.PI
    this.surface.push(
      new Vector(Math.cos(angle), Math.sin(angle))
        .multiply(this.reach)
    )
  }

  this.render = getRender(this, screen)
}

Projectile.prototype.onScreen = function(){
  return (
    this.position.x > 0 && this.position.x < 1 &&
    this.position.y > 0 && this.position.y < 1
  )
}

// Utility functions ---------------------------------------------------
function getRender(object, screen){
  return {
    position: new Vector(
      object.position.x * screen.width,
      object.position.y * screen.height
    ),
    surface: object.surface.map(function(v){
      return v.multiply(screen.scale)
    })
  }
}

function draw(object, ctx, pen){
  points = object.render.surface.map(function(v){
    return v.add(object.render.position)
  })

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (var i = 1; i < points.length; i++){
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()

  if (pen.fill){
    ctx.fillStyle = pen.fill
    ctx.fill()
  }
  if (pen.stroke){
    ctx.strokeStyle = pen.stroke.color
    ctx.lineWidth = pen.stroke.width
    ctx.stroke()
  }
}

function move(object, screen){
  if (typeof(object.speed) == 'number')
    object.position = object.position.add(
      new Vector(
        Math.cos(object.direction),
        -Math.sin(object.direction)
      ).multiply(object.speed / screen.scale)
    )
  else
    object.position = object.position.add(object.speed)

  object.render.position = new Vector(
    object.position.x * screen.width,
    object.position.y * screen.height
  )
}

function collides(object, other){
  return object.position.distance(other.position) < Math.max(object.reach, other.reach)
}

function baseLog(x, y){
  return Math.log(y) / Math.log(x)
}

// Vector class --------------------------------------------------------
function Vector(x, y){
  this.x = x
  this.y = y
}

Vector.prototype.magnitude = function(){
  return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
}

Vector.prototype.normalized = function(){
  return this.multiply(1 / this.magnitude())
}

Vector.prototype.distance = function(other){
  return other.add(this.multiply(-1)).length()
}

Vector.prototype.add = function(other){
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