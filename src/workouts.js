'use strict';

class Workout {
  clicks = 0;

  constructor(coords, distance, duration, date, id) {
    this.coords = coords; // [lat, long]
    this.distance = distance; //km
    this.duration = duration; //min
    if (!date && !id) {
      this.date = new Date();
      this.id = String(Date.now()).slice(-10);
    } else {
      this.date = date;
      this.id = id;
    }
  }

  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence, date, id, desc) {
    super(coords, distance, duration, date, id);
    this.cadence = cadence;
    this.calcPace();
    if (!desc) this._setDescription();
    else this.description = desc;
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain, date, id, desc) {
    super(coords, distance, duration, date, id);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    if (!desc) this._setDescription();
    else this.description = desc;
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

export { Workout, Running, Cycling };
