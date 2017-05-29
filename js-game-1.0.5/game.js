'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(addedVector) {

    if (!(addedVector instanceof Vector)) {
      throw new Error('Error');
    }
    try {
      this.x += addedVector.x;
      this.y += addedVector.y;
      return new Vector(this.x, this.y);
    }
    catch (e) {
      console.log(e);
    }

  }

  times(multiplier) {

    if (typeof multiplier !== 'number') {
      throw `В качестве множителя должно быть число`;
    }
    try {

      this.x *= multiplier;
      this.y *= multiplier;

      return new Vector(this.x, this.y);
    }
    catch (e) {
      console.log(e);
    }
  }
}

// ************************************

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {

    if (arguments.length > 0 && [pos, size, speed].some((item) => !(item instanceof Vector))) {
      throw new Error(`Все аргументы должны быть объектами типа Vector`);
    }

    try {
      this.pos = pos;
      this.size = size;
      this.speed = new Vector(speed.x, speed.y);

      this.act = function () {
      };

      Object.defineProperty(this, 'type', {
        value: 'actor'
      });
      Object.defineProperty(this, 'left', {
        get() {
          return this.pos.x;
        }
      });
      Object.defineProperty(this, 'top', {
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

      });
    }
    catch (e) {
      console.log(e);
    }

  }


  isIntersect(actorInstance) {

    const I = (a, b, x1, x2, y1, y2) => !(a[x2] <= b[x1] || a[x1] >= b[x2] || a[y2] <= b[y1] || a[y1] >= b[y2]);

    if (!(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали аргумент типа Actor`);
    }
    try {
      if (this === actorInstance) {
        return false;
      }
      else {
        return I(actorInstance, this, 'left', 'right', 'top', 'bottom');

      }
    }
    catch (e) {
      console.log(e);
    }
  }

}

// ***************************************************

class Level {
  constructor(gridMatrix = [], movingObjectsArray = []) {

    this.grid = gridMatrix.slice();

    this.actors = movingObjectsArray.slice().filter(item => item instanceof Object);


    Object.defineProperty(this, 'player', {
      get() {
        return this.actors.filter(item => item.type === 'player')[0]
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(this, 'height', {
      get() {
        return (this.grid.every(item => Array.isArray(item))) ? this.grid.length : 1;
      }
    });
    Object.defineProperty(this, 'width', {
      get() {
        let start = this.height > 1 ? this.grid[0].length : this.grid.length;
        return this.grid.reduce((memo, item) => item.length > memo ? item.length : memo, start);
      }
    });
    this.status = null;
    this.finishDelay = 1;

  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0 || false;
  }

  actorAt(actorInstance) {
    if (arguments.length === 0 || !(actorInstance instanceof Actor)) {
      throw new Error(`Вы не передали движущийся объект`);
    }
    try {
      return this.actors.find(item => item.isIntersect(actorInstance));
    }
    catch (e) {
      console.log(e);
    }
  }

  obstacleAt(objectPositionProspective, objectSize) {
    if (arguments.length < 2 || [objectPositionProspective, objectSize].some(item => !item instanceof Vector)) {
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

    try {
      const virtualActor = new Actor(objectPositionProspective, objectSize);
      const checkResult = borderCheck(virtualActor);
      if (checkResult) {
        return checkResult;
      }
      const searchRowInd = this.grid.findIndex((row, ind) => row.find((ceil, pos) =>
        virtualActor.isIntersect(new Actor(new Vector(pos, ind)))));

      return searchRowInd !== -1
        ? this.grid[searchRowInd]
          .find((ceil, pos) => virtualActor.isIntersect(new Actor(new Vector(pos, searchRowInd)))) : undefined;
    }
    catch (e) {
      console.log(e);
    }
  }

  removeActor(actorInstance) {
    const foundIndex = this.actors.findIndex(item => item === actorInstance);
    if (foundIndex !== -1) {
      this.actors.splice(foundIndex, 1);
    }
  }

  noMoreActors(typeString) {
    return this.actors.length === 0 || !this.actors.some(item => item.type === typeString);
  }

  playerTouched(typeObjectString, actorInstance) {
    if (typeof  typeObjectString !== 'string') {
      throw new Error(`Вы не передали стоку в первом обязательном параметре метода playerTouched`);
    }
    try {
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
    catch (e) {
      console.log(e);
    }

  }

}

//console.log('#######', Level.prototype.constructor);

// *******************************************************

class LevelParser {
  constructor(objectsDictionary) {
    this.objectsDictionary = Object.assign({}, objectsDictionary);
    console.log(this.objectsDictionary);
  }

  actorFromSymbol(symbolString) {
    return this.objectsDictionary[symbolString];

  }

  obstacleFromSymbol(symbolString) {
    const OBSTACLES = {
      '!': 'lava',
      'x': 'wall'
    };
    return OBSTACLES[symbolString];
  }

  createGrid(stringsArr) {
    /*return stringsArr.map(item => Array.from(item))
     .map(item => item.map(el => [' ', '@', 'v', '=', '|'].find(sim => sim === el)
     ? undefined : el === 'x' ? 'wall' : el === '!' ? 'lava' : el));*/

    return stringsArr.map(item => Array.from(item).map(el => this.obstacleFromSymbol(el)));
  }

  createActors(plan) {
    let actorsList = [];
    plan.forEach((item, ind) =>
      item.split('').forEach((el, pos) => {
        const testingConstructor = this.actorFromSymbol(el);
        if (testingConstructor!== undefined && testingConstructor.prototype.constructor === testingConstructor) {
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

/*const plan = [
  ' @ ',
  'x!x'
];
const actorsDict = Object.create(null);
actorsDict['@'] = Actor;

const parser = new LevelParser(actorsDict);

let a = parser.createActors(plan);
console.log(a);
console.log(Level.prototype.constructor);*/

