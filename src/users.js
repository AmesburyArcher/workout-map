'use strict';

class User {
  #workouts = [];
  constructor(name, userName, password, birthdate) {
    this.firstName = name;
    this.userName = userName;
    this.password = password;
    this.birthdate = birthdate;
  }

  getWorkouts() {
    return this.#workouts;
  }

  setWorkout(workout) {
    this.#workouts.push(workout);
  }
}

export { User };
