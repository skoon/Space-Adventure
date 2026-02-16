/**
 * Travel UI Module
 * Handles map visualization and travel interaction
 */

let state;
let getUnlockedLocations;
let travelTo;
let updateUI;
let locationsData; // renamed to maintain reference to data, distinct from function

export function initTravelUI(deps, uiUpdateFn) {
    state = deps.state;
    locationsData = deps.data.locations;
    if (deps.locations) {
        getUnlockedLocations = deps.locations.getUnlockedLocations;
        travelTo = deps.locations.travelTo;
    }
    updateUI = uiUpdateFn;
}

/**
 * Show travel screen with available destinations
 */
export function showTravelScreen() {
    const modal = document.getElementById("travelScreen");
    const container = document.getElementById("travelDestinations");

    if (!modal || !container || !getUnlockedLocations) return;

    container.innerHTML = "";
    
    const unlockedLocs = getUnlockedLocations();

    // MAP VISUALIZATION
    const mapContainer = document.createElement("div");
    mapContainer.className = "map-container";
    
    // Draw connections (simple SVG lines)
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    
    // Define connections
    const connections = [
        { from: "terra_prime", to: "xylo_delta" },
        { from: "xylo_delta", to: "nebula_outpost" },
        { from: "terra_prime", to: "nebula_outpost" }
    ];
    
    connections.forEach(conn => {
        const fromLoc = unlockedLocs.find(l => l.id === conn.from);
        const toLoc = unlockedLocs.find(l => l.id === conn.to);
        
        if (fromLoc && toLoc) {
             const x1 = (fromLoc.coordinates?.x || 0) / 8 + "%";
             const y1 = (fromLoc.coordinates?.y || 0) / 6 + "%";
             const x2 = (toLoc.coordinates?.x || 0) / 8 + "%";
             const y2 = (toLoc.coordinates?.y || 0) / 6 + "%";
             
             const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
             line.setAttribute("x1", x1);
             line.setAttribute("y1", y1);
             line.setAttribute("x2", x2);
             line.setAttribute("y2", y2);
             line.setAttribute("stroke", "#4b5563");
             line.setAttribute("stroke-width", "2");
             line.setAttribute("stroke-dasharray", "5,5");
             svg.appendChild(line);
        }
    });
    
    mapContainer.appendChild(svg);
    
    // Draw Nodes
    unlockedLocs.forEach(loc => {
         const node = document.createElement("div");
         const isCurrent = state.currentLocation === loc.id;
         node.className = `map-node ${isCurrent ? 'current-location animate-pulse ring-4 ring-blue-500' : ''}`;
         
         // Position
         node.style.left = (loc.coordinates?.x || 100) / 8 + "%";
         node.style.top = (loc.coordinates?.y || 100) / 6 + "%";
         
         // Tooltip / Label
         const label = document.createElement("div");
         label.className = "map-label text-xs";
         label.innerHTML = `${loc.name}`;
         node.appendChild(label);
         
         if (!isCurrent) {
             node.onclick = () => {
                 if (travelTo(loc.id)) {
                     const travelModal = document.getElementById("travelScreen");
                     if (travelModal) travelModal.classList.add("hidden");
                     updateUI(); // Ensure UI updates to reflect new location immediately
                 }
             };
         }
         
         mapContainer.appendChild(node);
    });

    container.appendChild(mapContainer);

    // List View (Compact)
    const listContainer = document.createElement("div");
    listContainer.className = "grid grid-cols-1 gap-2";

    unlockedLocs.forEach(loc => {
        const isCurrent = state.currentLocation === loc.id;
        const currentCredits = state.character.credits || 0;
        const canAfford = currentCredits >= (loc.travelCost || 0);
        
        const card = document.createElement("div");
        card.className = `p-3 rounded border flex justify-between items-center ${isCurrent ? 'bg-blue-900 border-blue-400' : 'bg-gray-700 border-gray-600'}`;

        card.innerHTML = `
            <div>
                <div class="font-bold ${isCurrent ? 'text-blue-300' : 'text-gray-200'}">${loc.name}</div>
                <div class="text-xs text-gray-400">${loc.description}</div>
            </div>
            <div class="text-right">
                ${isCurrent ? 
                    '<span class="text-blue-400 font-bold text-sm">CURRENT</span>' : 
                    `<button class="px-3 py-1 rounded text-sm font-bold ${canAfford ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-red-900 text-gray-400 cursor-not-allowed'}" 
                        onclick="window.travelToLocation('${loc.id}')" ${!canAfford ? 'disabled' : ''}>
                        Travel (${loc.travelCost || 0} cr)
                    </button>`
                }
            </div>
        `;
        
        listContainer.appendChild(card);
    });
    
    container.appendChild(listContainer);
}

// Global helper for the button
export function travelToLocation(locId) {
    if (travelTo(locId)) {
        const travelModal = document.getElementById("travelScreen");
        if (travelModal) travelModal.classList.add("hidden");
        updateUI();
    }
}

window.travelToLocation = travelToLocation;
