import type { GDProject } from "./types";
import playerUrl from "../../assets/player.png";
import coinUrl from "../../assets/coin.png";
import platformUrl from "../../assets/platform.png";
import slimeUrl from "../../assets/slime.png";

let counter = 0;
export const uid = (prefix: string) => `${prefix}_${++counter}_${Math.floor(Math.random() * 1e6)}`;

export function createDemoProject(): GDProject {
  return {
    name: "My platformer project",
    windowWidth: 800,
    windowHeight: 600,
    scenes: ["Level 1"],
    extensions: ["Platformer", "Top-down movement"],
    layers: [
      { name: "Base layer", visible: true },
      { name: "UI", visible: true },
    ],
    objects: [
      {
        id: "obj_player",
        name: "Player",
        type: "Sprite",
        asset: playerUrl,
        behaviors: ["Platformer character"],
        variables: [{ name: "Lives", value: "3" }],
      },
      {
        id: "obj_platform",
        name: "Platform",
        type: "Tiled Sprite",
        asset: platformUrl,
        behaviors: ["Platform"],
        variables: [],
      },
      {
        id: "obj_coin",
        name: "Coin",
        type: "Sprite",
        asset: coinUrl,
        behaviors: [],
        variables: [],
      },
      {
        id: "obj_slime",
        name: "Slime",
        type: "Sprite",
        asset: slimeUrl,
        behaviors: [],
        variables: [{ name: "Speed", value: "80" }],
      },
      {
        id: "obj_score",
        name: "ScoreText",
        type: "Text",
        text: "Score: 0",
        textColor: "#FAFAFA",
        textSize: 24,
        behaviors: [],
        variables: [],
      },
    ],
    instances: [
      { id: "inst_ground1", objectId: "obj_platform", x: 0, y: 520, angle: 0, width: 416, height: 80, zOrder: 1, layer: "Base layer", locked: false, customSize: true },
      { id: "inst_ground2", objectId: "obj_platform", x: 416, y: 520, angle: 0, width: 416, height: 80, zOrder: 1, layer: "Base layer", locked: false, customSize: true },
      { id: "inst_plat1", objectId: "obj_platform", x: 180, y: 400, angle: 0, width: 160, height: 32, zOrder: 2, layer: "Base layer", locked: false, customSize: true },
      { id: "inst_plat2", objectId: "obj_platform", x: 460, y: 320, angle: 0, width: 160, height: 32, zOrder: 2, layer: "Base layer", locked: false, customSize: true },
      { id: "inst_plat3", objectId: "obj_platform", x: 640, y: 420, angle: 0, width: 128, height: 32, zOrder: 2, layer: "Base layer", locked: false, customSize: true },
      { id: "inst_player", objectId: "obj_player", x: 90, y: 430, angle: 0, width: 72, height: 55, zOrder: 5, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_coin1", objectId: "obj_coin", x: 220, y: 350, angle: 0, width: 34, height: 34, zOrder: 3, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_coin2", objectId: "obj_coin", x: 500, y: 270, angle: 0, width: 34, height: 34, zOrder: 3, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_coin3", objectId: "obj_coin", x: 680, y: 370, angle: 0, width: 34, height: 34, zOrder: 3, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_coin4", objectId: "obj_coin", x: 560, y: 470, angle: 0, width: 34, height: 34, zOrder: 3, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_slime1", objectId: "obj_slime", x: 380, y: 470, angle: 0, width: 52, height: 44, zOrder: 4, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_slime2", objectId: "obj_slime", x: 660, y: 470, angle: 0, width: 52, height: 44, zOrder: 4, layer: "Base layer", locked: false, customSize: false },
      { id: "inst_score", objectId: "obj_score", x: 16, y: 12, angle: 0, width: 140, height: 32, zOrder: 10, layer: "UI", locked: false, customSize: false },
    ],
    events: [
      {
        id: "ev_comment1",
        kind: "comment",
        conditions: [],
        actions: [],
        subEvents: [],
        collapsed: false,
        comment: "SETUP — camera and HUD",
        commentColor: "green",
      },
      {
        id: "ev_start",
        kind: "standard",
        collapsed: false,
        conditions: [
          { id: "in_s1", typeId: "BuiltinCommonInstructions::Once", inverted: false, parameters: {} },
        ],
        actions: [
          { id: "in_a1", typeId: "CenterCamera", inverted: false, parameters: { object: "Player" } },
          { id: "in_a2", typeId: "SetText", inverted: false, parameters: { object: "ScoreText", text: "Score: 0" } },
          { id: "in_a3", typeId: "SetSceneVar", inverted: false, parameters: { variable: "Score", op: "set to", value: "0" } },
        ],
        subEvents: [],
      },
      {
        id: "ev_comment2",
        kind: "comment",
        conditions: [],
        actions: [],
        subEvents: [],
        collapsed: false,
        comment: "PLAYER MOVEMENT",
        commentColor: "green",
      },
      {
        id: "ev_move",
        kind: "standard",
        collapsed: false,
        conditions: [
          { id: "in_m1", typeId: "OnFloor", inverted: false, parameters: { object: "Player" } },
        ],
        actions: [],
        subEvents: [
          {
            id: "ev_move_right",
            kind: "standard",
            collapsed: false,
            conditions: [
              { id: "in_mr1", typeId: "KeyPressed", inverted: false, parameters: { key: "Right" } },
            ],
            actions: [
              { id: "in_mr2", typeId: "ChangeX", inverted: false, parameters: { object: "Player", op: "add", value: "5" } },
              { id: "in_mr3", typeId: "FlipX", inverted: false, parameters: { object: "Player", flip: "no" } },
            ],
            subEvents: [],
          },
          {
            id: "ev_move_left",
            kind: "standard",
            collapsed: false,
            conditions: [
              { id: "in_ml1", typeId: "KeyPressed", inverted: false, parameters: { key: "Left" } },
            ],
            actions: [
              { id: "in_ml2", typeId: "ChangeX", inverted: false, parameters: { object: "Player", op: "subtract", value: "5" } },
              { id: "in_ml3", typeId: "FlipX", inverted: false, parameters: { object: "Player", flip: "yes" } },
            ],
            subEvents: [],
          },
        ],
      },
      {
        id: "ev_coins",
        kind: "group",
        conditions: [],
        actions: [],
        collapsed: false,
        groupName: "Collecting coins",
        groupColor: "#7046EC",
        subEvents: [
          {
            id: "ev_coin_pick",
            kind: "standard",
            collapsed: false,
            conditions: [
              { id: "in_c1", typeId: "Collision", inverted: false, parameters: { object: "Player", object2: "Coin" } },
            ],
            actions: [
              { id: "in_c2", typeId: "DeleteObject", inverted: false, parameters: { object: "Coin" } },
              { id: "in_c3", typeId: "SetSceneVar", inverted: false, parameters: { variable: "Score", op: "add", value: "1" } },
              { id: "in_c4", typeId: "SetText", inverted: false, parameters: { object: "ScoreText", text: '"Score: " + VariableString(Score)' } },
              { id: "in_c5", typeId: "PlaySound", inverted: false, parameters: { file: "coin.wav" } },
            ],
            subEvents: [],
          },
        ],
      },
      {
        id: "ev_slime_patrol",
        kind: "standard",
        collapsed: false,
        conditions: [
          { id: "in_p1", typeId: "TimerGreater", inverted: false, parameters: { timer: "slime_move", seconds: "2" } },
        ],
        actions: [
          { id: "in_p2", typeId: "AddForceToward", inverted: false, parameters: { object: "Slime", target: "Player", speed: "60" } },
          { id: "in_p3", typeId: "StartTimer", inverted: false, parameters: { timer: "slime_move" } },
        ],
        subEvents: [],
      },
      {
        id: "ev_hit",
        kind: "standard",
        collapsed: false,
        conditions: [
          { id: "in_h1", typeId: "Collision", inverted: false, parameters: { object: "Player", object2: "Slime" } },
        ],
        actions: [
          { id: "in_h2", typeId: "DeleteObject", inverted: false, parameters: { object: "Player" } },
          { id: "in_h3", typeId: "ChangeScene", inverted: false, parameters: { scene: "Level 1" } },
        ],
        subEvents: [],
      },
    ],
  };
}
