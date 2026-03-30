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
const analytics = getAnalytics(app);

/**
 * Housing Data Schema
 */
const dbSchema = {
    /**
     * Name/path of the price and income collection
     */
    priceAndIncomeCollection: 'prices-and-income',
    /**
     * The fields in each document/row of the price and income collection
     */
    priceAndIncomeData: {
        zip: 'zip',
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

const helloWorld = () => {
    console.debug('Hello UFL!');
};

/**
 *
 * @param {number} zip
 */
export const getMedianIncomeByZip = (zip) => {
    // TODO: Implement this function to retrieve median income data for the given zip code
};

/**
 *
 * @param {number} zip
 */
export const getMedianHousingCostByZip = (zip) => {
    // TODO: Implement this function to retrieve median housing cost data for the given zip code
};

/**
 *
 * @param {number} zip
 */
export const getSupplyAndDemandDataByZip = (zip) => {
    // TODO: Implement this function to retrieve supply and demand data for the given zip code
};

/**
 *
 * @param {number} zip
 */
export const getInvestorActivityDataByZip = (zip) => {
    // TODO: Implement this function to retrieve investor activity data for the given zip code
};

/**
 *
 * @param {number} zip
 */
export const getUnemploymentDataByZip = (zip) => {
    // TODO: Implement this function to retrieve unemployment data for the given zip code
};

/**
 *
 * @param {number} budget
 */
export const getTopHousingLocationsByBudget = (budget) => {
    // TODO: Implement this function to retrieve top housing locations by budget
};

helloWorld();
