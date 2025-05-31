//@ts-check
import { Dana } from "../Characters/Dana.js";
import { Heero } from "../Characters/Heero.js";
import { vnEngine } from "../Core/VisualNovelEngine.js";
import { Dialogue, Flow, RoomScene, Scene } from "../Core/VisualNovelModules.js";

const HomeMenu = [
    Flow.Action("Dormitorio", [Flow.Jump("Bedroom")], { icon: "Icons/home/myroom_day" }),
    Flow.Action("Sala", [Flow.Jump("LivingRoom")], { icon: "Icons/home/livingroom_day" }),
    Flow.Action("Cocina", [Flow.Jump("Kitchen")], { icon: "Icons/home/kitchen_day" }),
    Flow.Action("Baño", [Flow.Jump("Bathroom")], { icon: "Icons/home/hometoilet_day" }),
    Flow.Action("Jardín", [Flow.Jump("Backyard")], { icon: "Icons/home/yard_day" }),
    Flow.Action("Regresar", [Flow.Jump("Home")], { icon: "Icons/icon_back" })
];
// Escena donde aparece Dana
//escena inical que se dispara desde el map main menu
vnEngine.defineScene('house_history', [
    Flow.If(Flow.Var("DanaFriendshipLevel", "==", 0), [
        Scene.Show("Scene/home/home_day"),
        Dialogue.Say("Tú", "¡Estoy en casa!"),
        Dana.Show(),
        Dana.Say("que haces en casa deberias estar en la escuela"),
        Dana.ShowR(),
        Heero.ShowL(),
        Dialogue.Say("Tú", "No queria estar en clases"),
        Flow.Set("DanaFriendshipLevel", 1),
        Dana.Say("Ok"),
        Flow.Jump('Home')
    ], [
        Flow.Jump('Home')
    ]
    )
]);

//otra escena que se puede llamar desde cualquie parte del proyecto siempre que se haya importado correctamente los archivos
vnEngine.defineScene('Dana_Home_0', [
  Scene.Show("Scene/home/home_day", "Audio/house_ambience"),
  Dana.Show(), // Muestra Dana feliz
  Dialogue.Say("Dana", "¿Otra vez perdiendo el tiempo?"),
  Flow.Choice([
    Flow.Action("Disculparse", [Flow.Set("danaFriendshipLevel", 2)]),
    Flow.Action("Reírse", [Dana.Say("No es gracioso")])
  ])
]);

function HomeStreetRandomEvent() {
  const random = Math.floor(Math.random() * 4);
  switch (random) {
    case 0:
      return Flow.Jump("Dana_Home_0");
    default:
      return Heero.Say("No hay nada por acá");
  }
}

// Escena inicial con mapa interactivo
vnEngine.defineScene('Home',
  RoomScene.Go("Scene/home/home_day", [
    HomeStreetRandomEvent,
    Dialogue.Say("Narrador", "Has llegado a casa. ¿A dónde deseas ir?")
  ], [...HomeMenu], "house_ambience")
);