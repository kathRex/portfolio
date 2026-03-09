// ==================================================
// Configuration
// ==================================================
const TRIPLYDB_SPARQL_ENDPOINT = "https://api.triplydb.com/datasets/katmirex/Mario-Kart-8-Deluxe---Complete-Ontology/sparql";
const NAMESPACE_MK = "http://mariokart8deluxe.owl#"; //Ontology URI!


// ==================================================
// SPARQL data (using modern Fetch API)
// ==================================================

async function fetchSparqlData(query) {
    try {
        const url = `${TRIPLYDB_SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/sparql-results+json' // Request JSON format
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching SPARQL data:", error);
        throw error; // Re-throw to be caught by the calling function
    }
}


// ==================================================
// Clean up for writing (remove prefixes,..)
// ==================================================
function getLocalName(uri) {
    if (!uri) return '';
    const parts = uri.split('#');
    let name = parts.pop(); // Gets "hasAcceleration" from #hasAcceleration
    if (name.includes('/')) {
        name = name.split('/').pop();
    }
    //Remove "has" prefix if it exists and capitalize the first letter
    if (name.startsWith('has') && name.length > 3) {
        name = name.substring(3); //Remove has
        name = name.charAt(0).toUpperCase() + name.slice(1); //Capitalize first letter
    }
    return name;
}


// ==================================================
// Show Tracs for each Cup
// ==================================================

//Populates "Select a Cup' dropdown with all available cups from the ontology

async function populateCupsDropdown() {
    // Get references to HTML elements
    const dropdown = document.getElementById('cupSelect');
    if (!dropdown) return;
    const statusElement = document.getElementById('cupsTracksStatus');
    const errorElement = document.getElementById('cupsTracksError');

    // Reset UI 
    dropdown.innerHTML = '<option value="">Loading cups...</option>';
    errorElement.textContent = '';
    statusElement.textContent = 'Loading cups...';

    //Query to get all individuals of type Cup
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?cupUri ?cupName
        WHERE {
            ?cupUri rdf:type mk:Cup .
            OPTIONAL { ?cupUri rdfs:label ?cupName_label . }
            BIND(COALESCE(?cupName_label, STRAFTER(STR(?cupUri), STR(mk:))) AS ?cupName)
        }
        ORDER BY ?cupName
    `;

    try {
        // Execute query
        const data = await fetchSparqlData(query);
        // Reset dropdown
        dropdown.innerHTML = '<option value="">Select a Cup</option>';

        // If no cups found, display message and stop
        if (data.results.bindings.length === 0) {
            dropdown.innerHTML = '<option value="">No cups found.</option>';
            statusElement.textContent = 'No cups found.';
            return;
        }

        // Loop through each cup 
        data.results.bindings.forEach(binding => {
            // Create a new option element for dropdown
            const option = document.createElement('option');

            option.value = binding.cupUri.value;
            // Set visible text to clean name
            option.textContent = getLocalName(binding.cupName.value);
            // Add new option to the dropdow
            dropdown.appendChild(option);
        });
        statusElement.textContent = 'Cups loaded. Please select a cup.';
    } catch (error) {
        // 
        console.error("Error populating cups dropdown:", error);
        dropdown.innerHTML = '<option value="">Error loading cups</option>';
        errorElement.textContent = `Failed to load cups: ${error.message}`;
        statusElement.textContent = 'Error loading cups.';
    }
}

// It fetches, displays list of tracks for specific cup

async function displayTracksForSelectedCup() {
    // Get URI of the cup the user selected
    const selectedCupUri = document.getElementById('cupSelect').value;

    // Get references to HTML elements 
    const selectedCupNameDisplay = document.getElementById('selectedCupName');
    const trackList = document.getElementById('trackList');
    const statusElement = document.getElementById('cupsTracksStatus');
    const errorElement = document.getElementById('cupsTracksError');
    const tracksDisplayDiv = document.getElementById('tracksDisplay');

    // Reset results area 
    trackList.innerHTML = '';
    errorElement.textContent = '';
    selectedCupNameDisplay.textContent = '--';
    tracksDisplayDiv.style.display = 'none';

    // If "Select a Cup" selected, do nothing
    if (!selectedCupUri) {
        statusElement.textContent = 'Please select a cup.';
        return;
    }

    // Get visible text of selected option to display
    const selectedCupText = document.getElementById('cupSelect').options[document.getElementById('cupSelect').selectedIndex].textContent;
    selectedCupNameDisplay.textContent = selectedCupText;
    statusElement.textContent = `Loading tracks for ${selectedCupText}...`;

    // Query to find all tracks linked to the selected cup's URI
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?trackName
        WHERE {
            BIND(IRI("${selectedCupUri}") AS ?cup) .
            ?cup mk:hasTrack ?track .
            OPTIONAL { ?track rdfs:label ?trackName_label . }
            BIND(COALESCE(?trackName_label, STRAFTER(STR(?track), STR(mk:))) AS ?trackName)
        }
        ORDER BY ?trackName
    `;

    try {
        // Execute the query
        const data = await fetchSparqlData(query);
        // Make results area visible
        tracksDisplayDiv.style.display = 'block';

        // If no tracks were found for this cup display message
        if (data.results.bindings.length === 0) {
            trackList.innerHTML = '<li>No tracks found for this cup.</li>';
            statusElement.textContent = `No tracks found for ${selectedCupText}.`;
            return;
        }

        // Loop through each track that was found
        data.results.bindings.forEach(binding => {
            // Create a new list item for the track
            const listItem = document.createElement('li');
            //clean name
            listItem.textContent = getLocalName(binding.trackName.value);
            // Add list item to the track list
            trackList.appendChild(listItem);
        });
        statusElement.textContent = `Tracks for ${selectedCupText} loaded.`;
    } catch (error) {

        console.error("Error displaying tracks for selected cup:", error);
        errorElement.textContent = `Failed to load tracks for this cup: ${error.message}`;
        statusElement.textContent = 'Error loading tracks.';
        trackList.innerHTML = '<li>Error loading tracks.</li>';
    }
}



// ==================================================
// FILTER Tracks by Nintendo Platform
// ==================================================

async function populatePlatformsDropdown() {
    // Get HTML
    const dropdown = document.getElementById('platformSelect');
    if (!dropdown) return;
    const statusElement = document.getElementById('platformTracksStatus');
    const errorElement = document.getElementById('platformTracksError');

    // Reset the UI 
    dropdown.innerHTML = '<option value="">Loading platforms...</option>';
    errorElement.textContent = '';
    statusElement.textContent = 'Loading platforms...';

    //Query all unique GamePlatform individuals
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?platformUri ?platformName
        WHERE {
          ?platformUri rdf:type mk:GamePlatform .
          OPTIONAL { ?platformUri rdfs:label ?platformName_label . }
          BIND(COALESCE(?platformName_label, STRAFTER(STR(?platformUri), STR(mk:))) AS ?platformName)
        }
        ORDER BY ?platformName
    `;

    try {
        //Execute
        const data = await fetchSparqlData(query);

        // Reset dropdown
        dropdown.innerHTML = '<option value="">Select a Platform</option>';

        if (data.results.bindings.length === 0) {
            dropdown.innerHTML = '<option value="">No platforms found.</option>';
            statusElement.textContent = 'No platforms found.';
            return;
        }

        // Loop through each platform
        data.results.bindings.forEach(binding => {
            //New html element for the options
            const option = document.createElement('option');
            option.value = binding.platformUri.value;

            option.textContent = getLocalName(binding.platformName.value);
            dropdown.appendChild(option);
        });
        statusElement.textContent = 'Platforms loaded. Please select a platform.';

        //Errors
    } catch (error) {
        console.error("Error populating platforms dropdown:", error);
        dropdown.innerHTML = '<option value="">Error loading platforms</option>';
        errorElement.textContent = `Failed to load platforms: ${error.message}`;
        statusElement.textContent = 'Error loading platforms.';
    }
}


// Displays tracks for the selected platform
async function displayTracksForSelectedPlatform() {
    // Get elements
    const selectedPlatformUri = document.getElementById('platformSelect').value;
    const selectedPlatformNameDisplay = document.getElementById('selectedPlatformName');
    const platformTrackList = document.getElementById('platformTrackList');
    const statusElement = document.getElementById('platformTracksStatus');
    const errorElement = document.getElementById('platformTracksError');
    const tracksDisplayDiv = document.getElementById('platformTracksDisplay');


    // Reset the state
    platformTrackList.innerHTML = '';
    errorElement.textContent = '';
    selectedPlatformNameDisplay.textContent = '--';
    tracksDisplayDiv.style.display = 'none'; // Initially hides the display area

    // If no platform is selected, exit the function
    if (!selectedPlatformUri) {
        statusElement.textContent = 'Please select a platform.';
        return;
    }

    // Display name of platform & load status
    const selectedPlatformText = document.getElementById('platformSelect').options[document.getElementById('platformSelect').selectedIndex].textContent;
    selectedPlatformNameDisplay.textContent = selectedPlatformText;
    statusElement.textContent = `Loading tracks from ${selectedPlatformText}...`;

    // Query to retrieve tracks for the selected platform
    const query = `
        PREFIX mk: <${NAMESPACE_MK}>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?trackName
        WHERE {
            ?track mk:hasOriginPlatform <${selectedPlatformUri}> . # Filters by the platform URI
            OPTIONAL { ?track rdfs:label ?trackName_label . }
            BIND(COALESCE(?trackName_label, STRAFTER(STR(?track), STR(mk:))) AS ?trackName)
        }
        ORDER BY ?trackName
    `;

    try {
        const data = await fetchSparqlData(query); // Execute query

        // Make the display area visible 
        tracksDisplayDiv.style.display = 'block';

        if (data.results.bindings.length === 0) {
            // Message if no tracks were found
            platformTrackList.innerHTML = '<li>No tracks found for this platform.</li>';
            statusElement.textContent = `No tracks found for ${selectedPlatformText}.`;
            return;
        }

        // Add the found tracks to the list
        data.results.bindings.forEach(binding => {
            const listItem = document.createElement('li');
            listItem.textContent = getLocalName(binding.trackName.value); 
            platformTrackList.appendChild(listItem);
        });
        statusElement.textContent = `Tracks from ${selectedPlatformText} loaded.`;
    } catch (error) {
        // Error handling 
        console.error("Error displaying tracks for selected platform:", error);
        errorElement.textContent = `Failed to load tracks for this platform: ${error.message}`;
        statusElement.textContent = 'Error loading tracks.';
        platformTrackList.innerHTML = '<li>Error loading tracks.</li>';
    }
}


// ==================================================
// Displays tracks in a table based on their slipperiness type
// ==================================================

async function displaySlipperyTracksInTable() {
    const slipperyTableBody = document.querySelector('#slipperyTracksTable tbody');
    const statusElement = document.getElementById('slipperyTableStatus');
    const errorElement = document.getElementById('slipperyTableError');
    const tableDisplayDiv = document.getElementById('slipperyTracksTableDisplay');

    // Reset display state
    slipperyTableBody.innerHTML = ''; // Clear previous content
    errorElement.textContent = '';
    tableDisplayDiv.style.display = 'none';
    statusElement.textContent = 'Loading slippery tracks...';

    // Definition of slipperiness types and their URIs
    const slipperyTypes = {
        light: { uri: `${NAMESPACE_MK}LightSlip`, tracks: [] },
        medium: { uri: `${NAMESPACE_MK}MediumSlip`, tracks: [] },
        heavy: { uri: `${NAMESPACE_MK}HeavySlip`, tracks: [] }
    };

    try {
        // Fetch tracks for each slipperiness type in parallel
        const fetchPromises = Object.keys(slipperyTypes).map(async typeKey => {
            const typeInfo = slipperyTypes[typeKey];
            const query = `
                PREFIX mk: <${NAMESPACE_MK}>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

                SELECT ?trackName
                WHERE {
                    ?track a mk:Track .
                    ?track mk:hasSlipperiness <${typeInfo.uri}> . 
                    OPTIONAL { ?track rdfs:label ?trackName_label . }
                    BIND(COALESCE(?trackName_label, STRAFTER(STR(?track), STR(mk:))) AS ?trackName)
                }
                ORDER BY ?trackName
            `;
            const data = await fetchSparqlData(query);
            typeInfo.tracks = data.results.bindings.map(binding => getLocalName(binding.trackName.value));
        });

        await Promise.all(fetchPromises); // Wait for all fetches to complete

        tableDisplayDiv.style.display = 'block'; // Make the table visible

        // Determine max of tracks
        const maxTracks = Math.max(
            slipperyTypes.light.tracks.length,
            slipperyTypes.medium.tracks.length,
            slipperyTypes.heavy.tracks.length
        );

        if (maxTracks === 0) {
            statusElement.textContent = 'No slippery tracks found.';
            return;
        }

        // Populate table by rows
        for (let i = 0; i < maxTracks; i++) {
            const row = slipperyTableBody.insertRow();
            const lightCell = row.insertCell();
            const mediumCell = row.insertCell();
            const heavyCell = row.insertCell();

            // Insert track name
            lightCell.textContent = slipperyTypes.light.tracks[i] || '';
            mediumCell.textContent = slipperyTypes.medium.tracks[i] || '';
            heavyCell.textContent = slipperyTypes.heavy.tracks[i] || '';
        }

        statusElement.textContent = 'Slippery Terrains are specific off-road sections on certain tracks where the grip is significantly reduced. The classification into Light, Medium, or Heavy determines the severity of this effect, directly impacting how much a combinations Off-Road Traction stat is penalized.';

    } catch (error) {
        console.error("Error displaying slippery tracks table:", error);
        errorElement.textContent = `Failed to load slippery tracks: ${error.message}`;
        statusElement.textContent = 'Error loading slippery tracks.';
    }
}



// ==================================================
// Event Listeners and Initializers
// ==================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Header scroll functionality (generic to all pages)
    const scrollThreshold = 50;
    function handleHeaderScroll() {
        const header = document.querySelector('header');
        if (header) { // Ensure header exists before trying to modify it
            if (window.scrollY > scrollThreshold) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    // Call once on load in case the page is already scrolled (important for fixed headers)
    handleHeaderScroll();


    // Initializations specific to cups_tracks.html
    // Check if an element specific to cups_tracks.html exists
    if (document.getElementById('cupSelect')) {
        // Populate cups dropdown
        await populateCupsDropdown();
        document.getElementById('cupSelect').addEventListener('change', displayTracksForSelectedCup);

        // Populate platforms dropdown
        await populatePlatformsDropdown();
        document.getElementById('platformSelect').addEventListener('change', displayTracksForSelectedPlatform);

        // Call function to display slippery tracks in a table
        displaySlipperyTracksInTable();
    }
});