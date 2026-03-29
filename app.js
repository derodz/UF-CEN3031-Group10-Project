//USA based world map
const map = L.map('map').setView([39.8283, -98.5795],4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
}).addTo(map);

const stateData = {
    'Florida': { score: 65, income: 52000, home: 350000 },
    'Texas': { score: 72, income: 58000, home: 290000 },
    'California': { score: 28, income: 75000, home: 750000 },
    'New York': { score: 35, income: 68000, home: 550000 },
    'Ohio': { score: 78, income: 48000, home: 180000 },
    'Georgia': { score: 68, income: 54000, home: 310000 },
    'North Carolina': { score: 70, income: 51000, home: 280000 },
    'Arizona': { score: 55, income: 52000, home: 400000 },
    'Washington': { score: 42, income: 72000, home: 580000 },
    'Colorado': { score: 48, income: 68000, home: 520000 },
    'Michigan': { score: 74, income: 50000, home: 220000 },
    'Pennsylvania': { score: 62, income: 55000, home: 280000 },
    'Illinois': { score: 58, income: 60000, home: 320000 },
    'Virginia': { score: 52, income: 65000, home: 400000 },
    'Nevada': { score: 45, income: 54000, home: 420000 },
    'Oregon': { score: 40, income: 58000, home: 480000 },
    'Tennessee': { score: 71, income: 49000, home: 260000 },
    'Indiana': { score: 76, income: 47000, home: 190000 },
    'Missouri': { score: 75, income: 48000, home: 200000 },
    'Alabama': { score: 77, income: 44000, home: 170000 }
};

function getColor(score) {
    if (score >= 65) return '#34a853';
    if (score >= 45) return '#fbbc04';
    return '#ea4335';
}

function formatCurrency(num) {
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    return '$' + (num / 1000).toFixed(0) + 'k';
}

function style(feature) {
    const stateName = feature.properties.name;
    const data = stateData[stateName];
    const score = data ? data.score : 50; // default if no data
    
    return {
        fillColor: getColor(score),
        weight: 1,
        opacity: 1,
        color: '#fff',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    const layer = e.target;
    if (layer === decoloredState) return;
    layer.setStyle({
        weight: 3,
        color: '#333',
        fillOpacity: 0.9
    });
    layer.bringToFront();
}

function resetHighlight(e){
    const layer = e.target;
    if (layer === decoloredState) return;
    layer.setStyle({
        weight: 1,
        color: '#fff',
        fillOpacity: 0.7
    });
    layer.bringToFront();
}

function onEachFeature(feature, layer){
    const stateName = feature.properties.name;
    const data = stateData[stateName];

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: function() {
            map.fitBounds(layer.getBounds());
            if (data) {
                document.getElementById('avgIncome').textContent = formatCurrency(data.income);
                document.getElementById('avgHome').textContent = formatCurrency(data.home);
                document.getElementById('score').textContent = data.score + '/100';
            }
        }
    });

    if(data) {
        layer.bindPopup(`
            <strong>${stateName}</strong><br>
            Score: ${data.score}/100<br>
            Avg Income: ${formatCurrency(data.income)}<br>
            Avg Home: ${formatCurrency(data.home)}
        `);

    } else {
        layer.bindPopup(`<strong>${stateName}</strong><br>No data available`);
    }
}

let geojsonLayer;
fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);
    });

const stateNames = {
    'FL': 'Florida', 'TX': 'Texas', 'CA': 'California', 'NY': 'New York',
    'OH': 'Ohio', 'GA': 'Georgia', 'NC': 'North Carolina', 'AZ': 'Arizona',
    'WA': 'Washington', 'CO': 'Colorado', 'MI': 'Michigan', 'PA': 'Pennsylvania',
    'IL': 'Illinois', 'VA': 'Virginia', 'NV': 'Nevada', 'OR': 'Oregon',
    'TN': 'Tennessee', 'IN': 'Indiana', 'MO': 'Missouri', 'AL': 'Alabama'
};

let zipMarker = null;
let zipBoundaryLayer = null;
let decoloredState = null;

function clearZipHighlight() {
    if (zipMarker) { map.removeLayer(zipMarker); zipMarker = null; }
    if (zipBoundaryLayer) { map.removeLayer(zipBoundaryLayer); zipBoundaryLayer = null; }
    // Restore previously decolored state
    if (decoloredState) {
        decoloredState.setStyle(style(decoloredState.feature));
        decoloredState = null;
    }
}

function fetchZipBoundary(zip) {
    const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-united-states-of-america-zcta5/records?where=zcta5_code%3D%22${zip}%22&select=geo_shape,zcta5_code&limit=1`;
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                return data.results[0].geo_shape;
            }
            return null;
        });
}

function searchByZip(zip) {
    // Fetch location info and boundary in parallel
    Promise.all([
        fetch(`https://api.zippopotam.us/us/${zip}`).then(r => {
            if (!r.ok) throw new Error('Invalid zip code');
            return r.json();
        }),
        fetchZipBoundary(zip)
    ])
    .then(([locationData, boundary]) => {
        const lat = parseFloat(locationData.places[0].latitude);
        const lng = parseFloat(locationData.places[0].longitude);
        const city = locationData.places[0]['place name'];
        const stateAbbr = locationData.places[0]['state abbreviation'];
        const stateName = stateNames[stateAbbr];

        clearZipHighlight();

        // Decolor the state so the zip boundary stands out
        if (geojsonLayer) {
            geojsonLayer.eachLayer(layer => {
                if (layer.feature.properties.name === stateName) {
                    layer.setStyle({
                        fillColor: 'transparent',
                        fillOpacity: 0,
                        weight: 1,
                        color: '#ccc'
                    });
                    decoloredState = layer;
                }
            });
        }

        // Draw the zip code boundary polygon
        if (boundary) {
            zipBoundaryLayer = L.geoJson(boundary, {
                style: {
                    color: '#0d47a1',
                    weight: 4,
                    fillColor: '#1a73e8',
                    fillOpacity: 0.35
                }
            }).addTo(map);
            zipBoundaryLayer.bringToFront();
            map.fitBounds(zipBoundaryLayer.getBounds(), { padding: [20, 20] });
        } else {
            map.setView([lat, lng], 13);
        }

        // Place marker at the true center of the boundary if available
        const markerPos = zipBoundaryLayer
            ? zipBoundaryLayer.getBounds().getCenter()
            : L.latLng(lat, lng);
        zipMarker = L.marker(markerPos).addTo(map);
        zipMarker.bindPopup(`
            <strong>${zip} - ${city}, ${stateAbbr}</strong><br>
            ${stateName && stateData[stateName]
                ? `Score: ${stateData[stateName].score}/100<br>
                   Avg Income: ${formatCurrency(stateData[stateName].income)}<br>
                   Avg Home: ${formatCurrency(stateData[stateName].home)}`
                : 'No detailed data available'}
        `).openPopup();

        // Update footer stats
        if (stateName && stateData[stateName]) {
            const sd = stateData[stateName];
            document.getElementById('avgIncome').textContent = formatCurrency(sd.income);
            document.getElementById('avgHome').textContent = formatCurrency(sd.home);
            document.getElementById('score').textContent = sd.score + '/100';
        }
    })
    .catch(() => {
        alert('Zip code not found. Please enter a valid 5-digit US zip code.');
    });
}

function searchByState(abbr) {
    const stateName = stateNames[abbr.toUpperCase()];
    if (stateName && stateData[stateName]) {
        clearZipHighlight();
        const data = stateData[stateName];
        document.getElementById('avgIncome').textContent = formatCurrency(data.income);
        document.getElementById('avgHome').textContent = formatCurrency(data.home);
        document.getElementById('score').textContent = data.score + '/100';

        geojsonLayer.eachLayer(layer => {
            if (layer.feature.properties.name === stateName) {
                map.fitBounds(layer.getBounds());
            }
        });
    }
}

document.getElementById('searchBtn').addEventListener('click', function() {
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

console.log('Map initialized!');