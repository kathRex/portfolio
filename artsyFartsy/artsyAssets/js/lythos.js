//---------------------------------------------------------
//Fetch Character Data
//---------------------------------------------------------
let loggedIn = false;
document.getElementById("login-btn").onclick = () => {
  const password = prompt("Enter Admin Password:");
  if (password === "0909") {
    loggedIn = true;
    loadCharacterData();
    alert("Logged in as Admin");
  } else {
    alert("Access Denied");
  }
};

async function loadCharacterData() {
  try {
    const response = await fetch("http://localhost:3000/api/character");
    if (!response.ok) throw new Error("Error loading data");

    const data = await response.json();

    //Fill HTML-Elements
    //Static Elements
    document.getElementById("name").innerText = data.name;
    document.getElementById("background").innerText =
      "Background: " + data.background;
    document.getElementById("species").innerText = "Species: " + data.species;
    document.getElementById("subclass").innerText =
      "Subclass: " + data.subclass;
    document.getElementById("class").innerText = "Class: " + data.class;

    //Vital Stats - editable
    renderEditableField("edit-lvl", data.level, "level");
    renderEditableField("edit-ac", data.armor_class, "armor_class");
    renderEditableField("edit-hp", `${data.hp.current}/${data.hp.max}`, "hp");
    renderEditableField("edit-hitdie", data.hit_dice, "hit_dice");
    renderEditableField("edit-conditions", data.conditions, "conditions");

    //Main Character Stats - editable
    if (data.stats) {
      //create object from array with Object.entries
      Object.entries(data.stats).forEach(([statName, value]) => {
        const elementID = `edit-${statName}`;
        const fieldName = `stats.${statName}`;
        //Render only if element exists
        if (document.getElementById(elementID)) {
          renderEditableField(elementID, value, fieldName);
        }
      });
    }
    //Main Character Stat Modificators
    if (data.stat_mod) {
      Object.entries(data.stat_mod).forEach(([modName, value]) => {
        const elementID = `edit-${modName}`;
        const fieldName = `stat_mod.${modName}`;
        if (document.getElementById(elementID)) {
          renderEditableField(elementID, value, fieldName);
        }
      });
    }

    console.log("Data loaded", data);
  } catch (error) {
    console.error("API fetch error", error);
  }
}
// Load Skript with Page
window.onload = loadCharacterData;

//---------------------------------------------------------
//Render editable fields
//---------------------------------------------------------
//elementID: ID of HTML tag | value: DB data | fieldName: DB property name to write the updated value back
function renderEditableField(elementID, value, fieldName) {
  //Get the DB data and fill in value
  const displayElement = document.getElementById(elementID);
  displayElement.innerText = value;
  //If logged in values can be edited
  if (loggedIn) {
    //Attach listener to element
    displayElement.classList.add("clickable");
    displayElement.onclick = () => {
      //Create input when displayElement is clicked
      const input = document.createElement("input");
      //If type of value is a number, set input type to number, otherwise set it to text
      input.type = typeof value === "number" ? "number" : "text";
      input.value = value;
      input.className = "edit-input";
      //When clicking out of the field or enter, save the update
      input.onblur = () => saveFieldUpdate(fieldName, input.value, elementID);
      input.onkeydown = (e) => {
        if (e.key === "Enter") input.blur();
      };
      //Wipe current text
      displayElement.innerHTML = "";
      //Moves the new input field into the div
      displayElement.appendChild(input);
      //Puts cursor into field so we can type
      input.focus();
    };
  }
}

//---------------------------------------------------------
// Save Field Updates
//---------------------------------------------------------
async function saveFieldUpdate(fieldName, newValue, elementID) {
  try {
    let processedValue = newValue;

    // List of all paths that should be numbers
    const numericPaths = [
      "level",
      "armor_class",
      "stats.proficiency",
      "stats.str",
      "stats.dex",
      "stats.con",
      "stats.int",
      "stats.wis",
      "stats.cha",
      "stats.passsive_perception",
      "stats.speed",
      "stat_mod.str_mod",
      "stat_mod.dex_mod",
      "stat_mod.con_mod",
      "stat_mod.int_mod",
      "stat_mod.wis_mod",
      "stat_mod.cha_mod",
      "stat_saving_throw.str_save",
      "stat_saving_throw.dex_save",
      "stat_saving_throw.con_save",
      "stat_saving_throw.int_save",
      "stat_saving_throw.wis_save",
      "stat_saving_throw.cha_save",
      "speciesTraits.size",
      "speciesTraits.darkvision",
      "spellcasting.mod",
      "spellcasting.spell_save_dc",
      "spellcasting.spell_atk_bonus",
      "coins.cp",
      "coins.sp",
      "coins.ep",
      "coins.gp",
      "coins.pp",
    ];

    // Check if the current fieldName is in the numeric list or starts with "skills."
    if (numericPaths.includes(fieldName) || fieldName.startsWith("skills.")) {
      processedValue = Number(newValue);
    }

    // Special handling for HP
    if (fieldName === "hp") {
      const parts = newValue.split("/");
      processedValue = {
        current: Number(parts[0]),
        max: Number(parts[1]),
      };
    }

    const response = await fetch("http://localhost:3000/api/character/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: fieldName,
        value: processedValue,
      }),
    });

    if (!response.ok) throw new Error("Failed to update db");

    console.log(`Successfully updated ${fieldName}`);
    loadCharacterData();
  } catch (error) {
    console.error("Update error: ", error);
    loadCharacterData();
  }
}
