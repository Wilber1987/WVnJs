//@ts-check
import { saveSystem, vnEngine } from "./VisualNovelEngine.js";
const domainUrl = "./Media";
export class Scene {
    static Show(url, audio, loopAudio = true, isAffectedByTime = false) {
        return {
            type: "scene",
            image: `${domainUrl}/${url}`,
            audio: audio ? `${domainUrl}/${audio}.mp3` : null,
            isAffectedByTime: isAffectedByTime,
            loopAudio
        };
    }
    static ShowV(url, audio, loopScene = true, loopAudio = true) {
        return {
            type: "scene",
            video: `${domainUrl}/${url}`,
            audio: audio ? `${domainUrl}/${audio}.mp3` : null,
            loopScene,
            loopAudio
        };
    }
}

export class Character {
    static Show(who, image, position = "center") {
        return {
            type: "show", who,
            image: `${domainUrl}/${image}`,
            position
        };
    }

    static ShowR(who, image) {
        return this.Show(who, image, "right");
    }

    static ShowL(who, image) {
        return this.Show(who, image, "left");
    }

    static Hide(who) {
        return { type: "hide", who };
    }
}

export class Dialogue {
    static Say(name, text, audio) {
        return { type: "say", name, text, audio: audio ? `${domainUrl}/${audio}.mp3` : null };
    }

    static Narrate(text, audio = null) {
        return this.Say("", text, audio);
    }
}

export class Flow {
    static Jump(target) {
        return { type: "jump", target };
    }
    /**
    * @param {string} text
    * @param {Array} action
    * @param {{ icon?: string, typeMenu?: string, position?: { xpos: number, ypos: number} }} [config] 
    * @returns {any}
    */
    static Action(text, action, config) {
        return {
            text, action,
            icon: config?.icon ? `./Media/${config?.icon}` : undefined,
            typeMenu: config?.typeMenu,
            xpos: config?.position?.xpos,
            ypos: config?.position?.ypos
        };
    }

    static Choice(options) {
        return { type: "choice", options };
    }

    static If(condition, thenBlock, elseBlock = []) {
        return { type: "if", condition, then: thenBlock, else: elseBlock };
    }

    static Set(variable, value) {
        return { type: "set", var: variable, value };
    }

    static Wait(duration) {
        return { type: "wait", duration };
    }

    // Operadores para condiciones
    static Var(name, operator, value) {
        return { type: "variable", var: name, operator, value };
    }

    static And(...conditions) {
        return { type: "and", conditions };
    }

    static Or(...conditions) {
        return { type: "or", conditions };
    }

    static Not(condition) {
        return { type: "not", condition };
    }
    static Menu(options, config = {}) {
        return {
            type: 'choice',
            options: options.map(option => ({
                ...option,
                typeMenu: config.typeMenu || 'FLOATING'
            }))
        };
    }
    static Time(hourOperator, hourValue) {
        return { type: "time", operator: hourOperator, value: hourValue };
    }
}
const mapBack = Flow.Action("", [Flow.Jump('MainMap')], { typeMenu: "TAB", icon: "Icons/map" });

export class MapScene {
    static Go(MapName, Options, OptionalsMenus = [], audio, isAffectedByTime) {
        //Options?.forEach();
        return [
            Scene.Show(MapName, audio, true, isAffectedByTime),
            ...OptionalsMenus,
            Flow.Choice([mapBack, ...Options])
        ]
    }
}

const roomBack = Flow.Action("", [Flow.Jump('MainMap')], { typeMenu: "TAB", icon: "Icons/map" });


export const MainMenu = Flow.Menu([
    Flow.Action("Guardar", [
        () => saveSystem.showSaveLoadScreen(false)
    ], { icon: "Icons/icon_save" }),
    Flow.Action("Cargar", [
        () => saveSystem.showSaveLoadScreen(true)
    ], { icon: "Icons/icon_download" }),
    Flow.Action("", [
        () => vnEngine.TimeSystem.autoAdvanceTime(4)
    ], { icon: "Icons/time_skip" }),
    Flow.Action("Opciones", [Scene.Show("menu_options")], { icon: "Icons/icon_patchnote" })
], { typeMenu: "FLOATING" });

export class RoomScene {
    static Go(RoomName, Commands, Options, audio, isAffectedByTime) {
        Options?.forEach(option => {
            if (!option.position) {
                option.typeMenu = 'TAB'
            }
        });
        return [
            MainMenu,
            Scene.Show(RoomName, audio, true, isAffectedByTime),
            ...Commands,
            Flow.Choice([roomBack, ...Options])
        ]
    }
}

export class CharacterModel {
    Name = "name";
    State = {        
        Normal: "avatar"
    }
    Say(text) {
        return Dialogue.Say(this.Name, text);
    }
    GetVar(name) {
        return vnEngine.variables[name] ?? this[name]
    }

    Show(state = "Normal", position = "center") {
        return Character.Show(this.Name, this.State[state] ?? this.State["Normal"], position)
    }
    ShowR(state) {
        return this.Show(state, "right");
    }
    ShowL(state) {
        return this.Show(state, "left");
    }
    Hide() {
        return Character.Show(this.Name);
    }

}