/**
 * @fileoverview Motor de Novelas Visuales - Basado en estructura Ren'Py, completamente web-first.
 * Permite mostrar escenas, personajes, diálogos, opciones interactivas, audio, video y tiempo dinámico.
 */

/**
 * @class VisualNovelEngine
 * @constructor
 */
class VisualNovelEngine {
  /**
   * Inicializa el motor con UI, sistema de tiempo, elementos multimedia y estilos.
   */
  constructor() {
    this.scenes = {}; // Almacena todas las escenas definidas
    this.currentScene = null; // Escena actual en ejecución
    this.history = []; // Historial de diálogos
    this.variables = {}; // Variables globales del juego
    this.activeCharacters = new Set(); // Personajes mostrados actualmente
    this.transitionDuration = 300; // Duración de transiciones en ms
    this.uiElements = {
      gameContainer: document.getElementById('game-container'),
      textContainer: document.getElementById('text-container'),
      textBox: document.getElementById('text-box'),
      nameBox: document.getElementById('name-box'),
      choicesContainer: document.getElementById('choices-container'),
      choicesContainerMenu: document.getElementById('choices-container-menu'),
      choicesContainerFullScreen: document.getElementById('choices-container-fullscreen'),
      background: document.getElementById('background'),
      characterSprites: document.getElementById('character-sprites')
    };
    this.TimeSystem = new TimeSystem(this); // Sistema de tiempo integrado
    this.activeAudioInstances = []; // Audios activos para controlarlos
    this.currentBackgroundAudio = null; // Audio actual del fondo
    this.currentCommandIndex = 0; // Índice actual del bloque de comandos
    this.injectTransitionStyles(); // Aplica estilos de transición iniciales
  }

  /**
   * Detiene todos los audios activos.
   */
  stopAllAudio() {
    this.activeAudioInstances.forEach(sound => {
      try {
        sound.pause();
        sound.currentTime = 0;
      } catch (e) {}
    });
    this.activeAudioInstances = [];
  }

  /**
   * Detiene el audio de fondo actual si existe.
   */
  stopCurrentAudio() {
    if (this.currentBackgroundAudio) {
      this.currentBackgroundAudio.pause();
      this.currentBackgroundAudio.currentTime = 0;
      this.currentBackgroundAudio = null;
    }
  }

  /**
   * Inyecta estilos CSS dinámicos para transiciones y efectos visuales.
   */
  injectTransitionStyles() {
    const style = document.createElement('style');
    style.textContent = `
.character {
  position: absolute;
  bottom: 0;
  transition: all ${this.transitionDuration}ms ease;
  opacity: 0;
  transform: translateY(20px);
}
.character.visible {
  opacity: 1;
  transform: translateY(0);
}
.character.left { left: 10%; }
.character.center { left: 50%; transform: translateX(-50%) translateY(0); }
.character.right { right: 10%; }
.character.hiding {
  opacity: 0;
  transform: translateY(20px);
}
.background-image {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity ${this.transitionDuration}ms ease;
}
.background-image.fade-out {
  opacity: 0;
}
.menu-tab-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
  z-index: 1000;
}
.menu-floating-container {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}
.positioned-choice {
  z-index: 1000;
  background-color: #444;
  color: white;
  padding: 10px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.positioned-choice:hover {
  background-color: #666;
}
.choice-button {
  background-color: #333;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}
.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}
`;
    document.head.appendChild(style);
  }

  /**
   * Define una escena para ser usada luego por startScene(...)
   * @param {string} sceneName - Nombre único de la escena
   * @param {Array<any>} sceneData - Bloque de comandos que define la escena
   */
  defineScene(sceneName, sceneData) {
    this.scenes[sceneName] = sceneData;
  }

  /**
   * Inicia la ejecución de una escena por su nombre.
   * @param {string} sceneName - Nombre de la escena
   */
  startScene(sceneName) {
    if (!this.scenes[sceneName]) {
      console.error(`Escena no encontrada: ${sceneName}`);
      return;
    }
    this.currentScene = sceneName;
    this.executeBlock(this.scenes[sceneName]);
  }

  /**
   * Ejecuta un bloque de comandos secuencialmente.
   * @param {Array<any>} block - Lista de comandos a ejecutar
   */
  async executeBlock(block) {
    for (const command of block) {
      await this.processCommand(command);
    }
  }

  /**
   * Procesa un comando individual según su tipo.
   * @param {Object} command - Comando a procesar
   */
  async processCommand(command) {
    let commandResult;

    // Si es una función, ejecutarla y obtener resultado
    if (typeof command === 'function') {
      commandResult = await command();
      if (!commandResult) {
        return;
      } else {
        command = commandResult;
      }
    }

    switch (command.type) {
      case 'say':
        await this.showText(command.name, command.text, command.audio);
        await this.waitForClick();
        break;

      case 'choice':
        await this.showChoices(command.options);
        break;

      case 'jump':
        this.startScene(command.target);
        return;

      case 'set':
        this.variables[command.var] = command.value;
        break;

      case 'if':
        const conditionMet = this.evaluateCondition(command.condition);
        if (conditionMet) {
          await this.executeBlock(command.then);
        } else if (command.else) {
          await this.executeBlock(command.else);
        }
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, command.duration));
        break;

      default:
        console.warn('Unknown command type:', command.type);
    }
  }

  /**
   * Evalúa una condición lógica basada en variables del juego.
   * @param {Object} condition - Objeto con tipo, operador y valor
   * @returns {boolean}
   */
  evaluateCondition(condition) {
    if (!condition) return true;
    if (condition.type === 'variable') {
      switch (condition.operator) {
        case '==': return (this.variables[condition.var] ?? 0) == condition.value;
        case '===': return this.variables[condition.var] === condition.value;
        case '>': return (this.variables[condition.var] ?? 0) > condition.value;
        case '<': return (this.variables[condition.var] ?? 0) < condition.value;
        case '>=': return (this.variables[condition.var] ?? 0) >= condition.value;
        case '<=': return (this.variables[condition.var] ?? 0) <= condition.value;
        case '!=': return (this.variables[condition.var] ?? 0) != condition.value;
        default: return false;
      }
    }
    return false;
  }

  /**
   * Muestra texto en pantalla y opcionalmente reproduce audio asociado.
   * @param {string} name - Nombre del personaje o Narrador
   * @param {string} text - Texto a mostrar
   * @param {string|undefined} [audio] - Ruta al audio opcional
   */
  async showText(name, text, audio = undefined) {
    this.uiElements.nameBox.textContent = name || '';
    this.uiElements.textBox.textContent = text;
    this.history.push({ name, text });

    let userClicked = false;
    const localAudios = [];

    if (audio) {
      const sound = new Audio(audio);
      sound.loop = false;
      try {
        await sound.play();
        sound.onended = () => {
          userClicked = true;
        };
        localAudios.push(sound);
      } catch (err) {
        console.warn('Error al reproducir audio:', err);
      }
    }

    await new Promise(resolve => {
      const checkAudioEnd = setInterval(() => {
        if (userClicked) {
          clearInterval(checkAudioEnd);
          resolve();
        }
      }, 200);

      const clickHandler = () => {
        document.removeEventListener('click', clickHandler);
        document.removeEventListener('keypress', keyHandler);
        clearInterval(checkAudioEnd);
        resolve();
      };

      const keyHandler = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          clickHandler();
        }
      };

      document.addEventListener('click', clickHandler);
      document.addEventListener('keypress', keyHandler);
    });

    // Detener cualquier audio lanzado durante este diálogo
    localAudios.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  /**
   * Espera un click o tecla Enter/espacio para continuar.
   * @returns {Promise<void>}
   */
  waitForClick() {
    return new Promise(resolve => {
      const handler = () => {
        document.removeEventListener('click', handler);
        document.removeEventListener('keypress', keyHandler);
        resolve();
      };

      const keyHandler = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          handler();
        }
      };

      document.addEventListener('click', handler);
      document.addEventListener('keypress', keyHandler);
    });
  }

  /**
   * Muestra menús con diferentes tipos de diseño.
   * @param {Array<Object>} options - Opciones de menú
   */
  async showChoices(options) {
    this.uiElements.choicesContainer.style.display = "none";
    this.uiElements.choicesContainerFullScreen.style.display = "none";
    this.uiElements.choicesContainer.innerHTML = '';

    const validOptions = options.filter(option =>
      !option.condition || this.evaluateCondition(option.condition)
    );

    if (validOptions.length === 0) return;

    const tabOptions = validOptions.filter(o => o.typeMenu === 'TAB');
    const menuOptions = validOptions.filter(o => o.typeMenu === 'MENU');
    const floatingOptions = validOptions.filter(o => o.typeMenu === 'FLOATING');
    const positionedOptions = validOptions.filter(o => o.xpos !== undefined && o.ypos !== undefined);
    const defaultOptions = validOptions.filter(o => !o.typeMenu && o.xpos === undefined);

    // 1. Menú TAB - Cuadrícula en esquina inferior derecha
    if (tabOptions.length > 0) {
      const tabWrapper = document.createElement('div');
      tabWrapper.className = 'menu-tab-container';
      tabWrapper.style.gridTemplateColumns = `repeat(${Math.min(4, tabOptions.length)}, 1fr)`;

      for (const option of tabOptions) {
        const button = await this.createChoiceButton(option);
        tabWrapper.appendChild(button);
      }

      this.uiElements.choicesContainer.appendChild(tabWrapper);
      this.uiElements.choicesContainer.style.display = "grid";
    }

    // 2. Menú lateral fijo - Tipo MENU
    if (menuOptions.length > 0) {
      const menuWrapper = document.createElement('div');
      menuWrapper.className = 'menu-container';

      for (const option of menuOptions) {
        const button = await this.createChoiceButton(option);
        menuWrapper.appendChild(button);
      }

      this.uiElements.choicesContainerFullScreen.appendChild(menuWrapper);
      this.uiElements.choicesContainerFullScreen.style.display = "flex";
    }

    // 3. Menú flotante - No bloquea el flujo
    if (floatingOptions.length > 0) {
      const floatingWrapper = document.createElement('div');
      floatingWrapper.className = 'menu-floating-container';

      for (const option of floatingOptions) {
        const button = await this.createChoiceButton(option);
        floatingWrapper.appendChild(button);
      }

      this.uiElements.choicesContainerFullScreen.appendChild(floatingWrapper);
      this.uiElements.choicesContainerFullScreen.style.display = "flex";
    }

    // 4. Opciones posicionadas manualmente
    for (const option of positionedOptions) {
      const button = await this.createChoiceButton(option);
      button.style.position = 'absolute';
      button.style.left = `${(this.uiElements.background?.offsetWidth * (option.xpos / 100))}px`;
      button.style.top = `${(this.uiElements.background?.offsetHeight * (option.ypos / 100))}px`;
      this.uiElements.choicesContainerFullScreen.appendChild(button);
      this.uiElements.choicesContainerFullScreen.style.display = "flex";
    }

    // 5. Opciones normales (centradas)
    const normalOptions = [...defaultOptions];
    if (normalOptions.length > 0) {
      this.uiElements.choicesContainer.style.opacity = "0";
      const defaultWrapper = document.createElement('div');
      defaultWrapper.className = 'default-choice-wrapper';
      defaultWrapper.style.display = 'flex';
      defaultWrapper.style.flexDirection = 'column';
      defaultWrapper.style.gap = '10px';

      for (const option of normalOptions) {
        const button = await this.createChoiceButton(option, defaultWrapper);
        defaultWrapper.appendChild(button);
      }

      this.uiElements.choicesContainer?.appendChild(defaultWrapper);
      void defaultWrapper.offsetWidth;
      this.uiElements.choicesContainer.style.opacity = "1";

      // Solo esperar click si hay opciones normales
      await this.waitForClick();
    }
  }

  /**
   * Crea un botón de opción reutilizable.
   * @param {Object} option - Configuración de la opción
   * @param {HTMLElement} [parent] - Opcional, contenedor padre
   * @returns {HTMLButtonElement}
   */
  async createChoiceButton(option, parent) {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.textContent = option.text;

    if (option.icon) {
      const icon = document.createElement('img');
      icon.src = option.icon;
      icon.className = 'menu-icon';
      button.prepend(icon);
    }

    button.addEventListener('click', async () => {
      button.classList.add('fade-out');
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
      if (parent) {
        parent.remove();
      }
      if (option.action) {
        await this.executeBlock(option.action);
      }
    });

    return button;
  }

  /**
   * Cambia el fondo con transición, soporta imagen o video.
   * @param {Object} command - Comando de escena
   */
  async changeBackground(command) {
    this.stopCurrentAudio();

    const currentBg = this.uiElements.background.querySelector('.background-image:not(.fade-out)');
    const newBgContainer = document.createElement('div');
    newBgContainer.className = 'background-image';
    newBgContainer.style.position = 'absolute';
    newBgContainer.style.width = '100%';
    newBgContainer.style.height = '100%';
    newBgContainer.style.opacity = 0;

    let mediaElement = null;
    let audioInstance = null;

    // Reproducir audio asociado si existe
    if (command.audio) {
      audioInstance = new Audio(command.audio);
      audioInstance.loop = command.loopAudio ?? true;
      try {
        await audioInstance.play();
        this.currentBackgroundAudio = audioInstance;
      } catch (err) {
        console.warn('Error al reproducir audio:', err);
      }
    }

    // Manejo de video
    if (command.video) {
      let validVideoUrl = null;

      // Si ya tiene extensión, intentar directamente
      const hasExtension = /\.\w+$/.test(command.video);
      if (hasExtension) {
        const response = await fetch(command.video, { method: 'HEAD' }).catch(() => null);
        if (response?.ok) {
          validVideoUrl = command.video;
        }
      }

      // Si no hay extensión o falló, probar con varias extensiones
      if (!validVideoUrl) {
        validVideoUrl = await this.tryLoadVideo(command.video);
      }

      // Si encontramos un video válido, crear el elemento
      if (validVideoUrl) {
        mediaElement = document.createElement('video');
        mediaElement.src = validVideoUrl;
        mediaElement.autoplay = true;
        mediaElement.muted = false;
        mediaElement.loop = command.loopScene ?? false;
        mediaElement.playsInline = true;
        mediaElement.style.width = '100%';
        mediaElement.style.height = '100%';
        mediaElement.style.objectFit = 'cover';
        newBgContainer.appendChild(mediaElement);

        try {
          await mediaElement.play();

          // Si no es loop, esperar hasta terminar o timeout
          if (!mediaElement.loop) {
            const videoEnded = new Promise(resolve => {
              mediaElement.onended = resolve;
            });
            const timeout = new Promise(resolve => setTimeout(resolve, 5000));
            await Promise.race([videoEnded, timeout]);
          }

        } catch (err) {
          console.warn("Reproducción automática bloqueada:", err);
        }

        // Detener video anterior si existe
        if (currentBg) {
          const oldVideo = currentBg.querySelector('video');
          if (oldVideo) {
            oldVideo.pause();
            oldVideo.currentTime = 0;
          }
        }

      } else {
        console.warn("No se pudo cargar ningún video válido.");
      }
    }

    // Manejo de imagen
    else if (command.image) {
      let timeLayout = "";
      if (command.isAffectedByTime) {
        timeLayout = this.getTimeSuffix();
        let validImage = await this.loadImageWithExtensions(command.image + timeLayout);
        if (!validImage) {
          validImage = await this.loadImageWithExtensions(command.image);
        }
        newBgContainer.style.backgroundImage = `url('${validImage}')`;
      } else {
        newBgContainer.style.backgroundImage = `url('${command.image}')`;
      }

      newBgContainer.style.backgroundSize = 'cover';
      newBgContainer.style.backgroundPosition = 'center';
    }

    this.uiElements.background.appendChild(newBgContainer);

    // Forzar reflow para activar transición
    void newBgContainer.offsetWidth;

    // Eliminar fondo anterior
    if (currentBg) {
      currentBg.classList.add('fade-out');
      setTimeout(() => {
        currentBg.remove();
      }, 200);
    }

    // Activar opacidad
    newBgContainer.style.opacity = '1';

    // Esperar a que termine la transición visual
    await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
  }

  /**
   * Intenta cargar un video probando múltiples extensiones.
   * @param {string} url - URL base sin extensión
   * @returns {Promise<string|null>} - Devuelve la URL válida o null si falla
   */
  async tryLoadVideo(url) {
    const extensions = ['webm', 'mp4', 'ogg'];
    for (const ext of extensions) {
      const testUrl = `${url}.${ext}`;
      try {
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          return testUrl;
        }
      } catch (e) {
        continue;
      }
    }
    console.warn(`No se encontró ningún formato válido para el video: ${url}`);
    return null;
  }

  /**
   * Carga una imagen probando varias extensiones.
   * @param {string} basePath - Ruta base sin extensión
   * @returns {Promise<string|null>} - Devuelve la URL válida o null
   */
  async loadImageWithExtensions(basePath) {
    const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
    for (const ext of extensions) {
      const url = `${basePath}.${ext}`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (e) {
        continue;
      }
    }
    console.warn(`Ninguna extensión válida encontrada para: ${basePath}`);
    return null;
  }

  /**
   * Devuelve sufijo de tiempo (ej: _morning, _night).
   * @returns {string}
   */
  getTimeSuffix() {
    const hour = this.TimeSystem.getCurrentTime().hour;
    if (hour >= 5 && hour < 12) return "_morning";
    if (hour >= 12 && hour < 17) return "_afternoon";
    if (hour >= 17 && hour < 20) return "_sunset";
    return "_night";
  }

  /**
   * Muestra un personaje en pantalla con transición.
   * @param {string} character - Nombre del personaje
   * @param {string} image - Ruta base del personaje
   * @param {string} [position="center"] - Posición: left, right, center
   */
  async showCharacter(character, image, position = 'center') {
    // Si el personaje ya está visible, solo actualizamos su imagen
    if (this.activeCharacters.has(character)) {
      const existing = document.querySelector(`.character[data-character="${character}"]`);
      if (existing) {
        existing.src = image;
        existing.className = `character ${position}`;
        return;
      }
    }

    // Crear nuevo elemento
    let element;

    // Detectar si es un video (para animaciones con transparencia)
    const isVideo = /\.(webm|mp4|ogg)$/i.test(image);
    if (isVideo) {
      element = document.createElement('video');
      element.src = image;
      element.autoplay = true;
      element.loop = true;
      element.muted = true;
      element.playsInline = true;
      element.style.objectFit = 'contain';
    } else {
      element = document.createElement('img');
      element.src = image;
    }

    element.className = `character ${position}`;
    element.dataset.character = character;
    element.alt = character;

    this.uiElements.characterSprites.appendChild(element);
    this.activeCharacters.add(character);

    // Forzar reflow para activar transición
    void element.offsetWidth;
    element.classList.add('visible');

    // Si es video, iniciar reproducción
    if (isVideo && element instanceof HTMLVideoElement) {
      try {
        await element.play();
      } catch (err) {
        console.warn("No se pudo reproducir el video:", err);
      }
    }

    // Esperar a que termine la transición visual
    await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
  }

  /**
   * Oculta un personaje con transición suave.
   * @param {string} character - Nombre del personaje
   */
  async hideCharacter(character) {
    const elements = document.querySelectorAll(`.character[data-character="${character}"]`);
    if (elements.length === 0) return;

    for (const el of elements) {
      el.classList.remove('visible');
      el.classList.add('hiding');

      // Esperar a que termine la transición antes de remover
      await new Promise(resolve => {
        el.addEventListener('transitionend', () => {
          el.remove();
          resolve();
        }, { once: true });
      });
    }

    this.activeCharacters.delete(character);
  }

  /**
   * Método principal de interacción con el usuario.
   * @returns {Promise<void>}
   */
  waitForClick() {
    return new Promise(resolve => {
      const handler = () => {
        document.removeEventListener('click', handler);
        document.removeEventListener('keypress', keyHandler);
        resolve();
      };

      const keyHandler = (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          handler();
        }
      };

      document.addEventListener('click', handler);
      document.addEventListener('keypress', keyHandler);
    });
  }

  /**
   * Avanza el tiempo y refresca la escena actual si es necesario.
   * @param {number} hoursToAdd - Horas a sumar
   */
  async advanceTimeAndRefresh(hoursToAdd = 1) {
    this.TimeSystem.advanceTime(hoursToAdd);
    this.TimeSystem.updateTimeUI();

    if (this.scenes[this.currentScene]) {
      this.uiElements.background.innerHTML = '';
      this.changeBackground(this.scenes[this.currentScene][0]);
    }
  }
}