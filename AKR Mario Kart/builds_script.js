// ==================================================
// Configuration
// ==================================================
const TRIPLYDB_SPARQL_ENDPOINT = "https://api.triplydb.com/datasets/katmirex/Mario-Kart-8-Deluxe---Complete-Ontology/sparql";
const NAMESPACE_MK = "http://mariokart8deluxe.owl#";

// ==================================================
// Playstyle Definitions
// ==================================================
const playstyles = {
    speedDemon: {
        displayName: "Speed Demon",
        description: "This build prioritizes maximum top speed above all else, making it ideal for long straightaways and experienced players.",
        weights: { GroundSpeed: 3, WaterSpeed: 2, AirSpeed: 2, AntiGravitySpeed: 2, Weight: 1, MiniTurbo: 0.5 }
    },
    driftMaster: {
        displayName: "Drift & Boost Master",
        description: "Perfect for courses with many turns. This build focuses on high acceleration and a powerful mini-turbo to boost out of drifts quickly.",
        weights: { Acceleration: 3, MiniTurbo: 3, GroundHandling: 1, AntiGravityHandling: 1 }
    },
    unstoppableTank: {
        displayName: "Unstoppable Tank",
        description: "Built for aggressive racing and battle mode. This build maximizes weight to knock opponents around and resists being pushed.",
        weights: { Weight: 3, GroundSpeed: 1, Invincibility: 1.5 }
    },
    offroadSpecialist: {
        displayName: "Off-Road Specialist",
        description: "Ideal for tracks with lots of shortcuts. This build maximizes off-road traction to maintain speed on sand, grass, or dirt.",
        weights: { OffRoadTraction: 4, GroundHandling: 1, Acceleration: 1 }
    },
    allRounder: {
        displayName: "Balanced All-Rounder",
        description: "A solid, versatile setup for any situation. This build provides a great balance between speed, acceleration, and handling.",
        weights: { GroundSpeed: 1.5, Acceleration: 1.5, GroundHandling: 1.5, MiniTurbo: 1 }
    }
};

// Global cache for component data to avoid re-fetching
let allComponentsCache = null;


// ==================================================
// SPARQL & Helper Functions
// ==================================================

async function fetchSparqlData(query) {
    try {
        // Build complete URL for the API request
        const url = `${TRIPLYDB_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
        // Send request & wait for response from the server
        const response = await fetch(url, { headers: { 'Accept': 'application/sparql-results+json' } });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        throw error;
    }
}
//Take URI and extracts clean name
function getLocalName(uri) {
    if (!uri) return '';
    return uri.split('#').pop();
}

// ==================================================
// Core Logic
// ==================================================

// Fetches all components and their stats, stores them in the cache
async function fetchAllComponents() {
    if (allComponentsCache) return allComponentsCache;

    // Update status message
    const statusElement = document.getElementById('playstyleStatus');
    statusElement.textContent = 'Loading all component data... This may take a moment.';

    const componentTypes = ['Driver', 'Body', 'Tire', 'Glider'];
    const promises = componentTypes.map(type => {
        //dynamic query for current component type
        const query = `
            PREFIX mk: <${NAMESPACE_MK}>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?entityUri ?entityName ?statProperty ?statValue
            WHERE {
              ?entityUri a mk:${type} .
              OPTIONAL { ?entityUri rdfs:label ?entityName_label . }
              BIND(COALESCE(?entityName_label, STRAFTER(STR(?entityUri), STR(mk:))) AS ?entityName) .
              OPTIONAL {
                ?entityUri ?statProperty ?statValue .
                FILTER(STRSTARTS(STR(?statProperty), STR(mk:has)) && ?statProperty != mk:isDLC)
              }
            } ORDER BY ?entityName`;
        return fetchSparqlData(query);
    });

    try {
        const results = await Promise.all(promises);
        // Prepare objects to organize fetched data
        const components = { Driver: {}, Body: {}, Tire: {}, Glider: {} };

        // Loop through the results (one for each component type)
        results.forEach((data, index) => {
            const type = componentTypes[index];
            data.results.bindings.forEach(binding => {
                const uri = binding.entityUri.value;
                // create an entry 
                if (!components[type][uri]) {
                    components[type][uri] = { name: getLocalName(binding.entityName.value), stats: {} };
                }
                // If this row contains stat data, add to component's stats object
                if (binding.statProperty) {
                    const propName = getLocalName(binding.statProperty.value).replace('has', '');
                    const value = parseFloat(binding.statValue.value);
                    if (!isNaN(value)) {
                        components[type][uri].stats[propName] = value;
                    }
                }
            });
        });

        // Convert organized data into final structure 
        allComponentsCache = {
            drivers: Object.values(components.Driver),
            bodies: Object.values(components.Body),
            tires: Object.values(components.Tire),
            gliders: Object.values(components.Glider)
        };
        // Update status and return cached data
        statusElement.textContent = 'Data loaded. Please select a playstyle.';
        return allComponentsCache;
    } catch (error) {
        document.getElementById('playstyleError').textContent = 'Failed to load component data. Please refresh the page.';
        statusElement.textContent = 'Error loading data.';
        return null;
    }
}

// Populates the playstyle dropdown menu
function populatePlaystyleDropdown() {
    const dropdown = document.getElementById('playstyleSelect');
    dropdown.innerHTML = '<option value="">Select a Playstyle</option>';
    for (const key in playstyles) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = playstyles[key].displayName;
        dropdown.appendChild(option);
    }
}


// Main function to find and display the best build
async function findBestBuildForPlaystyle() {
    const selectedKey = document.getElementById('playstyleSelect').value;
    const resultContainer = document.getElementById('playstyleResultOutput');
    const statusElement = document.getElementById('playstyleStatus');

    // Grab container for results
    const descriptionContainer = document.getElementById('playstyleDescriptionContainer');
    const combinationContainer = document.getElementById('bestCombinationOutput');
    const errorElement = document.getElementById('playstyleError');
    errorElement.textContent = ''; // Fehler zurücksetzen

    // Invisible if nothing selected/found
    if (!selectedKey) {
        resultContainer.classList.add('hidden');
        descriptionContainer.classList.remove('visible');
        combinationContainer.classList.remove('visible');
        return;
    }

    statusElement.textContent = `Calculating best build for "${playstyles[selectedKey].displayName}"...`;

    // Make container visible
    resultContainer.classList.remove('hidden');
    descriptionContainer.classList.add('visible');
    combinationContainer.classList.add('visible');

    // Show description
    document.getElementById('playstyleDescription').textContent = playstyles[selectedKey].description;

    const components = await fetchAllComponents();
    if (!components) return;

    let bestCombination = null;
    let maxScore = -Infinity;

    // Iterate through combinations
    // Loop through every driver
    components.drivers.forEach(driver => {
        // For each driver, loop through every body
        components.bodies.forEach(body => {
            // For each driver/body pair, loop through every tire
            components.tires.forEach(tire => {
                // For each driver/body/tire trio, loop through every glider
                components.gliders.forEach(glider => {

                    // Create empty object to hold stats for this combination
                    const totalStats = {};
                    //Initialize score
                    let currentScore = 0;

                    // List of all stat names present of the 4 selected parts
                    const allStatKeys = new Set([
                        ...Object.keys(driver.stats), ...Object.keys(body.stats),
                        ...Object.keys(tire.stats), ...Object.keys(glider.stats)
                    ]);
                    //Loop through all stat name, calculate total for combination
                    allStatKeys.forEach(stat => {
                        totalStats[stat] = (driver.stats[stat] || 0) + (body.stats[stat] || 0) + (tire.stats[stat] || 0) + (glider.stats[stat] || 0);
                    });
                    //Get important stats fpr selected playstyle
                    const weights = playstyles[selectedKey].weights;
                    //Calculate final score of combination (Multiply each total score with its importance /weight)
                    for (const stat in weights) {
                        currentScore += (totalStats[stat] || 0) * weights[stat];
                    }
                    // Compare this combination score to best score found so far
                    if (currentScore > maxScore) {
                        // If this combination is better, update the max score
                        maxScore = currentScore;
                        // Store combination as the new best
                        bestCombination = {
                            driver: driver.name,
                            body: body.name,
                            tire: tire.name,
                            glider: glider.name,
                            stats: totalStats
                        };
                    }
                });
            });
        });
    });

    //Show reults
    if (bestCombination) {
        displayRecommendedBuild(bestCombination);
        statusElement.textContent = `Recommended build for "${playstyles[selectedKey].displayName}" found!`;
    } else {
        errorElement.textContent = 'Could not determine a best build.';
        statusElement.textContent = 'Calculation failed.';
    }
}

// Updates UI with build info and stat chart
function displayRecommendedBuild(build) {
    // Update component names
    document.getElementById('bestDriver').textContent = build.driver;
    document.getElementById('bestBody').textContent = build.body;
    document.getElementById('bestTire').textContent = build.tire;
    document.getElementById('bestGlider').textContent = build.glider;

    // Helper to update stat value and bar width
    const updateStat = (statName, value) => {
        const formattedValue = (value || 0).toFixed(2);
        const elementId = statName.charAt(0).toLowerCase() + statName.slice(1);

        const valueElement = document.getElementById(`total${statName}`);
        if (valueElement) valueElement.textContent = formattedValue;

        const barElement = document.getElementById(`bar-${elementId}`);
        if (barElement) {
            // Max on this chart (100%) is 20
            const percentage = Math.min(((value || 0) / 20) * 100, 100);
            barElement.style.width = `${percentage}%`;
        }
    };

    // Update all stats in the chart
    updateStat('GroundSpeed', build.stats.GroundSpeed);
    updateStat('WaterSpeed', build.stats.WaterSpeed);
    updateStat('AirSpeed', build.stats.AirSpeed);
    updateStat('AntiGravitySpeed', build.stats.AntiGravitySpeed);
    updateStat('Acceleration', build.stats.Acceleration);
    updateStat('Weight', build.stats.Weight);
    updateStat('GroundHandling', build.stats.GroundHandling);
    updateStat('WaterHandling', build.stats.WaterHandling);
    updateStat('AirHandling', build.stats.AirHandling);
    updateStat('AntiGravityHandling', build.stats.AntiGravityHandling);
    updateStat('OnRoadTraction', build.stats.OnRoadTraction);
    updateStat('OffRoadTraction', build.stats.OffRoadTraction);
    updateStat('MiniTurbo', build.stats.MiniTurbo);
    updateStat('Invincibility', build.stats.Invincibility);
}


// ==================================================
// Event Listeners and Initializers
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    // Standard header scroll logic
    const scrollThreshold = 50;
    function handleHeaderScroll() {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // Initialize the playstyles page
    if (document.getElementById('playstyleSelect')) {
        populatePlaystyleDropdown();
        // Pre-fetch component data on page load for faster calculations later
        fetchAllComponents();
    }
});