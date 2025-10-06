//@ts-check
import { saveSystem, vnEngine } from "./VisualNovelEngine.js";
import { Flow, Scene } from "./VisualNovelModules.js";

export const MainMenu = Flow.Menu([
    Flow.Action("Guardar Partida", [
        () => saveSystem.showSaveLoadScreen(false)
    ], { icon: "Icons/icon_save" }),

    Flow.Action("Cargar Partida", [
        () => saveSystem.showSaveLoadScreen(true)
    ], { icon: "Icons/icon_download" }),

    Flow.Action("", [
        () => vnEngine.TimeSystem.autoAdvanceTime(4)
    ], { icon: "Icons/time_skip" }),

    Flow.Action("Personajes", [
        () => vnEngine.CharacterView()
    ], { icon: "Icons/time_skip" }),

    Flow.Action("Opciones", [Scene.Show("menu_options")], { icon: "Icons/icon_patchnote" }),
    Flow.Action("Salir al Menú", [Flow.Jump("start")], { icon: "Icons/icon_mainmenu" })
], { typeMenu: "FLOATING" });
