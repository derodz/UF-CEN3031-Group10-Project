// Import the functions you need from the SDKs you need
// import { initializeApp } from 'firebase/app';
// import { getAnalytics } from 'firebase/analytics';
// import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// TODO: change the below to use modules above when we have the react app going
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js';
import * as firestore from 'https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyB8-bIodbAsoTo4CaIyeZp7T_jSq1xNrsU',
    authDomain: 'affordable-housing-risk.firebaseapp.com',
    projectId: 'affordable-housing-risk',
    storageBucket: 'affordable-housing-risk.firebasestorage.app',
    messagingSenderId: '70084664070',
    appId: '1:70084664070:web:0456fb8a6c031afa741c87',
    measurementId: 'G-7HD00PKNZC',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = firestore.initializeFirestore(app, {}, '(default)');

/**
 * Housing Data Schema
 */
const dbSchema = {
    /**
     * Name/path of the zip code to GEOID mapping collection
     */
    zipCodeGeoIdMapCollection: 'zip-codes-to-places',
    zipCodeGeoIdData: {
        zip: 'zip',
        /**
         * 7 character place code (GEOID)
         */
        place: 'place',
        placeName: 'placeName',
    },
    /**
     * Name/path of the price and income collection
     */
    priceAndIncomeCollection: 'prices-and-income',
    /**
     * The fields in each document/row of the price and income collection
     */
    priceAndIncomeData: {
        /**
         * 7 character place code
         */
        geoId: 'place',
        city: 'placeName',
        medianIncome: 'hh_type_1',
        /**
         * Single person
         */
        professionalMedianIncome: 'hh_type_4',
        /**
         * Two persons
         */
        dualProfessionalMedianIncome: 'hh_type_8',
        /**
         * Households per acre
         */
        unitDensity: 'gross_hh_density',
        percentSingleFamilyUnits: 'pct_detatched_single_family_unit',
        percentHousingCostOfIncome: 'h_own',
    },
};

/** @type {{ zip: string, place: string, placeName: string }[]} */
export const zipCodes = [];

const priceAndIncomeCollection = () => firestore.collection(db, dbSchema.priceAndIncomeCollection);

const getGeoidByZip = (zip) => {
    const geoId = zipCodes.find((zipCode) => zipCode.zip === zip)?.place;

    if (!geoId) {
        console.error(`No GEOID found for zip code ${zip}`);
    }

    return geoId;
};

const LoadZipCodeMapping = async () => {
    const zipCodeMapCollection = await firestore.collection(db, dbSchema.zipCodeGeoIdMapCollection);
    const zipCodeMapSnapshot = await firestore.getDocs(zipCodeMapCollection);
    zipCodeMapSnapshot.forEach((doc) => {
        const data = doc.data();
        zipCodes.push(data);
    });
};

export const init = async () => {
    console.debug('Hello UFL!');
    await LoadZipCodeMapping();
};

/**
 * Returns the median income for the given zip code
 * @param {number} zip
 */
export const getMedianIncomeByZip = async (zip) => {
    const geoId = getGeoidByZip(zip);
    if (!geoId) {
        return null;
    }
    const priceAndIncomeDocRef = firestore.doc(db, dbSchema.priceAndIncomeCollection, geoId);
    const priceAndIncomeSnapshot = await firestore.getDoc(priceAndIncomeDocRef);
    if (!priceAndIncomeSnapshot.exists()) {
        console.error(`No price and income data found for GEOID ${geoId} (zip code ${zip})`);
        return null;
    }
    const priceAndIncomeData = priceAndIncomeSnapshot.data();
    return priceAndIncomeData[dbSchema.priceAndIncomeData.medianIncome];
};

/**
 * Returns the percentage of income that goes towards housing costs for the given zip code
 * @param {number} zip
 */
export const getPercentHousingCostByZip = async (zip) => {
    const geoId = getGeoidByZip(zip);
    if (!geoId) {
        console.error(`No price and income data found for GEOID ${geoId} (zip code ${zip})`);
        return null;
    }
    const priceAndIncomeDocRef = firestore.doc(db, dbSchema.priceAndIncomeCollection, geoId);
    const priceAndIncomeSnapshot = await firestore.getDoc(priceAndIncomeDocRef);
    if (!priceAndIncomeSnapshot.exists()) {
        console.error(`No price and income data found for GEOID ${geoId} (zip code ${zip})`);
        return null;
    }
    const priceAndIncomeData = priceAndIncomeSnapshot.data();
    return priceAndIncomeData[dbSchema.priceAndIncomeData.percentHousingCostOfIncome];
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
 * TODO: We still don't have data for this (Sprint 2)
 * @param {number} zip
 */
export const getInvestorActivityDataByZip = async (zip) => {
    // TODO: We still don't have data for this (Sprint 2)
    // TODO: Implement this function to retrieve investor activity data for the given zip code
};

/**
 * TODO: We still don't have data for this (Sprint 2)
 * @param {number} zip
 */
export const getUnemploymentDataByZip = async (zip) => {
    // TODO: We still don't have data for this (Sprint 2)
    // TODO: Implement this function to retrieve unemployment data for the given zip code
};

/**
 * Returns places based on median income <= provided budget
 * @param {number} budget
 * @returns {{ zip: string, geoId: string, city: string, medianIncome: string, }[]}
 */
export const getTopHousingLocationsByBudget = async (budget) => {
    const priceAndIncomeQuery = firestore.query(priceAndIncomeCollection(), firestore.where(dbSchema.priceAndIncomeData.medianIncome, '<=', budget));
    const querySnapshot = await firestore.getDocs(priceAndIncomeQuery);
    const affordableLocations = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const zip = zipCodes.find((zipCode) => zipCode.place === data[dbSchema.priceAndIncomeData.geoId])?.zip;
        affordableLocations.push({
            zip: zip,
            geoId: data[dbSchema.priceAndIncomeData.geoId],
            city: data[dbSchema.priceAndIncomeData.city],
            medianIncome: data[dbSchema.priceAndIncomeData.medianIncome],
        });
    });
    return affordableLocations;
};
