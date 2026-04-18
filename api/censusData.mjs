// ===========================================
// Census Bureau API
// ===========================================

// Sentinel value Census uses when data isn't available
const CENSUS_NO_DATA = -666666666;

// Safely parse a Census value, returning null if it's missing or invalid
const censusVal = (raw) => {
    const n = Number(raw);
    return (isNaN(n) || n <= CENSUS_NO_DATA) ? null : n;
};

// State abbreviation to FIPS code
const stateFips = {
    AL:'01', AK:'02', AZ:'04', AR:'05', CA:'06', CO:'08', CT:'09', DE:'10',
    FL:'12', GA:'13', HI:'15', ID:'16', IL:'17', IN:'18', IA:'19', KS:'20',
    KY:'21', LA:'22', ME:'23', MD:'24', MA:'25', MI:'26', MN:'27', MS:'28',
    MO:'29', MT:'30', NE:'31', NV:'32', NH:'33', NJ:'34', NM:'35', NY:'36',
    NC:'37', ND:'38', OH:'39', OK:'40', OR:'41', PA:'42', RI:'44', SC:'45',
    SD:'46', TN:'47', TX:'48', UT:'49', VT:'50', VA:'51', WA:'53', WV:'54',
    WI:'55', WY:'56', DC:'11',
};

// ===========================================
// Data source URLs (ACS 5-Year Estimates)
// ===========================================

const medianIncomeUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B19121)&ucgid=860Z200US{{0}}';
const housingCostUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25105)&ucgid=860Z200US{{0}}';
const allHousingCostUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25105)&ucgid=pseudo(0100000US$8600000)';
const stateHousingCostUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25105)&ucgid=pseudo(0400000US{{0}}$8600000)';
const occupancyUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25003)&ucgid=860Z200US{{0}}';
const employmentUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B23025)&ucgid=860Z200US{{0}}';
const vacancyUrl = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25004)&ucgid=860Z200US{{0}}';

// ===========================================
// Low-level fetch helpers
// ===========================================

// Fetch Census data for a single zip code
const getCensusData = async (url, zip) => {
    const response = await (await fetch(url.replace('{{0}}', zip))).json();
    const headers = response[0];
    const data = response[1];
    return Object.fromEntries(headers.map((h, i) => [h, data[i]]));
};

// Fetch bulk Census data (all zip codes), filtering out bad entries
const getBulkCensusData = async (url) => {
    const response = await (await fetch(url)).json();
    const headers = response[0];
    const rows = response.slice(1);

    return rows
        .map((row) => {
            const entry = Object.fromEntries(headers.map((h, i) => [h, row[i]]));
            entry['zip'] = entry['NAME'].replace('ZCTA5 ', '');
            entry['housingCost'] = censusVal(entry['B25105_001E']);
            return entry;
        })
        .filter((entry) => entry['housingCost'] !== null);
};

// ===========================================
// Exported data functions
// ===========================================

// Median household income for a zip code
export const getMedianIncomeByZip = async (zip) => {
    const data = await getCensusData(medianIncomeUrl, zip);
    return censusVal(data['B19121_003E']);
};

// Median monthly housing cost for a zip code
export const getMedianMonthlyHousingCostByZip = async (zip) => {
    const data = await getCensusData(housingCostUrl, zip);
    return censusVal(data['B25105_001E']);
};

// Top 10 zip codes within a monthly budget, sorted highest cost first.
// Optionally filtered by state (e.g. "FL").
export const getTopTenHousingLocationsByMonthlyBudget = async (budget, state) => {
    if (!budget || isNaN(budget)) return [];

    let url = allHousingCostUrl;
    if (state) {
        const fips = stateFips[state.toUpperCase()];
        if (!fips) return [];
        url = stateHousingCostUrl.replace('{{0}}', fips);
    }

    const allData = await getBulkCensusData(url);
    const filtered = allData.filter((entry) => entry['housingCost'] <= Number(budget));
    filtered.sort((a, b) => b['housingCost'] - a['housingCost']);
    return filtered.slice(0, 10);
};

// Homeownership vacancy rate + buyers market grade (A/B/C/F)
export const getSupplyAndDemandDataByZip = async (zip) => {
    const vacancyData = await getCensusData(vacancyUrl, zip);
    const occupancyData = await getCensusData(occupancyUrl, zip);

    const forSale = censusVal(vacancyData['B25004_004E']);
    const soldNotOccupied = censusVal(vacancyData['B25004_005E']);
    const ownerOccupied = censusVal(occupancyData['B25003_002E']);

    if (forSale === null || soldNotOccupied === null || ownerOccupied === null) {
        return { homeownershipVacancyRate: null, buyersMarketScore: null };
    }

    const salesSupply = forSale + soldNotOccupied;
    const totalSupply = salesSupply + ownerOccupied;
    if (totalSupply === 0) {
        return { homeownershipVacancyRate: null, buyersMarketScore: null };
    }

    const rate = Number(((salesSupply / totalSupply) * 100).toFixed(2));

    let grade;
    if (rate <= 1)        grade = 'F'; // very low supply
    else if (rate <= 1.5) grade = 'C'; // balanced
    else if (rate <= 2.5) grade = 'B'; // healthy supply
    else                  grade = 'A'; // excess supply

    return { homeownershipVacancyRate: rate, buyersMarketScore: grade };
};

// Percentage of renter-occupied units (proxy for investor activity)
export const getInvestorActivityDataByZip = async (zip) => {
    const data = await getCensusData(occupancyUrl, zip);
    const renters = censusVal(data['B25003_003E']);
    const total = censusVal(data['B25003_001E']);
    if (renters === null || total === null || total === 0) return null;
    return Number(((renters / total) * 100).toFixed(2));
};

// Unemployment rate for a single year
export const getUnemploymentDataByZip = async (zip) => {
    const data = await getCensusData(employmentUrl, zip);
    const laborForce = censusVal(data['B23025_001E']);
    const unemployed = censusVal(data['B23025_005E']);
    if (laborForce === null || unemployed === null || laborForce === 0) return null;
    return Number(((unemployed / laborForce) * 100).toFixed(2));
};

// Unemployment rates across 2019–2023 for trend chart
export const getUnemploymentTrendByZip = async (zip) => {
    const years = [2019, 2020, 2021, 2022, 2023];
    const trend = [];

    for (const year of years) {
        const url = `https://api.census.gov/data/${year}/acs/acs5?get=group(B23025)&ucgid=860Z200US{{0}}`;
        try {
            const data = await getCensusData(url, zip);
            const labor = censusVal(data['B23025_001E']);
            const unemployed = censusVal(data['B23025_005E']);
            const rate = (labor && unemployed !== null) ? Number(((unemployed / labor) * 100).toFixed(2)) : null;
            trend.push({ year, rate });
        } catch {
            trend.push({ year, rate: null });
        }
    }

    return trend;
};
