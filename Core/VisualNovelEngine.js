//@ts-check
import { SaveSystem } from "./SaveSystem.js";
import { TimeSystem } from './TimeSystem.js';


export class VisualNovelEngine {
  GetCurrenTime() {
    return this.TimeSystem.currentTime
  }
  SetProps(Vars = {}) {
    for (const key in this.variables) {
      if (Vars.hasOwn(key)) {
        Vars[key] = this.variables[key]
      }
      //console.log("test", Vars);

    }
  }
  constructor() {
    this.jumpTriggered = false;
    this.scenes = {};
    this.currentScene = null;
    this.currentSceneImage = null;
    this.history = [];
    this.variables = {};
    this.activeCharacters = new Set(); // Track active characters
    this.transitionDuration = 300; // Default transition duration in ms
    this.uiElements = {
      gameContainer: this.getUiElement('game-container'),
      gloablMenuContainer: this.getUiElement('global-choices-container-menu'),
      textContainer: this.getUiElement('text-container'),
      textBox: this.getUiElement('text-box'),
      nameBox: this.getUiElement('name-box'),
      choicesContainer: this.getUiElement('choices-container'),
      choicesContainerMenu: this.getUiElement('choices-container-menu'),
      choicesContainerFullScreen: this.getUiElement('choices-container-fullscreen'),
      background: this.getUiElement('background'),
      characterSprites: this.getUiElement('character-sprites')
    };
    this.TimeSystem = new TimeSystem(this);
    this.activeAudioInstances = [];
    /**@type {HTMLAudioElement?} */
    this.currentBackgroundAudio = new Audio();
    this.currentCommandIndex = 0;
    this.currentsBlocks = [];
    // CSS for transitions
    this.injectTransitionStyles();
  }
  getUiElement(id) {
    let uiElement = document.getElementById(id);
    if (uiElement) {
      return uiElement;
    }
    uiElement = document.createElement("div");
    uiElement.id = id;
    document.body.appendChild(uiElement);
    return uiElement;
  }

  setglobalMenu(command) {
    this.showChoices(command.options, true, this.currentScene);
  }

  stopAllAudio() {
    console.log(this.activeAudioInstances);

    this.activeAudioInstances.forEach(sound => {
      try {
        sound.pause();
        sound.currentTime = 0;
      } catch (e) { }
    });
    this.activeAudioInstances = [];
  }

  stopCurrentAudio() {
    if (this.currentBackgroundAudio) {
      this.currentBackgroundAudio.pause();
      this.currentBackgroundAudio.currentTime = 0;
      this.currentBackgroundAudio = null;
    }
  }

  // Inyectar estilos CSS para transiciones
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
        transition: opacity ${this.transitionDuration}ms ease;
      }
      .background-image.fade-out {
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
  }

  // Definir una escena
  defineScene(sceneName, sceneData) {
    this.scenes[sceneName] = sceneData;
  }

  // Iniciar una escena
  startScene(sceneName, inBlock) {
    this.jumpTriggered = true;
    // Limpiar variables temporales
    this.currentCommandIndex = 0;
    console.log(sceneName, this.scenes[sceneName]);

    if (!this.scenes[sceneName]) {
      console.error(`Escena no encontrada: ${sceneName}`);
      return;
    }
    this.currentScene = sceneName;
    this.currentsBlocks = this.scenes[sceneName]
    this.executeBlock(this.currentsBlocks, sceneName);
  }

  goToCurrentScene() {
    try {
      if (!this.scenes[this.currentScene]) {
        console.error(`Escena no encontrada: ${this.currentScene}`);
        return;
      }
      this.currentsBlocks = this.scenes[this.currentScene]
      this.executeBlock(this.currentsBlocks, this.currentScene);
    } catch (error) {
      console.log(error);
      console.log(this.currentScene);
      console.table(this.scenes[this.currentScene]);
    }
  }

  // Ejecutar un bloque de comandos
  async executeBlock(blocks = this.currentsBlocks, sceneName) {
    try {
      this.currentCommandIndex = 0;
      for (const command of blocks) {

        if (sceneName != this.currentScene && !this.jumpTriggered) return; // ✅ Salir si ya se saltó
        else this.jumpTriggered = false

        const returnCommand = await this.processCommand(command, sceneName);
        this.currentCommandIndex++;
        if (returnCommand == false) {
          if (this.clickHandler) document.removeEventListener('click', this.clickHandler);
          if (this.keyHandler) document.removeEventListener('keypress', this.keyHandler);
          break;
        }
      }
    } catch (error) {
      console.log(error);
      console.table(blocks);
    }

  }

  // Procesar un comando individual
  async processCommand(commandValue, sceneName) {
    if (this.jumpTriggered) return;
    let command = {}
    if (typeof commandValue === "function") {
      command = commandValue;
    }
    else {
      for (const key in commandValue) {
        command[key] = commandValue[key]
      }
    }
    this.TimeSystem.updateTimeUI();
    let commandResult;
    if (typeof command === 'function') {
      commandResult = await command();
      if (!commandResult) {
        return;
      } else {
        command = commandResult
        //console.log(command);
      }
    }
    if (!command || !command.type) return;
    switch (command.type) {
      case 'say':
        await this.showText(command.name, command.text, command.audio, command.isFemale);
        //await this.waitForClick();
        break;
      case 'show':
        await this.showCharacter(command.who, command.image, command.position);
        break;
      case 'audio':
        if (command.audio) {
          this.stopCurrentAudio()
          const audioInstance = new Audio(command.audio);
          audioInstance.loop = command.loopAudio ?? true;
          try {
            await audioInstance.play();
            this.currentBackgroundAudio = audioInstance; // Guardamos para detener después
          } catch (err) {
            console.warn('Error al reproducir audio:', err);
          }
        }
        break;
      case 'hide':
        await this.hideCharacter(command.who);
        break;
      case 'scene':
        await this.changeBackground(command);
        break;
      case 'jump':
        this.clearMenus();
        this.startScene(command.target);
        return false; // Exit current execution

      case 'choice':
        await this.showChoices(command.options, undefined, sceneName);
        break;

      case 'set':
        this.variables[command.var] = command.value;
        break;

      case 'if':
        const conditionMet = this.evaluateCondition(command.condition);
        console.log(conditionMet);

        if (conditionMet) {
          await this.executeBlock(command.then, sceneName);
        } else if (command.else) {
          await this.executeBlock(command.else, sceneName);
        }
        break;

      case 'wait':
        await new Promise(resolve => setTimeout(resolve, command.duration));
        break;

      default:
        console.warn('Unknown command type:', command.type);
    }
    return true;
  }


  /**
   * Muestra texto con animación de escritura (letra por letra)
   * @param {string} name - Nombre del hablante
   * @param {string} text - Texto a mostrar
   * @param {string|null} [audio] - Audio opcional asociado
   */
  async showText(name, text, audio = null, isFemale = false) {
    // @ts-ignore TODO REVISAR
    this.uiElements.textBox.block = "flex";
    if (isFemale) {
      this.uiElements.nameBox.className = "female"
    } else {
      this.uiElements.nameBox.className = "male"
    }
    this.uiElements.nameBox.textContent = name || '';
    this.uiElements.textBox.textContent = '';
    this.history.push({ name, text });

    let audioFinished = false;
    const localAudios = [];

    if (audio) {
      this.stopAllAudio();
      const sound = new Audio(audio);
      sound.loop = false;
      this.activeAudioInstances.push(sound);
      localAudios.push(sound);
      try {
        await sound.play();
        sound.onended = () => {
          audioFinished = true;
        };
        sound.onerror = () => {
          console.warn('Error al reproducir audio:', audio);
          audioFinished = true;
        };
      } catch (err) {
        console.warn('No se pudo reproducir el audio:', err);
        audioFinished = true;
      }
    }
    this.uiElements.textContainer.style.opacity = "1";
    // ANIMACIÓN DE TEXTO LETRA POR LETRA
    const textBox = this.uiElements.textBox;
    textBox.textContent = '';
    textBox.style.opacity = "0"; // Ocultar antes de comenzar

    // Esperar un fotograma para permitir que transition funcione
    await new Promise(r => requestAnimationFrame(r));

    // Mostrar suavemente
    textBox.style.opacity = "1";

    // Animación letra por letra
    for (let i = 0; i < text.length; i++) {
      textBox.textContent += text[i];
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Esperar al menos 2 segundos antes de permitir avanzar
    const minWait = new Promise(resolve => setTimeout(resolve, 1000));

    // También esperar que termine el audio o que el usuario interactúe
    const userOrAudio = new Promise(resolve => {
      const checkAudioEnd = setInterval(() => {
        if (audioFinished) {
          clearInterval(checkAudioEnd);
          cleanup();
          resolve(true);
        }
      }, 200);

      const cleanup = () => {
        document.removeEventListener('click', clickHandler);
        document.removeEventListener('keypress', keyHandler);
        clearInterval(checkAudioEnd);
      };

      const clickHandler = () => {
        cleanup();
        resolve(true);
      };

      const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          cleanup();
          resolve(true);
        }
      };

      document.addEventListener('click', clickHandler);
      document.addEventListener('keypress', keyHandler);
    });

    // Esperar ambos: mínimo 2 segundos Y audio/usuario
    await Promise.all([minWait, userOrAudio]);

    // Detener todos los audios de esta escena
    localAudios.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }


  // Mostrar personaje con transición
  async showCharacter(character, image, position = 'center') {
    // Si ya está visible, solo actualizamos la imagen o video
    let imageUrl = await this.loadImageWithExtensions(image);
    if (this.activeCharacters.has(character)) {
      const existing = document.querySelector(`.character[data-character="${character}"]`);
      if (existing) {
        // @ts-ignore
        existing.src = imageUrl;
        existing.className = `character visible ${position}`;
        return;
      }
    }
    // Crear elemento nuevo
    let element;
    // Detectar si es un video (por extensión)
    const isVideo = /\.(webm|mp4|ogg|mov)$/i.test(imageUrl);
    if (isVideo) {
      element = document.createElement('video');
      element.src = imageUrl;
      element.autoplay = true;
      element.loop = true;
      element.muted = true;
      element.playsInline = true;
      element.style.objectFit = 'contain';
    } else {
      element = document.createElement('img');
      element.src = imageUrl;
    }

    element.className = `character ${position}`;
    element.dataset.character = character;
    // @ts-ignore
    element.alt = character;

    this.uiElements.characterSprites.appendChild(element);
    this.activeCharacters.add(character);

    // Forzar reflow y activar transición
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

    // Esperar transición
    await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
  }

  async loadImageWithExtensions(basePath) {
    const extensions = ['mov', 'webp', 'png', 'jpg', 'gif', 'webm', 'mp4'];
    const hasExtension = /\.\w+$/.test(basePath);

    // Si ya tiene extensión, intentar directamente
    if (hasExtension) {
      try {
        const response = await fetch(basePath, { method: 'HEAD' });
        if (response.ok) {
          return basePath;
        }
      } catch (_) {
        // No mostrar nada aquí para evitar ruido en consola
      }
    }

    // Probar con múltiples extensiones silenciosamente
    for (const ext of extensions) {
      const url = `${basePath}.${ext}`;
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (_) {
        // No mostrar errores aquí
      }
    }

    // Solo mostrar advertencia si ningún recurso fue válido
    console.warn(`Ninguna extensión válida encontrada para: ${basePath}`);
    return null;
  }


  // Ocultar personaje con transición
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
          resolve(true);
        }, { once: true });
      });
    }

    this.activeCharacters.delete(character);
  }

  async hideAllCharacter() {
    const elements = document.querySelectorAll(`.character`);

    if (elements.length === 0) return;

    for (const el of elements) {
      el.classList.remove('visible');
      el.classList.add('hiding');

      // Esperar a que termine la transición antes de remover
      await new Promise(resolve => {
        el.addEventListener('transitionend', () => {
          el.remove();
          resolve(true);
        }, { once: true });
      });
    }
  }

  // Cambiar fondo con transición
  async changeBackground(command) {
    // Si es solo una URL (imagen), convertirlo en un comando compatible
    if (typeof command === 'string') {
      command = { image: command };
    }

    // Detener cualquier audio previo

    this.hideAllCharacter()

    const currentBg = this.uiElements.background?.querySelector('.background-image:not(.fade-out)');
    const newBgContainer = document.createElement('div');
    newBgContainer.className = 'background-image';
    newBgContainer.style.position = 'absolute';
    newBgContainer.style.width = '100%';
    newBgContainer.style.height = '100%';
    newBgContainer.style.opacity = "0";

    let mediaElement = null;
    let audioInstance = null;

    // Reproducir audio asociado si existe
    if (command.audio) {
      this.stopAllAudio()
      audioInstance = new Audio(command.audio);
      audioInstance.loop = command.loopAudio ?? true;
      try {
        await audioInstance.play();
        this.activeAudioInstances.push(audioInstance)
        //this.currentBackgroundAudio = audioInstance; // Guardamos para detener después
      } catch (err) {
        console.warn('Error al reproducir audio:', err);
      }
    }
    command.video = command.video ?? await this.tryLoadVideo(command.image);

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
        mediaElement.loop = command.loopScene ?? true;
        mediaElement.playsInline = true;
        mediaElement.style.width = '100%';
        mediaElement.style.height = '100%';
        mediaElement.style.objectFit = 'cover';

        newBgContainer.appendChild(mediaElement);

        try {
          await mediaElement.play();
          // Si no es loop, esperar hasta que termine o pasen 5 segundos
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
        // Opcional: mostrar imagen alternativa o mensaje
      }
    }

    // Manejo de imagen
    else if (command.image && command.video == null) {
      // Intentar encontrar una imagen válida
      let imageUrl = command.image;

      if (command.isAffectedByTime) {
        const suffix = this.getTimeSuffix();

        // Separar nombre y extensión si hay extensión
        const match = imageUrl.match(/^(.*)(\.\w+)$/);
        if (match) {
          // Hay extensión → insertar sufijo antes
          imageUrl = `${match[1]}${suffix}${match[2]}`;
        } else {
          // No hay extensión → agregar sufijo al final
          imageUrl = `${imageUrl}${suffix}`;
        }
      }
      let validImage = await this.loadImageWithExtensions(imageUrl);
      newBgContainer.style.backgroundImage = `url('${validImage}')`;
      newBgContainer.style.backgroundSize = 'cover';
      newBgContainer.style.backgroundPosition = 'center';
    }

    this.uiElements.background?.appendChild(newBgContainer);

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
    if (command.video) {
      await this.waitForClick()
    }
  }

  getTimeSuffix() {
    const hour = this.TimeSystem.getCurrentTime().hour;

    if (hour >= 5 && hour < 12) return "_day";
    if (hour >= 12 && hour < 15) return "_day";
    if (hour >= 15 && hour < 20) return "_afternoon";
    if (hour >= 20 || hour < 1) return "_night";
    if (hour >= 1 || hour < 5) return "_night";

    return "_day"; // fallback
  }

  async tryLoadVideo(url, extensions = ['mp4', 'webm', 'ogg', 'avi', 'AVI']) {

    for (const ext of extensions) {
      const testUrl = `${url}.${ext}`;
      try {
        const response = await fetch(testUrl, { method: 'HEAD' }).catch(() => null);
        if (response?.ok) {
          return testUrl; // Retorna la primera extensión válida
        }
      } catch (_) {
        // Silenciar errores por extensión no encontrada
      }
    }
    //console.error(`No se encontró ningún formato válido para el video: ${url}`);
    return null;
  }




  async showChoices(options, isGlobal = false, sceneName) {
    this.uiElements.textContainer.style.opacity = "0";
    const validOptions = options.filter((/** @type {{ condition: any; }} */ option) =>
      !option.condition || this.evaluateCondition(option.condition)
    );

    if (validOptions.length === 0) return;

    // Separar por tipo de menú
    const tabOptions = validOptions.filter(o => o.typeMenu === 'TAB');
    const menuOptions = validOptions.filter(o => o.typeMenu === 'MENU');
    const floatingOptions = validOptions.filter(o => o.typeMenu === 'FLOATING');
    const positionedOptions = validOptions.filter(o => o.xpos !== undefined && o.ypos !== undefined);
    const defaultOptions = validOptions.filter(o => !o.typeMenu && o.xpos === undefined);

    // 1. Menú TAB - Cuadrícula en esquina inferior derecha
    if (tabOptions.length > 0) {
      this.uiElements.choicesContainer.style.opacity = "0";
      const tabWrapper = document.createElement('div');
      tabWrapper.className = 'menu-wrapper menu-tab-container';
      tabWrapper.style.gridTemplateColumns = `repeat(${Math.min(4, tabOptions.length)}, 1fr)`;

      for (const option of tabOptions) {
        const button = await this.createChoiceButton(option, undefined, sceneName);
        tabWrapper.appendChild(button);
      }
      if (!isGlobal) {
        this.uiElements.choicesContainer?.appendChild(tabWrapper);
        this.uiElements.choicesContainer.style.display = "grid";
        this.uiElements.choicesContainer.style.opacity = "1";
      } else {
        this.uiElements.gloablMenuContainer?.appendChild(tabWrapper);
      }
    }

    // 2. Menú lateral fijo - Tipo MENU
    if (menuOptions.length > 0) {
      this.uiElements.choicesContainerFullScreen.style.opacity = "0";
      const menuWrapper = document.createElement('div');
      menuWrapper.className = 'menu-wrapper menu-container';

      for (const option of menuOptions) {
        const button = await this.createChoiceButton(option, undefined, sceneName);
        menuWrapper.appendChild(button);
      }
      if (!isGlobal) {
        this.uiElements.choicesContainerFullScreen?.appendChild(menuWrapper);
        this.uiElements.choicesContainerFullScreen.style.display = "flex";
        this.uiElements.choicesContainerFullScreen.style.opacity = "1"

      } else {
        this.uiElements.gloablMenuContainer?.appendChild(menuWrapper);
      }
    }

    // 3. Menú flotante - No bloquea el flujo
    if (floatingOptions.length > 0) {
      this.uiElements.choicesContainerMenu.style.opacity = "0"
      this.uiElements.choicesContainerMenu.innerHTML = ""
      const floatingWrapper = document.createElement('div');
      floatingWrapper.className = 'menu-wrapper menu-floating-container';

      for (const option of floatingOptions) {
        const button = await this.createChoiceButton(option, undefined, sceneName);
        floatingWrapper.appendChild(button);
      }
      if (!isGlobal) {
        this.uiElements.choicesContainerMenu?.appendChild(floatingWrapper);
        this.uiElements.choicesContainerMenu.style.display = "flex";
        this.uiElements.choicesContainerMenu.style.opacity = "1"
      }
      else {
        this.uiElements.gloablMenuContainer?.appendChild(floatingWrapper);
      }
      // NO esperamos click ni promesa aquí
    }
    if (positionedOptions.length > 0) {
      this.uiElements.choicesContainerFullScreen.style.opacity = "0"
      const positionedWrapper = document.createElement('div');
      positionedWrapper.className = 'menu-wrapper menu-positioned-container';
      // 4. Opciones posicionadas manualmente
      for (const option of positionedOptions) {
        const button = await this.createChoiceButton(option, positionedWrapper, sceneName);
        button.style.position = 'absolute';
        //button.style.left = `${(this.uiElements.background.offsetWidth * (option.xpos / 100))}px`;
        //button.style.top = `${(this.uiElements.background.offsetHeight * (option.ypos / 100))}px`; heightPercent, widthPercent
        button.style.left = `${option.xpos}%`;
        button.style.bottom = `${option.ypos}%`;
        console.log("test", option);
        if (option.heightPercent || option.widthPercent) {
          console.log(option);

          button.style.height = option.heightPercent ? `${option.heightPercent}%` : "auto";
          button.style.width = option.widthPercent ? `${option.widthPercent}%` : "auto";
          button.style.background = "none"
        }

        positionedWrapper.appendChild(button);
      }


      if (!isGlobal) {
        this.uiElements.choicesContainerFullScreen?.appendChild(positionedWrapper);
        this.uiElements.choicesContainerFullScreen.style.display = "flex";
        this.uiElements.choicesContainerFullScreen.style.opacity = "1"

      } else {
        this.uiElements.gloablMenuContainer?.appendChild(positionedWrapper);
      }
    }

    // 5. Opciones normales (centradas)
    const normalOptions = [...defaultOptions];
    if (normalOptions.length > 0) {
      this.uiElements.choicesContainer.style.opacity = "0"
      const defaultWrapper = document.createElement('div');
      defaultWrapper.className = 'menu-wrapper default-choice-wrapper';
      defaultWrapper.style.display = 'flex';
      defaultWrapper.style.flexDirection = 'column';
      defaultWrapper.style.gap = '10px';

      for (const option of normalOptions) {
        const button = await this.createChoiceButton(option, defaultWrapper, sceneName);
        defaultWrapper.appendChild(button);
      }
      if (!isGlobal) {
        this.uiElements.choicesContainer?.appendChild(defaultWrapper);
        this.uiElements.choicesContainer.style.display = "flex";
        this.uiElements.choicesContainer.style.opacity = "1"

      } else {
        this.uiElements.gloablMenuContainer?.appendChild(defaultWrapper);
      }
      // Solo esperar click si hay opciones normales
      await new Promise(resolve => {
        const buttons = defaultWrapper.querySelectorAll('button');
        const handler = () => {
          buttons.forEach(btn => btn.removeEventListener('click', handler));
          resolve(true);
        };

        buttons.forEach(btn => btn.addEventListener('click', handler));
      });
    }
  }

  clearMenus() {
    this.uiElements.gameContainer?.querySelectorAll(".menu-wrapper").forEach(menu => {
      // @ts-ignore
      if (menu.parentNode.id == "global-choices-container-menu") {
        return
      }
      // @ts-ignore
      menu.style.opacity = "0";
      setTimeout(() => {
        menu.remove();
      }, 1000);
    })
    this.uiElements.choicesContainerFullScreen.style.opacity = "0"
    this.uiElements.choicesContainer.style.opacity = "0"
    this.uiElements.choicesContainerMenu.style.opacity = "0";
    //this.uiElements.textBox.innerHTML = "";
    //this.uiElements.nameBox.innerHTML = "";
    this.uiElements.textContainer.style.opacity = "0";
  }

  async createChoiceButton(option, menuWrapper, sceneName) {
    const button = document.createElement('button');

    // Mantener las clases originales según el tipo de menú
    if (option.typeMenu === 'TAB') {
      button.className = 'choice-button menu-tab-item';
    } else if (option.typeMenu === 'MENU') {
      button.className = 'choice-button menu-item';
    } else if (option.xpos !== undefined && option.ypos !== undefined) {
      button.className = 'choice-button positioned-choice';
    } else if (option.typeMenu === 'FLOATING') {
      button.className = 'choice-button menu-floating-item';
    } else {
      button.className = 'choice-button';
    }
    button.textContent = option.text;
    // Agregar icono si existe
    if (option.icon) {

      // Intentar encontrar una imagen válida
      let validImage = await this.loadImageWithExtensions(option.icon);
      if (!validImage) {
        console.warn(`No se pudo cargar la imagen para icono "${option.icon}"`);
      }
      const icon = document.createElement('img');
      icon.src = validImage;
      icon.className = 'menu-icon';
      button.prepend(icon);
    }

    // Acción al hacer click
    button.addEventListener('click', async () => {
      if (menuWrapper) {
        menuWrapper.remove()
      }
      button.classList.add('fade-out');
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
      //console.log(menuWrapper);
      if (option.action) {
        // @ts-ignore
        if (button.parentNode?.parentNode?.id == 'global-choices-container-menu') {
          this.jumpTriggered = true
        }
        await this.executeBlock(option.action, sceneName);

      }
    });

    return button;
  }
  // Esperar click para continuar
  // waitForClick queda auto-contenida y recuerda los listeners previos
  waitForClick = (() => {
    this.clickHandler = null;
    this.keyHandler = null;

    return (time = Date.now()) => {
      console.log('espera', time);

      // ① Limpiar cualquier listener viejo
      if (this.clickHandler) document.removeEventListener('click', this.clickHandler);
      if (this.keyHandler) document.removeEventListener('keypress', this.keyHandler);

      return new Promise(resolve => {
        this.clickHandler = () => {
          // ② Retirar los listeners actuales
          document.removeEventListener('click', this.clickHandler);
          // @ts-ignore
          document.removeEventListener('keypress', this.keyHandler);
          this.clickHandler = this.keyHandler = null;        // liberar variables
          resolve(true);
          console.log('libera:', time);
        };

        this.keyHandler = e => {
          if (e.key === ' ' || e.key === 'Enter') {
            this.clickHandler();
          }
        };

        // ③ Registrar los nuevos listeners
        document.addEventListener('click', this.clickHandler);
        document.addEventListener('keypress', this.keyHandler);
      });
    };
  })();

  // Evaluar condición mejorada
  evaluateCondition(condition) {
    if (!condition) return true;
    ////console.log("ev:", condition);
    //console.log("result:", condition.var, this.variables[condition.var], this.variables[condition.var] == condition.value);
    if (!this.variables[condition.var]) {
      this.variables[condition.var] = 0;
    }
    switch (condition.type) {
      case 'variable':
        const value = this.variables[condition.var];
        switch (condition.operator) {
          case '==': return value == condition.value;
          case '!=': return value != condition.value;
          case '>': return value > condition.value;
          case '<': return value < condition.value;
          case '>=': return value >= condition.value;
          case '<=': return value <= condition.value;
          default: return false;
        }
      case 'time':
        const currentHour = this.TimeSystem.getCurrentTime().hour;
        switch (condition.operator) {
          case '==': return currentHour == condition.value;
          case '>': return currentHour > condition.value;
          case '<': return currentHour < condition.value;
          case '>=': return currentHour >= condition.value;
          case '<=': return currentHour <= condition.value;
          default: return false;
        }
      case 'and':
        return condition.conditions.every(c => this.evaluateCondition(c));

      case 'or':
        return condition.conditions.some(c => this.evaluateCondition(c));

      case 'not':
        return !this.evaluateCondition(condition.condition);

      default:
        return false;
    }
  }

  //GUARDADO 
  quickSave(slot = 'slot1') {
    saveSystem.saveToSlot(slot);
  }

  quickLoad(slot = 'slot1') {
    saveSystem.loadFromSlot(slot);
  }
}
const vnEngine = new VisualNovelEngine();
const saveSystem = new SaveSystem(vnEngine);

export { vnEngine, saveSystem };