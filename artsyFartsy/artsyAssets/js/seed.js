//---------------------------------------------------------
//Execute manual with node seed.js only for maintenance now
//Runs once to clear the DB and inserts example seed
//---------------------------------------------------------
//Import path, mongoose and schema
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import Character from "./character.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//path.resove: Go up two levels from the folder of this script and look for .env file
//Find & import .env in path (__dirname is a variable that knows where current script is sitting)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const seedData = async () => {
  try {
    //Check memory for variable MONGO_URI
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI ist undefined. Prüfe die .env Datei.");
    }
    //Open tunnel to cloud
    await mongoose.connect(process.env.MONGO_URI);

    //Wipe table
    await Character.deleteMany({});
    //Create local data object for cavalluccia
    const cavalluccia = new Character({
      name: "Cavalluccia Mireth",
      background: "Entertainer",
      species: "Chthonic Tiefling",
      class: "Wizard",
      subclass: "Illusionist",
      level: 2,
      armor_class: 12,
      hp: { current: 14, max: 14 },
      hit_dice: "2d6",
      stats: {
        proficiency: +2,
        str: 8,
        dex: 14 + 2,
        con: 13,
        int: 16,
        wis: 10,
        cha: 11 + 1,
        passsive_perception: 10,
        speed: 30,
      },
      stat_mod: {
        str_mod: -1,
        dex_mod: +3,
        con_mod: +1,
        int_mod: +3,
        wis_mod: 0,
        cha_mod: +1,
      },
      stat_saving_throw: {
        str_save: -1,
        dex_save: +3,
        con_save: +1,
        int_save: +5,
        wis_save: +2,
        cha_save: +1,
      },
      skills: {
        athletics: -1,
        initiative: +3,
        acrobatics: +5,
        sleight_of_hand: +3,
        stealth: +3,
        arcana: +5,
        history: +3,
        investigation: +7,
        nature: +3,
        religion: +3,
        animal_handling: 0,
        insight: 0,
        medicine: 0,
        perception: 0,
        survival: 0,
        deception: +1,
        intimidation: +1,
        performance: +3,
        persuasion: +1,
      },
      conditions: "",

      proficiencies: {
        armorTraining: {
          light: false,
          medium: false,
          heavy: false,
          shields: false,
        },
        weaponTraining: {
          simple: true,
          martial: false,
          improv: false,
        },
        tools: "bagpipes",
        languages:
          "common, infernal (lineage), aquan (primordial, self-taught)",
      },
      weaponsAndCantrips: [
        {
          name: "Dagger",
          atkBonus: +4,
          damage: "1d4",
          damageType: "+2 piercing",
          notes: "finesse, light, thrown (20/60 ft)",
        },
        {
          name: "Quaterstaff",
          atkBonus: +1,
          damage: "1d6",
          damageType: "-1 bludgeoning",
          notes: "",
        },
        {
          name: "Chill Touch",
          atkBonus: +5,
          damage: "1d10",
          damageType: "necrotic",
          notes: "prevents healing",
        },
        {
          name: "Ray of Frost",
          atkBonus: +5,
          damage: "1d8",
          damageType: "cold",
          notes: "-10 ft speed until next turn",
        },
      ],
      class_features: ["Spellcasting", "Ritual Adept", "Arcane Recovery"],
      feats: [
        "Musician: Instrument Training, Ecouraging Song (once after long rest for as many allies as proficiency bonus)",
      ],

      speciesTraits: {
        size: 5.3,
        darkvision: 60,
        traits: ["Fiendish Legacy", "Otherwordly Presence"],
      },

      spellcasting: {
        ability: "Intelligence",
        mod: +3,
        spell_save_dc: 13,
        spell_atk_bonus: +5,
      },
      spellSlots: [
        {
          level: 1,
          max: 3,
          used: [false, false, false],
        },
      ],
      spells: [
        {
          level: 0,
          name: "Chill Touch",
          castingTime: "Action",
          range: "Touch",
          concentration: false,
          ritual: false,
          components: {
            v: true,
            s: true,
            m: false,
          },
          notes: [""],
        },
        {
          level: 0,
          name: "Thaumaturgy",
          castingTime: "Action",
          range: "30 ft",
          concentration: false,
          ritual: false,
          components: {
            v: true,
            s: false,
            m: false,
          },
          notes: ["up to 1m"],
        },
        {
          level: 0,
          name: "Minor Illusion",
          castingTime: "Action",
          range: "30 ft",
          concentration: false,
          ritual: false,
          components: {
            v: true,
            s: false,
            m: true,
          },
          notes: ["1m"],
        },
        {
          level: 0,
          name: "Ray of Frost",
          castingTime: "Action",
          range: "60 ft",
          concentration: false,
          ritual: false,
          components: {
            v: true,
            s: true,
            m: false,
          },
          notes: ["1m"],
        },
      ],

      equipment: {
        armor_worn: "Jester Costume",
        weapons: ["2 Daggers", "Arcane Focus"],
        other_gear: [
          "Wizard: Robe, Spellbook, Scholars Pack",
          "Entertainer: Parfume, Travelers Clothes, 2 Costumes",
          "high quality waterskin with fancy tea",
        ],
        attuned_magic_item: [""],
      },

      appearance: ["white hair", "cute"],
      personality: [
        "cheerful, bubbly, easily excited",
        "naturally curious about people, places and magic",
      ],
      backstory: "A lot will follow",

      coins: {
        cp: 0,
        sp: 1,
        ep: 0,
        gp: 16,
        pp: 0,
      },
    });
    //Upload data to DB
    await cavalluccia.save();
    console.log("character loaded");
    //Close connection cause this is only needed once
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};
seedData();
