import { VisualNovelEngine } from "./VisualNovelEngine.js";
/**
 * Representa el estado actual del tiempo en la novela visual.
 * @typedef {Object} CurrentTime
 * @property {number} hour - Hora del día (0-23)
 * @property {number} day - Número de día desde el inicio (1 = día 1)
 * @property {string} weekDay - Nombre del día de la semana
 * @property {'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday'} weekDay - Día de la semana (valores permitidos)
 * @property {'Spring'|'Summer'|'Autumn'|'Winter'} season - Estación actual
 */
export class TimeSystem {
  /**
  * @param {VisualNovelEngine} vnEngine 
  */
  constructor(vnEngine) {
    this.vnEngine = vnEngine;
    /** @type {CurrentTime}*/
    this.currentTime = vnEngine.TimeSystem?.getCurrentTime() ?? {
      hour: 8,   // 8 AM por defecto
      day: 1,    // Día 1
      weekDay: 'Monday',
      season: 'Spring'
    };
    this.timeSpeedMultiplier = 1; // 1x velocidad real
    this.dayLengthInMs = 60000; // Un día = 60 segundos (ajustable)
    this.weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    this.seasons = ['Spring', 'Summer', 'Autumn', 'Winter'];
  }

  // === Días de la semana ===
  isMonday() { return this.currentTime.weekDay === 'Monday'; }
  isTuesday() { return this.currentTime.weekDay === 'Tuesday'; }
  isWednesday() { return this.currentTime.weekDay === 'Wednesday'; }
  isThursday() { return this.currentTime.weekDay === 'Thursday'; }
  isFriday() { return this.currentTime.weekDay === 'Friday'; }
  isSaturday() { return this.currentTime.weekDay === 'Saturday'; }
  isSunday() { return this.currentTime.weekDay === 'Sunday'; }

  // === Estaciones del año ===
  isSpring() { return this.currentTime.season === 'Spring'; }
  isSummer() { return this.currentTime.season === 'Summer'; }
  isAutumn() { return this.currentTime.season === 'Autumn'; }
  isWinter() { return this.currentTime.season === 'Winter'; }

  // Opcional: métodos más genéricos
  isWeekend() { return this.isSaturday() || this.isSunday(); }
  isWeekday() { return !this.isWeekend(); }
  /**
   * Avanza el tiempo en X horas
   * @param {number} hoursToAdd
   */
  advanceTime(hoursToAdd = 1) {
    const totalHours = this.currentTime.hour + hoursToAdd;

    const daysToAdd = Math.floor(totalHours / 24);
    const newHour = totalHours % 24;
    const currentWeekIndex = this.weekDays.indexOf(this.currentTime.weekDay);
    const newWeekIndex = (currentWeekIndex + daysToAdd) % this.weekDays.length;

    this.currentTime.hour = newHour;
    this.currentTime.day += daysToAdd;
    this.currentTime.weekDay = this.weekDays[newWeekIndex];
    this.currentTime.season = this.calculateSeason(); // Opcional
    this.vnEngine.clearMenus();
    this.vnEngine.startScene(this.vnEngine.currentScene);
  }

  get hour() { return this.currentTime.hour; }
  get day() { return this.currentTime.day; }
  get weekDay() { return this.currentTime.weekDay; }
  get season() { return this.currentTime.season; }

  /**
   * Devuelve la hora actual en formato AM/PM
   */
  getFormattedHour() {
    const hour = this.currentTime.hour % 12 || 12;
    const period = this.currentTime.hour < 12 ? 'AM' : 'PM';
    return `${hour} ${period}`;
  }

  /**
   * Calcula la estación según el número de día
   */
  calculateSeason() {
    const day = this.currentTime.day;
    const seasonLength = 90; // días por estación
    const seasonIndex = Math.floor((day % (seasonLength * 4)) / seasonLength);
    return this.seasons[seasonIndex];
  }

  /**
   * Devuelve el estado actual del tiempo
   */
  getCurrentTime() {
    return { ...this.currentTime };
  }

  /**
   * Cambia la velocidad del paso del tiempo
   * @param {number} multiplier 1 = normal, 2 = doble velocidad, etc.
   */
  setSpeed(multiplier = 1) {
    this.timeSpeedMultiplier = multiplier;
  }

  /**
   * Avanza el tiempo automáticamente (ej: durante eventos)
   * @param {number} hoursToAdd
   * @param {number} durationMs duración real en pantalla
   */
  async autoAdvanceTime(hoursToAdd = 1, durationMs = 5000) {
    const interval = durationMs / hoursToAdd;
    //for (let i = 0; i < hoursToAdd; i++) {
    //await new Promise(resolve => setTimeout(resolve, interval / this.timeSpeedMultiplier));
    this.advanceTime(hoursToAdd);
    this.updateTimeUI();
  }

  /**
   * Muestra el estado del tiempo en la UI
   */
  updateTimeUI() {
    const timeDisplay = document.getElementById('game-time-display');
    if (!timeDisplay) return;
    timeDisplay.textContent = `
      Hora: ${this.getFormattedHour()} |
      Día: ${this.currentTime.day} (${this.currentTime.weekDay}) |
      Temporada: ${this.currentTime.season}
    `;
  }
}