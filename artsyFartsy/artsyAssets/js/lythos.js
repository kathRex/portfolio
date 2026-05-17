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
//elementID: ID of HTML tag | value: DB data | fieldName: DB property name
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
//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//---------------------------------------------------------
// Spawn soap-bubble images when the user scrolls downward
//---------------------------------------------------------
(function () {
  const bubbleSrc = "/artsyFartsy/artsyAssets/bubble.png";
  let lastY = window.scrollY;
  let lastSpawn = 0;
  const cooldown = 350; // ms between spawn events
  const minSize = 50; // px
  const maxSize = 170; // px

  function randInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }
  function randFloat(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnBubbles() {
    const count = randInt(2, 6);
    const vw = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0,
    );
    for (let i = 0; i < count; i++) {
      const size = randInt(minSize, maxSize);
      const el = document.createElement("div");
      el.className = "bubble";
      el.style.width = size + "px";
      // random horizontal position but keep fully inside viewport
      const left = randInt(8, Math.max(8, vw - size - 8));
      el.style.left = left + "px";
      // random animation duration and horizontal drift
      const dur = randInt(3200, 7200);
      const drift = `${randInt(-90, 90)}px`;
      const scale = (size / maxSize) * randFloat(0.9, 1.15);

      el.style.setProperty("--duration", dur + "ms");
      el.style.setProperty("--drift", drift);
      el.style.setProperty("--scale", scale);

      // Use an <img> inside to keep proper aspect and allow future tinting
      const img = document.createElement("img");
      img.src = bubbleSrc;
      img.alt = "bubble";
      el.appendChild(img);

      // remove after animation finishes
      const removeAfter = dur + 200;
      const cleanup = () => {
        if (el.parentNode) el.parentNode.removeChild(el);
        el.removeEventListener("animationend", onAnimEnd);
        clearTimeout(timeoutId);
      };
      const onAnimEnd = cleanup;
      el.addEventListener("animationend", onAnimEnd);
      const timeoutId = setTimeout(cleanup, removeAfter);

      document.body.appendChild(el);
    }
  }

  window.addEventListener(
    "scroll",
    function () {
      const y = window.scrollY || window.pageYOffset;
      const now = Date.now();
      const scrollingDown = y > lastY;
      lastY = y;
      if (!scrollingDown) return;
      if (now - lastSpawn < cooldown) return;
      lastSpawn = now;
      spawnBubbles();
    },
    { passive: true },
  );
})();
