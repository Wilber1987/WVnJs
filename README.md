# WVnJs

Un motor modular de novelas visuales inspirado en Ren'Py, hecho en JavaScript puro.
Permite crear juegos interactivos en la web con:

Escenas dinámicas (imágenes o videos)
Personajes animados (WebM/PNG)
Diálogos con audio
Menús posicionados (TAB, FLOATING, MENU)
Sistema de tiempo del día
Guardado local con localStorage
Transiciones suaves y responsivas
Requisitos
Navegador moderno (Chrome, Firefox, Edge)
Soporte para módulos ES6 (type="module")
Carpetas multimedia organizadas (Media/, Characters/, History/, etc.)
Iniciar el Proyecto
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

Crear Personajes Personalizados
Define tus personajes extendiendo CharacterModel.
```
import { CharacterModel } from "../Core/VisualNovelModules.js";

export class DanaModel extends CharacterModel {
  Name = "Dana";
  State = {
    Default: "Character/dana_default",
    Happy: "Character/dana_happy",
    Sad: "Character/dana_sad",
    Angry: "Character/dana_angry"
  };
}

export const Dana = new DanaModel();
```

Uso en escenas

```
vnEngine.defineScene('Dana_Home_0', [
  Scene.Show("home/home_day", "house_ambience"),
  Dana.Show("Happy"), // Muestra a Dana con estado feliz
  Dana.Say("¿Otra vez perdiendo el tiempo?"),
  Flow.Choice([
    Flow.Action("Disculparse", [
      Dana.Show("Smile"),
      Dana.Say("Está bien... esta vez.")
    ]),
    Flow.Action("Reírse", [
      Dana.Show("Angry"),
      Dana.Say("¡Eres imposible!"),
      Flow.Set("danaMood", "angry")
    ])
  ]),
  Flow.Jump("Home")
]);
```

Usar RoomScene.Go(...) – Mapas Interactivos
Este método permite mostrar un fondo con opciones posicionadas.

Ejemplo de uso:

```
import { RoomScene } from "../Core/VisualNovelModules.js";
import { Dana } from "../Characters/Dana.js";
import { HomeMenu } from "../Menus/HomeMenu.js";

function HomeStreetRandomEvent() {
  const random = Math.floor(Math.random() * 4);
  switch(random) {
    case 0: return Flow.Jump("Dana_Home_0");
    case 1: return Flow.Jump("Dana_Talk_Late");
    case 2: return Flow.Jump("Dana_CheckIn");
    default: return Heero.Say("No hay nada por acá");
  }
}

// Escena principal de 'Home'
vnEngine.defineScene('Home',
  RoomScene.Go("home/home_day", [
    HomeStreetRandomEvent,
    Dialogue.Say("Narrador", "Has llegado a casa. ¿A dónde deseas ir?")
  ], [...HomeMenu], "house_ambience", true)
);
```

Posicionar Botones en Pantalla

Puedes usar xpos e ypos para posicionar botones manualmente:

```
Flow.Action("Ir al sótano", [Flow.Jump("Basement")], {
  icon: "icon_basement",
  position: { xpos: 70, ypos: 85 } // 70% ancho, 85% alto
})
```

Guardado Local
Guarda y restaura partidas fácilmente:

```
saveSystem.saveToSlot("slot1"); // Guardar estado actual
saveSystem.loadFromSlot("slot1"); // Cargar partida

// Mostrar pantalla gráfica de guardado/carga
saveSystem.showSaveLoadScreen(false); // false = guardar
saveSystem.showSaveLoadScreen(true);  // true = cargar
```
Sistema de Tiempo
Avanza el tiempo y muestra escenas según la hora del día:

```
// Avanzar 3 horas
vnEngine.TimeSystem.advanceTime(3);

// Obtener hora actual
const time = vnEngine.TimeSystem.getCurrentTime(); // { hour, day, weekDay, season }

// Mostrar escena si es de noche
if (time.hour >= 20 || time.hour < 5) {
  Scene.Show("night_scene");
} else {
  Scene.Show("day_scene");
}
```

También puedes definir escenas que cambien automáticamente según la hora:

```
Scene.Show("plaza", null, true, true); // isAffectedByTime = true
```

 Extensiones Soportadas
El motor prueba automáticamente varias extensiones:
```
Imagen
.webp, .png,.jpg,.gif

Video
.mp4,.webm,.ogg

Audio
.mp3```

Comandos Principales

```Scene.Show(image, audio, loopAudio, isAffectedByTime) - Fondo + música ambiental
Dialogue.Say(name, text, audio) - Diálogo con voz
Flow.Choice(options) - Menú interactivo
Flow.Jump(target) - Salto entre escenas
Flow.If(condition, thenBlock, elseBlock) - Condicionales lógicos
Flow.Set(variable, value) - Asignar variables globales
Character.Show(state, position) - Mostrar personaje
Character.Hide() - Ocultar personaje```


Para Desarrolladores
Extender el motor
Puedes añadir nuevas funcionalidades creando clases personalizadas:

```class CustomScene {
  static Go(...) {
    // Tu lógica personalizada
  }
}```

Agregar condiciones complejas
Usa Flow.And, Flow.Or, Flow.Not para condiciones lógicas avanzadas:

```Flow.If(
  Flow.And(
    Flow.Var("danaFriendshipLevel", ">=", 2),
    Flow.Time("<", 12)
  ),
  [
    Scene.Show("plaza_morning"),
    Dialogue.Say("Tú", "Es temprano...")
  ]
)```

Características Principales

```Scene.Show(...)  - Carga fondos con transición
Character.Show(...)  - Personajes con estados visuales
Flow.Choice(...)  - Menús interactivos
Flow.Jump(...)  - Saltar entre escenas
Flow.If(...)  - Condiciones lógicas
TimeSystem - Cambios automáticos según hora
SaveSystem - Guardar/restaurar partida
RoomScene.Go(...)  - Mapas con opciones posicionadas```

Ejemplo Completo de una Escena Dinámica

```vnEngine.defineScene('Kitchen_Dana_01', [
  Scene.Show("home/kitchen_day", "kitchen_ambience"),
  Dialogue.Say("Narrador", "El aroma del caldo recién hecho llena la cocina..."),
  Dana.Show("Cooking"),
  Dana.Say("¿Quieres un poco?"),
  Flow.Choice([
    Flow.Action("Sí, gracias", [
      Dana.Show("Smile"),
      Dana.Say("Ten cuidado, está caliente.")
    ]),
    Flow.Action("No, estoy bien", [
      Dana.Show("Disappointed"),
      Dana.Say("Como quieras.")
    ])
  ]),
  Flow.Jump("Home")
]);```

## 📜 Licencia

Este motor está bajo una variante personalizada de la [MIT License](LICENSE), con una cláusula adicional:

> Todo proyecto que use este motor debe mencionar explícitamente al creador original en sus créditos o documentación.

Esto permite el uso libre del código, siempre que se te reconozca como el autor original.

[Ver el archivo LICENSE para más detalles](LICENSE)
