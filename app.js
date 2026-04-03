// ===========================================
// 1. Map Setup
// ===========================================

const map = L.map('map').setView([39.8283, -98.5795], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

// ===========================================
// 2. Data
// ===========================================

const stateData = {
    'Alabama': { score: 77, income: 44000, home: 170000 },
    'Alaska': { score: 50, income: 75000, home: 450000 }, // Placeholder data
    'Arizona': { score: 55, income: 52000, home: 400000 },
    'Arkansas': { score: 73, income: 42000, home: 150000 }, // Placeholder data
    'California': { score: 28, income: 75000, home: 750000 },
    'Colorado': { score: 48, income: 68000, home: 520000 },
    'Connecticut': { score: 55, income: 70000, home: 380000 }, // Placeholder data
    'Delaware': { score: 60, income: 60000, home: 320000 }, // Placeholder data
    'Florida': { score: 65, income: 52000, home: 350000 },
    'Georgia': { score: 68, income: 54000, home: 310000 },
    'Hawaii': { score: 30, income: 70000, home: 600000 }, // Placeholder data
    'Idaho': { score: 65, income: 50000, home: 300000 }, // Placeholder data
    'Illinois': { score: 58, income: 60000, home: 320000 },
    'Indiana': { score: 76, income: 47000, home: 190000 },
    'Iowa': { score: 72, income: 52000, home: 210000 }, // Placeholder data
    'Kansas': { score: 70, income: 50000, home: 180000 }, // Placeholder data
    'Kentucky': { score: 74, income: 45000, home: 160000 }, // Placeholder data
    'Louisiana': { score: 71, income: 43000, home: 170000 }, // Placeholder data
    'Maine': { score: 60, income: 52000, home: 250000 }, // Placeholder data
    'Maryland': { score: 50, income: 75000, home: 450000 }, // Placeholder data
    'Massachusetts': { score: 45, income: 72000, home: 500000 }, // Placeholder data
    'Michigan': { score: 74, income: 50000, home: 220000 },
    'Minnesota': { score: 68, income: 62000, home: 350000 }, // Placeholder data
    'Mississippi': { score: 76, income: 40000, home: 150000 }, // Placeholder data
    'Missouri': { score: 75, income: 48000, home: 200000 },
    'Montana': { score: 70, income: 52000, home: 280000 }, // Placeholder data
    'Nebraska': { score: 72, income: 55000, home: 230000 }, // Placeholder data
    'Nevada': { score: 45, income: 54000, home: 420000 },
    'New Hampshire': { score: 62, income: 65000, home: 300000 }, // Placeholder data
    'New Jersey': { score: 55, income: 70000, home: 400000 }, // Placeholder data
    'New Mexico': { score: 68, income: 45000, home: 220000 }, // Placeholder data
    'New York': { score: 35, income: 68000, home: 550000 },
    'North Carolina': { score: 70, income: 51000, home: 280000 },
    'North Dakota': { score: 75, income: 60000, home: 250000 }, // Placeholder data
    'Ohio': { score: 78, income: 48000, home: 180000 },
    'Oklahoma': { score: 73, income: 45000, home: 160000 }, // Placeholder data
    'Oregon': { score: 40, income: 58000, home: 480000 },
    'Pennsylvania': { score: 62, income: 55000, home: 280000 },
    'Rhode Island': { score: 55, income: 60000, home: 350000 }, // Placeholder data
    'South Carolina': { score: 72, income: 47000, home: 220000 }, // Placeholder data
    'South Dakota': { score: 74, income: 52000, home: 240000 }, // Placeholder data
    'Tennessee': { score: 71, income: 49000, home: 260000 },
    'Texas': { score: 72, income: 58000, home: 290000 },
    'Utah': { score: 60, income: 62000, home: 400000 }, // Placeholder data
    'Vermont': { score: 65, income: 55000, home: 280000 }, // Placeholder data
    'Virginia': { score: 52, income: 65000, home: 400000 },
    'Washington': { score: 42, income: 72000, home: 580000 },
    'West Virginia': { score: 88, income: 42000, home: 150000 }, // Placeholder data
    'Wisconsin': { score: 70, income: 55000, home: 260000 },
    'Wyoming': { score: 78, income: 58000, home: 300000 } // Placeholder data
};

const stateNames = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois',
    'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
    'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan',
    'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana',
    'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
    'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota',
    'OH': 'Ohio', 'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
    'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
    'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
    'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

// ===========================================
// 3. Utility Functions
// ===========================================

function getColor(score) {
    if (score >= 65) return '#34a853';
    if (score >= 45) return '#fbbc04';
    return '#ea4335';
}

function formatCurrency(num) {
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    return '$' + (num / 1000).toFixed(0) + 'k';
}

function updateFooterStats(income, home, score) {
    document.getElementById('avgIncome').textContent = formatCurrency(income);
    document.getElementById('avgHome').textContent = formatCurrency(home);
    document.getElementById('score').textContent = score + '/100';
}

// ===========================================
// 4. State Layer (styling, hover, popups)
// ===========================================

let geojsonLayer;
let decoloredState = null;

function stateStyle(feature) {
    const stateName = feature.properties.name;
    const data = stateData[stateName];
    const score = data ? data.score : 50;

    return {
        fillColor: getColor(score),
        weight: 1,
        opacity: 1,
        color: '#fff',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    if (e.target === decoloredState) return;
    e.target.setStyle({ weight: 3, color: '#333', fillOpacity: 0.9 });
    e.target.bringToFront();
}

function resetHighlight(e) {
    if (e.target === decoloredState) return;
    e.target.setStyle({ weight: 1, color: '#fff', fillOpacity: 0.7 });
    e.target.bringToFront();
}

function onEachFeature(feature, layer) {
    const stateName = feature.properties.name;
    const data = stateData[stateName];

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: function () {
            map.fitBounds(layer.getBounds());
            if (data) updateFooterStats(data.income, data.home, data.score);
        }
    });

    if (data) {
        layer.bindPopup(
            `<strong>${stateName}</strong><br>
             Score: ${data.score}/100<br>
             Avg Income: ${formatCurrency(data.income)}<br>
             Avg Home: ${formatCurrency(data.home)}`
        );
    } else {
        layer.bindPopup(`<strong>${stateName}</strong><br>No data available`);
    }
}

const STATES_GEOJSON_URL =
    'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

fetch(STATES_GEOJSON_URL)
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJson(data, {
            style: stateStyle,
            onEachFeature: onEachFeature
        }).addTo(map);
    });

// ===========================================
// 5. Zip Code Search
// ===========================================

const ZIP_BOUNDARY_API =
    'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-united-states-of-america-zcta5/records';
const ZIP_LOCATION_API = 'https://api.zippopotam.us/us';

let zipMarker = null;
let zipBoundaryLayer = null;

function clearZipHighlight() {
    if (zipMarker) { map.removeLayer(zipMarker); zipMarker = null; }
    if (zipBoundaryLayer) { map.removeLayer(zipBoundaryLayer); zipBoundaryLayer = null; }
    if (decoloredState) {
        decoloredState.setStyle(stateStyle(decoloredState.feature));
        decoloredState = null;
    }
}

function fetchZipBoundary(zip) {
    const url = `${ZIP_BOUNDARY_API}?where=zcta5_code%3D%22${zip}%22&select=geo_shape,zcta5_code&limit=1`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) return data.results[0].geo_shape;
            return null;
        });
}

function decolorState(stateName) {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(layer => {
        if (layer.feature.properties.name === stateName) {
            layer.setStyle({ fillColor: 'transparent', fillOpacity: 0, weight: 1, color: '#ccc' });
            decoloredState = layer;
        }
    });
}

function searchByZip(zip) {
    Promise.all([
        fetch(`${ZIP_LOCATION_API}/${zip}`).then(r => {
            if (!r.ok) throw new Error('Invalid zip code');
            return r.json();
        }),
        fetchZipBoundary(zip)
    ])
    .then(([locationData, boundary]) => {
        const place = locationData.places[0];
        const lat = parseFloat(place.latitude);
        const lng = parseFloat(place.longitude);
        const city = place['place name'];
        const stateAbbr = place['state abbreviation'];
        const stateName = stateNames[stateAbbr];
        const data = stateName ? stateData[stateName] : null;

        clearZipHighlight();
        decolorState(stateName);

        // Draw zip code boundary polygon
        if (boundary) {
            zipBoundaryLayer = L.geoJson(boundary, {
                style: { color: '#0d47a1', weight: 4, fillColor: '#1a73e8', fillOpacity: 0.35 }
            }).addTo(map);
            zipBoundaryLayer.bringToFront();
            map.fitBounds(zipBoundaryLayer.getBounds(), { padding: [20, 20] });
        } else {
            map.setView([lat, lng], 13);
        }

        // Place marker at the true center of the boundary
        const markerPos = zipBoundaryLayer
            ? zipBoundaryLayer.getBounds().getCenter()
            : L.latLng(lat, lng);

        zipMarker = L.marker(markerPos).addTo(map);
        zipMarker.bindPopup(
            `<strong>${zip} - ${city}, ${stateAbbr}</strong><br>
             ${data
                 ? `Score: ${data.score}/100<br>
                    Avg Income: ${formatCurrency(data.income)}<br>
                    Avg Home: ${formatCurrency(data.home)}`
                 : 'No detailed data available'}`
        ).openPopup();

        if (data) updateFooterStats(data.income, data.home, data.score);
    })
    .catch(() => {
        alert('Zip code not found. Please enter a valid 5-digit US zip code.');
    });
}

// ===========================================
// 6. State Search
// ===========================================

function searchByState(abbr) {
    const stateName = stateNames[abbr.toUpperCase()];
    if (!stateName || !stateData[stateName]) return;

    clearZipHighlight();
    const data = stateData[stateName];
    updateFooterStats(data.income, data.home, data.score);

    geojsonLayer.eachLayer(layer => {
        if (layer.feature.properties.name === stateName) {
            map.fitBounds(layer.getBounds());
            layer.openPopup(layer.getBounds().getCenter());
        }
    });
}

// ===========================================
// 7. Event Listeners
// ===========================================

document.getElementById('searchBtn').addEventListener('click', function () {
    const zip = document.getElementById('zipcode').value.trim();
    const state = document.getElementById('state').value.trim();

    if (zip.length === 5 && /^\d{5}$/.test(zip)) {
        searchByZip(zip);
    } else if (state.length === 2) {
        searchByState(state);
    } else {
        alert('Please enter a valid 5-digit zip code or 2-letter state abbreviation.');
    }
});
