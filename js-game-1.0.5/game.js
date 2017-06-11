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

    // тут можно проверить ещё isNaN
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


    // в данном случае лучше не выделять это в фунцию

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
    // здесь лучше использовать find
    return this.actors.find(item => item.type === 'player');
  }


  // это лучше заполнить в конструкторе
  // и я не до конца понял зачем проверка того, что каждый элемент массива является массивом

  //serg: height убрал

  // reduce - правильно, лучше это посчитать в конструкторе
  // начать можно с 0, чтобы проще было

  // serg: width убрал

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

    // Здесь не нужно использовать isIntersect
    // нужно просто получить ячейку поля и если там есть препятсявие - вернуть его
    const searchRowIndex = this.grid.findIndex((row, ind) => row.find((cell, pos) => pos >= Math.floor(virtualActor.left) && pos < Math.ceil(virtualActor.right) && ind >= Math.floor(virtualActor.top) && ind < Math.ceil(virtualActor.bottom) && cell));

    if (searchRowIndex === -1) {
      return undefined;
    }
    return this.grid[searchRowIndex].find((cell, pos) => pos >= Math.floor(virtualActor.left) && pos < Math.ceil(virtualActor.right) && cell);

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
      throw new Error(`Вы не передали строку в первом обязательном параметре метода playerTouched`);
    }

    if (['lava', 'fireball'].find(item => item === typeObjectString)) {
      this.status = 'lost';
      // здесь лучше написать return; чтобы прекратить выполнение функции
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

    // лучше задать не в конструкторе, а ниже
    // сейчас объект OBSTACLES будет создавать каждый раз при выполнении функции
    // лучше вынести его выше или сделать полем класса, можно статическим

  }

  obstacleFromSymbol(symbolString) {
    return this.OBSTACLES[symbolString];
  }

  actorFromSymbol(symbolString) {
    const testingConstructor = this.objectsDictionary[symbolString];
    // в чём смысл второй проверки?
    if (typeof testingConstructor === 'function') {
      return testingConstructor;
    }
    return undefined;
  }

  createGrid(stringsArr) {
    // лучше преращать строку в массив с помощью split - так сразу понятно, что идёт работа со строкой
    return stringsArr.map(item => item.split('').map(el => this.obstacleFromSymbol(el)));
  }

  createActors(plan) {
    let actorsList = [];
    plan.forEach((item, ind) =>
      item.split('').map((el, pos) => {
        const testingConstructor = this.actorFromSymbol(el);
        // не совсем так. нужно проверить, что testingConstructor это функция,
        // создать объект и проверить, что он instanceof Actor
        if (testingConstructor && new testingConstructor() instanceof Actor) {
          actorsList.push(new testingConstructor(new Vector(pos, ind)));
        }
      }));
    return actorsList;
  }

  parse(plan) {
    // здесь можно не копировать массив - он не мутируется
    const gridMatrix = this.createGrid(plan);
    const actorsList = this.createActors(plan);
    return new Level(gridMatrix, actorsList);
  }

}

// *******************************************************

class Fireball extends Actor {
  constructor(pos, speed) {
    super(pos, new Vector(1, 1), speed);
    // должно заполняться в конструкторе базового класса

  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    // здесь нужно использовать plus и times
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    // здесь нужно использовать times
    this.speed = this.speed.times(-1);
  }

  act(time, levelObj) {
    const nextPos = this.getNextPosition(time);
    if (levelObj.obstacleAt(nextPos, this.size)) {
      this.handleObstacle();
      // лучше так не переносить
      // serg: ?
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
    // поле должно заполняться в конструкторе базового класса
  }
}

// *****************************************************

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.initialPos = pos;
    // поле должно заполняться в конструкторе базового класса
  }

  handleObstacle() {
    // this.initialPos уже вектор, можно не создавать новый
    this.pos = this.initialPos;
  }

}

// *********************************************************

class Coin extends Actor {
  constructor(pos = new Vector()) {
    super(new Vector(pos.x + 0.2, pos.y + 0.1), new Vector(0.6, 0.6));
    this.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

    // size и pos должны задаваться через конструктор базовго класса
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
    //this.pos = new Vector(pos.x, pos.y - 0.5);
    //this.size = new Vector(0.8, 1.5);
  }

  get type() {
    return 'player';
  }
}

// **********************************************

const schema = [
  '         ',
  '  |     ',
  '         ',
  '     x  @ x',
  '     xxxxxxx!',
  ' o        ',
  'xxxxx     ',
  '         '
];

const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball
};
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay)
  .then(status => alert(`Игрок ${status}`));

// Ниже написан правильный код запуска игры, только console.log лучше заменить на alert

// Также монетки не должны залетать в стены

/*loadLevels()
 .then((v) => JSON.parse(v))
 .then((v) => runGame(v, parser, DOMDisplay))
 .then(v => console.log(`Вы получили приз`));*/





