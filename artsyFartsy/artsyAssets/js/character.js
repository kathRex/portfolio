//---------------------------------------------------------
//Database Schema
//---------------------------------------------------------
//Import mongoose into js
//Built in node.js function, looks into node.modules folder and finds Mongoose library
//Stores entire library in a variable
const mongoose = require("mongoose");
//mongoose.Schema: access constructor function from library, creating an object
const characterSchema = new mongoose.Schema({
  name: String,
  background: String,
  species: String,
  class: String,
  subclass: String,
  level: Number,
  armor_class: Number,
  hp: { current: Number, max: Number },
  hit_dice: String,
  stats: {
    proficiency: Number,
    str: Number,
    dex: Number,
    con: Number,
    int: Number,
    wis: Number,
    cha: Number,
    passsive_perception: Number,
    speed: Number,
  },
  stat_mod: {
    str_mod: Number,
    dex_mod: Number,
    con_mod: Number,
    int_mod: Number,
    wis_mod: Number,
    cha_mod: Number,
  },
  stat_saving_throw: {
    str_save: Number,
    dex_save: Number,
    con_save: Number,
    int_save: Number,
    wis_save: Number,
    cha_save: Number,
  },
  skills: {
    athletics: Number,
    initiative: Number,
    acrobatics: Number,
    sleight_of_hand: Number,
    stealth: Number,
    arcana: Number,
    history: Number,
    investigation: Number,
    nature: Number,
    religion: Number,
    animal_handling: Number,
    insight: Number,
    medicine: Number,
    perception: Number,
    survival: Number,
    deception: Number,
    intimidation: Number,
    performance: Number,
    persuasion: Number,
  },
  conditions: String,

  proficiencies: {
    armorTraining: {
      light: { type: Boolean, default: false },
      medium: { type: Boolean, default: false },
      heavy: { type: Boolean, default: false },
      shields: { type: Boolean, default: false },
    },
    weaponTraining: {
      simple: { type: Boolean, default: false },
      martial: { type: Boolean, default: false },
      improv: { type: Boolean, default: false },
    },
    tools: String,
    languages: String,
  },
  weaponsAndCantrips: [
    {
      name: String,
      atkBonus: Number,
      damage: String,
      damageType: String,
      notes: String,
    },
  ],
  class_features: [String],
  feats: [String],

  speciesTraits: {
    size: Number,
    darkvision: Number,
    traits: [String],
  },

  spellcasting: {
    ability: String,
    mod: Number,
    spell_save_dc: Number,
    spell_atk_bonus: Number,
  },
  spellSlots: [
    {
      level: Number,
      max: Number,
      used: [Boolean],
    },
  ],
  spells: [
    {
      level: Number,
      name: String,
      castingTime: String,
      range: String,
      concentration: { type: Boolean, default: false },
      ritual: { type: Boolean, default: false },
      components: {
        v: { type: Boolean, default: false },
        s: { type: Boolean, default: false },
        m: { type: Boolean, default: false },
      },
      notes: [String],
    },
  ],

  equipment: {
    armor_worn: String,
    weapons: [String],
    other_gear: [String],
    attuned_magic_item: [String],
  },

  appearance: [String],
  personality: [String],
  backstory: String,

  coins: {
    cp: Number,
    sp: Number,
    ep: Number,
    gp: Number,
    pp: Number,
  },
});
//What I attach to module.exports is what other files receive when they do f.e. require("./character")
//Compiles Schema into a Model
//"Character" = Used by Mongoose to find collection in DB
module.exports = mongoose.model("Character", characterSchema);
