/**
 * Census Bureau economic data source links
 */

const medianIncomeDataSource = 'https://api.census.gov/data/2024/acs/acs5?get=group(B19121)&ucgid=860Z200US{{0}}';
const monthlyMedianHousingCostDataSource = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25105)&ucgid=860Z200US{{0}}';
const allMonthlyMedianHousinCostDataSource = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25105)&ucgid=pseudo(0100000US$8600000)';
const occupancyDemographicsDataSource = 'https://api.census.gov/data/2024/acs/acs5?get=group(B25003)&ucgid=860Z200US{{0}}';
/**
 * Get data from the Census API for a specific zip code and return it as an object with header keys and data values
 * @param {string} url
 * @param {string} zip
 * @returns
 */
const getCensusApiData = async (url, zip) => {
    /** @type {[]} */
    const response = await (await fetch(url.replace('{{0}}', zip))).json();
    /** @type {string[]} */
    const headers = response[0];
    /** @type {string[]} */
    const data = response[1];

    return Object.fromEntries(headers.map((h, i) => [h, data[i]]));
};

/**
 * Get data from the Census API without filtering and return it as a list of objects with header keys and data values
 * @param {string} url
 * @returns
 */
const getBulkCensusApiData = async (url) => {
    /** @type {[]} */
    const response = await (await fetch(url)).json();
    /** @type {string[]} */
    const headers = response[0];
    /** @type {string[]} */
    const data = response.slice(1);

    return data.map((d) => {
        const entry = Object.fromEntries(headers.map((h, i) => [h, d[i]]));
        entry['zip'] = entry['NAME'].replace('ZCTA5 ', '');
        entry['housingCost'] = Number(entry['B25105_001E']);
        return entry;
    });
};

/**
 * Returns the median income for the given zip code
 * @param {number} zip
 */
export const getMedianIncomeByZip = async (zip) => {
    console.debug(`Getting median income for zip code ${zip}...`);
    const medianIncomeData = await getCensusApiData(medianIncomeDataSource, zip);
    console.debug(`Retrieved median income data for zip code ${zip}:`, medianIncomeData);
    return Number(medianIncomeData['B19121_003E']);
};

/**
 * Returns the median monthly housing costs for the given zip code
 * @param {number} zip
 */
export const getMedianMonthlyHousingCostByZip = async (zip) => {
    console.debug(`Getting median monthly housing cost for zip code ${zip}...`);
    const medianCostData = await getCensusApiData(monthlyMedianHousingCostDataSource, zip);
    console.debug(`Retrieved monthly housing cost data for zip code ${zip}:`, medianCostData);
    return Number(medianCostData['B25105_001E']);
};

/**
 * Returns places based on median income <= provided budget
 * @param {number} budget
 * @returns {{ zip: string, housingCost: number, }[]}
 */
export const getTopTenHousingLocationsByMonthlyBudget = async (budget) => {
    if (!budget || isNaN(budget)) {
        console.error(`Invalid budget provided: ${budget}`);
        return [];
    }

    console.debug(`Getting top housing locations for budget ${budget}...`);
    const allMedianMonthlyCostData = await getBulkCensusApiData(allMonthlyMedianHousinCostDataSource);
    return allMedianMonthlyCostData.filter((entry) => entry['housingCost'] <= Number(budget)).slice(0, 10);
};

/**
 * TODO: We still don't have data for this (Sprint 2)
 * @param {number} zip
 */
export const getSupplyAndDemandDataByZip = async (zip) => {
    // TODO: We still don't have data for this (Sprint 2)
    // TODO: Implement this function to retrieve supply and demand data for the given zip code
};

/**
 * Investory Activity is calculated as the percentage of renter-occupied housing units in the given zip code
 * @param {number} zip
 */
export const getInvestorActivityDataByZip = async (zip) => {
    console.debug(`Requesting investor activity for zip code ${zip}...`);
    const occupancyDemographicsData = await getCensusApiData(occupancyDemographicsDataSource, zip);
    console.debug(`Retrieved occupancy demographics data for zip code ${zip}:`, occupancyDemographicsData);
    const renterPercentage = (Number(occupancyDemographicsData['B25003_003E']) / Number(occupancyDemographicsData['B25003_001E'])) * 100;
    console.debug(`Calculated renter percentage for zip code ${zip}: ${renterPercentage}%`);
    return Number(renterPercentage.toFixed(2));
};

/**
 * TODO: We still don't have data for this (Sprint 2)
 * @param {number} zip
 */
export const getUnemploymentDataByZip = async (zip) => {
    // TODO: We still don't have data for this (Sprint 2)
    // TODO: Implement this function to retrieve unemployment data for the given zip code
};
