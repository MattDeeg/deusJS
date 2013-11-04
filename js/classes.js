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

  this.activatingEntity = null;
  this.activePercent = 0;
  this.isActive = false;
  this.callback = null;

  this.drawLine();
  Log.trace('New NodeConnector created', this);
};

PIXI.NodeConnector.prototype = Object.create(PIXI.Graphics.prototype);
PIXI.NodeConnector.prototype.constructor = PIXI.NodeConnector;
PIXI.NodeConnector.prototype.NEUTRAL_COLOR = 0xF2F2F2;
PIXI.NodeConnector.prototype.ACTIVE_GROWTH_PERCENT = 0.01;

PIXI.NodeConnector.prototype.update = function update() {
  if (this.isActive) {
    this.activePercent = Math.min(1, this.activePercent + (this.ACTIVE_GROWTH_PERCENT * this.activatingEntity.speedAdjustment));
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

PIXI.NodeConnector.prototype.setActive = function setActive(activatingEntity, callback) {
  this.activatingEntity = activatingEntity;

  this.callback = callback;
  this.isActive = true;
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

  if (this.activatingEntity) {
    var maxDistance = this.lineLength * (this.activePercent === undefined ? 1 : this.activePercent),
      p = this.point1.getPointAtAngle(this.angle, maxDistance);
    this.setColor(this.activatingEntity.color);
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
  if (this.activatingEntity) {
    this.setColor(this.activatingEntity.color);
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
  this.nodeSize = nodeSize;

  this.drawBase();
  this.drawBadge();

  var icon = new PIXI.Sprite(texture, 0, 0);
  icon.anchor.x = 0.5;
  icon.anchor.y = 0.5;

  this.addChild(this.base);
  this.addChild(this.badge);
  this.addChild(icon);
};
PIXI.NodeIcon.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PIXI.NodeIcon.prototype.constructor = PIXI.NodeIcon;

PIXI.NodeIcon.prototype.drawBase = function() {
  var baseTop = 2;
  this.base = this.base || new PIXI.Graphics();

  this.base.clear();
  this.base.beginFill(0x998F8D);
  this.base.lineStyle(5, 0xC3B7B3);
  this.base.moveTo(this.nodeSize / 2, baseTop);
  this.base.lineTo(-this.nodeSize / 2, baseTop);
  this.base.lineTo(-this.nodeSize, baseTop + 10);
  this.base.lineTo(-this.nodeSize / 2, baseTop + 20);
  this.base.lineTo(this.nodeSize / 2, baseTop + 20);
  this.base.lineTo(this.nodeSize, baseTop + 10);
  this.base.lineTo(this.nodeSize / 2, baseTop);
  this.base.endFill();
};
PIXI.NodeIcon.prototype.drawBadge = function() {
  this.badge = this.badge || new PIXI.Graphics();

  this.badge.clear();
  this.badge.lineStyle(0);
  this.badge.beginFill(0xFF0000, 0.8);
  var badgeSize = 10;
  this.badge.drawCircle(this.nodeSize, 0, badgeSize);
  this.badge.endFill();

  if (this.badge.children.length) {
    this.badge.removeChild(this.badge.children[0]);
  }

  var rankText = this.parent ? this.parent.rank : '';

  var badgeText = new PIXI.Text(rankText, {font: "12px Snippet", fill: "white", align: "center"});
  badgeText.position.x = this.nodeSize - 2;
  badgeText.position.y = -8;
  this.badge.addChild(badgeText);
};

PIXI.NodeIcon.prototype.update = function update() {
  this.drawBadge();
};

/*
	888b    888             888         .d88888b.                        888
	8888b   888             888        d88P" "Y88b                       888
	88888b  888             888        888     888                       888
	888Y88b 888 .d88b.  .d88888 .d88b. 888     888888  888 .d88b. 888d888888 8888b. 888  888
	888 Y88b888d88""88bd88" 888d8P  Y8b888     888888  888d8P  Y8b888P"  888    "88b888  888
	888  Y88888888  888888  88888888888888     888Y88  88P88888888888    888.d888888888  888
	888   Y8888Y88..88PY88b 888Y8b.    Y88b. .d88P Y8bd8P Y8b.    888    888888  888Y88b 888
	888    Y888 "Y88P"  "Y88888 "Y8888  "Y88888P"   Y88P   "Y8888 888    888"Y888888 "Y88888
	                                                                                     888
	                                                                                Y8b d88P
	                                                                                 "Y88P"
*/
PIXI.NodeOverlay = function() {
  PIXI.DisplayObjectContainer.call(this);
  this.drawBackground();
	this.addChild(this.border);

  var capture = this.drawButton(0, -25);
  var nuke = this.drawButton(-37, 0);
  var fortify = this.drawButton(37, 0);
  var iunno = this.drawButton(0, 25);

  capture.click = _.bind(function() {
    this.parent.activate(GAME_ENTITIES.PC);
		this.visible = false;
  }, this);
  nuke.click = _.bind(function () {
		this.visible = false;
  }, this);
  fortify.click = _.bind(function() {
		this.visible = false;
  }, this);
  iunno.click = _.bind(function() {
		this.visible = false;
  }, this);

	this.visible = false;
	this.interactive = true;

	this.mouseout = _.bind(function() {
		this.visible = false;
	}, this)sho;
};
PIXI.NodeOverlay.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PIXI.NodeOverlay.prototype.constructor = PIXI.NodeOverlay;

PIXI.NodeOverlay.prototype.drawBackground = function() {
	var border = this.border || new PIXI.Graphics();

	var pointArray = [
		new PIXI.Point(12, -50),
		new PIXI.Point(32, -25),
		new PIXI.Point(50, -25),
		new PIXI.Point(70, 0),
		new PIXI.Point(50, 25),
		new PIXI.Point(32, 25),
		new PIXI.Point(12, 50),
		new PIXI.Point(-12, 50),
		new PIXI.Point(-32, 25),
		new PIXI.Point(-50, 25),
		new PIXI.Point(-70, 0),
		new PIXI.Point(-50, -25),
		new PIXI.Point(-32, -25),
		new PIXI.Point(-12, -50)
	];

	border.clear();
	border.lineStyle(3, 0XB17E3A);
	border.beginFill(0X935F26, 0.6);
	border.moveToPoint(pointArray[pointArray.length - 1]);
	_.each(pointArray, function(point) {
		border.lineToPoint(point);
	});
	border.endFill();
	border.hitArea = new PIXI.Polygon(pointArray);

	this.border = border;
};

PIXI.NodeOverlay.prototype.drawButton = function (x, y) {
	var button = new PIXI.Graphics();

	var pointArray = [
		new PIXI.Point(x + 8, y - 20),
		new PIXI.Point(x + 25, y),
		new PIXI.Point(x + 8, y + 20),
		new PIXI.Point(x - 8, y + 20),
		new PIXI.Point(x - 25, y),
		new PIXI.Point(x - 8, y - 20)
	];

	button.lineStyle(3, 0XB17E3A);
	button.beginFill(0XB17E3A, 0.8);
	button.moveToPoint(pointArray[pointArray.length - 1]);
	_.each(pointArray, function(point) {
		button.lineToPoint(point);
	});
	button.endFill();
	button.hitArea = new PIXI.Polygon(pointArray);
	button.buttonMode = true;
	button.interactive = true;

	this.addChild(button);
	return button;
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

  this.icon = new PIXI.NodeIcon(texture, nodeSize)
  this.overlay = new PIXI.NodeOverlay();
  this.addChild(this.icon);
  this.addChild(this.overlay);

  this.setRank(rank);

  this.buttonMode = true;
  this.interactive = true;
  this.click = _.bind(function(data){
    var which = data.originalEvent.which;
    if (which === 1) { // left click
      if (GAME_ENTITIES.PC.active) {
      	this.overlay.visible = true;
        // this.activate(GAME_ENTITIES.PC);
        // this.fortify(GAME_ENTITIES.PC);
      }
    }
    else if (which === 3) { // right click
      Log.debug(this);
    }
    return false;
  }, this);

  NODE_MAP[this.id] = this;
  Log.trace('New Node created', this);
};

PIXI.Node.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
PIXI.Node.prototype.constructor = PIXI.Node;
PIXI.Node.prototype.CONNECTION_ANGLE_VARIANCE = 0.1;

PIXI.Node.prototype.adjustRank = function adjustRank(adjustment) {
  this.setRank(this.rank + adjustment);
};
PIXI.Node.prototype.setRank = function setRank(newRank) {
  this.rank = Math.max(0, newRank);
  this.icon.update();
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

// var speed = ((15 * activatingEntity.stealth + 10 * activatingEntity.capture) / (this.rank + 1)) / 300,
PIXI.Node.prototype.getLineConnectedCallback = function getLineConnectedCallback(activatingEntity) {
  var node = this;
  return function() {
    node.controlled[activatingEntity.id] = true;
    _doCaptureDetectionCheck(node, activatingEntity);
    _expandAIControl(node, activatingEntity);
    if (node._nodeSpecificCallback(activatingEntity)) {
       node._nodeSpecificCallback = noop;
    }
  };
};
PIXI.Node.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
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
    callback = this.getLineConnectedCallback(activatingEntity);
  // if it's already controlled or activated by the activating entity, bail off
  var id = this.id;
  if (this.controlled[activatingEntity.id] ||
        this.activated[activatingEntity.id]) {
    return;
  }

  var isActivated = false;
  _.each(MAP_LINES, function(mapLine) {
    var validline = false;
    if (!mapLine.line.activatingEntity) {
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
      mapLine.line.setActive(activatingEntity, callback);
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
PIXI.StartNode.prototype.constructor = PIXI.StartNode;
PIXI.StartNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.AI)) {
    Log.info('Game Over: You lose');
    GAME_ENTITIES.PC.active = false;
    return true;
  }
};

PIXI.BlankNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.blankNode, x, y, NODE_SIZE, rank, false, false);
};
PIXI.BlankNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.BlankNode.prototype.constructor = PIXI.BlankNode;

PIXI.CriticalNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.criticalNode, x, y, NODE_SIZE, rank, false, false);
  GAME_ENTITIES.CRITICAL_NODES++;
};
PIXI.CriticalNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.CriticalNode.prototype.constructor = PIXI.CriticalNode;
PIXI.CriticalNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    GAME_ENTITIES.CRITICAL_NODES--;
    Log.info('One down, ' + GAME_ENTITIES.CRITICAL_NODES + ' to go.');
    if (GAME_ENTITIES.CRITICAL_NODES === 0) {
      Log.info('Game Over: You win!');
      GAME_ENTITIES.AI.active = false;
    }
    return true;
  }
};

PIXI.DataNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.dataNode, x, y, NODE_SIZE, rank, false, false);
};
PIXI.DataNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.DataNode.prototype.constructor = PIXI.DataNode;
PIXI.DataNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    Log.info('Data node captured: @TODO add stuff to bag');
    return true;
  }
};

PIXI.SecurityNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.securityNode, x, y, NODE_SIZE, rank, false, true);
};
PIXI.SecurityNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.SecurityNode.prototype.constructor = PIXI.SecurityNode;
PIXI.SecurityNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    GAME_ENTITIES.AI.active = false;
    Log.info('Game Over: You win!');
    _.each(NODE_MAP, function (node) {
      if (node instanceof PIXI.DataNode) {
        // fake capturing any data node
        node._nodeSpecificCallback(activatingEntity);
      }
    });
    return true;
  }
};

PIXI.UtilityNode = function (x, y, rank) {
  PIXI.Node.call(this, textures.utilityNode, x, y, NODE_SIZE, rank, false, false);
};
PIXI.UtilityNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.UtilityNode.prototype.constructor = PIXI.UtilityNode;
PIXI.UtilityNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  Log.error('UtilityNode should not be used directly, just as a base class for another node type');
};

PIXI.ClearanceNode = function (x, y, rank) {
  PIXI.UtilityNode.call(this, x, y, rank);
};
PIXI.ClearanceNode.prototype = Object.create(PIXI.Node.prototype);
PIXI.ClearanceNode.prototype.constructor = PIXI.ClearanceNode;
PIXI.ClearanceNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    _.each(NODE_MAP, function(node) {
      if (node instanceof PIXI.DataNode) {
        Log.debug('Reducing rank on node ' + node.id, node);
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
PIXI.SoftenNode.prototype.constructor = PIXI.SoftenNodeI;
PIXI.SoftenNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    _.each(this.getTargetNodes(), function(node) {
      Log.debug('Reducing rank on ' + node.id, node);
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
PIXI.TransferNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    var validNodes = _.filter(NODE_MAP, function(node) {
      return !(node instanceof PIXI.StartNode ||
                node instanceof PIXI.SecurityNode ||
                node.id === this.id);
    }, this);
    var max = validNodes.length-1,
      soften = _.random(0, max),
      harden;

    do {
      harden = _.random(0, max);
    }
    while (harden === soften);

    Log.debug('Reducing rank on node ' + soften, NODE_MAP[soften]);
    Log.debug('Increasing rank on node ' + harden, NODE_MAP[harden]);

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
PIXI.SpamNode.prototype._nodeSpecificCallback = function _nodeSpecificCallback(activatingEntity) {
  if (activatingEntity.equals(GAME_ENTITIES.PC)) {
    GAME_ENTITIES.AI.speedAdjustment = 0.5;
    Log.debug('Reducing AI speed to ' + GAME_ENTITIES.AI.speedAdjustment);
    setTimeout(function() {
      GAME_ENTITIES.AI.speedAdjustment = 1;
      Log.debug('Restoring AI speed to ' + GAME_ENTITIES.AI.speedAdjustment);
    }, 5000);
    return true;
  }
};

/*
  888     888888   d8b888d8b888
  888     888888   Y8P888Y8P888
  888     888888      888   888
  888     888888888888888888888888888  888
  888     888888   888888888888   888  888
  888     888888   888888888888   888  888
  Y88b. .d88PY88b. 888888888Y88b. Y88b 888
   "Y88888P"  "Y888888888888 "Y888 "Y88888
                                       888
                                  Y8b d88P
                                   "Y88P"
*/
var _doAIDetectionRoll = function _doAIDetectionRoll(targetNumber) {
  var aiRoll = _.random(1, 100);
  Log.debug(aiRoll + '<' + targetNumber);
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

/*
  8888888888        888                           d8b                   888b     d888        888   888                  888
  888               888                           Y8P                   8888b   d8888        888   888                  888
  888               888                                                 88888b.d88888        888   888                  888
  8888888   888  888888888 .d88b. 88888b. .d8888b 888 .d88b. 88888b.    888Y88888P888 .d88b. 88888888888b.  .d88b.  .d88888.d8888b
  888       `Y8bd8P'888   d8P  Y8b888 "88b88K     888d88""88b888 "88b   888 Y888P 888d8P  Y8b888   888 "88bd88""88bd88" 88888K
  888         X88K  888   88888888888  888"Y8888b.888888  888888  888   888  Y8P  88888888888888   888  888888  888888  888"Y8888b.
  888       .d8""8b.Y88b. Y8b.    888  888     X88888Y88..88P888  888   888   "   888Y8b.    Y88b. 888  888Y88..88PY88b 888     X88
  8888888888888  888 "Y888 "Y8888 888  888 88888P'888 "Y88P" 888  888   888       888 "Y8888  "Y888888  888 "Y88P"  "Y88888 88888P'
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

PIXI.Graphics.prototype.moveToPoint = function moveToPoint(point) {
  this.moveTo(point.x, point.y);
};
PIXI.Graphics.prototype.lineToPoint = function lineToPoint(point) {
  this.lineTo(point.x, point.y);
};
