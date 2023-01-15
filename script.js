'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

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

////////////////////////////////////////////////////////////////
//APPLICATION
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  constructor() {
    // get user pos
    this._getPosition();

    //get data from local storage
    this._getLocalStorage();
    //Attach event handlers

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    containerWorkouts.addEventListener('click', this._editForm.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._submitEditForm.bind(this)
    );
  }

  _getPosition() {
    //get user position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    if (mapE) {
      this.#mapEvent = mapE;
      this._hideEditButtons(null);
    }
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _hideEditButtons(workout) {
    const allForms = document.querySelectorAll('.workout');
    allForms.forEach(form => {
      if (workout) {
        if (form.dataset.id !== workout.id) {
          form.querySelector('.workout__edit__button').style.display = 'none';
        }
      } else {
        form.querySelector('.workout__edit__button').style.display = 'none';
      }
    });
  }

  _displayEditButtons() {
    const allForms = document.querySelectorAll('.workout');
    allForms.forEach(
      form =>
        (form.querySelector('.workout__edit__button').style.display = 'block')
    );
  }

  _editForm(e) {
    /////////////////////////////////////DO ME NEXT
    if (e.target.closest('.workout__edit')) {
      const buttonHTML = e.target.closest('.workout__edit');
      const formDOM = e.target.closest('.workout');
      //disable dropwdown to change type
      const dropDown = document.querySelector('.form__input');
      dropDown.disabled = true;
      // add class to form to disable submit listener
      form.classList.add('ignore');

      const workout = this.#workouts.find(
        work => work.id === formDOM.dataset.id
      ); // display form on button click

      // hide all other edit buttons
      this._hideEditButtons(workout);

      // retreive values from stored workout
      if (workout.type === 'cycling') {
        this._toggleElevationField();
        inputType.selectedIndex = 1;
        inputElevation.value = workout.elevationGain;
      }
      if (workout.type === 'running') {
        inputType.selectedIndex = 0;
        inputCadence.value = workout.cadence;
      }
      inputDistance.value = workout.distance;
      inputDuration.value = workout.duration;
      // display values from retreived workout
      this._showForm();

      // switch edit button to submit button
      buttonHTML.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__edit__submit" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="9 11 12 14 20 6" />
        <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" />
      </svg>
      `;
      buttonHTML.classList.remove('workout__edit');
      buttonHTML.classList.add('workout__edit__submit');
    }
  }

  _submitEditForm(e) {
    if (e.target.closest('.workout__edit__submit')) {
      // selectors
      const buttonHTML = e.target.closest('.workout__edit__submit');
      const form = e.target.closest('.workout');

      //find the workout in the stored array
      const workout = this.#workouts.find(work => work.id === form.dataset.id);

      //update values from new input
      const newWorkoutType = inputType.value;
      const newDistance = inputDistance.value;
      const newDuration = inputDuration.value;

      workout.type = newWorkoutType;
      workout.distance = newDistance;
      workout.duration = newDuration;

      if (newWorkoutType === 'running') {
        const newCadence = inputCadence.value;
        workout.cadence = newCadence;
        workout.calcPace();
      }

      if (newWorkoutType === 'cycling') {
        const newElevation = inputElevation.value;
        workout.elevationGain = newElevation;
        workout.calcSpeed();
      }

      // show updated list
      this._renderEditForm(workout, form);

      // hide and update form
      const dropDown = document.querySelector('.form__input');
      dropDown.disabled = false;
      this._hideForm();

      //remove ignore classlist from form
      form.classList.remove('ignore');

      //update local storage
      this._setLocalStorage();

      // switch submit back to edit button
      buttonHTML.innerHTML = `
        <button type="button" class="workout__edit workout__edit__button">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__edit" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
                  <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
                  <line x1="16" y1="5" x2="19" y2="8" />
                </svg>
        </button>
      `;

      // display edit buttons again
      this._displayEditButtons();
    }
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();
    if (form.classList.contains('ignore')) return;
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every(input => input > 0);

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //if running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to workout array
    this.#workouts.push(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);
    //render workout on list
    this._renderWorkout(workout);
    //Clear input fields
    this._hideForm();
    // set local storage to all workouts
    this._setLocalStorage();
    //display edit buttons
    this._displayEditButtons();
  }

  _renderEditForm(workout, form) {
    form.classList.remove('workout--running');
    form.classList.remove('workout--cycling');
    form.classList.add(`workout--${workout.type}`);
    let html = `
          <h2 class="workout__title">
            ${workout.description}
            <button type="button" class="workout__edit workout__edit__button">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__edit" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
                <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
                <line x1="16" y1="5" x2="19" y2="8" />
              </svg>
            </button>
          </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value workout__distance">${
              workout.distance
            }</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value workout__duration">${
              workout.duration
            }</span>
            <span class="workout__unit">min</span>
          </div>
        `;
    if (workout.type === 'running') {
      html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value workout__pace">${workout.pace.toFixed(
                1
              )}</span>
              <span class="workout__unit workout__unit__frequency">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value workout__cadence">${
                workout.cadence
              }</span>
              <span class="workout__unit">spm</span>
            </div>
          `;
    }
    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value workout__speed">${workout.speed.toFixed(
              1
            )}</span>
            <span class="workout__unit workout__unit__frequency">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value workout__elevation">${
              workout.elevationGain
            }</span>
            <span class="workout__unit">m</span>
          </div>
        `;
    }
    form.innerHTML = html;
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">
            ${workout.description}
            <div class="workout__button__container">
              <button type="button" class="workout__trash workout__trash__button">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__trash" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                </svg>
              </button>
              <button type="button" class="workout__edit workout__edit__button">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__edit" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M9 7h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
                  <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
                  <line x1="16" y1="5" x2="19" y2="8" />
                </svg>
              </button>
            </div>
          </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value workout__distance">${
              workout.distance
            }</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value workout__duration">${
              workout.duration
            }</span>
            <span class="workout__unit">min</span>
          </div>

          `;
    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value workout__pace">${workout.pace.toFixed(
            1
          )}</span>
          <span class="workout__unit workout__unit__frequency">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value workout__cadence">${
            workout.cadence
          }</span>
          <span class="workout__unit">spm</span>
        </div>
    </li>
        `;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value workout__speed">${workout.speed.toFixed(
          1
        )}</span>
        <span class="workout__unit workout__unit__frequency">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value workout__elevation">${
          workout.elevationGain
        }</span>
        <span class="workout__unit">m</span>
      </div>
    </li> 
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // using the public interface;
    // workout.click();
  }

  _createWorkoutFromLocalStorage(arr) {
    arr.forEach(function (workout) {
      const type = workout.type;
      const duration = workout.duration;
      const distance = workout.distance;
      const [lat, lng] = workout.coords;

      let newWorkout;
      if (type === 'running') {
        const cadence = workout.cadence;

        newWorkout = new Running(
          [lat, lng],
          distance,
          duration,
          cadence,
          workout.date,
          workout.id,
          workout.description
        );
      }
      if (type === 'cycling') {
        const elevation = workout.elevationGain;

        newWorkout = new Cycling(
          [lat, lng],
          distance,
          duration,
          elevation,
          workout.date,
          workout.id,
          workout.description
        );
      }

      this.#workouts.push(newWorkout);
    }, this);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    this._createWorkoutFromLocalStorage(data);
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
