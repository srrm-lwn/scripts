// ==UserScript==
// @name         Rental Estimate Summary
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  try to take over the world!
// @author       You
// @match        *://www.zillow.com/*
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @updateURL    https://raw.githubusercontent.com/srrmlwn/scripts/master/rental-estimator/tampermonkey.js
// @downloadURL  https://raw.githubusercontent.com/srrmlwn/scripts/master/rental-estimator/tampermonkey.js
// ==/UserScript==

(function () {
    'use strict';

    if (window.location.href.indexOf("homedetails") !== -1
        || window.location.href.indexOf("community") !== -1) {
        console.log("On listing detail page. Skipping rental estimate summary.");
        return;
    }

    const propertyTaxRate = {
        "HI": 0.0027,
        "AL": 0.0042,
        "LA": 0.0053,
        "CO": 0.0053,
        "DC": 0.0055,
        "DE": 0.0056,
        "SC": 0.0057,
        "WV": 0.0059,
        "WY": 0.0061,
        "AR": 0.0063,
        "UT": 0.0064,
        "NV": 0.0064,
        "AZ": 0.0069,
        "ID": 0.0072,
        "TN": 0.0073,
        "CA": 0.0076,
        "NM": 0.0079,
        "MS": 0.0081,
        "VA": 0.0081,
        "MT": 0.0084,
        "NC": 0.0085,
        "IN": 0.0086,
        "KY": 0.0086,
        "OK": 0.0090,
        "GA": 0.0091,
        "FL": 0.0093,
        "MO": 0.0097,
        "ND": 0.0099,
        "OR": 0.0101,
        "WA": 0.0101,
        "MD": 0.0109,
        "MN": 0.0113,
        "AK": 0.0118,
        "MA": 0.0123,
        "SD": 0.0132,
        "ME": 0.0136,
        "KS": 0.0141,
        "IA": 0.0156,
        "OH": 0.0158,
        "MI": 0.0158,
        "PA": 0.0159,
        "RI": 0.0166,
        "NY": 0.0171,
        "NE": 0.0177,
        "TX": 0.0181,
        "VT": 0.0188,
        "WI": 0.0191,
        "CT": 0.0211,
        "NH": 0.0220,
        "IL": 0.0230,
        "NJ": 0.0247
    };
    const insuranceRate = 0.00420057306;

    console.info("### Starting Rental Estimate Summary");

    //Extract Listings (i.e. articles)
    const articles = $("article");
    console.info("Found " + articles.length + " articles");
    //Extract a default State from the Listing's addresses to compute property taxes
    const defaultState = extractDefaultState(articles);
    //Extract and add monthly cost and rental estimates for each Listing
    articles.map(function () {
        const article = $(this);
        const url = article.find("div a").attr("href");
        const urlItems = url.split("/");
        const id = urlItems[urlItems.length - 2];

        $.get(url).then(function (data) {
            logDebug(id, "Fetched URL - " + url);
            const {rentalEstimate, hoa} = extractFromListingDetails(id, data);
            let monthlyCost = computeMonthlyCost(id, article, hoa);

            const cardInfo = article.find(".list-card-info");
            addMonthlyCostToListing(monthlyCost, cardInfo);
            addRentalEstimateToListing(rentalEstimate, cardInfo);
        });
    });

    function extractDefaultState(articles) {
        let state = undefined;
        articles.map(function () {
            const article = $(this);

            if (state === undefined) {
                const address = article.find("address").text();
                const pattern = /[A-Z]{2} [0-9]{5}/;
                if (pattern.test(address)) {
                    state = pattern.exec(address)[0].split(" ")[0];
                    console.info("Using state " + state + " as default for property taxes.");
                }
            }
        });
        return state;
    }

    function extractFromListingDetails(id, data) {
        const secret = $('<div id="secret"></div>');
        $('body').append(secret);
        secret.hide();
        const nodes = $.parseHTML(data);
        secret.append(nodes);

        const rentalEstimate = extractRentalEstimate();
        const hoa = extractHOA();
        secret.remove();
        return {rentalEstimate, hoa};
    }

    function extractRentalEstimate() {
        return $("#ds-rental-home-values").text().split("$")[1];
    }

    function extractHOA() {
        let hoaText = $(".ds-home-fact-list-item span:contains('HOA')");
        if (hoaText !== undefined) {
            let hoaVal = hoaText.next().text();
            if (hoaVal !== undefined) {
                hoaVal = hoaVal.replace("$", "").replace("/mo", "");
                return hoaVal === "" ? 0 : parseFloat(hoaVal);
            }
        }
        return 0;
    }

    function computeMonthlyCost(id, article, hoa) {
        let monthlyCost;
        const {insurance, propertyTax} = extractInsuranceAndTax(id, article);
        monthlyCost = hoa + insurance + propertyTax;
        monthlyCost = monthlyCost.toFixed(0);
        logDebug(id, "Monthly Cost = " + monthlyCost + "; HOA = " + hoa + "; Insurance = " + insurance + "; Tax = " + propertyTax);
        return monthlyCost;
    }

    function extractInsuranceAndTax(id, article) {
        let price = article.find(".list-card-price").text();
        logDebug(id, "Price Text = " + price);
        logDebug(id, "Tax Rate = " + propertyTaxRate[defaultState]);
        if (price !== undefined) {
            price = price.replace("$", "").replaceAll(",", "").replace("+", "");
            const insurance = insuranceRate * price / 12;
            const propertyTax = propertyTaxRate[defaultState] * price / 12;
            return {insurance, propertyTax};
        }
        return undefined;
    }

    function addMonthlyCostToListing(monthlyCost, cardInfo) {
        let prefix = "Monthly Cost (excl. mortgage): ";
        let monthlyCostMsg = prefix + "Not Available";
        if (monthlyCost !== undefined || !isNaN(parseFloat(monthlyCost))) {
            monthlyCostMsg = prefix + "$" + monthlyCost + "/mo";
        }

        const monthlyCostFooter = $('<div></div>');
        monthlyCostFooter.css("order", 4);
        monthlyCostFooter.append('<div class="list-card-type"> ' + monthlyCostMsg + ' </div>');
        cardInfo.append(monthlyCostFooter);
    }

    function addRentalEstimateToListing(rentalEstimate, cardInfo) {
        let prefix = "Rental Estimate: ";
        let estimateMsg = prefix + "Not Available";
        if (rentalEstimate !== undefined) {
            estimateMsg = prefix + "$" + rentalEstimate;
        }
        const footer = $('<div></div>');
        footer.css("order", 5);
        footer.append('<div class="list-card-type"> ' + estimateMsg + ' </div>');

        return cardInfo.append(footer);
    }

    function logDebug(id, msg) {
        console.debug("[" + id + "] " + msg);
    }
})();
