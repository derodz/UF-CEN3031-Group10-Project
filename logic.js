//Use filesystem to read from csv
const fs = require('fs');

//Create location object
class Location {
    constructor(name, income, housing_price) {
        if (income === 0 || housing_price === 0) {
            this.name = name;
            this.income = 0;
            this.housing_price = 0;
            this.affordability_score = 0;
        } else {
            this.name = name;
            this.income = income;
            this.housing_price = housing_price;
            this.affordability_score = this.normalizeData(housing_price);
        }
    }

    normalizeData(housing_price) {
        var affordability_score = 0;
        if (housing_price <= 25) {
            affordability_score = 100;
        } 
        else if (housing_price >= 60) {
            affordability_score = 0;
        } 
        else {
            affordability_score = 3 * (60 - housing_price);
        }
        return affordability_score;
    }

    getName() { return this.name; }
    getIncome() { return this.income; }
    getHousingPrice() { return this.housing_price; }
    getAffordabilityScore() { return this.affordability_score; }
    setAffordabilityScore(afscore) { this.affordability_score = afscore; }
}

const lines = fs.readFileSync('counties.csv', 'utf8').split('\n');
const locations = [];

// skip first line (header)
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const tokens = line.split(',');
    let name = '';
    let income = 0;
    let housing_price = 0;

    if (tokens[50] === '' || tokens[60] === '') {
        income = 0;
        housing_price = 0;
    } else {
        income = tokens[50]
        housing_price = tokens[60];
    }

    const location = new Location(name, income, housing_price);
    locations.push(location);
}

//Testing Code

//print results, cap at 100, newline every 12 items
for (let i = 0; i < locations.length; i++) {
    if (locations[i].getAffordabilityScore(100) >= 100) {
        locations[i].setAffordabilityScore(100);
    }
    //if (i % 12 === 0) {
        //process.stdout.write('\n');
    //}
    //process.stdout.write(locations[i].getAffordabilityScore()toFixed(2) + ', ');
}

module.exports =  {Location, locations}