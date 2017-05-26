'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(addedVector) {
    try {
      if (!(addedVector instanceof Vector)) {
        throw `Можно прибавлять к вектору только вектор типа Vector`;
      }
      return new Vector(this.x + addedVector.x, this.y + addedVector.y);
    }
    catch (e) {
      console.log(e);
    }
  }

  times(multiplier) {
    try {
      if (typeof multiplier !== 'number') {
        throw `В качестве множителя должно быть число`;
      }
      else {
        this.x *= multiplier;
        this.y *= multiplier;

        return new Vector(this.x, this.y);
      }
    }
    catch (e) {
      console.log(e);
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
    try {
      //console.log([...arguments]);
      if( [...arguments].length > 0 && [...arguments].some((item) => !(item instanceof Vector))) {
        throw `Все аргументы должны быть объектами типа Vector`;
      }
      this.pos = new Vector(pos.x, pos.y);
      this.size = new Vector(size.x, size.y);
      this.speed = new Vector(speed.x, speed.y);
      this.act = function () {};

      Object.defineProperty(this, 'type', {
        value: 'actor'
      });
      Object.defineProperty(this, 'left', {
        value: this.pos.x
      });
      Object.defineProperty(this, 'top', {
        value: this.pos.y
      });
      Object.defineProperty(this, 'right', {
        value: this.pos.x + this.size.x
      });
      Object.defineProperty(this, 'bottom', {
        value: this.pos.y + this.size.y
      });
      }

    catch(e) {
      console.log(e);
    }
  }
  isIntersect(actorInstance) {
    try {
      if ([... arguments].length === 0 || !(actorInstance instanceof Actor)) {
        throw `Вы не передали аргумент типа Actor`;
      }
      if (this === actorInstance) {
        return false;
      }


    }
    catch(e) {
      console.log(e);
    }

  }
}



const a = new Actor(new Vector(1, 3));
console.log(a);