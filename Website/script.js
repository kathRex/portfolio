// ==================================================
// Configuration
// ==================================================
const TRIPLYDB_SPARQL_ENDPOINT = "https://api.triplydb.com/datasets/katmirex/Mario-Kart-8-Deluxe---Complete-Ontology/sparql";
const NAMESPACE_MK = "http://mariokart8deluxe.owl#"; //Ontology URI!


// ==================================================
// Global Data Storage
// ==================================================
let slipperinessData = {};


// ==================================================
// SPARQL data (using modern Fetch API)
// ==================================================

async function fetchSparqlData(query) {
    // Check if the response from the server was successful
    try {
        const url = `${TRIPLYDB_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json' // Request JSON format
            }
        });
        // Error message includes the HTTP status and the server's message
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        return await response.json();
        // Execute if any error occurs inside the try block
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        throw error; // Re-throw to be caught by the calling function
    }
}


// ==================================================
// Clean up for writing (remove prefixes, capitalize first letter)
// ==================================================
function getLocalName(uri) {
    if (!uri) return '';
    const parts = uri.split('#');
    let name = parts.pop();
    if (name.includes('/')) {
        name = name.split('/').pop();
    }
    if (name.startsWith('has') && name.length > 3) {
        name = name.substring(3);
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    return name;
}


// ==================================================
// Reusable Dropdown Function!
// ==================================================

//Populate dropdown menu function, entityType variable so it can be reused!
async function populateDropdown(selectId, entityType) {

    const dropdown = document.getElementById(selectId);
    const statusElement = document.getElementById('calculatorStatus');

    //Shows a loading message for the user
    dropdown.innerHTML = '<option value="">Loading...</option>';

    //Get all individuals of whatever type
    const query = `
                PREFIX mk: <${NAMESPACE_MK}>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                SELECT ?entityUri ?entityName WHERE {
                  ?entityUri rdf:type mk:${entityType} .
                  OPTIONAL { ?entityUri rdfs:label ?entityName_label . }
                  BIND(COALESCE(?entityName_label, STRAFTER(STR(?entityUri), STR(mk:))) AS ?entityName)
                } ORDER BY ?entityName`;
    try {
        //execute
        const data = await fetchSparqlData(query);

        //Reset dropdown + user message
        dropdown.innerHTML = `<option value="">Select a ${entityType}</option>`;

        //Error
        if (data.results.bindings.length === 0) {
            dropdown.innerHTML = `<option value="">No ${entityType}s found.</option>`;
            return;
        }

        //Loop through results
        data.results.bindings.forEach(binding => {
            //Create Option Element
            const option = document.createElement('option');
            option.value = binding.entityUri.value;

            //Call localName function for cleanup
            option.textContent = getLocalName(binding.entityName.value);
            //Add option to menu
            dropdown.appendChild(option);
        });

        statusElement.textContent = 'Please select components (track is optional).';


    } catch (error) {
        console.error(`Error populating ${entityType} dropdown:`, error);
        dropdown.innerHTML = `<option value="">Error loading ${entityType}s</option>`;
        document.getElementById('calculatorError').textContent = `Failed to load ${entityType}s for calculator: ${error.message}`;
    }
}

// ==================================================
// Slippery Tracks Dropdown and Calculations
// ==================================================

//Populates track dropdown with ONLY tracks with slipperiness property

async function populateSlipperyTracksDropdown() {
    //Get HTML element reference
    const dropdown = document.getElementById('trackSelect');
    const statusElement = document.getElementById('calculatorStatus');

    //User message
    dropdown.innerHTML = '<option value="">Loading Tracks...</option>';

    //Query to find tracks with slippery profile
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?trackUri ?trackName ?slipperinessProfile WHERE {
            ?trackUri a mk:Track .
            ?trackUri mk:hasSlipperiness ?slipperinessProfile .
            OPTIONAL { ?trackUri rdfs:label ?trackName_label . }
            BIND(COALESCE(?trackName_label, STRAFTER(STR(?trackUri), STR(mk:))) AS ?trackName)
        } ORDER BY ?trackName`;

    try {
        //Execute query
        const data = await fetchSparqlData(query);

        //Reset dropdown & user message
        dropdown.innerHTML = '<option value="">Select a Slippery Track</option>';

        //Error
        if (data.results.bindings.length === 0) {
            dropdown.innerHTML = '<option value="">No slippery tracks found.</option>';
            return;
        }

        //Loop through tracks
        data.results.bindings.forEach(binding => {
            //Get URI & clean name
            const trackUri = binding.trackUri.value;
            const trackName = getLocalName(binding.trackName.value);

            //Get Type (heavy, medium, light)
            let slipperinessType = getLocalName(binding.slipperinessProfile.value);
            //Remove "Slip"word bc Entity names are (LightSlip, MediumSlip,...)
            slipperinessType = slipperinessType.replace('Slip', '');

            //HTML element option
            const option = document.createElement('option');

            option.value = trackUri;

            //Write it neat as Track(slippery level)
            option.textContent = `${trackName} (${slipperinessType})`;

            //Add Track as option
            dropdown.appendChild(option);
        });


    } catch (error) {
        console.error("Error populating slippery tracks dropdown:", error);
        dropdown.innerHTML = '<option value="">Error loading tracks</option>';
        document.getElementById('calculatorError').textContent = 'Failed to load tracks for calculator: ' + error.message;
    }
}


//Fetches & stores all slipperiness level data (0-20) for Light, Medium, and Heavy Slips!

async function prefetchAllSlipperinessData() {
    //Log
    console.log("Pre-fetching slipperiness data...");

    //Variable for each type
    const slipperyTypes = ['LightSlip', 'MediumSlip', 'HeavySlip'];

    //Loop through all types
    for (const type of slipperyTypes) {
        // Dynamic query for the current slipperiness type (all data properties containing "hasSlipLevel")
        const query = `
            PREFIX mk: <${NAMESPACE_MK}>
            SELECT ?prop ?value WHERE {
                mk:${type} ?prop ?value .
                FILTER(CONTAINS(STR(?prop), "hasSlipLevel"))
            }`;

        try {
            // Execute 
            const data = await fetchSparqlData(query);

            // Re-create the full URI for the current type(as main key for storage object)
            const typeUri = `${NAMESPACE_MK}${type}`;
            // Empty object to hold the levels
            slipperinessData[typeUri] = {};


            // Loop through each property (hasSlipLevel0,...) 
            data.results.bindings.forEach(binding => {

                // Get the clean property name 
                const propLocalName = binding.prop.value.split('#').pop();
                // Extract level number from name
                const level = parseInt(propLocalName.replace('hasSlipLevel', ''));
                // Convert the value from a string to a number so we can calculate the grip with it
                const value = parseFloat(binding.value.value);

                //If level & value are numbers (safety)
                if (!isNaN(level) && !isNaN(value)) {
                    // Store value in the empty object (key = lvl)
                    slipperinessData[typeUri][level] = value;
                }
            });

        } catch (error) {
            console.error(`Failed to pre-fetch data for ${type}:`, error);
        }
    }
    console.log("Slipperiness data loaded:", slipperinessData);
}


//Fetch function for slipperiness profile URI for a given track 
async function fetchTrackSlipperiness(trackUri) {
    if (!trackUri) return null;

    //Find hasSlipperiness property for track
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        SELECT ?slipperinessProfile WHERE {
            <${trackUri}> mk:hasSlipperiness ?slipperinessProfile .
        }`;
    try {
        //Execute
        const data = await fetchSparqlData(query);

        //Check for result
        if (data.results.bindings.length > 0) {
            //Return value (URI)
            return data.results.bindings[0].slipperinessProfile.value;
        }
        return null;

    } catch (error) {
        console.error("Error fetching track slipperiness:", error);
        return null;
    }
}


//Fetch all stat properties for specific component (driver, vehicle parts)
async function fetchComponentStats(componentUri) {
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        SELECT ?statProperty ?statValue WHERE {
          BIND(IRI("${componentUri}") AS ?component) .
          OPTIONAL { ?component ?statProperty ?statValue .
                     FILTER (STRSTARTS(STR(?statProperty), STR(mk:has)))
                     FILTER (?statProperty != mk:isDLC)
          }
        }`;

    //Execute
    const data = await fetchSparqlData(query);

    //Empty object to store stats
    const stats = {};

    //Loop through stats
    data.results.bindings.forEach(binding => {
        //Clean name for properties
        const propName = getLocalName(binding.statProperty.value);
        //Convert from string to number
        const value = parseFloat(binding.statValue.value);

        //Add stat to empty object
        stats[propName] = isNaN(value) ? 0 : value;
    });
    return stats;
}

//This is where the magic happens
//Fetches stats for selected components, calculates totals and updates URIs
async function calculateCombinedStats() {

    //Gather all inputs from all dropdowns
    const driverUri = document.getElementById('driverSelect').value;
    const bodyUri = document.getElementById('bodySelect').value;
    const tireUri = document.getElementById('tireSelect').value;
    const gliderUri = document.getElementById('gliderSelect').value;
    const trackUri = document.getElementById('trackSelect').value;

    //Get HTML references
    const statusElement = document.getElementById('calculatorStatus');
    const errorElement = document.getElementById('calculatorError');
    const statsOutput = document.getElementById('combinedStatsOutput');
    const gripDisplay = document.getElementById('gripOnSlipperyTerrainDisplay');

    //Reset UI & hide display
    errorElement.textContent = '';
    gripDisplay.classList.add('hidden');

    //Check if at least the 4 important elements are selected (Driver & Vehicle Parts)
    const allComponentsSelected = driverUri && bodyUri && tireUri && gliderUri;

    if (allComponentsSelected) {
        //Show result area & message
        statsOutput.classList.add('visible');
        statusElement.textContent = 'Calculating combined stats...';

        try {
            //Fetch data (promise to get all simultaneously)
            const [driverStats, bodyStats, tireStats, gliderStats] = await Promise.all([
                fetchComponentStats(driverUri),
                fetchComponentStats(bodyUri),
                fetchComponentStats(tireUri),
                fetchComponentStats(gliderUri)
            ]);

            //Create empty object to hold sum of stats
            const totalStats = {};
            //List of all stat properties from all components
            const allStatKeys = new Set([...Object.keys(driverStats), ...Object.keys(bodyStats), ...Object.keys(tireStats), ...Object.keys(gliderStats)]);

            //Loop though stat and sum values of all 4 components
            allStatKeys.forEach(prop => {
                totalStats[prop] = (driverStats[prop] || 0) + (bodyStats[prop] || 0) + (tireStats[prop] || 0) + (gliderStats[prop] || 0);
            });

            //Update UI
            const updateStat = (statName, value) => {
                const formattedValue = value.toFixed(2);
                const elementId = statName.charAt(0).toLowerCase() + statName.slice(1);

                //Update text value
                document.getElementById(`total${statName}`).textContent = formattedValue;

                //Update bar width
                const barElement = document.getElementById(`bar-${elementId.replace('total', '')}`);
                if (barElement) {
                    const percentage = Math.min((value / 20) * 100, 100);
                    barElement.style.width = `${percentage}%`;
                }
            };

            //Call helper function, build diagram
            updateStat('GroundSpeed', totalStats.GroundSpeed || 0);
            updateStat('WaterSpeed', totalStats.WaterSpeed || 0);
            updateStat('AirSpeed', totalStats.AirSpeed || 0);
            updateStat('AntiGravitySpeed', totalStats.AntiGravitySpeed || 0);
            updateStat('Acceleration', totalStats.Acceleration || 0);
            updateStat('Weight', totalStats.Weight || 0);
            updateStat('GroundHandling', totalStats.GroundHandling || 0);
            updateStat('WaterHandling', totalStats.WaterHandling || 0);
            updateStat('AirHandling', totalStats.AirHandling || 0);
            updateStat('AntiGravityHandling', totalStats.AntiGravityHandling || 0);
            updateStat('OnRoadTraction', totalStats.OnRoadTraction || 0);
            updateStat('OffRoadTraction', totalStats.OffRoadTraction || 0);
            updateStat('MiniTurbo', totalStats.MiniTurbo || 0);
            updateStat('Invincibility', totalStats.Invincibility || 0);


            //Calculation for Grip on Slippery Terrain
            //If a slippery track has been selected
            if (trackUri) {
                //Get slipperiness profile
                const slipperinessProfileUri = await fetchTrackSlipperiness(trackUri);
                if (slipperinessProfileUri && slipperinessData[slipperinessProfileUri]) {

                    const totalOffRoadTraction = totalStats.OffRoadTraction || 0;

                    //Round traction to full number to use as level value (for hasSlipLevel0,...)
                    const tractionLevel = Math.round(totalOffRoadTraction);
                    //Get modifyer
                    const slipModifier = slipperinessData[slipperinessProfileUri][tractionLevel];

                    //Final calculation: OffRoadTraction = Level; Level * SlipModifyer = Grip on Slippery Trerrain
                    if (slipModifier !== undefined) {
                        const finalGripValue = totalOffRoadTraction * slipModifier;

                        //Update text & bar for the grip display 
                        document.getElementById('totalGripOnSlipperyTerrain').textContent = finalGripValue.toFixed(3);
                        const gripBar = document.getElementById('bar-gripOnSlipperyTerrain');
                        const gripPercentage = Math.min((finalGripValue / 20) * 100, 100);
                        gripBar.style.width = `${gripPercentage}%`;

                        gripDisplay.classList.remove('hidden');
                    }
                }
            }
            statusElement.textContent = 'Combined stats calculated.';

        } catch (error) {
            console.error("Error calculating combined stats:", error);
            errorElement.textContent = `Failed to calculate combined stats: ${error.message}`;
            statusElement.textContent = 'Error calculating.';
            statsOutput.classList.remove('visible');
        }
    } else {
        //If not all components are selected result area stays hidden
        statsOutput.classList.remove('visible');
    }
}

//Resets the output area
function clearCombinedStats() {
    const statSpans = document.querySelectorAll('.calculated-stats span');
    statSpans.forEach(span => {
        span.textContent = '--';
    });
    document.getElementById('gripOnSlipperyTerrainDisplay').classList.add('hidden'); // Use class to hide
    document.getElementById('calculatorError').textContent = '';
}


// ==================================================
// Parameter Filter
// ==================================================

function populateStatDropdown() {
    //Get drop down element
    const statSelect = document.getElementById('statSelect');

    //Array for all stat names to choose from
    const stats = ["Acceleration", "GroundSpeed", "Weight", "GroundHandling", "AntiGravitySpeed", "AntiGravityHandling", "AirSpeed", "AirHandling", "WaterSpeed", "WaterHandling", "Invincibility", "MiniTurbo", "OnRoadTraction", "OffRoadTraction"];

    statSelect.innerHTML = '<option value="">Select a Stat</option>';

    //Loop through all stat names in array
    stats.forEach(stat => {
        //Create the html option element
        const option = document.createElement('option');
        option.value = stat;
        option.textContent = stat;
        statSelect.appendChild(option);
    });
}

//Reset Best Combination display
function clearBestCombination() {
    document.getElementById('bestDriver').textContent = '--';
    document.getElementById('bestBody').textContent = '--';
    document.getElementById('bestTire').textContent = '--';
    document.getElementById('bestGlider').textContent = '--';
    document.getElementById('bestStatValue').textContent = '--';
    document.getElementById('selectedStatName').textContent = '--';
    document.getElementById('parameterFilterError').textContent = '';
}

//Fetches all components of a type with their stats
async function fetchAllComponentsWithStats(entityType) {
    //Get all entities of a certain type and all their stat properties
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?entityUri ?entityName ?statProperty ?statValue WHERE {
          ?entityUri rdf:type mk:${entityType} .
          OPTIONAL { ?entityUri rdfs:label ?entityName_label . }
          BIND(COALESCE(?entityName_label, STRAFTER(STR(?entityUri), STR(mk:))) AS ?entityName) .
          OPTIONAL {
            ?entityUri ?statProperty ?statValue .
            FILTER (STRSTARTS(STR(?statProperty), STR(mk:has)))
            FILTER (?statProperty != mk:isDLC)
          }
        } ORDER BY ?entityName ?statProperty`;

    //Execute
    const data = await fetchSparqlData(query);

    //Create empty object to group stats by component
    const components = {};

    //Loop through query results
    data.results.bindings.forEach(binding => {
        const uri = binding.entityUri.value;
        const name = getLocalName(binding.entityName.value);
        const propName = binding.statProperty ? getLocalName(binding.statProperty.value) : null;
        const value = binding.statValue ? parseFloat(binding.statValue.value) : 0;
        //Create URI if new component
        if (!components[uri]) components[uri] = { name: name, stats: {} };
        //Add stat property to the components stats object
        if (propName && !isNaN(value)) components[uri].stats[propName] = value;
    });

    //Convert to array of component objects and return
    return Object.values(components);
}


//Find combination of driver, body, tire, glider with maximized selected stat
async function findBestCombination() {
    //Get dropdown input
    const selectedStat = document.getElementById('statSelect').value;

    //Get references to UI elements
    const statusElement = document.getElementById('parameterFilterStatus');
    const errorElement = document.getElementById('parameterFilterError');

    const outputElement = document.getElementById('bestCombinationOutput'); // Element holen


    errorElement.textContent = '';

    // Wenn keine Statistik ausgewählt ist, Box ausblenden und Funktion beenden
    if (!selectedStat) {
        statusElement.textContent = 'Please select a stat.';
        outputElement.classList.remove('visible');
        return;
    }


    // Alte Ergebnisse erst löschen, wenn eine neue Suche startet
    clearBestCombination();

    statusElement.textContent = `Finding best combination for ${selectedStat}...`;
    document.getElementById('selectedStatName').textContent = selectedStat;

    try {
        //Fetch component data 
        const [drivers, bodies, tires, gliders] = await Promise.all([
            fetchAllComponentsWithStats('Driver'),
            fetchAllComponentsWithStats('Body'),
            fetchAllComponentsWithStats('Tire'),
            fetchAllComponentsWithStats('Glider')
        ]);

        //Calculate
        let bestCombination = null;
        //Start with lowest possible value
        let maxStatValue = -Infinity;

        //Lots of loops because we need to calculate for all selected components
        drivers.forEach(driver => {
            bodies.forEach(body => {
                tires.forEach(tire => {
                    gliders.forEach(glider => {
                        //For current combination calculate total value of selected stat
                        const currentStatValue = (driver.stats[selectedStat] || 0) + (body.stats[selectedStat] || 0) + (tire.stats[selectedStat] || 0) + (glider.stats[selectedStat] || 0);
                        //Check if current sombi is better than best one found so far
                        if (currentStatValue > maxStatValue) {
                            //If it is, update max val and save it as the best combo
                            maxStatValue = currentStatValue;
                            bestCombination = { driver: driver.name, body: body.name, tire: tire.name, glider: glider.name, value: currentStatValue };
                        }
                    });
                });
            });
        });


        //Display results after checking which component won


        if (bestCombination) {
            document.getElementById('bestDriver').textContent = bestCombination.driver;
            document.getElementById('bestBody').textContent = bestCombination.body;
            document.getElementById('bestTire').textContent = bestCombination.tire;
            document.getElementById('bestGlider').textContent = bestCombination.glider;
            document.getElementById('bestStatValue').textContent = bestCombination.value.toFixed(2);
            statusElement.textContent = 'Best combination found.';

            // NEU: Die Box mit den Ergebnissen einblenden
            outputElement.classList.add('visible');

        } else {
            //Only if no data found at all
            statusElement.textContent = 'No combinations found for the selected stat.';
            // Sicherstellen, dass die Box ausgeblendet ist, wenn nichts gefunden wird
            outputElement.classList.remove('visible');
        }
    } catch (error) {
        console.error("Error finding best combination:", error);
        errorElement.textContent = `Failed to find best combination: ${error.message}`;
        statusElement.textContent = 'Error finding combination.';
        clearBestCombination();
        // Box bei einem Fehler ausblenden
        outputElement.classList.remove('visible');
    }
}



// ==================================================
// Fetch and display Driver Stats (Table)
// ==================================================

//Fetches all driver stats from the ontology and displays them in an HTML table

async function loadDriverStats() {
    const statusElement = document.getElementById('driverStatsStatus');
    const driverStatsTable = document.getElementById('driverStatsTable');
    const errorMessage = document.getElementById('driverStatsError');


    // Reset before loading new data
    driverStatsTable.innerHTML = '';
    errorMessage.textContent = '';
    statusElement.textContent = 'Loading driver stats...';

    const query = `
            PREFIX mk: <${NAMESPACE_MK}>
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            SELECT ?driverUri ?driverName ?statProperty ?statValue WHERE {
              ?driverUri rdf:type mk:Driver . ?driverUri ?statProperty ?statValue .
              FILTER (STRSTARTS(STR(?statProperty), STR(mk:has))) FILTER (?statProperty != mk:isDLC)
              OPTIONAL { ?driverUri rdfs:label ?driverName_label . }
              BIND(COALESCE(?driverName_label, STRAFTER(STR(?driverUri), STR(mk:))) AS ?driverName)
            } ORDER BY ?driverName ?statProperty`;

    try {
        // Execute query 
        const data = await fetchSparqlData(query);
        // If query returns no results display message
        if (data.results.bindings.length === 0) {
            driverStatsTable.innerHTML = '<thead><tr><th>Driver</th><th>No stats found.</th></tr></thead><tbody></tbody>';
            statusElement.textContent = 'Data loaded.';
            return;
        }

        const driversData = {};
        // Set for stat names (table header)
        const allStatProperties = new Set();

        // Loop over each row from query
        data.results.bindings.forEach(binding => {
            const driverLocalName = getLocalName(binding.driverName.value);
            const statPropLocalName = getLocalName(binding.statProperty.value);
            const statValue = binding.statValue.value;

            // Group the stats by driver name
            if (!driversData[driverLocalName]) driversData[driverLocalName] = { name: driverLocalName };
            driversData[driverLocalName][statPropLocalName] = statValue;

            allStatProperties.add(statPropLocalName);
        });

        // Convert Set of properties to array & sort alphabetically
        const sortedStatProperties = Array.from(allStatProperties).sort();

        // Create the table header row
        const tableHead = driverStatsTable.createTHead();
        const headerRow = tableHead.insertRow();
        headerRow.insertCell().textContent = 'Driver';

        // Column header for stats  
        sortedStatProperties.forEach(prop => {
            //Filters isDLC bc it's irrelevant for the stat table
            if (prop !== 'IsDLC') {
                const th = document.createElement('th');
                th.textContent = prop;
                headerRow.appendChild(th);
            }
        });

        // Create table body
        const tableBody = driverStatsTable.createTBody();
        //Sort driver names
        const sortedDriverNames = Object.keys(driversData).sort();

        //Table row for each driver
        sortedDriverNames.forEach(driverName => {
            const driver = driversData[driverName];
            const row = tableBody.insertRow();
            row.insertCell().textContent = driver.name;

            // Add cell for each stat 
            sortedStatProperties.forEach(prop => {
                if (prop !== 'IsDLC') {
                    const cell = row.insertCell();
                    cell.textContent = driver[prop] !== undefined ? driver[prop] : '--';
                }
            });
        });

        // Update the status message
        statusElement.textContent = '';

        // Error messages
    } catch (error) {
        console.error("Error loading driver stats:", error);
        errorMessage.textContent = `Failed to load driver stats: ${error.message}`;
        statusElement.textContent = 'Error loading data.';
        driverStatsTable.innerHTML = '<thead><tr><th>Driver</th><th>Error loading data.</th></tr></thead><tbody></tbody>';
    }
}

// ==================================================
// Body Stats Table
// ==================================================
//Fetch all body stats from the ontology and displays them in an HTML table
async function loadBodyStats() {
    //Get HTML references
    const statusElement = document.getElementById('bodyStatsStatus');
    const statsTable = document.getElementById('bodyStatsTable');
    const errorMessage = document.getElementById('bodyStatsError');
     //Reset UI
    statsTable.innerHTML = '';
    errorMessage.textContent = '';
    statusElement.textContent = 'Loading body stats...';

    //Query for all individuals of type Body and their stats
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?entityUri ?entityName ?statProperty ?statValue WHERE {
          ?entityUri rdf:type mk:Body .
          OPTIONAL { ?entityUri ?statProperty ?statValue .
            FILTER (STRSTARTS(STR(?statProperty), STR(mk:has))) FILTER (?statProperty != mk:isDLC)
          }
          OPTIONAL { ?entityUri rdfs:label ?entityName_label . }
          BIND(COALESCE(?entityName_label, STRAFTER(STR(?entityUri), STR(mk:))) AS ?entityName)
        } ORDER BY ?entityName ?statProperty`;

    try {
        //Execute query
        const data = await fetchSparqlData(query);

        //Handle no results
        if (data.results.bindings.length === 0) {
            statsTable.innerHTML = '<thead><tr><th>Body</th><th>No stats found.</th></tr></thead><tbody></tbody>';
            statusElement.textContent = 'Data loaded.';
            return;
        }
        const componentData = {};
        const allStatProperties = new Set();
        //Loop results
        data.results.bindings.forEach(binding => {
            const localName = getLocalName(binding.entityName.value);
            if (!componentData[localName]) componentData[localName] = { name: localName };
            if (binding.statProperty) {
                const statPropLocalName = getLocalName(binding.statProperty.value);
                componentData[localName][statPropLocalName] = binding.statValue.value;
                allStatProperties.add(statPropLocalName);
            }
        });
        //Create table header
        const sortedStatProperties = Array.from(allStatProperties).sort();
        const tableHead = statsTable.createTHead();
        const headerRow = tableHead.insertRow();
        headerRow.insertCell().textContent = 'Body';
        sortedStatProperties.forEach(prop => {
            if (prop !== 'IsDLC') {
                const th = document.createElement('th');
                th.textContent = prop;
                headerRow.appendChild(th);
            }
        });
        //Create table body
        const tableBody = statsTable.createTBody();
        const sortedComponentNames = Object.keys(componentData).sort();
        sortedComponentNames.forEach(name => {
            const component = componentData[name];
            const row = tableBody.insertRow();
            row.insertCell().textContent = component.name;
            sortedStatProperties.forEach(prop => {
                if (prop !== 'IsDLC') {
                    const cell = row.insertCell();
                    cell.textContent = component[prop] !== undefined ? component[prop] : '--';
                }
            });
        });
        statusElement.textContent = '';

        //Errors
    } catch (error) {
        console.error("Error loading body stats:", error);
        errorMessage.textContent = `Failed to load body stats: ${error.message}`;
        statusElement.textContent = 'Error loading data.';
        statsTable.innerHTML = '<thead><tr><th>Body</th><th>Error loading data.</th></tr></thead><tbody></tbody>';
    }
}

// ==================================================
// Tire Stats Table
// ==================================================

//Fetches all tire stats from the ontology and displays them in an HTML table
async function loadTireStats() {
    //Get HTML references
    const statusElement = document.getElementById('tireStatsStatus');
    const statsTable = document.getElementById('tireStatsTable');
    const errorMessage = document.getElementById('tireStatsError');
    //Reset UI
    statsTable.innerHTML = '';
    errorMessage.textContent = '';
    statusElement.textContent = 'Loading tire stats...';

    //Query for all individuals of type tire and their stats
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?entityUri ?entityName ?statProperty ?statValue WHERE {
          ?entityUri rdf:type mk:Tire .
          OPTIONAL { ?entityUri ?statProperty ?statValue .
            FILTER (STRSTARTS(STR(?statProperty), STR(mk:has))) FILTER (?statProperty != mk:isDLC)
          }
          OPTIONAL { ?entityUri rdfs:label ?entityName_label . }
          BIND(COALESCE(?entityName_label, STRAFTER(STR(?entityUri), STR(mk:))) AS ?entityName)
        } ORDER BY ?entityName ?statProperty`;

    try {
        //Execute query
        const data = await fetchSparqlData(query);
        //Handle no results
        if (data.results.bindings.length === 0) {
            statsTable.innerHTML = '<thead><tr><th>Tire</th><th>No stats found.</th></tr></thead><tbody></tbody>';
            statusElement.textContent = 'Data loaded.';
            return;
        }
        //Prepare to group data
        const componentData = {};
        const allStatProperties = new Set();
        //Loop through results
        data.results.bindings.forEach(binding => {
            const localName = getLocalName(binding.entityName.value);
            if (!componentData[localName]) componentData[localName] = { name: localName };
            if (binding.statProperty) {
                const statPropLocalName = getLocalName(binding.statProperty.value);
                componentData[localName][statPropLocalName] = binding.statValue.value;
                allStatProperties.add(statPropLocalName);
            }
        });
        //Create table header
        const sortedStatProperties = Array.from(allStatProperties).sort();
        const tableHead = statsTable.createTHead();
        const headerRow = tableHead.insertRow();
        headerRow.insertCell().textContent = 'Tire';
        sortedStatProperties.forEach(prop => {
            if (prop !== 'IsDLC') {
                const th = document.createElement('th');
                th.textContent = prop;
                headerRow.appendChild(th);
            }
        });
        //Create table body
        const tableBody = statsTable.createTBody();
        const sortedComponentNames = Object.keys(componentData).sort();
        sortedComponentNames.forEach(name => {
            const component = componentData[name];
            const row = tableBody.insertRow();
            row.insertCell().textContent = component.name;
            sortedStatProperties.forEach(prop => {
                if (prop !== 'IsDLC') {
                    const cell = row.insertCell();
                    cell.textContent = component[prop] !== undefined ? component[prop] : '--';
                }
            });
        });
        statusElement.textContent = '';
        //Handle Erorrs
    } catch (error) {
        console.error("Error loading tire stats:", error);
        errorMessage.textContent = `Failed to load tire stats: ${error.message}`;
        statusElement.textContent = 'Error loading data.';
        statsTable.innerHTML = '<thead><tr><th>Tire</th><th>Error loading data.</th></tr></thead><tbody></tbody>';
    }
}

// ==================================================
// Glider Stats Table
// ==================================================
//Fetches all glider stats from the ontology and displays them in an HTML table
async function loadGliderStats() {
    //Get HTML references
    const statusElement = document.getElementById('gliderStatsStatus');
    const statsTable = document.getElementById('gliderStatsTable');
    const errorMessage = document.getElementById('gliderStatsError');
    //Reset UI
    statsTable.innerHTML = '';
    errorMessage.textContent = '';
    statusElement.textContent = 'Loading glider stats...';

    //Query for all glider entities & data properties
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?entityUri ?entityName ?statProperty ?statValue WHERE {
          ?entityUri rdf:type mk:Glider .
          OPTIONAL { ?entityUri ?statProperty ?statValue .
            FILTER (STRSTARTS(STR(?statProperty), STR(mk:has))) FILTER (?statProperty != mk:isDLC)
          }
          OPTIONAL { ?entityUri rdfs:label ?entityName_label . }
          BIND(COALESCE(?entityName_label, STRAFTER(STR(?entityUri), STR(mk:))) AS ?entityName)
        } ORDER BY ?entityName ?statProperty`;

    try {
        //Execute query
        const data = await fetchSparqlData(query);
        //for 0 results
        if (data.results.bindings.length === 0) {
            statsTable.innerHTML = '<thead><tr><th>Glider</th><th>No stats found.</th></tr></thead><tbody></tbody>';
            statusElement.textContent = 'Data loaded.';
            return;
        }
        const componentData = {};
        const allStatProperties = new Set();
        //Loop through results
        data.results.bindings.forEach(binding => {
            const localName = getLocalName(binding.entityName.value);
            if (!componentData[localName]) componentData[localName] = { name: localName };
            if (binding.statProperty) {
                const statPropLocalName = getLocalName(binding.statProperty.value);
                componentData[localName][statPropLocalName] = binding.statValue.value;
                allStatProperties.add(statPropLocalName);
            }
        });
        //Create table header
        const sortedStatProperties = Array.from(allStatProperties).sort();
        const tableHead = statsTable.createTHead();
        const headerRow = tableHead.insertRow();
        headerRow.insertCell().textContent = 'Glider';
        sortedStatProperties.forEach(prop => {
            if (prop !== 'IsDLC') {
                const th = document.createElement('th');
                th.textContent = prop;
                headerRow.appendChild(th);
            }
        });
        //Create table body
        const tableBody = statsTable.createTBody();
        const sortedComponentNames = Object.keys(componentData).sort();
        sortedComponentNames.forEach(name => {
            const component = componentData[name];
            const row = tableBody.insertRow();
            row.insertCell().textContent = component.name;
            sortedStatProperties.forEach(prop => {
                if (prop !== 'IsDLC') {
                    const cell = row.insertCell();
                    cell.textContent = component[prop] !== undefined ? component[prop] : '--';
                }
            });
        });
        statusElement.textContent = '';
        //Error messages
    } catch (error) {
        console.error("Error loading glider stats:", error);
        errorMessage.textContent = `Failed to load glider stats: ${error.message}`;
        statusElement.textContent = 'Error loading data.';
        statsTable.innerHTML = '<thead><tr><th>Glider</th><th>Error loading data.</th></tr></thead><tbody></tbody>';
    }
}

// ==================================================
// Event Listeners and Initializers
// ==================================================

document.addEventListener('DOMContentLoaded', async () => {

    //Header Scroll Effect
    const scrollThreshold = 50; //Number of px to scroll before effect triggers
    function handleHeaderScroll() {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > scrollThreshold) {
                // Add the "scrolled" class to header (for CSS)
                header.classList.add('scrolled');
            } else {
                // Remove class when back on top
                header.classList.remove('scrolled');
            }
        }
    }


    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    if (document.getElementById('driverSelect')) {
        //Pre-fetch slipperyness data
        await prefetchAllSlipperinessData();

        // Array for all dropdowns that need to be populated
        const componentPromises = [
            populateDropdown('driverSelect', 'Driver'),
            populateDropdown('bodySelect', 'Body'),
            populateDropdown('tireSelect', 'Tire'),
            populateDropdown('gliderSelect', 'Glider'),
            populateSlipperyTracksDropdown()
        ];
        //Run data-fetching for all dropdowns simultaneous
        await Promise.all(componentPromises);

        //Load main driver stats table
        await loadDriverStats();

        // --- ADD THESE THREE LINES ---
        await loadBodyStats();
        await loadTireStats();
        await loadGliderStats();
        // -----------------------------

        // Populate stat dropdown for param filter
        populateStatDropdown();
        //Add calculateCombinedStats function as event listener (when user changes selection: stats recalculate)
        document.getElementById('driverSelect').addEventListener('change', calculateCombinedStats);
        document.getElementById('bodySelect').addEventListener('change', calculateCombinedStats);
        document.getElementById('tireSelect').addEventListener('change', calculateCombinedStats);
        document.getElementById('gliderSelect').addEventListener('change', calculateCombinedStats);
        document.getElementById('trackSelect').addEventListener('change', calculateCombinedStats);
        //Call calculation function (clear state)
        calculateCombinedStats();
    }
});