'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(addedVector) {

      if (!(addedVector instanceof Vector)) {
        throw `Можно прибавлять к вектору только вектор типа Vector`;
      }
      return new Vector(this.x + addedVector.x, this.y + addedVector.y);
  }

  times(multiplier) {

      if (typeof multiplier !== 'number') {
        throw `В качестве множителя должно быть число`;
      }
      else {
        this.x *= multiplier;
        this.y *= multiplier;

        return new Vector(this.x, this.y);
      }
  }
}

// ************************************

/*
 const start = new Vector(30, 50);
 const moveTo = new Vector(5, 10);
 const finish = start.plus(moveTo.times(2));

 console.log(`Исходное расположение: ${start.x}:${start.y}`);
 console.log(`Текущее расположение: ${finish.x}:${finish.y}`);*/

// ************************************

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    //console.log([...arguments]);
    if (arguments.length > 0 && [...arguments].some((item) => !(item instanceof Vector))) {
      throw `Все аргументы должны быть объектами типа Vector`;
    }

    this.pos = new Vector(pos.x, pos.y);
    this.size = new Vector(size.x, size.y);
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


  isIntersect(actorInstance) {

    const isHalfIntersect = (transferredObject, thisObject, p1, p2, p3, p4) => {
      if ((transferredObject[p1] >= thisObject[p1] && transferredObject[p1] <= thisObject[p2])
        && (transferredObject[p3] >= thisObject[p3] && transferredObject[p3] <= thisObject[p4] ||
        transferredObject[p4] >= thisObject[p3] && transferredObject[p4] <= thisObject[p4])) {
        //console.log(`yes`);
        return true;
      }
      //console.log(`no`, this[p1], actorInstance[p1]);
      return false;
    };

    if (arguments.length === 0 || !(actorInstance instanceof Actor)) {
      throw `Вы не передали аргумент типа Actor`;
    }
    if (this === actorInstance) {
      return false;
    }
    else {
      return isHalfIntersect(actorInstance, this, 'left', 'right', 'top', 'bottom')
        || isHalfIntersect(actorInstance, this,
          'right', 'left', 'top', 'bottom');
    }

  }
}


const items = new Map();
const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
  return ['left', 'top', 'right', 'bottom']
    .map(side => `${side}: ${item[side]}`)
    .join(', ');
}

function movePlayer(x, y) {
  player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
  console.log(`${title}: ${position(item)}`);
  if (player.isIntersect(item)) {
    console.log(`Игрок подобрал ${title}`);
  }
}

/*items.forEach(status);
 movePlayer(10, 10);
 //console.log(player);
 items.forEach(status);
 movePlayer(5, -5);
 items.forEach(status);*/

// ***************************************************8

class Level {
  constructor(gridMatrix = [], movingObjectsArray = []) {
    if (arguments.length > 0 && [...arguments].some(item => !Array.isArray(item))) {
      throw `game over`;
    }

  }
}



