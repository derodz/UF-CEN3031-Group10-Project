import * as censusApi from './api/censusData.mjs';

// ===========================================
// 1. Map Setup
// ===========================================

const map = L.map('map').setView([39.8283, -98.5795], 4);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap',
}).addTo(map);

// ===========================================
// 2. State Data (hardcoded for state-level view)
// ===========================================

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
    document.getElementById('score').textContent = getLetterGrade(score);
}

function getLetterGrade(score) {
    if (score >= 96) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 89) return 'A-';
    if (score >= 86) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 79) return 'B-';
    if (score >= 76) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 69) return 'C-';
    if (score >= 66) return 'D+';
    if (score >= 63) return 'D';
    if (score >= 59) return 'D-';
    return 'F';
}

function getRiskLevel(score) {
    if (score >= 65) return { label: 'Low Risk', cls: 'low' };
    if (score >= 45) return { label: 'Medium Risk', cls: 'medium' };
    return { label: 'High Risk', cls: 'high' };
}

function calculateAffordabilityScore(annualIncome, annualHousingCost) {
    const housingPercent = (annualHousingCost / annualIncome) * 100;
    if (housingPercent <= 26.7) return 100;
    if (housingPercent >= 60) return 0;
    return 3 * (60 - housingPercent);
}

// ===========================================
// 4. Search History
// ===========================================

const historyEntries = [];

function getArrow(entryScore, currentScore) {
    if (entryScore > currentScore) return '↑';
    if (entryScore < currentScore) return '↓';
    return '=';
}

function renderHistory(currentScore) {
    const list = document.getElementById('history');
    list.innerHTML = '';

    historyEntries.forEach((entry, i) => {
        const li = document.createElement('li');
        if (i === 0) {
            li.innerHTML = `<span class="history-label">${entry.zipOrState}: ${getLetterGrade(entry.score)}</span>`;
        } else {
            const arrow = getArrow(entry.score, currentScore);
            const cls = arrow === '↑' ? 'up' : arrow === '↓' ? 'down' : 'equal';
            li.innerHTML = `<span class="history-arrow ${cls}">${arrow}</span><span class="history-label">${entry.zipOrState}: ${getLetterGrade(entry.score)}</span>`;
        }
        list.appendChild(li);
    });
}

function addToHistory(entry) {
    historyEntries.unshift(entry);
    if (historyEntries.length > 10) historyEntries.pop();
    renderHistory(entry.score);
}

// ===========================================
// 5. State Layer (map coloring, hover, popups)
// ===========================================

let geojsonLayer;
let decoloredState = null;
let selectedState = null;

function stateStyle(feature) {
    const data = stateData[feature.properties.name];
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
    if (e.target === decoloredState || e.target === selectedState) return;
    e.target.setStyle({ weight: 3, color: '#333', fillOpacity: 0.9 });
    e.target.bringToFront();
}

function resetHighlight(e) {
    if (e.target === decoloredState || e.target === selectedState) return;
    e.target.setStyle({ weight: 1, color: '#fff', fillOpacity: 0.7 });
    e.target.bringToFront();
}

function clearSelectedState() {
    if (selectedState) {
        selectedState.setStyle(stateStyle(selectedState.feature));
        selectedState = null;
    }
}

function onEachFeature(feature, layer) {
    const name = feature.properties.name;
    const data = stateData[name];

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
            `<strong>${name}</strong><br>
             Score: ${getLetterGrade(data.score)}<br>
             Median Income: ${formatCurrency(data.income)}<br>
             Annual Housing Cost: ${formatCurrency(data.home)}`,
        );
    } else {
        layer.bindPopup(`<strong>${name}</strong><br>No data available`);
    }
}

fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
    .then((res) => res.json())
    .then((data) => {
        geojsonLayer = L.geoJson(data, {
            style: stateStyle,
            onEachFeature: onEachFeature,
        }).addTo(map);
    });

// ===========================================
// 6. Zip Code Search
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
    clearSelectedState();
}

function fetchZipBoundary(zip) {
    const url = `${ZIP_BOUNDARY_API}?where=zcta5_code%3D%22${zip}%22&select=geo_shape,zcta5_code&limit=1`;
    return fetch(url)
        .then((res) => res.json())
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

            if (income === null || monthlyHousingCost === null) {
                alert('No Census data available for ZIP ' + zip + '. Try a residential ZIP code.');
                return;
            }

            const annualCost = monthlyHousingCost * 12;
            const score = Math.round(calculateAffordabilityScore(income, annualCost));

            clearZipHighlight();
            decolorState(stateName);

            // Draw zip boundary
            if (boundary) {
                zipBoundaryLayer = L.geoJson(boundary, {
                    style: { color: '#0d47a1', weight: 4, fillColor: '#1a73e8', fillOpacity: 0.35 },
                }).addTo(map);
                zipBoundaryLayer.bringToFront();
                map.fitBounds(zipBoundaryLayer.getBounds(), { padding: [20, 20] });
            } else {
                map.setView([lat, lng], 13);
            }

            // Marker
            const markerPos = zipBoundaryLayer ? zipBoundaryLayer.getBounds().getCenter() : L.latLng(lat, lng);
            zipMarker = L.marker(markerPos).addTo(map);
            zipMarker
                .bindPopup(
                    `<strong>${zip} - ${city}, ${stateAbbr}</strong><br>
             Score: ${getLetterGrade(score)}<br>
             Median Income: ${formatCurrency(income)}<br>
             Annual Housing Cost: ${formatCurrency(annualCost)}`,
                )
                .openPopup();

            updateFooterStats(income, annualCost, score);
            addToHistory({ zipOrState: zip, score });
            showInfoPanel(zip, score, income, annualCost);
        })
        .catch(() => {
            alert('Could not load data for that ZIP code. Please check it and try again.');
        });
}

// ===========================================
// 7. State Search
// ===========================================

function searchByState(abbr) {
    const stateName = stateNames[abbr.toUpperCase()];
    if (!stateName || !stateData[stateName]) return;

    clearZipHighlight();
    const data = stateData[stateName];
    updateFooterStats(data.income, data.home, data.score);

    clearSelectedState();
    geojsonLayer.eachLayer((layer) => {
        if (layer.feature.properties.name === stateName) {
            map.fitBounds(layer.getBounds());
            layer.setStyle({ weight: 4, color: '#0d47a1', fillColor: '#1a73e8', fillOpacity: 0.6 });
            layer.bringToFront();
            selectedState = layer;
        }
    });

    addToHistory({ zipOrState: abbr, score: data.score });
}

// ===========================================
// 8. Filters
// ===========================================

function stateMatchesFilters(data) {
    if (!data) return true;

    const incomeVal = document.getElementById('income').value;
    const priceVal = document.getElementById('price').value;
    const riskVal = document.getElementById('risk').value;
    const affordVal = document.getElementById('affordabilityScore').value;

    // Income filter
    if (incomeVal === 'Under $50k' && data.income >= 50000) return false;
    if (incomeVal === '$50k - $100k' && (data.income < 50000 || data.income >= 100000)) return false;
    if (incomeVal === '$100k+' && data.income < 100000) return false;

    // Price filter
    if (priceVal === 'Under $200k' && data.home >= 200000) return false;
    if (priceVal === '$200k - $400k' && (data.home < 200000 || data.home >= 400000)) return false;
    if (priceVal === '$400k+' && data.home < 400000) return false;

    // Risk filter (based on score thresholds)
    if (riskVal === 'Low Risk' && data.score < 65) return false;
    if (riskVal === 'Medium Risk' && (data.score < 45 || data.score >= 65)) return false;
    if (riskVal === 'High Risk' && data.score >= 45) return false;

    // Affordability filter
    if (affordVal === 'Very Affordable' && data.score < 75) return false;
    if (affordVal === 'Moderately Affordable' && (data.score < 55 || data.score >= 75)) return false;
    if (affordVal === 'Less Affordable' && (data.score < 35 || data.score >= 55)) return false;
    if (affordVal === 'Not Affordable' && data.score >= 35) return false;

    return true;
}

// ===========================================
// 9. Search Button
// ===========================================

document.getElementById('searchBtn').addEventListener('click', () => {
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
// 10. Info Panel (ZIP details)
// ===========================================

let unemploymentChart = null;

function drawUnemploymentChart(trend) {
    const ctx = document.getElementById('unemploymentChart').getContext('2d');
    if (unemploymentChart) unemploymentChart.destroy();

    unemploymentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trend.map((t) => String(t.year)),
            datasets: [
                {
                    label: 'Unemployment Rate',
                    data: trend.map((t) => t.rate),
                    borderColor: '#1a73e8',
                    backgroundColor: 'rgba(26, 115, 232, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (item) => (item.raw !== null ? item.raw + '% unemployment' : 'No data'),
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Unemployment %', font: { size: 11 } },
                    ticks: { callback: (val) => val + '%' },
                },
                x: {
                    title: { display: true, text: 'Year', font: { size: 11 } },
                },
            },
        },
    });
}

async function showInfoPanel(zip, score, income, home) {
    const details = document.getElementById('details');
    const risk = getRiskLevel(score);

    // Show what we already know immediately
    details.innerHTML = `
        <div class="info-row">
            <span>Risk Level</span>
            <span class="badge ${risk.cls}">${risk.label}</span>
        </div>
        <div class="info-row">
            <span>Affordability Score</span>
            <span>${getLetterGrade(score)}</span>
        </div>
        <div class="info-row">
            <span>Median Income</span>
            <span>${formatCurrency(income)}</span>
        </div>
        <div class="info-row">
            <span>Annual Housing Cost</span>
            <span>${formatCurrency(home)}</span>
        </div>
        <div class="info-row">
            <span>Unemployment Rate</span>
            <span id="infoUnemployment">Loading...</span>
        </div>
        <div class="info-row">
            <span>Buyers Market</span>
            <span id="infoBuyersGrade">Loading...</span>
        </div>
        <div class="info-row">
            <span>Renter Activity</span>
            <span id="infoRenterActivity">Loading...</span>
        </div>
        <h3>Unemployment Trend</h3>
        <canvas id="unemploymentChart"></canvas>
    `;

    // Fetch the rest in parallel
    const [unemployment, supply, renters, trend] = await Promise.all([censusApi.getUnemploymentDataByZip(zip), censusApi.getSupplyAndDemandDataByZip(zip), censusApi.getInvestorActivityDataByZip(zip), censusApi.getUnemploymentTrendByZip(zip)]);

    document.getElementById('infoUnemployment').textContent = unemployment !== null ? unemployment + '%' : 'N/A';

    document.getElementById('infoBuyersGrade').textContent = supply.buyersMarketScore !== null ? supply.buyersMarketScore + ' (' + supply.homeownershipVacancyRate + '% vacancy)' : 'N/A';

    document.getElementById('infoRenterActivity').textContent = renters !== null ? renters + '% renters' : 'N/A';

    drawUnemploymentChart(trend);
}

// ===========================================
// 11. Budget Search
// ===========================================

async function searchByBudget(budget) {
    if (!budget || isNaN(budget)) {
        alert('Please enter a valid monthly budget.');
        return;
    }

    const state = document.getElementById('budgetState').value.trim() || null;
    const details = document.getElementById('details');
    details.innerHTML = '<p class="placeholder">Searching for affordable areas...</p>';

    const results = await censusApi.getTopTenHousingLocationsByMonthlyBudget(budget, state).catch(() => null);

    if (!results || results.length === 0) {
        details.innerHTML = '<p class="placeholder">No areas found within that budget.</p>';
        return;
    }

    // Fetch city/state names for each zip
    const enriched = await Promise.all(
        results.map(async (entry) => {
            try {
                const res = await fetch(`${ZIP_LOCATION_API}/${entry.zip}`);
                const data = await res.json();
                const place = data.places[0];
                return {
                    zip: entry.zip,
                    housingCost: entry.housingCost,
                    city: place['place name'],
                    state: place['state abbreviation'],
                };
            } catch {
                return { zip: entry.zip, housingCost: entry.housingCost, city: 'Unknown', state: '' };
            }
        }),
    );

    details.innerHTML = `
        <p class="budget-heading">Top areas under ${formatCurrency(budget)}/mo</p>
        <ul class="budget-results">
            ${enriched
                .map(
                    (e) => `
                <li class="budget-item" data-zip="${e.zip}">
                    <span class="budget-location">${e.city}, ${e.state} <small>${e.zip}</small></span>
                    <span class="budget-cost">${formatCurrency(e.housingCost)}/mo</span>
                </li>
            `,
                )
                .join('')}
        </ul>
    `;

    // Click a result to run full zip search
    details.querySelectorAll('.budget-item').forEach((item) => {
        item.addEventListener('click', () => {
            document.getElementById('zipcode').value = item.dataset.zip;
            searchByZip(item.dataset.zip);
        });
    });
}

document.getElementById('budgetBtn').addEventListener('click', () => {
    const budget = parseFloat(document.getElementById('budgetInput').value);
    searchByBudget(budget);
});
