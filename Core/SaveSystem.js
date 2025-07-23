//@ts-check
import { VisualNovelEngine } from "./VisualNovelEngine.js";
import { Flow } from "./VisualNovelModules.js";

export class SaveSystem {
  constructor(vnEngine) {
    /**@type {VisualNovelEngine} */
    this.vnEngine = vnEngine;
    this.storage = localStorage; // Backend por defecto
  }
  /**
   * Guarda un estado completo del juego
   * @param {string} slot Nombre del slot de guardado (ej: 'slot1')
   * @param {Object} state Estado del juego (variables, historia, escena actual, etc.)
   */
  saveState(slot, state) {
    try {
      const serializedState = JSON.stringify(state);
      this.storage.setItem(`game-save-${slot}`, serializedState);
      console.log(`Estado guardado en ${slot}`);
    } catch (err) {
      console.error('Error al guardar el estado:', err);
    }
  }

  /**
   * Carga un estado previamente guardado
   * @param {string} slot Nombre del slot de guardado
   * @returns {Object | null}
   */
  loadState(slot) {
    try {
      const serializedState = this.storage.getItem(`game-save-${slot}`);
      return serializedState ? JSON.parse(serializedState) : null;
    } catch (err) {
      console.error('Error al cargar el estado:', err);
      return null;
    }
  }

  /**
   * Elimina un estado guardado
   * @param {string} slot
   */
  deleteState(slot) {
    this.storage.removeItem(`game-save-${slot}`);
    console.log(`Estado eliminado de ${slot}`);
  }

  /**
   * Obtiene todos los slots de guardado disponibles
   * @returns {Array<string>}
   */
  getAvailableSlots() {
    const slots = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith('game-save-')) {
        slots.push(key.replace('game-save-', ''));
      }
    }
    return slots;
  }

  /**
   * Obtiene el estado actual del juego para guardarlo
   * @param {VisualNovelEngine} engine
   * @returns {Object}
   */
  captureGameState(engine) {
    return {
      variables: { ...engine.variables },
      history: [...engine.history],
      currentScene: engine.currentScene,
      activeCharacters: Array.from(engine.activeCharacters),
      timeState: engine.TimeSystem.getCurrentTime(),

      // Nuevo: información del bloque actual
      currentBlock: [...engine.scenes[engine.currentScene]], // Bloque completo
      commandIndex: engine.currentCommandIndex ?? 0         // Índice actual (nuevo)
    };
  }

  /**
   * Restaura el estado del juego desde un guardado
   * @param {VisualNovelEngine} engine
   * @param {Object} state
   */
  restoreGameState(engine, state) {
    engine.variables = { ...state.variables };
    engine.history = [...state.history];
    engine.currentScene = state.currentScene;
    engine.activeCharacters = new Set(state.activeCharacters);
    engine.TimeSystem.currentTime = state.timeState;

    // Restablecer el bloque actual
    if (state.currentBlock && state.commandIndex !== undefined) {
      //engine.scenes[engine.currentScene] = state.currentBlock;
      engine.currentCommandIndex = state.commandIndex;
    } else {
      engine.currentCommandIndex = 0;
    }

    console.log("Estado restaurado:", state);
  }
  showSaveMenu() {
    const savedSlots = this.getAvailableSlots();

    if (savedSlots.length === 0) {
      alert("No hay partidas guardadas.");
      return;
    }

    const options = savedSlots.map(slot => ({
      text: `Cargar "${slot}"`,
      action: [
        () => this.vnEngine.quickLoad(slot)
      ]
    }));

    // Mostrar como menú flotante NO BLOQUEANTE
    return Flow.Choice(options);
  }


  //pantalals de carga
  /**
   * Guarda el estado actual en un slot específico
   */
  saveToSlot(slot) {
    const state = this.captureGameState(this.vnEngine);
    localStorage.setItem(`game-save-${slot}`, JSON.stringify(state));
    console.log(`Guardado en slot ${slot}`);
  }

  /**
   * Carga un estado desde un slot
   */
  async loadFromSlot(slot) {
    this.vnEngine.clearMenus();
    const savedState = this.loadState(slot);
    if (savedState) {
      this.restoreGameState(this.vnEngine, savedState);
      await this.vnEngine.startScene(savedState.currentScene, this.vnEngine.currentCommandIndex);
      this.vnEngine.waitForClick();
    } else {
      console.warn("No hay partida guardada en este slot");
    }
  }
  /**
   * Muestra una pantalla con slots para guardar o cargar
   * @param {boolean} isLoadMode - true para carga, false para guardar
   */
  showSaveLoadScreen(isLoadMode = true) {
    const screen = document.getElementById('save-load-screen');
    const grid = document.getElementById('save-load-grid');
    // @ts-ignore
    grid.innerHTML = '';

    for (let i = 1; i <= 8; i++) {
      const slotName = `slot${i}`;
      const div = document.createElement('div');
      div.className = 'save-slot';
      div.textContent = `Slot ${i}`;

      const savedState = this.loadState(slotName);

      if (isLoadMode) {
        if (!savedState) {
          div.classList.add('empty');
          div.textContent = `Slot ${i} (vacío)`;
        } else {
          div.addEventListener('click', () => {
            this.loadFromSlot(slotName);
            // @ts-ignore
            screen.style.display = 'none';
          });
        }
      } else {
        if (savedState) {
          div.style.backgroundColor = '#555';
          div.textContent = `Slot ${i} (ocupado)`;
        }

        div.addEventListener('click', () => {
          this.saveToSlot(slotName);
          // @ts-ignore
          screen.style.display = 'none';
        });
      }

      // @ts-ignore
      grid.appendChild(div);

    }
    const divReturn = document.createElement('div');
    divReturn.className = 'save-slot';
    divReturn.textContent = `Return`;
    divReturn.addEventListener('click', () => {
      // @ts-ignore
      screen.style.display = 'none';
    });
    // @ts-ignore
    grid.appendChild(divReturn)
    // @ts-ignore
    screen.style.display = 'flex';
  }
}
