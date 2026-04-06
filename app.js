// ===========================================
// 1. Map Setup
// ===========================================

const map = L.map('map').setView([39.8283, -98.5795], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap',
}).addTo(map);

// ===========================================
// 2. Data
// ===========================================

import * as censusApi from './api/censusData.mjs';

const stateData = {
    Florida: { score: 65, income: 52000, home: 350000 },
    Texas: { score: 72, income: 58000, home: 290000 },
    California: { score: 28, income: 75000, home: 750000 },
    'New York': { score: 35, income: 68000, home: 550000 },
    Ohio: { score: 78, income: 48000, home: 180000 },
    Georgia: { score: 68, income: 54000, home: 310000 },
    'North Carolina': { score: 70, income: 51000, home: 280000 },
    Arizona: { score: 55, income: 52000, home: 400000 },
    Washington: { score: 42, income: 72000, home: 580000 },
    Colorado: { score: 48, income: 68000, home: 520000 },
    Michigan: { score: 74, income: 50000, home: 220000 },
    Pennsylvania: { score: 62, income: 55000, home: 280000 },
    Illinois: { score: 58, income: 60000, home: 320000 },
    Virginia: { score: 52, income: 65000, home: 400000 },
    Nevada: { score: 45, income: 54000, home: 420000 },
    Oregon: { score: 40, income: 58000, home: 480000 },
    Tennessee: { score: 71, income: 49000, home: 260000 },
    Indiana: { score: 76, income: 47000, home: 190000 },
    Missouri: { score: 75, income: 48000, home: 200000 },
    Alabama: { score: 77, income: 44000, home: 170000 },
};

const stateNames = {
    FL: 'Florida',
    TX: 'Texas',
    CA: 'California',
    NY: 'New York',
    OH: 'Ohio',
    GA: 'Georgia',
    NC: 'North Carolina',
    AZ: 'Arizona',
    WA: 'Washington',
    CO: 'Colorado',
    MI: 'Michigan',
    PA: 'Pennsylvania',
    IL: 'Illinois',
    VA: 'Virginia',
    NV: 'Nevada',
    OR: 'Oregon',
    TN: 'Tennessee',
    IN: 'Indiana',
    MO: 'Missouri',
    AL: 'Alabama',
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

/**
 *
 * @param {{ zipOrState: string, score: number}} entry
 */
function addToHistory(entry) {
    const historyList = document.getElementById('history');
    const firstItem = historyList.firstChild;
    const newItem = document.createElement('li');
    newItem.textContent = `${entry.zipOrState}: ${entry.score}/100`;
    historyList.insertBefore(newItem, firstItem);
    if (historyList.children.length > 10) {
        historyList.removeChild(historyList.lastChild);
    }
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
        fillOpacity: 0.7,
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
        },
    });

    if (data) {
        layer.bindPopup(
            `<strong>${stateName}</strong><br>
             Score: ${data.score}/100<br>
             Avg Income: ${formatCurrency(data.income)}<br>
             Avg Home: ${formatCurrency(data.home)}`,
        );
    } else {
        layer.bindPopup(`<strong>${stateName}</strong><br>No data available`);
    }
}

const STATES_GEOJSON_URL = 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

fetch(STATES_GEOJSON_URL)
    .then((response) => response.json())
    .then((data) => {
        geojsonLayer = L.geoJson(data, {
            style: stateStyle,
            onEachFeature: onEachFeature,
        }).addTo(map);
    });

// ===========================================
// 5. Zip Code Search
// ===========================================

const ZIP_BOUNDARY_API = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/georef-united-states-of-america-zcta5/records';
const ZIP_LOCATION_API = 'https://api.zippopotam.us/us';

let zipMarker = null;
let zipBoundaryLayer = null;

function clearZipHighlight() {
    if (zipMarker) {
        map.removeLayer(zipMarker);
        zipMarker = null;
    }
    if (zipBoundaryLayer) {
        map.removeLayer(zipBoundaryLayer);
        zipBoundaryLayer = null;
    }
    if (decoloredState) {
        decoloredState.setStyle(stateStyle(decoloredState.feature));
        decoloredState = null;
    }
}

function fetchZipBoundary(zip) {
    const url = `${ZIP_BOUNDARY_API}?where=zcta5_code%3D%22${zip}%22&select=geo_shape,zcta5_code&limit=1`;
    return fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.results && data.results.length > 0) return data.results[0].geo_shape;
            return null;
        });
}

function decolorState(stateName) {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer((layer) => {
        if (layer.feature.properties.name === stateName) {
            layer.setStyle({ fillColor: 'transparent', fillOpacity: 0, weight: 1, color: '#ccc' });
            decoloredState = layer;
        }
    });
}

//Affordability Score Calculation Logic
function calculateAffordabilityScore(annualIncome, annualHousingCost) {
    var affordability_score = 0;
    var housing_price = annualHousingCost / annualIncome;
    if (housing_price <= 26.7) {
        affordability_score = 100;
    } else if (housing_price >= 60) {
        affordability_score = 0;
    } else {
        affordability_score = 3 * (60 - housing_price);
    }
    return affordability_score;
}

function searchByZip(zip) {
    Promise.all([
        fetch(`${ZIP_LOCATION_API}/${zip}`).then((r) => {
            if (!r.ok) throw new Error('Invalid zip code');
            return r.json();
        }),
        fetchZipBoundary(zip),
    ])
        .then(async ([locationData, boundary]) => {
            const place = locationData.places[0];
            const lat = parseFloat(place.latitude);
            const lng = parseFloat(place.longitude);
            const city = place['place name'];
            const stateAbbr = place['state abbreviation'];
            const stateName = stateNames[stateAbbr];
            const income = await censusApi.getMedianIncomeByZip(zip);
            const monthlyHousingCost = await censusApi.getMedianMonthlyHousingCostByZip(zip);
            const medianPrice = monthlyHousingCost * 12;
            const affordabilityScore = calculateAffordabilityScore(income, medianPrice);
            const data = { score: affordabilityScore, income, home: medianPrice };
            console.debug('fetched data for zip', income, monthlyHousingCost);

            clearZipHighlight();
            decolorState(stateName);

            // Draw zip code boundary polygon
            if (boundary) {
                zipBoundaryLayer = L.geoJson(boundary, {
                    style: { color: '#0d47a1', weight: 4, fillColor: '#1a73e8', fillOpacity: 0.35 },
                }).addTo(map);
                zipBoundaryLayer.bringToFront();
                map.fitBounds(zipBoundaryLayer.getBounds(), { padding: [20, 20] });
            } else {
                map.setView([lat, lng], 13);
            }

            // Place marker at the true center of the boundary
            const markerPos = zipBoundaryLayer ? zipBoundaryLayer.getBounds().getCenter() : L.latLng(lat, lng);

            zipMarker = L.marker(markerPos).addTo(map);
            zipMarker
                .bindPopup(
                    `<strong>${zip} - ${city}, ${stateAbbr}</strong><br>
             ${
                 data
                     ? `Score: ${data.score}/100<br>
                    Avg Income: ${formatCurrency(data.income)}<br>
                    Avg Home: ${formatCurrency(data.home)}`
                     : 'No detailed data available'
             }`,
                )
                .openPopup();

            if (data) updateFooterStats(data.income, data.home, data.score);

            addToHistory({ zipOrState: zip, score: data.score });
        })
        .catch((err) => {
            console.error('Error fetching zip code data:', err);
            alert('There was a problem calculating for that zip code. Please ensure it is valid and try again.');
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

    geojsonLayer.eachLayer((layer) => {
        if (layer.feature.properties.name === stateName) {
            map.fitBounds(layer.getBounds());
        }
    });

    addToHistory({ zipOrState: abbr, score: data.score });
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

// ===========================================
// 8. Budget Search
// ===========================================

function searchByMontlyBudget(budget) {
    if (!budget || isNaN(budget)) {
        console.error(`Invalid budget provided: ${budget}`);
        alert(`Invalid budget provided`);
        return;
    }

    censusApi
        .getTopTenHousingLocationsByMonthlyBudget(budget)
        .then((results) => {
            console.debug(`Received ${results.length} results for budget search:`, results);
            if (results.length === 0) {
                alert('No locations found within that budget.');
                return;
            }

            const resultsList = results.map((entry) => {
                return { zip: entry.zip, housingCost: formatCurrency(entry.housingCost) };
            });
            console.debug('Formatted budget search results:', resultsList);
            // TODO: we need to figure out how to display these results in the UI
        })
        .catch((err) => {
            console.error('Error fetching budget search results:', err);
            alert('An error occurred while searching for locations within your budget. Please try again later.');
        });
}
