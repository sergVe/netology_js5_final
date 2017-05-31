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
    // аналогично

    // лишняя мутация

    return new Vector(this.x * multiplier, this.y * multiplier);
  }

}

// ************************************

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

    if (arguments.length > 0 && [pos, size, speed].some((item) => !(item instanceof Vector))) {
      throw new Error(`Все аргументы должны быть объектами типа Vector`);
    }

    // зачем тут try?

    this.pos = pos;
    this.size = size;
    this.speed = new Vector(speed.x, speed.y);

    // свойства и методы нужно определять как поля класса
    /*this.act = function () {
     };*/


    /* Object.defineProperty(this, 'left', {
     get() {
     return this.pos.x;
     }
     });*/
    /* Object.defineProperty(this, 'top', {
     get() {
     return this.pos.y;
     },
     enumerable: true
     });
     Object.defineProperty(this, 'right', {
     get() {
     return this.pos.x + this.size.x;
     },
     enumerable: true
     });
     Object.defineProperty(this, 'bottom', {
     get() {
     return this.pos.y + this.size.y;
     },
     enumerable: true

     });*/

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
    // зачем делать left, right, top, bottom аргументами, если они передаются один раз?
    const intersectionResult = (a, b) => !(a['right'] <= b['left'] || a['left'] >= b['right'] || a['bottom'] <= b['top'] || a['top'] >= b['bottom']);

    if (!(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали аргумент типа Actor`);
    }

    // зачем тут try?

    if (this === actorInstance) {
      return false;
    }
    else {
      return intersectionResult(actorInstance, this);
    }
  }

}

// ***************************************************

class Level {
  constructor(gridMatrix = [], movingObjectsArray = []) {

    this.grid = gridMatrix.slice();

    // filter по-моему, лишняя проверка
    this.actors = movingObjectsArray.slice();

    // объявить через поля класса

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
    return this.status !== null && this.finishDelay < 0 || false;
  }

  actorAt(actorInstance) {
    if (arguments.length === 0 || !(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали движущийся объект`);
    }

    // зачем try?
    return this.actors.find(item => item.isIntersect(actorInstance));
  }

  obstacleAt(objectPositionProspective, objectSize) {
    // тут достаточно последовательно проверить оба аргумента
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

    // зачем try?

    const virtualActor = new Actor(objectPositionProspective, objectSize);
    const checkResult = borderCheck(virtualActor);
    if (checkResult) {
      return checkResult;
    }

    const searchRowInd = this.grid.findIndex((row, ind) => row.find((ceil, pos) =>
      virtualActor.isIntersect(new Actor(new Vector(pos, ind)))));

    // развернуть это выражение
    /* return searchRowInd !== -1
     ? this.grid[searchRowInd]
     .find((ceil, pos) => virtualActor.isIntersect(new Actor(new Vector(pos, searchRowInd)))) : undefined;*/
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
    // чтобы избежать отрицания можно использовать every()
    return this.actors.length === 0 || this.actors.every(item => item.type !== typeString);
  }

  playerTouched(typeObjectString, actorInstance) {
    if (typeof  typeObjectString !== 'string') {
      throw new Error(`Вы не передали стоку в первом обязательном параметре метода playerTouched`);
    }

    // try

    if (['lava', 'fireball'].find(item => item === typeObjectString)) {
      this.status = 'lost';
    }
    if (typeObjectString === 'coin' && actorInstance.type === 'coin') {
      this.removeActor(actorInstance);
      if (this.actors.find(item => item.type === 'coin')) {
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
    return typeof this.objectsDictionary[symbolString] === 'function' ? this.objectsDictionary[symbolString] : undefined;

  }

  // Это нужно вынести в поле класса (задать в конструкторе),
  // иначе этот объект будет создаваться при каждом выхове метода

  createGrid(stringsArr) {

    return stringsArr.map(item => Array.from(item).map(el => this.obstacleFromSymbol(el)));
  }

  createActors(plan) {
    let actorsList = [];
    plan.forEach((item, ind) =>
      item.split('').forEach((el, pos) => {
        const testingConstructor = this.actorFromSymbol(el);
        if (testingConstructor !== undefined && testingConstructor.prototype.constructor === testingConstructor) {
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

class Fireball extends Actor {
  constructor(pos = new Vector(), speed = new Vector()) {
    super();
    this.pos = pos;
    this.speed = new Vector(speed.x, speed.y);
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

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.speed = new Vector(2, 0);
  }

}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.initialPos = pos;
    this.speed = new Vector(0,3);
  }

  handleObstacle() {
    this.pos = new Vector(this.initialPos.x, this.initialPos.y);
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

/*console.log(Fireball.prototype.constructor, Object.getPrototypeOf(Fireball.prototype), Object.getPrototypeOf(HorizontalFireball.prototype),
  Actor.prototype.isPrototypeOf(Level.prototype));*/



