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

    if (isNaN(multiplier) || typeof multiplier !== 'number') {
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
    if (!(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали аргумент типа Actor`);
    }

    if (this === actorInstance) {
      return false;
    }

    if (this.right <= actorInstance.left) {
      return false;
    }
    if (this.left >= actorInstance.right) {
      return false;
    }
    if (this.bottom <= actorInstance.top) {
      return false;
    }
    if (this.top >= actorInstance.bottom) {
      return false;
    }
    return true;
  }

}

// ***************************************************

class Level {
  constructor(gridMatrix = [], movingObjectsArray = []) {

    this.grid = gridMatrix.slice();
    this.actors = movingObjectsArray.slice();
    this.status = null;
    this.finishDelay = 1;
    this.height = this.grid.length;
    this.width = this.grid.reduce((memo, item) => item.length > memo ? item.length : memo, 0);
  }

  get player() {
    return this.actors.find(item => item.type === 'player');
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

  hasBoundaryIntersection(left, right, top, bottom) {
    if (left < 0 || right > this.width || top < 0) {
      return 'wall';
    }
    if (bottom > this.height) {
      return 'lava';
    }
    return false;
  }

  obstacleAt(positionProspective, objectSize) {

    if ([positionProspective, objectSize].some(item => !item instanceof Vector)) {
      throw `Вы не передали объекты типа Vector`;
    }
    const leftLimit = Math.floor(positionProspective.x);
    const rightLimit = Math.ceil(positionProspective.x + objectSize.x);
    const topLimit = Math.floor(positionProspective.y);
    const  bottomLimit = Math.ceil(positionProspective.y + objectSize.y);
    const checkBoundary = this.hasBoundaryIntersection(leftLimit, rightLimit, topLimit, bottomLimit);

    if (checkBoundary) {
      return checkBoundary;
    }

    for (let y = topLimit; y < bottomLimit; y++) {
      for (let x = leftLimit; x < rightLimit; x++) {
        if (this.grid[y][x]) {
          return this.grid[y][x];

        }
      }
    }
    return undefined;
  }

  removeActor(actorInstance) {
    const foundIndex = this.actors.indexOf(actorInstance);
    if (foundIndex !== -1) {
      this.actors.splice(foundIndex, 1);
    }
  }

  noMoreActors(typeString) {

    return !this.actors.some(item => item.type === typeString);
  }

  playerTouched(typeObjectString, actorInstance) {
    if (typeof  typeObjectString !== 'string') {
      throw new Error(`Вы не передали строку в первом обязательном параметре метода playerTouched`);
    }
    if (this.status !== null) {
      return;
    }
      if (['lava', 'fireball'].find(item => item === typeObjectString)) {
        this.status = 'lost';
        return;
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
    this.OBSTACLES = {
      '!': 'lava',
      'x': 'wall'
    };
  }

  obstacleFromSymbol(symbolString) {
    return this.OBSTACLES[symbolString];
  }

  actorFromSymbol(symbolString) {
    const testingConstructor = this.objectsDictionary[symbolString];
    if (typeof testingConstructor === 'function') {
      return testingConstructor;
    }
    return undefined;
  }

  createGrid(stringsArr) {
    return stringsArr.map(item => item.split('').map(el => this.obstacleFromSymbol(el)));
  }

  createActors(plan) {
    let actorsList = [];
    plan.forEach((item, ind) =>
      item.split('').forEach((el, pos) => {
        const testingConstructor = this.actorFromSymbol(el);
        if (testingConstructor) {
          const testingInstance = new testingConstructor(new Vector(pos, ind));
          if (testingInstance instanceof Actor) {
            actorsList.push(testingInstance);
          }
        }
      }));
    return actorsList;
  }

  parse(plan) {
    const gridMatrix = this.createGrid(plan);
    const actorsList = this.createActors(plan);
    return new Level(gridMatrix, actorsList);
  }

}

// *******************************************************

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, new Vector(1, 1), speed);

  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
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
    super(pos, new Vector(2, 0));
  }

}

// *******************************************************

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

// *****************************************************

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.initialPos = pos;
  }

  handleObstacle() {
    this.pos = this.initialPos;
  }

}

// *********************************************************

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
    this.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    this.spring = this.rand(0, 2 * Math.PI);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.initialPos = this.pos;
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

    return this.initialPos.plus(new Vector(0, delta.y));
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

// ******************************************************

class Player extends Actor {
  constructor(pos = new Vector()) {
    super(new Vector(pos.x, pos.y - 0.5), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

// **********************************************

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
};
const parser = new LevelParser(actorDict);

loadLevels()
  .then((v) => JSON.parse(v))
  .then((v) => runGame(v, parser, DOMDisplay))
  .then(v => alert(`Вы получили приз`));





