//@ts-check
import { MainMenu } from "../Core/MainMenu.js";
import { vnEngine } from "../Core/VisualNovelEngine.js";
import { Flow, MapScene } from "../Core/VisualNovelModules.js";
import "../History/HomeHistory.js";

vnEngine.defineScene('MainMap',
    MapScene.Go("Scene/home_menu", [
        Flow.Action("Home", [
            Flow.Jump("house_history")
        ], { icon: "Icons/icon_mansion", position: { xpos: 50, ypos: 50 } })
    ], [MainMenu], "Audio/backyard_ambience", true)
);


