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
  var self = this

  this.rootElement.style.background = '#000'
  this.rootElement.style.resize = 'both'
  this.rootElement.style.overflow = 'hidden'
  // @todo rootElement resizing (interval check for width and height)

  this.canvas = document.createElement('canvas')
  this.canvas.setAttribute('tabindex', '1')
  this.rootElement.appendChild(this.canvas)
  this.ctx = this.canvas.getContext('2d')

  this.style = document.createElement('style')
  this.style.innerHTML = (
    '\
    .label {\
      position: absolute;\
      display: inline-block;\
      top: 0;\
      color: #fff;\
      font-size: 1.5em;\
      font-variant: small-caps;\
      padding: 0.5em;\
    }\
    .initialUI {\
      display: block;\
      margin: 0 auto;\
      padding: 0.3em;\
      width: 10em;\
      background: #000;\
      color: #fff;\
      font-size: 1.3em;\
      border: 1px solid #fff;\
      box-sizing: content-box;\
      text-align: left;\
      font-variant: small-caps;\
      transition: all 0.5s;\
    }\
    button.initialUI:hover {\
      background: #fff;\
      color: #000;\
      transition: all 1s;\
    }\
    '
  )
  this.rootElement.appendChild(this.style)

  this.labels = {
    score: document.createElement('div'),
    lives: document.createElement('div')
  }

  this.labels.score.classList.add('label')
  this.labels.score.style.left = '0'
  this.rootElement.appendChild(this.labels.score)

  this.labels.lives.classList.add('label')
  this.labels.lives.style.right = '0'
  this.rootElement.appendChild(this.labels.lives)

  this.form = document.createElement('div')
  this.form.style.position = 'absolute'
  this.form.style.bottom = '50%'
  this.form.style.width = '100%'
  this.rootElement.appendChild(this.form)

  this.captionL = document.createElement('div')
  this.captionL.innerHTML = 'Asteroids'
  this.captionL.classList.add('initialUI')
  this.captionL.style.border = 'none'
  this.form.appendChild(this.captionL)

  this.uidI = document.createElement('input')
  this.uidI.setAttribute('type', 'text')
  this.uidI.setAttribute('placeholder', 'nickname (required)')
  this.uidI.setAttribute('id', 'asteroidsNickname')
  this.uidI.classList.add('initialUI')
  this.uidI.style.borderRadius = '0.3em 0.3em 0em 0em'
  this.form.appendChild(this.uidI)

  this.submitI = document.createElement('button')
  this.submitI.setAttribute('type', 'button')
  this.submitI.innerHTML = 'play'
  this.submitI.classList.add('initialUI')
  this.submitI.style.borderTop = 'none'
  this.submitI.style.borderRadius = '0em 0em 0.3em 0.3em'
  this.submitI.addEventListener('click', function(event){
    self.uid = sanitize(self.uidI.value)
    if (self.uid.length > 0){
      self.adjustSize()
      self.start()
    }
  })
  this.form.appendChild(this.submitI)

  this.keyPressed = { 'up' : false, 'left': false, 'right': false, 'fire': false }
  var keyMappings = {
    38: 'up', 87: 'up',
    37: 'left', 65: 'left',
    39: 'right', 68: 'right',
    32: 'fire', 13: 'fire'
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

  this.TIME_PER_FRAME = 1000 / 30 // 30 fps
  this.PEN = {
    ASTEROID: {
      fill: '#000',
      stroke: {
        color: '#fff',
        width: 1
      }
    },
    IMMORTAL: {
      fill: '#000',
      stroke: {
        color: '#777',
        width: 3
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
}

AsteroidsGame.prototype = Object.create(Game.prototype)
AsteroidsGame.prototype.constructor = Game

AsteroidsGame.prototype.resize = function(){
  this.adjustSize()
  // @todo rerender everything
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
  this.uid = gameState.user_id
  this.destroyed = gameState.asteroids_destroyed
  this.asteroids = gameState.asteroids_info
  this.player = gameState.player_info
}

AsteroidsGame.prototype.getState = function(){
  return {
    user_id: this.uid,
    asteroids_destroyed: this.destroyed,
    asteroids_info: this.asteroids,
    player_info: this.player
  }
}

AsteroidsGame.prototype.start = function(){
  this.destroyed = []
  this.score = 0

  this.asteroids = []
  this.player = new Player(this.screen)
  this.projectiles = []
  this.explosions = []

  var self = this
  this.loopTimer = setInterval(
    function(){ self.gameLoop() },
    this.TIME_PER_FRAME
  )

  this.form.style.display = 'none'
}

AsteroidsGame.prototype.stop = function(){
  clearInterval(this.loopTimer)
  this.form.style.display = 'block'
}

AsteroidsGame.prototype.gameLoop = function(){
  if (this.player.lives == 2) {
    this.stop()
    var self = this
    setTimeout(function(){
      self.ctx.fillStyle = '#000'
      self.ctx.fillRect(0, 0, self.screen.width, self.screen.height)
      // @todo send score to server
    }, 10)
  }

  this.handleInput()
  this.simulatePhysics()
  this.resolveCollisions()
  this.redraw()
  this.updateUI()
  this.score = computeScore(null, this.getState())
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
  var offScreen = []
  for (var i = 0; i < this.asteroids.length; i++){
    move(this.asteroids[i], this.screen)
    if (!this.asteroids[i].onScreen())
      offScreen.push(i)
  }
  for (var i = 0; i < offScreen.length; i++)
    this.asteroids.splice(offScreen[i]-i, 1)

  for (var i = 0; i < (baseLog(10, this.score+1) - this.asteroids.length + 1); i++)
    this.asteroids.push(new Asteroid(baseLog(40, this.score+1) + 2, this.screen))

  move(this.player, this.screen)

  offScreen = []
  for (var i = 0; i < this.projectiles.length; i++){
    move(this.projectiles[i], this.screen)
    if (!this.projectiles[i].onScreen())
      offScreen.push(i)
  }
  for (var i = 0; i < offScreen.length; i++)
    this.projectiles.splice(offScreen[i]-i, 1)

  offScreen = []
  for (var i = 0; i < this.explosions.length; i++){
    this.explosions[i].move(this.screen)
    if (this.explosions[i].expired())
      offScreen.push(i)
  }
  for (var i = 0; i < offScreen.length; i++)
    this.explosions.splice(offScreen[i]-i, 1)
}

AsteroidsGame.prototype.resolveCollisions = function(){
  var collisions = [], asteroidsHit = []
  for (var p = 0; p < this.projectiles.length; p++)
    for (var a = 0; a < this.asteroids.length; a++){
      if (asteroidsHit.indexOf(a) != -1)
        continue
      if (collides(this.projectiles[p], this.asteroids[a], this.screen)){
        collisions.push([p, a])
        asteroidsHit.push(a)
        break
      }
    }
  var p, a, pi, ai, particles, speed
  for (var i = 0; i < collisions.length; i++){
    pi = collisions[i][0]; ai = collisions[i][1]
    p = this.projectiles[pi]; a = this.asteroids[ai]

    particles = []
    for (var j = 0; j < a.surface.length; j += 18)
      particles.push(a.surface[j].add(a.position))
    speed = new Vector().fromAngle(p.direction).multiply(p.speed)
      .normalized()
    speed.y *= -1
    this.explosions.push(new Explosion(speed, particles))
  }
  for (var i = 0; i < collisions.length; i++){
    this.projectiles.splice(collisions[i][0]-i, 1)
    this.asteroids.splice(collisions[i][1]-i, 1)
    this.destroyed++
  }

  var player = this.player
  if (!player.immortal)
    for (var i = 0; i < this.asteroids.length; i++)
      if (collides(player, this.asteroids[i], this.screen)){

        player.lives -= 1
        player.immortal = true
        setTimeout(function() { player.immortal = false }, 3000)
      }
}

AsteroidsGame.prototype.redraw = function(){
  // black background
  this.ctx.fillStyle = '#000'
  this.ctx.fillRect(0, 0, this.screen.width, this.screen.height)

  // asteroids
  for (var i = 0; i < this.asteroids.length; i++)
    draw(this.asteroids[i], this.ctx, this.PEN.ASTEROID)

  // player
  draw(
    this.player, this.ctx,
    this.player.immortal ? this.PEN.IMMORTAL : this.PEN.PLAYER
  )

  // projectiles
  for (var i = 0; i < this.projectiles.length; i++)
    draw(this.projectiles[i], this.ctx, this.PEN.PROJECTILE)

  // explosions
  for (var i = 0; i < this.explosions.length; i++)
    this.explosions[i].draw(this.screen, this.ctx)
}

AsteroidsGame.prototype.updateUI = function(){
  this.labels.score.innerHTML = 'score: ' + this.score
  this.labels.lives.innerHTML = 'lives: ' + this.player.lives
}

function computeScore(cfg, gameState){
  try {
    return gameState.asteroids_destroyed * 50
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
  var surface = []
  for (var i = 0; i < this.surface; i += 5)
    surface.push(this.surface[i])

  return new Explosion(
    this.speed.add(projectile.speed),
    surface
  )
}

// Player class --------------------------------------------------------
function Player(screen){
  this.immortal = false
  this.lives = 3

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
  this.speed = 6

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

// Explosion class -----------------------------------------------------
function Explosion(speed, particles){
  this.particles = particles.map(function(position){
    return [
      position, 40 + Math.random() * 20,
      speed.add(speed.normalized().multiply(Math.random() * speed.magnitude() / 5))
    ]
  })
}

Explosion.prototype.move = function(screen){
  var expired = [], p
  for (var i = 0; i < this.particles.length; i++){
    p = this.particles[i]
    p[0] = p[0].add(p[2].multiply(1 / screen.scale))
    p[1] -= 1
    p[2].multiply(0.5)

    if (p[1] <= 0)
      expired.push(i)
  }
  for (var i = 0; i < expired.length; i++)
    this.particles.splice(expired[i]-i, 1)
}

Explosion.prototype.expired = function(){
  return this.particles.length == 0
}

Explosion.prototype.draw = function(screen, ctx){
  var p, position, color, size
  for (var i = 0; i < this.particles.length; i++){
    p = this.particles[i]
    position = new Vector(p[0].x * screen.width, p[0].y * screen.height)
    color = parseInt(256 * p[1] / 60)
    size = 0.01 * p[1] / 60 * screen.scale

    ctx.fillStyle = 'rgb(255,' + color + ', 0)'
    ctx.fillRect(position.x - size / 2, position.y - size / 2, size, size)
  }
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

function collides(object, other, screen){
  return (object.render.position.distance(other.render.position) <
    Math.max(object.reach, other.reach) * screen.scale
  )
}

function draw(object, ctx, pen){
  var points = object.render.surface.map(function(v){
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

function baseLog(x, y){
  return Math.log(y) / Math.log(x)
}

function sanitize(raw){
  var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';
  var tagOrComment = new RegExp(
      '<(?:'
      // Comment body.
      + '!--(?:(?:-*[^->])*--+|-?)'
      // Special "raw text" elements whose content should be elided.
      + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
      + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
      // Regular name
      + '|/?[a-z]'
      + tagBody
      + ')>',
      'gi');

  var temp;
  do {
    temp = raw;
    raw = raw.replace(tagOrComment, '');
  } while (raw !== temp);

  return raw.replace(/</g, '&lt;');
  // credits go to http://stackoverflow.com/questions/295566/sanitize-rewrite-html-on-the-client-side
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
  return other.add(this.multiply(-1)).magnitude()
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

Vector.prototype.fromAngle = function(angle){
  return new Vector(Math.cos(angle), Math.sin(angle))
}

// Execution -----------------------------------------------------------
g = new AsteroidsGame()
g.show()