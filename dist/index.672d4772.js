"use strict";
const mapDOM = document.querySelector("#map");
const form = document.querySelector(".form");
const sidebar = document.querySelector(".sidebar");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
class Workout {
    clicks = 0;
    constructor(coords, distance, duration, date, id){
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
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class Running extends Workout {
    type = "running";
    constructor(coords, distance, duration, cadence, date, id, desc){
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
    type = "cycling";
    constructor(coords, distance, duration, elevationGain, date, id, desc){
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
    #mapMarkers = [];
    #sorted = false;
    constructor(){
        // get user pos
        this._getPosition();
        //get data from local storage
        this._getLocalStorage();
        //Attach event handlers
        form.addEventListener("submit", this._newWorkout.bind(this));
        inputType.addEventListener("change", this._toggleElevationField);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
        containerWorkouts.addEventListener("click", this._editForm.bind(this));
        containerWorkouts.addEventListener("click", this._submitEditForm.bind(this));
        containerWorkouts.addEventListener("click", this._deleteSelectedWorkout.bind(this));
        sidebar.addEventListener("click", this._deleteAllWorkouts.bind(this));
        sidebar.addEventListener("click", this._sortWorkoutsButtonHandler.bind(this));
    }
    _sortWorkoutsButtonHandler(e) {
        if (!e.target.closest(".sort__workouts__button")) return;
        //swap sort value
        this.#sorted = !this.#sorted;
        this._sortWorkoutsDistance();
    }
    _sortWorkoutsDistance() {
        //check whether to sort by increasing, or original order based on App.#sorted value
        const workoutsArr = this.#sorted === true ? this.#workouts.slice().sort(function(a, b) {
            return a.distance - b.distance;
        }) : this.#workouts;
        this._renderAllWorkouts(workoutsArr);
    }
    _renderAllWorkouts(workoutArr) {
        // delete and then re-render all workouts based on sorted property
        const workouts = document.querySelectorAll(".workout");
        workouts.forEach((work)=>work.remove());
        const that = this;
        workoutArr.forEach((workout)=>that._renderWorkout(workout));
    }
    _mapMarkersArrayWatcher() {
        const container = document.querySelector(".workout__forms__buttons__container");
        //display outer icons if it doesnt already exist and array is populated
        if (this.#mapMarkers.length > 0) {
            if (!container) this._displaySortAndDelete();
        }
        //remove icons if array is empty
        if (this.#mapMarkers.length === 0) {
            if (container) container.remove();
        }
    }
    _getPosition() {
        //get user position
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            alert("Could not get your position");
        });
    }
    _loadMap(pos) {
        const { latitude  } = pos.coords;
        const { longitude  } = pos.coords;
        const coords = [
            latitude,
            longitude
        ];
        this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        //Handling clicks on map
        this.#map.on("click", this._showForm.bind(this));
        this.#workouts.forEach((work)=>{
            this._renderWorkoutMarker(work);
        });
        //check if icon container needed
        this._mapMarkersArrayWatcher();
    }
    _showForm(mapE) {
        if (mapDOM.classList.contains("ignore")) return;
        if (mapE) {
            this.#mapEvent = mapE;
            this._hideEditButtons(null);
        }
        form.classList.remove("hidden");
        inputDistance.focus();
    }
    _hideForm() {
        //Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = "";
        form.style.display = "none";
        form.classList.add("hidden");
        //needed for animation to perform correctly
        setTimeout(()=>form.style.display = "grid", 1000);
    }
    _hideEditButtons(workout) {
        const allForms = document.querySelectorAll(".workout");
        allForms.forEach((form)=>{
            if (workout) {
                if (form.dataset.id !== workout.id) form.querySelector(".workout__edit__button").style.display = "none";
            } else form.querySelector(".workout__edit__button").style.display = "none";
        });
    }
    _displayEditButtons() {
        const allForms = document.querySelectorAll(".workout");
        allForms.forEach((form)=>form.querySelector(".workout__edit__button").style.display = "block");
    }
    _hideTrashButtons() {
        const allForms = document.querySelectorAll(".workout");
        allForms.forEach((form)=>form.querySelector(".workout__trash__button").style.display = "none");
    }
    _displayTrashButtons() {
        const allForms = document.querySelectorAll(".workout");
        allForms.forEach((form)=>form.querySelector(".workout__trash__button").style.display = "block");
    }
    _editForm(e) {
        /////////////////////////////////////DO ME NEXT
        if (e.target.closest(".workout__edit")) {
            //make sure map is rendered first
            if (this.#mapMarkers.length === 0) return;
            //Delete the outer icons from DOM
            const outerIconContainer = document.querySelector(".workout__forms__buttons__container");
            if (outerIconContainer) outerIconContainer.remove();
            //Add class to map to remove map event clicks while editing
            mapDOM.classList.add("ignore");
            // add class to form to disable submit listener
            form.classList.add("ignore");
            //selectors
            const buttonHTML = e.target.closest(".workout__edit");
            const formDOM = e.target.closest(".workout");
            //disable dropwdown to change type
            const dropDown = document.querySelector(".form__input");
            dropDown.disabled = true;
            const workout = this.#workouts.find((work)=>work.id === formDOM.dataset.id); // display form on button click
            // hide all other edit buttons and trash buttons
            this._hideEditButtons(workout);
            this._hideTrashButtons();
            // retreive values from stored workout
            if (workout.type === "cycling") {
                this._toggleElevationField();
                inputType.selectedIndex = 1;
                inputElevation.value = workout.elevationGain;
            }
            if (workout.type === "running") {
                inputType.selectedIndex = 0;
                inputCadence.value = workout.cadence;
            }
            inputDistance.value = workout.distance;
            inputDuration.value = workout.duration;
            // display values from retreived workout
            form.classList.remove("hidden");
            // switch edit button to submit button
            buttonHTML.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__edit__submit" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <polyline points="9 11 12 14 20 6" />
        <path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9" />
      </svg>
      `;
            buttonHTML.classList.remove("workout__edit");
            buttonHTML.classList.add("workout__edit__submit");
        }
    }
    _submitEditForm(e) {
        if (e.target.closest(".workout__edit__submit")) {
            // selectors
            const buttonHTML = e.target.closest(".workout__edit__submit");
            const formDOM = e.target.closest(".workout");
            //find the workout in the stored array
            const workout = this.#workouts.find((work)=>work.id === formDOM.dataset.id);
            //update values from new input
            const newWorkoutType = inputType.value;
            const newDistance = inputDistance.value;
            const newDuration = inputDuration.value;
            workout.type = newWorkoutType;
            workout.distance = newDistance;
            workout.duration = newDuration;
            if (newWorkoutType === "running") {
                const newCadence = inputCadence.value;
                workout.cadence = newCadence;
                workout.calcPace();
            }
            if (newWorkoutType === "cycling") {
                const newElevation = inputElevation.value;
                workout.elevationGain = newElevation;
                workout.calcSpeed();
            }
            // show updated list
            this._renderEditForm(workout, formDOM);
            //remove ignore classlist from form and map
            form.classList.remove("ignore");
            mapDOM.classList.remove("ignore");
            // hide and update form
            const dropDown = document.querySelector(".form__input");
            dropDown.disabled = false;
            this._hideForm();
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
            // display edit and trash buttons again
            this._displayEditButtons();
            this._displayTrashButtons();
            //check for outside icon container
            this._mapMarkersArrayWatcher();
        }
    }
    _toggleElevationField() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }
    _newWorkout(e) {
        e.preventDefault();
        if (form.classList.contains("ignore")) return;
        const validInputs = (...inputs)=>inputs.every((input)=>Number.isFinite(input));
        const allPositive = (...inputs)=>inputs.every((input)=>input > 0);
        //Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat , lng  } = this.#mapEvent.latlng;
        let workout;
        //if running, create running object
        if (type === "running") {
            const cadence = +inputCadence.value;
            // check if data is valid
            if (!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert("Inputs have to be positive numbers!");
            workout = new Running([
                lat,
                lng
            ], distance, duration, cadence);
        }
        //if cycling, create cycling object
        if (type === "cycling") {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) || !allPositive(distance, duration)) return alert("Inputs have to be positive numbers!");
            workout = new Cycling([
                lat,
                lng
            ], distance, duration, elevation);
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
        // check if need to update icon container
        this._mapMarkersArrayWatcher();
    }
    _renderEditForm(workout, form) {
        form.classList.remove("workout--running");
        form.classList.remove("workout--cycling");
        form.classList.add(`workout--${workout.type}`);
        let html = `
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
            <span class="workout__icon">${workout.type === "running" ? "\uD83C\uDFC3‍♂️" : "\uD83D\uDEB4‍♀️"}</span>
            <span class="workout__value workout__distance">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value workout__duration">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if (workout.type === "running") html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value workout__pace">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit workout__unit__frequency">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value workout__cadence">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          `;
        if (workout.type === "cycling") html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value workout__speed">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit workout__unit__frequency">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value workout__elevation">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        `;
        form.innerHTML = html;
    }
    _renderWorkoutMarker(workout) {
        const marker = L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        })).setPopupContent(`${workout.type === "running" ? "\uD83C\uDFC3‍♂️" : "\uD83D\uDEB4‍♀️"} ${workout.description}`).openPopup();
        this.#mapMarkers.push(marker);
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
            <span class="workout__icon">${workout.type === "running" ? "\uD83C\uDFC3‍♂️" : "\uD83D\uDEB4‍♀️"}</span>
            <span class="workout__value workout__distance">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value workout__duration">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>

          `;
        if (workout.type === "running") html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value workout__pace">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit workout__unit__frequency">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value workout__cadence">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
    </li>
        `;
        if (workout.type === "cycling") html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value workout__speed">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit workout__unit__frequency">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value workout__elevation">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li> 
      `;
        form.insertAdjacentHTML("afterend", html);
    }
    _moveToPopup(e) {
        //clauses to disable moving
        if (e.target.closest(".workout__trash__button")) return;
        if (this.#mapMarkers.length === 0) return;
        const workoutEl = e.target.closest(".workout");
        if (!workoutEl) return;
        const workout = this.#workouts.find((work)=>work.id === workoutEl.dataset.id);
        //focus the map on the selected workout clicked from sidebar
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    }
    _deleteSelectedWorkout(e) {
        if (e.target.closest(".workout__trash__button")) {
            // need to make sure markers are loaded in before being able to delete
            if (this.#mapMarkers.length === 0) return;
            const formDOM = e.target.closest(".workout");
            //find workout in array
            const workout = this.#workouts.find((work)=>work.id === formDOM.dataset.id);
            // get index
            const workoutIndex = this.#workouts.findIndex((work)=>work === workout);
            // find marker in stored marker array
            const [lat, lng] = workout.coords;
            const marker = this.#mapMarkers.find((mark)=>lat === mark._latlng.lat && lng === mark._latlng.lng);
            const markerIndex = this.#mapMarkers.findIndex((mark)=>mark === marker);
            //remove various elements
            formDOM.remove();
            this.#map.removeLayer(marker);
            this.#workouts.splice(workoutIndex, 1);
            this.#mapMarkers.splice(markerIndex, 1);
            //update local storage
            this._setLocalStorage();
            // check if need to update outside icon container
            this._mapMarkersArrayWatcher();
        }
    }
    _deleteAllWorkouts(e) {
        if (e.target.closest(".workouts__all__trash__button")) {
            //set this to App
            const that = this;
            // loop through all workouts to remove markers from map
            that.#workouts.forEach((work, i)=>{
                const [lat, lng] = work.coords;
                const markerIndex = that.#mapMarkers.findIndex((mark)=>lat === mark._latlng.lat && lng === mark._latlng.lng);
                const marker = that.#mapMarkers[markerIndex];
                that.#map.removeLayer(marker);
            });
            //delete all traces of workouts in app
            that.#mapMarkers.splice(0, that.#mapMarkers.length);
            that.#workouts.splice(0, that.#workouts.length);
            const formsDOM = document.querySelectorAll(".workout");
            formsDOM.forEach((form)=>form.remove());
            //update storage
            that._setLocalStorage();
            //toggle outer icons visibility
            that._mapMarkersArrayWatcher();
        }
    }
    _displaySortAndDelete() {
        //create outer icons buttons
        const sortDOM = `
    <button class="sort__workouts__button" type="button">
      <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__sort" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M3 9l4 -4l4 4m-4 -4v14" />
        <path d="M21 15l-4 4l-4 -4m4 4v-14" />
      </svg>
    </button>
    `;
        const deleteDOM = `
      <button class="workouts__all__trash__button" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon__trash" width="20" height="20" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
          <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
          <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
        </svg>
      </button>
    `;
        //append button to container
        const container = document.createElement("div");
        container.classList.add("workout__forms__buttons__container");
        container.insertAdjacentHTML("afterbegin", sortDOM);
        container.insertAdjacentHTML("afterbegin", deleteDOM);
        const logoDOM = document.querySelector(".logo");
        logoDOM.after(container);
    }
    _createWorkoutFromLocalStorage(arr) {
        //recreate objects stored in local storage upon reload
        arr.forEach(function(workout) {
            const type = workout.type;
            const duration = workout.duration;
            const distance = workout.distance;
            const [lat, lng] = workout.coords;
            let newWorkout;
            if (type === "running") {
                const cadence = workout.cadence;
                newWorkout = new Running([
                    lat,
                    lng
                ], distance, duration, cadence, workout.date, workout.id, workout.description);
            }
            if (type === "cycling") {
                const elevation = workout.elevationGain;
                newWorkout = new Cycling([
                    lat,
                    lng
                ], distance, duration, elevation, workout.date, workout.id, workout.description);
            }
            //populate workouts array with recreated workout objects
            this.#workouts.push(newWorkout);
        }, this);
    }
    _setLocalStorage() {
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem("workouts"));
        if (!data) return;
        this._createWorkoutFromLocalStorage(data);
        this.#workouts.forEach((work)=>{
            this._renderWorkout(work);
        });
    }
    // method available to reset local storage
    reset() {
        localStorage.removeItem("workouts");
        location.reload();
    }
}
const app = new App();

//# sourceMappingURL=index.672d4772.js.map
