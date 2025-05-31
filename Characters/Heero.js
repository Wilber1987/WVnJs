//@ts-check
import { Character, CharacterModel } from "../Core/VisualNovelModules.js";

export class HeeroModel extends CharacterModel{
    Name = "Heero";
    State = {
        Ungry: "Character/heero_hungry",
        Fear: "Character/heero_hungry",
        Happy: "Character/heero_happy",
        Normal: "Character/heero_normal"
    }  
}

export const Heero = new HeeroModel();