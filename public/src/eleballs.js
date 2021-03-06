"use strict";

// ## Eleball constants
var ELEBALL_DEFAULT_VX = 300;
var ELEBALL_DEFAULT_VY = 300;
var ELEBALL_DEFAULT_DMG = 5;
// Element indices (0: fire, 1: earth, 2: lightning, 3: water, 0 > 1 > 2 > 3 > 0)
var ELEBALL_ELEMENT_FIRE = 0;
var ELEBALL_ELEMENT_EARTH = 1;
var ELEBALL_ELEMENT_LIGHTNING = 2;
var ELEBALL_ELEMENT_WATER = 3;
var ELEBALL_NUM_ELEMENTS = 4;
var ELEBALL_ELEMENTNAMES = ["element_fire", "element_earth", "element_lightning", "element_water"];
// TODO Change the sound files once they are ready
var ELEBALL_ELEMENTSOUNDS = ["fireBall.ogg", "earthBall.ogg", "lightningBall.ogg", "waterBall.ogg"];
var ELEBALL_DEFAULT_ELEMENT = 0; // fire
var ELEBALL_FRAME = 0; // always take the first frame
var ELEBALL_BOUNDINGBOX_SF = 0.5;
// ## Animation
var ELEBALL_ANIMATION = "eleball";
var ELEBALL_FIRE_ANIMATION_TIME = 0.5;

var ELEBALL_PLAYER_SF = 0.5;
var ELEBALL_ENEMY_SF = 0.5;

var TIME_TO_SELFDESTRUCT = 10000;

// Load element sounds
for (var i = 0; i < ELEBALL_ELEMENTSOUNDS.length; i++) {
  Q.load(ELEBALL_ELEMENTSOUNDS[i]);
}

// ## Own Eleball Sprite
Q.Sprite.extend("Eleball", {
  
  init: function(p, defaultP) {
    // merge p and defaultP, where attributes in p will override those in defaultP
    p = Q._defaults(p, defaultP);
    
    // console.log("Inside ELEBALL init: properties p passed in:");
    // console.log(getJSON(p));
    // console.log("defaultP:");
    // console.log(getJSON(defaultP));
    
    this._super(p, {
      entityType: 'ELEBALL',
      element : ELEBALL_DEFAULT_ELEMENT,
      sheet : ELEBALL_ELEMENTNAMES[ELEBALL_DEFAULT_ELEMENT],
      sprite : ELEBALL_ANIMATION,
      frame : 0,
      soundIsAnnoying : false,
      vx : 0,
      vy : 0,
      scale : 0.9,
      x : 0,
      y : 0,
      dmg : ELEBALL_DEFAULT_DMG,
      collided : false, // to check if has collided already
      type: Q.SPRITE_PARTICLE, // Eleballs are particles
      collisionMask: Q.SPRITE_ALL 
                      ^ Q.SPRITE_POWERUP 
                      ^ Q.SPRITE_PASSIVE // Eleballs collide with anything except powerups and passive things like ladders
    });  
    
    /*
    var tileLayer = Q.stage(STAGE_LEVEL)._collisionLayers[0];
    console.log("width: " + tileLayer.p.w + " height: " + tileLayer.p.h);
    for (var r = 0; r < tileLayer.p.rows; r++) {
      for (var c = 0; c < tileLayer.p.cols; c++) {
        console.log(r + "," + c + " tileprops: " + getJSON(tileLayer.getTile(c, r)));
      }
    }
    */

    // Set bounding box smaller
    this.p.points = makeScaledPoints(this.p.w, this.p.h, ELEBALL_BOUNDINGBOX_SF);

    this.add("2dEleball, animation, localPerceptionFilter");
    
    this.play("fire");

    this.on("onHit");
    
    // Destroy itself after 10 seconds
    var that = this;
    this.selfDestruct = setTimeout(function() {
      if (that && !that.isDestroyed) {
        removeSprite(that.p.entityType, that.p.spriteId);
      }
    }, TIME_TO_SELFDESTRUCT);
    
    // Play fire sound when eleball is launched
    if ( !this.p.soundIsAnnoying) {
      Q.audio.play(ELEBALL_ELEMENTSOUNDS[this.p.element]);
    }
  },

  onHit: function(collision) {
    //console.log("ELEBALL onHit method called");
  },
  
  step: function(dt) {
  }
});

// ## Player Eleball Sprite
Q.Eleball.extend("PlayerEleball", {
  
  init: function(p, defaultP) {
  
    p = Q._defaults(p, defaultP);
    
    this._super(p, {
      entityType: 'PLAYERELEBALL',
      shooterEntityType: 'PLAYER',
      shooterEntityId: -1
    });
  },
  
  // Player eleballs only damage enemies
  onHit: function(collision) {
    if (this.p.collided) {
      // Already collided, this is just an extraneous collision due to trigger
      return;
    }
    if (this.p.isServerSide // Damage simulation only happens on server side
      && (collision.obj.isA("Enemy") ||
      (collision.obj.isA("Player") && collision.obj.p.spriteId != this.p.shooterId) ||
      collision.obj.isA("Actor")) ) {
        collision.obj.takeDamage({dmg: this.p.dmg, shooterEntityType: this.p.shooterEntityType, shooterSpriteId: this.p.shooterId});
        this.p.collided = true;
    }
    this._super(collision);
  }
});

// ## Enemy Eleball Sprite
Q.Eleball.extend("EnemyEleball", {
  
  init: function(p, defaultP) {
  
    p = Q._defaults(p, defaultP);
    
    this._super(p, {
      entityType: 'ENEMYELEBALL',
      shooterEntityType: 'ENEMY',
      shooterEntityId: -1,
      dmg : ENEMY_ELEBALL_DEFAULT_DMG
    });  
  },
  
  // Enemy eleballs only damage players
  onHit: function(collision) {
    if (this.p.collided) {
      // Already collided, this is just an extraneous collision due to trigger
      return;
    }
    // Damage simulation happens on server only
    if (this.p.isServerSide && collision.obj.isA("Player") || collision.obj.isA("Actor")) {
      collision.obj.takeDamage({dmg:this.p.dmg, shooterEntityType: this.p.shooterEntityType, shooterSpriteId: this.p.shooterId});
      this.p.collided = true;
    }
    this._super(collision);
  }
});

Q.animations(ELEBALL_ANIMATION, {
  fire: { frames: [0,1,2,3,4,5], rate: ELEBALL_FIRE_ANIMATION_TIME/6}
});