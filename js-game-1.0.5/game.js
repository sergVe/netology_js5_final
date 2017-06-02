'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(addedVector) {

    if (!(addedVector instanceof Vector)) {
      throw new Error('Error: должен быть передан объект типа Vector');
    }

    return new Vector(this.x + addedVector.x, this.y + addedVector.y);
  }

  times(multiplier) {

    if (typeof multiplier !== 'number') {
      throw new Error(`В качестве множителя должно быть число`);
    }

    return new Vector(this.x * multiplier, this.y * multiplier);
  }

}

// ************************************

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

    if ([pos, size, speed].some((item) => !(item instanceof Vector))) {
      throw new Error(`Все аргументы должны быть объектами типа Vector`);
    }

    this.pos = pos;
    this.size = size;
    this.speed = new Vector(speed.x, speed.y);
  }

  act() {

  };

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(actorInstance) {

    const intersectionResult = (firstObj, secondObj) => firstObj.right > secondObj.left && firstObj.left < secondObj.right
    && firstObj.bottom > secondObj.top && firstObj.top < secondObj.bottom;

    if (!(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали аргумент типа Actor`);
    }

    if (this === actorInstance) {
      return false;
    }
    return intersectionResult(actorInstance, this);
  }

}

// ***************************************************

class Level {
  constructor(gridMatrix = [], movingObjectsArray = []) {

    this.grid = gridMatrix.slice();
    this.actors = movingObjectsArray.slice();
    this.status = null;
    this.finishDelay = 1;
  }

  get player() {
    return this.actors.filter(item => item.type === 'player')[0]
  }

  get height() {
    return (this.grid.every(item => Array.isArray(item))) ? this.grid.length : 1;
  }

  get width() {
    let start = this.height > 1 ? this.grid[0].length : this.grid.length;
    return this.grid.reduce((memo, item) => item.length > memo ? item.length : memo, start);
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actorInstance) {
    if (!(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали движущийся объект`);
    }

    return this.actors.find(item => item.isIntersect(actorInstance));
  }

  obstacleAt(objectPositionProspective, objectSize) {

    if ([objectPositionProspective, objectSize].some(item => !item instanceof Vector)) {
      throw `Вы не передали объекты типа Vector`;
    }
    const borderCheck = (actorInstance) => {

      if (actorInstance.left < 0 || actorInstance.right > this.width
        || actorInstance.top < 0) {
        return 'wall';
      }
      if (actorInstance.bottom > this.height) {
        return 'lava';
      }
      return false;
    };

    const virtualActor = new Actor(objectPositionProspective, objectSize);
    const checkResult = borderCheck(virtualActor);

    if (checkResult) {
      return checkResult;
    }

    const searchRowInd = this.grid.findIndex((row, ind) => row.find((ceil, pos) =>
      virtualActor.isIntersect(new Actor(new Vector(pos, ind)))));

    if (searchRowInd === -1) {
      return undefined;
    }
    return this.grid[searchRowInd].find((ceil, pos) => virtualActor.isIntersect(new Actor(new Vector(pos, searchRowInd))));
  }

  removeActor(actorInstance) {
    const foundIndex = this.actors.findIndex(item => item === actorInstance);
    if (foundIndex !== -1) {
      this.actors.splice(foundIndex, 1);
    }
  }

  noMoreActors(typeString) {

    return this.actors.length === 0 || this.actors.every(item => item.type !== typeString);
  }

  playerTouched(typeObjectString, actorInstance) {
    if (typeof  typeObjectString !== 'string') {
      throw new Error(`Вы не передали стоку в первом обязательном параметре метода playerTouched`);
    }

    if (['lava', 'fireball'].find(item => item === typeObjectString)) {
      this.status = 'lost';
    }
    if (typeObjectString === 'coin' && actorInstance.type === 'coin') {
      this.removeActor(actorInstance);
      if (this.noMoreActors('coin')) {
        this.status = 'won';
      }
    }
  }

}

// *******************************************************

class LevelParser {
  constructor(objectsDictionary) {
    this.objectsDictionary = Object.assign({}, objectsDictionary);

    this.obstacleFromSymbol = function (symbolString) {
      const OBSTACLES = {
        '!': 'lava',
        'x': 'wall'
      };
      return OBSTACLES[symbolString];
    }
  }

  actorFromSymbol(symbolString) {
    const testingConstructor = this.objectsDictionary[symbolString];
    if (typeof testingConstructor === 'function' && testingConstructor.prototype.constructor === testingConstructor) {
      return testingConstructor;
    }
    return undefined;
  }

  createGrid(stringsArr) {

    return stringsArr.map(item => Array.from(item).map(el => this.obstacleFromSymbol(el)));
  }

  createActors(plan) {
    let actorsList = [];
    plan.forEach((item, ind) =>
      item.split('').map((el, pos) => {
        const testingConstructor = this.actorFromSymbol(el);
        if (testingConstructor && (testingConstructor === Actor || Actor.prototype.isPrototypeOf(testingConstructor.prototype))) {
          actorsList.push(new testingConstructor(new Vector(pos, ind)));
        }
      }));
    return actorsList;
  }

  parse(plan) {
    const adoptedPlan = plan.slice();
    const gridMatrix = this.createGrid(adoptedPlan);
    const actorsList = this.createActors(adoptedPlan);
    return new Level(gridMatrix, actorsList);
  }

}

// *******************************************************

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, speed, speed);
    this.size = new Vector(1, 1);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return new Vector(this.pos.x + time * this.speed.x, this.pos.y + time * this.speed.y);
  }

  handleObstacle() {
    this.speed.x = -this.speed.x;
    this.speed.y = -this.speed.y;
  }

  act(time, levelObj) {
    const nextPos = this.getNextPosition(time);
    if (levelObj.obstacleAt(nextPos, this.size)) {
      this.handleObstacle();
    }
    else {
      this.pos = nextPos;
    }
  }
}

// ********************************************************

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.speed = new Vector(2, 0);
  }

}

// *******************************************************

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos);
    this.speed = new Vector(0, 2);
  }
}

// *****************************************************

class FireRain extends Fireball {
  constructor(pos) {
    super(pos);
    this.initialPos = pos;
    this.speed = new Vector(0, 3);
  }

  handleObstacle() {
    this.pos = new Vector(this.initialPos.x, this.initialPos.y);
  }

}

// *********************************************************

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super();
    this.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

    this.size = new Vector(0.6, 0.6);
    this.pos = new Vector(pos.x + 0.2, pos.y + 0.1);
    this.spring = this.rand(0, 2 * Math.PI);
    this.springSpeed = 8;
    this.springDist = 0.07;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring = this.spring + this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, this.springDist * Math.sin(this.spring));
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    const delta = this.getSpringVector(time);
    return new Vector(this.pos.x, this.pos.y + delta.y);
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

// ******************************************************

class Player extends Actor {
  constructor(pos = new Vector()) {
    super();
    this.pos = new Vector(pos.x, pos.y - 0.5);
    this.size = new Vector(0.8, 1.5);
  }

  get type() {
    return 'player';
  }
}

// **********************************************8

const schema = [
  '         ',
  '         ',
  '    =    ',
  '       o ',
  '     !xxx',
  ' @       ',
  'xxx!     ',
  '         '
];
/*
const actorDict = {
  '@': Player,
  '=': HorizontalFireball
}

const level = parser.parse(schema);
runLevel(level, DOMDisplay)
  .then(status => console.log(`Игрок ${status}`));
*/

const schemas = [
  [
    '  v      ',
    '         ',
    '    =    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball
}
const parser = new LevelParser(actorDict);

runGame(schemas, parser, DOMDisplay)
  .then(() => alert('Вы выиграли приз!'));

loadLevels();