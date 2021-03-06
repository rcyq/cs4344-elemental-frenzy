"use strict";

// ## Ladder Sprite
// Ladder sprite to enable players to climb
Q.Sprite.extend("Ladder", {
  init: function(p, defaultP) {
    this._super(p, { 
      sheet: 'ladder_wood',
      entityType: 'LADDER',
      type: Q.SPRITE_PASSIVE,
      collisionMask: Q.SPRITE_ACTIVE, // only collides with active players
      sensor: true
    });

    this.p.z = 1;

    this.add('2dLadder');
  }
});


// To be added to player/actor/ladder sprite
Q.component('2dLadder', {
  added: function(){  
    var entity = this.entity;
    Q._defaults(entity.p,{
      type: Q.SPRITE_PASSIVE,          
      collisionMask: Q.SPRITE_ACTIVE, // ladder only collides with player
      onLadder: false
    });
    entity.on('sensor',this,"sensorCollision");
  },
  
  sensorCollision: function(obj) {
    var entity = this.entity;
    if (obj.has('2dLadder')) {
      obj.climbLadder(entity);
    }
  },
  
  extend: {
    climbLadder: function(obj){
        if(obj.isA("Ladder")) { 
          this.p.onLadder = true;
        }
    }
  }
});

function shuffleArray(array) {
  if (typeof array === 'undefined') {
    console.log("Error in shuffleArray(): array is undefined");
    return;
  }
  if ( !(array.constructor === Array) ) {
    console.log("Error in shuffleArray(): array given is NOT an array");
    return;
  }
  var currentIndex = array.length, temporaryValue, randomIndex ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    
    //console.log("Shuffling index randomIndex " + randomIndex + " and currentIndex " + currentIndex);

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// To be added to stage
Q.component('ladderSystem',{
  added: function(){
    // Get random spawn position
    var tileLayer = this.entity._collisionLayers[0];
    var randomLadderPaths = tileLayer.getVerticalTileToTileEmptyPaths(3);
    randomLadderPaths = shuffleArray(randomLadderPaths);
    var MARGIN = 0.1 * tileLayer.p.w; // 10% away from the left/right gameworld edges


    var maxLadderCount = Math.floor(Math.max(tileLayer.p.rows, tileLayer.p.cols) / 8);
    var ladderCount = 0;
    var ladderW = tileLayer.p.tileW;
    var ladderH = tileLayer.p.tileH;

    for(var i in randomLadderPaths){
      if(ladderCount >= maxLadderCount){
        break;
      }

      var path = randomLadderPaths[i];
      if(path.x <= MARGIN || path.x >= (tileLayer.p.w - MARGIN)){
        // avoid spawning ladder at the corners of the game world
        continue;
      }

      // Insert one ladder (multiple ladder tiles)
      for(var p in path){
        var x = path[p].x;
        var y = path[p].y;

        //console.log("Insert ladder " + ladderCount + " at "+x+" "+y);
        
        // Creates ladder
        var ladder = new Q.Ladder({
            name: 'ladder_'+ladderCount,
            spriteId: getNextSpriteId(),
            x: x,
            y: y
          });

        // Insert the ladder
        this.entity.insert(ladder);
      }

      ladderCount++;
    }
  }
});