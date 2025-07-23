//@ts-check
import { saveSystem, vnEngine } from "./VisualNovelEngine.js";
const domainUrl = "./Media";
export class Scene {
    static Show(url, audio, loopAudio = true, isAffectedByTime = false) {
        return {
            type: "scene",
            image: `${domainUrl}/${url}`,
            audio: audio ? `${domainUrl}/${audio}` : null,
            isAffectedByTime: isAffectedByTime,
            loopAudio
        };
    }
    static ShowV(url, audio, loopScene = true, loopAudio = true) {
        return {
            type: "scene",
            video: `${domainUrl}/${url}`,
            audio: audio ? `${domainUrl}/${audio}` : null,
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
    static Say(name, text, audio, isFemale = false) {
        return { type: "say", name, text, audio: audio ? `${domainUrl}/${audio}` : null, isFemale };
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
    * @param {{ icon?: string, typeMenu?: string, position?: { xpos: number, ypos: number, heightPercent?: number, widthPercent?: number} }} [config] 
    * @returns {any}
    */
    static Action(text, action, config) {
        if (config?.position?.heightPercent) {
            console.log(config);            
        }
        return {
            text, action,
            icon: config?.icon ? `./Media/${config?.icon}` : undefined,
            typeMenu: config?.typeMenu,
            xpos: config?.position?.xpos,
            ypos: config?.position?.ypos,
            heightPercent: config?.position?.heightPercent,
            widthPercent: config?.position?.widthPercent,
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
    static PlayAudio(audio, loopAudio = true) {
        return {
            type: "audio",
            audio: audio ? `${domainUrl}/${audio}` : null,
            loopAudio
        };
    }
}
const mapBack = Flow.Action("", [Flow.Jump('MainMap')], { typeMenu: "TAB", icon: "Icons/map" });

export class MapScene {
    static Go(MapName, Options, OptionalsMenus = [], audio, isAffectedByTime = false, aditionalBlocks = []) {
        //Options?.forEach();
        return [
            Scene.Show(MapName, undefined, true, isAffectedByTime),
            ...OptionalsMenus,
            Flow.Choice([mapBack, ...Options]),
            ...aditionalBlocks,
            audio
        ]
    }
}

const roomBack = Flow.Action("", [Flow.Jump('MainMap')], { typeMenu: "TAB", icon: "Icons/map" });

export class RoomScene {
    static Go(RoomName, Commands, Options, audio, isAffectedByTime) {
        Options?.forEach(option => {
            if (!option.position) {
                option.typeMenu = 'TAB'
            }
        });
        return [
            Scene.Show(RoomName, audio, true, isAffectedByTime),
            ...Commands,
            Flow.Choice([roomBack, ...Options])
        ]
    }
}

export class CharacterModel {
    constructor() {
        // @ts-ignore
        this.Name = this.__proto__.constructor.name.replace("Model", "");
        this.State = {
            Ungry: `Scene/${this.Name}/Normal`,
            Fear: `Scene/${this.Name}/Normal`,
            Happy: `Scene/${this.Name}/Normal`,
            Normal: `Scene/${this.Name}/Normal`
        }

    }

    isFemale = false
    Say(text, audio) {
        return Dialogue.Say(this.Name, text, audio, this.isFemale);
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
        return Character.Hide(this.Name);
    }

}