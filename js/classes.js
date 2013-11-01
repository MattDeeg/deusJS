var noop = function noop() {};

/*
  8888888888        888   d8b888            
  888               888   Y8P888            
  888               888      888            
  8888888   88888b. 888888888888888888  888 
  888       888 "88b888   888888   888  888 
  888       888  888888   888888   888  888 
  888       888  888Y88b. 888Y88b. Y88b 888 
  8888888888888  888 "Y888888 "Y888 "Y88888 
                                        888 
                                   Y8b d88P 
                                    "Y88P"  
*/
var ENTITY_ID_COUNTER = 0;
var Entity = function(capture, fortify, stealth, active, color) {
  this.id = ENTITY_ID_COUNTER++;
  this.capture = capture;
  this.fortify = fortify;
  this.stealth = stealth;
  this.active = active;
  this.color = color;
  this.speedAdjustment = 1;
};
Entity.prototype.equals = function(entity) {
  return this.id === entity.id;
};

var GAME_ENTITIES = {
  PC: new Entity(1, 1, 0, true, 0x0891D1),
  AI: new Entity(1, 1, 0, false, 0xE80C00),
  CRITICAL_NODES: 0
};

/*
  8888888b.         d8b        888    
  888   Y88b        Y8P        888    
  888    888                   888    
  888   d88P .d88b. 88888888b. 888888 
  8888888P" d88""88b888888 "88b888    
  888       888  888888888  888888    
  888       Y88..88P888888  888Y88b.  
  888        "Y88P" 888888  888 "Y888 
*/
PIXI.Point.prototype.getAngle = function getAngle(point) {
  var angle = Math.atan2(point.y - this.y, point.x - this.x);

  // cache
  return angle;
};

PIXI.Point.prototype.getDistance = function getDistance(point) {
  var distance = Math.sqrt(Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2));

  return distance;
};

PIXI.Point.prototype.getPointAtAngle = function getPointAtAngle(angle, distance) {
  return new PIXI.Point(
        this.x + Math.cos(angle) * distance,
        this.y + Math.sin(angle) * distance
      );
};

/*
  888b    888             888         .d8888b.                                         888                   
  8888b   888             888        d88P  Y88b                                        888                   
  88888b  888             888        888    888                                        888                   
  888Y88b 888 .d88b.  .d88888 .d88b. 888        .d88b. 88888b. 88888b.  .d88b.  .d8888b888888 .d88b. 888d888 
  888 Y88b888d88""88bd88" 888d8P  Y8b888       d88""88b888 "88b888 "88bd8P  Y8bd88P"   888   d88""88b888P"   
  888  Y88888888  888888  88888888888888    888888  888888  888888  88888888888888     888   888  888888     
  888   Y8888Y88..88PY88b 888Y8b.    Y88b  d88PY88..88P888  888888  888Y8b.    Y88b.   Y88b. Y88..88P888     
  888    Y888 "Y88P"  "Y88888 "Y8888  "Y8888P"  "Y88P" 888  888888  888 "Y8888  "Y8888P "Y888 "Y88P" 888     
*/

PIXI.NodeConnector = function(nodeLineWidth, point1, point2, isOneWay) {
  PIXI.Graphics.call(this);
  this.nodeLineWidth = nodeLineWidth;
  this.isOneWay = isOneWay;
  this.point1 = point1;
  this.point2 = point2;
  this.angle = point1.getAngle(point2);
  this.lineLength = point1.getDistance(point2);

  this.activeColor = null;
  this.activePercent = 0;
  this.isActive = false;
  this.callback = null;

  this.drawLine();
};

PIXI.NodeConnector.prototype = Object.create(PIXI.Graphics.prototype);
PIXI.NodeConnector.prototype.constructor = PIXI.NodeConnector;
PIXI.NodeConnector.prototype.NEUTRAL_COLOR = 0xF2F2F2;
PIXI.NodeConnector.prototype.ACTIVE_GROWTH_PERCENT = 0.01;

PIXI.NodeConnector.prototype.update = function update() {
  if (this.isActive) {
    this.activePercent = Math.min(1, this.activePercent + this.ACTIVE_GROWTH_PERCENT);
    this.isActive = this.activePercent < 1;
    this.drawLine();
    if (!this.isActive && this.callback) {
      this.callback();
    }
  }
};

PIXI.NodeConnector.prototype.setColor = function setColor(color) {
  this.lineStyle(this.nodeLineWidth, color);
};

PIXI.NodeConnector.prototype.setActive = function setActive(speed, color, callback) {
  this.activeColor = color;
  this.ACTIVE_GROWTH_PERCENT = speed;

  this.callback = callback;
  this.isActive = true;
};

PIXI.NodeConnector.prototype.moveToPoint = function moveToPoint(point) {
  this.moveTo(point.x, point.y);
};
PIXI.NodeConnector.prototype.lineToPoint = function lineToPoint(point) {
  this.lineTo(point.x, point.y);
};
PIXI.NodeConnector.prototype.reverse = function reverse() {
  var p = this.point1;
  this.point1 = this.point2;
  this.point2 = p;
  this.angle = this.angle + Math.PI;
};

PIXI.NodeConnector.prototype.drawLine = function drawLine() {
  this.clear();
  if (this.isOneWay) {
    this.drawDashedLine();
  }
  else {
    this.drawSolidLine();
  }
};

PIXI.NodeConnector.prototype.drawSolidLine = function drawSolidLine() {
  this.setColor(this.NEUTRAL_COLOR);
  this.moveToPoint(this.point1);
  this.lineToPoint(this.point2);

  if (this.activeColor) {
    var maxDistance = this.lineLength * (this.activePercent === undefined ? 1 : this.activePercent),
      p = this.point1.getPointAtAngle(this.angle, maxDistance);
    this.setColor(this.activeColor);
    this.moveToPoint(this.point1);
    this.lineToPoint(p);
  }
};

PIXI.NodeConnector.prototype._drawDashedLine = function _drawDashedLine(point1, point2, percent) {
  var funcs = [this.moveToPoint, this.lineToPoint],
    distances = [6, 4],
    onFunc = 0,
    d, p;

  var multiplier = distances[0] + distances[1];
  // distances[1] is subtracted at the end so as to not account for an unwanted blank space
  var maxDistance = Math.floor(this.lineLength / multiplier) * multiplier - distances[1];
  d = (this.lineLength - maxDistance) / 2;
  maxDistance = maxDistance * (percent === undefined ? 1 : percent);

  while (d < maxDistance) {
    p = point1.getPointAtAngle(this.angle, d);
    d += distances[onFunc];
    funcs[onFunc].call(this, p);
    onFunc = (onFunc + 1) % 2;
  }
  p = point1.getPointAtAngle(this.angle, maxDistance);
  funcs[onFunc].call(this, p);
};

PIXI.NodeConnector.prototype.drawDashedLine = function drawDashedLine() {
  this.setColor(this.NEUTRAL_COLOR);
  this._drawDashedLine(this.point1, this.point2);
  if (this.activeColor) {
    this.setColor(this.activeColor);
    this._drawDashedLine(this.point1, this.point2, this.activePercent);
  }
};

/*
  888b    888             888       8888888                         
  8888b   888             888         888                           
  88888b  888             888         888                           
  888Y88b 888 .d88b.  .d88888 .d88b.  888   .d8888b .d88b. 88888b.  
  888 Y88b888d88""88bd88" 888d8P  Y8b 888  d88P"   d88""88b888 "88b 
  888  Y88888888  888888  88888888888 888  888     888  888888  888 
  888   Y8888Y88..88PY88b 888Y8b.     888  Y88b.   Y88..88P888  888 
  888    Y888 "Y88P"  "Y88888 "Y88888888888 "Y8888P "Y88P" 888  888 
*/
PIXI.NodeIcon = function (texture, nodeSize) {
  PIXI.DisplayObjectContainer.call(this);

  var base = new PIXI.Graphics();
  base.beginFill(0x998F8D);
  base.lineStyle(5, 0xC3B7B3);
  var baseTop = 2;
  base.moveTo(nodeSize / 2, baseTop);
  base.lineTo(-nodeSize / 2, baseTop);
  base.lineTo(-nodeSize, baseTop + 10);
  base.lineTo(-nodeSize / 2, baseTop + 20);
  base.lineTo(nodeSize / 2, baseTop + 20);
  base.lineTo(nodeSize, baseTop + 10);
  base.lineTo(nodeSize / 2, baseTop);

  var icon = new PIXI.Sprite(texture, 0, 0);
  icon.anchor.x = 0.5;
  icon.anchor.y = 0.5;

  var badge = new PIXI.Graphics();
  badge.lineStyle(0);
  badge.beginFill(0x000000, 0.8);
  var badgeSize = 10;
  badge.drawCircle(nodeSize, 0, badgeSize);

  if (badge.children.length) {
    badge.removeChild(badge.children[0]);
  }

  if (this.parent) {
    var rankText = new PIXI.Text(this.parent.rank, {font: "12px Snippet", fill: "white", align: "center"});
    rankText.position.x = nodeSize - 2;
    rankText.position.y = -8;
    badge.addChild(rankText);
  }

  this.addChild(base);
  this.addChild(badge);
  this.addChild(icon);
};
PIXI.NodeIcon.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PIXI.NodeIcon.prototype.constructor = PIXI.NodeIcon;

PIXI.NodeIcon.update = function update() {
  
};

/*
  888b    888             888         
  8888b   888             888         
  88888b  888             888         
  888Y88b 888 .d88b.  .d88888 .d88b.  
  888 Y88b888d88""88bd88" 888d8P  Y8b 
  888  Y88888888  888888  88888888888 
  888   Y8888Y88..88PY88b 888Y8b.     
  888    Y888 "Y88P"  "Y88888 "Y8888  
*/

var NODE_ID_COUNTER = 0,
  NODE_MAP = [],
  MAP_LINES = [];
PIXI.Node = function (texture, x, y, nodeSize, rank, controlledByPC, controlledByAI) {
  PIXI.DisplayObjectContainer.call(this);
  this.id = NODE_ID_COUNTER++;
  this.position.x = x;
  this.position.y = y;
  this.nodeSize = nodeSize;
  this.fortified = false;
  this.activated = [!!controlledByPC, !!controlledByAI];
  this.controlled = [!!controlledByPC, !!controlledByAI];
  this.addChild(new PIXI.NodeIcon(texture, nodeSize));
  this.setRank(rank);
  
  var self = this;
  this.buttonMode = true;
  this.setInteractive(true);
  this.click = function(data){
    if (GAME_ENTITIES.PC.active) {
      self.activate(GAME_ENTITIES.PC);
      self.fortify(GAME_ENTITIES.PC);
    }
  };

  NODE_MAP[this.id] = this;
};

PIXI.Node.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PIXI.Node.prototype.constructor = PIXI.Node;
PIXI.Node.prototype.CONNECTION_ANGLE_VARIANCE = 0.1;

PIXI.Node.prototype.adjustRank = function adjustRank(adjustment) {
  this.setRank(this.rank + adjustment);
};
PIXI.Node.prototype.setRank = function setRank(newRank) {
  this.rank = Math.max(0, newRank);
  this.children[0].update();
};

PIXI.Node.prototype.update = function update() {
};

PIXI.Node.prototype.getAngle = function getAngle(node) {
  return this.position.getAngle(node.position);
};

PIXI.Node.prototype.getDistance = function getDistance(node) {
  return this.position.getDistance(node.position);
};

PIXI.Node.prototype.getPointAtAngle = function getPointAtAngle(angle, distance) {
  return this.position.getPointAtAngle(angle, distance || this.nodeSize);
};

PIXI.Node.prototype._addConnection = function _addConnection(node, variance, isOneWay) {
  var angle = this.getAngle(node),
    point1 = this.getPointAtAngle(angle - variance),
    point2 = node.getPointAtAngle(angle + Math.PI + variance),
    line = new PIXI.NodeConnector(3, point1, point2, isOneWay);

  MAP_LINES.push({
    'starting': this,
    'ending': node,
    'line': line
  });
};

PIXI.Node.prototype.addConnection = function addConnection(node, isOneWay) {
  this._addConnection(node, this.CONNECTION_ANGLE_VARIANCE, isOneWay);
  if (isOneWay) {
    this._addConnection(node, -this.CONNECTION_ANGLE_VARIANCE, isOneWay);
  }
  else {
    node._addConnection(this, this.CONNECTION_ANGLE_VARIANCE, isOneWay);
  }
};

var _doAIDetectionRoll = function _doAIDetectionRoll(targetNumber) {
  var aiRoll = _.random(1, 100);
  console.log(aiRoll, '<', targetNumber);
  if (aiRoll < targetNumber) {
    GAME_ENTITIES.AI.active = true;
    _.each(NODE_MAP, function (n) {
      if (n.controlled[GAME_ENTITIES.AI.id]) {
        var targetNodes = n.getTargetNodes();
        _.each(targetNodes, function(target) {
          target.activate(GAME_ENTITIES.AI);
        });
      }
    });
  }
};

var _doCaptureDetectionCheck = function _doCaptureDetectionCheck(node, activatingEntity) {
  if (!GAME_ENTITIES.AI.active && activatingEntity.equals(GAME_ENTITIES.PC) && node.rank > 0) {
    var detection = 50 + (20 * node.rank - 10 * activatingEntity.capture - 15 * activatingEntity.stealth);
    detection = Math.max(15, Math.min(100, detection));
    _doAIDetectionRoll(detection);
  }
};

var _doFortifyDetectionCheck = function _doFortifyDetectionCheck(node, activatingEntity) {
  if (!GAME_ENTITIES.AI.active && activatingEntity.equals(GAME_ENTITIES.PC) && node.rank > 0) {
    var detection = 50 + (20 * node.rank - 10 * activatingEntity.fortify - 15 * activatingEntity.stealth);
    detection = Math.max(15, Math.min(100, detection));
    _doAIDetectionRoll(detection);
  }
};

var _expandAIControl = function _expandAIControl(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.AI)) {
    _.each(node.getTargetNodes(), function(target) {
      target.activate(GAME_ENTITIES.AI);
    });
  }
};

PIXI.Node.getLineConnectedCallback = function getLineConnectedCallback(node, activatingEntity) {
  return function() {
    node.controlled[activatingEntity.id] = true;
    _doCaptureDetectionCheck(node, activatingEntity);
    _expandAIControl(node, activatingEntity);
    if (node._nodeSpecificCallback(node, activatingEntity)) {
       node._nodeSpecificCallback = noop;
    }
  };
};
PIXI.Node.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  return;
};

PIXI.Node.prototype.getTargetNodes = function getTargetNodes() {
  var foundTargets = [],
    id = this.id;

  _.each(MAP_LINES, function(mapLine) {
    if (mapLine.starting.id === id &&
        !foundTargets[mapLine.ending.id]) {
      foundTargets[mapLine.ending.id] = mapLine.ending;
    }
    else if (mapLine.ending.id === id &&
              !mapLine.line.isOneWay &&
              !foundTargets[mapLine.starting.id]) {
      foundTargets[mapLine.starting.id] = mapLine.starting;
    }
  });

  return _.filter(foundTargets, function(node) {
    return node != null;
  });
};

PIXI.Node.prototype.activate = function activate(activatingEntity) {
  var foundPairs = [],
    callback = PIXI.Node.getLineConnectedCallback(this, activatingEntity);
  // if it's already controlled or activated by the activating entity, bail off
  var speed = ((15 * activatingEntity.stealth + 10 * activatingEntity.capture) / (this.rank + 1)) / 300,
    id = this.id;
  if (this.controlled[activatingEntity.id] ||
        this.activated[activatingEntity.id]) {
    return;
  }

  var isActivated = false;
  _.each(MAP_LINES, function(mapLine) {
    var validline = false;
    if (!mapLine.line.activeColor) {
      if (mapLine.starting.id === id &&
            !mapLine.line.isOneWay &&
            mapLine.ending.controlled[activatingEntity.id] &&
            !foundPairs[mapLine.ending.id]) {
        validline = true;
        foundPairs[mapLine.ending.id] = 1;
      }
      else if (mapLine.ending.id === id &&
                mapLine.starting.controlled[activatingEntity.id] &&
                !foundPairs[mapLine.starting.id]) {
        validline = true;
        foundPairs[mapLine.starting.id] = 1;
      }
    }

    if (validline) {
      if (mapLine.starting.id === id) {
        mapLine.line.reverse();
      }
      mapLine.line.setActive(speed, activatingEntity.color, callback);
      isActivated = true;
    }
  });

  if (isActivated) {
    this.activated[activatingEntity.id] = true;
  }
};

PIXI.Node.prototype.fortify = function fortify(activatingEntity) {
  if (!this.fortified && this.controlled[activatingEntity.id]) {
    this.adjustRank(1);
    this.fortified = true;
    _doFortifyDetectionCheck(this, activatingEntity);
  }
};

/*
  888b    888             888    88888888888                              
  8888b   888             888        888                                  
  88888b  888             888        888                                  
  888Y88b 888 .d88b.  .d88888 .d88b. 888 888  88888888b.  .d88b. .d8888b  
  888 Y88b888d88""88bd88" 888d8P  Y8b888 888  888888 "88bd8P  Y8b88K      
  888  Y88888888  888888  88888888888888 888  888888  88888888888"Y8888b. 
  888   Y8888Y88..88PY88b 888Y8b.    888 Y88b 888888 d88PY8b.         X88 
  888    Y888 "Y88P"  "Y88888 "Y8888 888  "Y8888888888P"  "Y8888  88888P' 
                                              888888                      
                                         Y8b d88P888                      
                                          "Y88P" 888                      
*/
var NODE_SIZE = 20;
PIXI.StartNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.startNode, x, y, NODE_SIZE, rank, true, false);
};
PIXI.StartNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.StartNode.prototype.constructor = PIXI.Node;
PIXI.StartNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.AI)) {
    console.log('OH SNAP, game over.');
    GAME_ENTITIES.PC.active = false;
    return true;
  }
};

PIXI.BlankNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.blankNode, x, y, NODE_SIZE, rank, false, false);
};
PIXI.BlankNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.BlankNode.prototype.constructor = PIXI.Node;

PIXI.CriticalNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.criticalNode, x, y, NODE_SIZE, rank, false, false);
  GAME_ENTITIES.CRITICAL_NODES++;
};
PIXI.CriticalNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.CriticalNode.prototype.constructor = PIXI.Node;
PIXI.CriticalNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    GAME_ENTITIES.CRITICAL_NODES--;
    console.log('one down, ' + GAME_ENTITIES.CRITICAL_NODES + ' to go.');
    if (GAME_ENTITIES.CRITICAL_NODES === 0) {
      console.log('oh wait, you won!');
      GAME_ENTITIES.AI.active = false;
    }
    return true;
  }
};

PIXI.DataNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.dataNode, x, y, NODE_SIZE, rank, false, false);
};
PIXI.DataNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.DataNode.prototype.constructor = PIXI.Node;
PIXI.DataNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    console.log('dolla dolla bill ya\'ll.');
    return true;
  }
};

PIXI.SecurityNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.securityNode, x, y, NODE_SIZE, rank, false, true);
};
PIXI.SecurityNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.SecurityNode.prototype.constructor = PIXI.Node;
PIXI.SecurityNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    console.log('way to win big.');
    GAME_ENTITIES.AI.active = false;
    return true;
  }
};

PIXI.UtilityNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.utilityNode, x, y, NODE_SIZE, rank, false, false);
};
PIXI.UtilityNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.UtilityNode.prototype.constructor = PIXI.Node;
PIXI.UtilityNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    console.log('::waggles fingers::');
    return true;
  }
};

PIXI.ClearanceNode = function (x, y, rank) {
  PIXI.UtilityNode.call(this, x, y, rank);
};
PIXI.ClearanceNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.ClearanceNode.prototype.constructor = PIXI.Node;
PIXI.ClearanceNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    _.each(NODE_MAP, function(node) {
      if (node instanceof PIXI.DataNode) {
        node.adjustRank(-1);
      }
    });
    return true;
  }
};

PIXI.SoftenNode = function (x, y, rank) {
  PIXI.UtilityNode.call(this, x, y, rank);
};
PIXI.SoftenNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.SoftenNode.prototype.constructor = PIXI.Node;
PIXI.SoftenNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    _.each(this.getTargetNodes(), function(node) {
      node.adjustRank(-1);
    });
    return true;
  }
};

PIXI.TransferNode = function (x, y, rank) {
  PIXI.UtilityNode.call(this, x, y, rank);
};
PIXI.TransferNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.TransferNode.prototype.constructor = PIXI.Node;
PIXI.TransferNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    var max = NODE_MAP.length-1,
      soften, harden;

    do {
      soften = _.random(0, max);
    }
    while (NODE_MAP[soften] instanceof PIXI.StartNode ||
            NODE_MAP[soften] instanceof PIXI.SecurityNode);

    do {
      harden = _.random(0, max);
    }
    while (harden === soften ||
            NODE_MAP[harden] instanceof PIXI.StartNode ||
            NODE_MAP[harden] instanceof PIXI.SecurityNode);

    NODE_MAP[soften].adjustRank(-2);
    NODE_MAP[harden].adjustRank(2);
    return true;
  }
};

PIXI.SpamNode = function (x, y, rank) {
  PIXI.UtilityNode.call(this, x, y, rank);
};
PIXI.SpamNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.SpamNode.prototype.constructor = PIXI.Node;
PIXI.SpamNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(node, activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    console.log('::waggles fingers::');
    return true;
  }
};