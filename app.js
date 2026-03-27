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
    layer.setStyle({
        weight: 3,
        color: '#333',
        fillOpacity: 0.9
    });
    layer.bringToFront();
}

function resetHighlight(e){
    const layer = e.target;
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

document.getElementById('searchBtn').addEventListener('click', function() {
    const stateInput = document.getElementById('state');
    const stateNames = {
        'FL': 'Florida', 'TX': 'Texas', 'CA': 'California', 'NY': 'New York',
        'OH': 'Ohio', 'GA': 'Georgia', 'NC': 'North Carolina', 'AZ': 'Arizona',
        'WA': 'Washington', 'CO': 'Colorado', 'MI': 'Michigan', 'PA': 'Pennsylvania',
        'IL': 'Illinois', 'VA': 'Virginia', 'NV': 'Nevada', 'OR': 'Oregon',
        'TN': 'Tennessee', 'IN': 'Indiana', 'MO': 'Missouri', 'AL': 'Alabama'
    };

    const stateName = stateNames[stateInput.value.toUpperCase()];
    if (stateName && stateData[stateName]) {
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
});

console.log('Map initialized!');