//@ts-check
import { saveSystem, vnEngine } from "./Core/VisualNovelEngine.js";
import { Flow, Scene } from "./Core/VisualNovelModules.js";
import "./Maps/MainMap.js";



// Definir escenas
vnEngine.defineScene('start', [
  Scene.Show("Scene/main_background"),
  Flow.Choice([
    Flow.Action("New Game", [Flow.Jump('MainMap')], { typeMenu: "MENU" }),
    Flow.Action("Load", [ ()=> saveSystem.showSaveLoadScreen() ], { typeMenu: "MENU" }),
    Flow.Action("Options", [Flow.Jump('OptionsMenu')], { typeMenu: "MENU" })
  ])
]);

// Iniciar el juego
vnEngine.startScene('start');