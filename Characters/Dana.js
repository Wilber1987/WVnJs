//@ts-check

import { CharacterModel } from "../Core/VisualNovelModules.js";


class DanaModel extends CharacterModel {
    Name = "Dana";
    State = {
        Ungry: "Character/dana_hungry",
        Fear: "Character/dana_hungry",
        Happy: "Character/dana_happy",
        Normal: "Character/dana_normal"
    }
}

export const Dana = new DanaModel();