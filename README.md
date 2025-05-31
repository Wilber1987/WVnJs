# WVnJs

Un motor modular de novelas visuales estilo Ren'Py, hecho en JavaScript puro.
Permite crear juegos interactivos en la web con:

Escenas dinámicas (imágenes o videos)
Personajes animados (WebM/PNG)
Diálogos con audio
Menús posicionados (TAB, FLOATING, MENU)
Sistema de tiempo del día
Guardado local con localStorage
Transiciones suaves y responsivas
📦 Requisitos
Navegador moderno (Chrome, Firefox, Edge)
Soporte para módulos ES6 (type="module")
Carpetas multimedia organizadas (Media/, Characters/, History/, etc.)
🚀 Iniciar el Proyecto
1. Clonar el repositorio

# git clone https://github.com/tu-usuario/nombre-del-repositorio.git 

```
├── Core/
│   ├── VisualNovelEngine.js    # El motor principal
│   ├── VisualNovelModules.js  # Scene, Character, Flow, Dialogue...
│   ├── TimeSystem.js           # Sistema de hora/día/estación
│   └── SaveSystem.js           # Guardado/restauración de partida
├── Characters/
│   ├── Dana.js                 # Definición de Dana
│   └── Heero.js                # Definición de Heero
├── Media/
│   ├── Scene/                  # Fondos e imágenes de escena
│   ├── Character/              # Imágenes o WebM de personajes
│   ├── Audio/                  # Archivos de sonido
│   └── Icons/                  # Iconos para menús
├── Maps/
│   └── MainMap.js              # Mapa interactivo
├── History/
│   └── HomeHistory.js          # Escenas y eventos relacionados a casa
├── Menus/
│   └── HomeMenu.js             # Opciones reutilizables
├── app.html                    # Archivo HTML principal
└── app.js                      # Punto de entrada del juego

```
.



En app.js:
```
import { vnEngine } from "./Core/VisualNovelEngine.js";
import { Scene, Flow, Dialogue } from "./Core/VisualNovelModules.js";
import { Dana } from "./Characters/Dana.js";
import { saveSystem } from "./Core/SaveSystem.js";

// Escena inicial
vnEngine.defineScene('start', [
  Scene.Show("main_background"),
  Flow.Choice([
    Flow.Action("New Game", [Flow.Jump("Home")], { typeMenu: "MENU" }),
    Flow.Action("Load", [() => saveSystem.showSaveLoadScreen(true)], { typeMenu: "MENU" }),
    Flow.Action("Options", [Flow.Jump("OptionsMenu")], { typeMenu: "MENU" })
  ])
]);

// Iniciar el juego
vnEngine.startScene('start');
```