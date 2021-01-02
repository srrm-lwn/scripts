// ==UserScript==
// @name         Rental Estimate Summary
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://www.zillow.com/*
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    if (window.location.href.indexOf("homedetails") != -1
        || window.location.href.indexOf("community") != -1) {
        console.log("On listing detail page. Skipping rental estimate summary.");
        return;
    }

    const propertyTaxRate = {"AZ": 0.0068};
    const insuranceMultiplier = 1466 / 349000;

    console.info("### Starting Rental Estimate Summary");

    //Extract listings (i.e. articles)
    const articles = $("article");
    console.info("Found " + articles.length + " articles");
    //Extract a default State for listings to compute property taxes
    const defaultState = extractDefaultState(articles);
    //Extract and add monthly cost and rental estimates for each listing (i.e. article)
    articles.map(function() {
        const article = $(this);
        const cardInfo = article.find(".list-card-info");
        var index = 4;
        addMonthlyCostEstimate(article, cardInfo, index++);
        addRentalEstimate(article, cardInfo, index++);
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

    function addMonthlyCostEstimate(article, cardInfo, index) {
        let monthlyCostMsg = "Non-Mortgage Costs: Not Available";
        let price = article.find(".list-card-price").text();
        if (price !== undefined) {
            price = price.replace("$", "").replace(",", "").replace("+", "");
            const insurance = insuranceMultiplier * price / 12;
            const propertyTax = propertyTaxRate[defaultState] * price / 12;
            //todo: add HOA
            const monthlyCost = (insurance + propertyTax).toFixed(0);
            console.log("Price = " + price + "; Insurance = " + insurance + "; Property Tax = " + propertyTax + "; Monthly Cost = " + monthlyCost);
            if (monthlyCost !== undefined || !isNaN(parseFloat(monthlyCost))) {
                monthlyCostMsg = "Non-Mortgage Costs: $" + monthlyCost + "/mo";
            }
        }
        console.info(monthlyCostMsg);
        const monthlyCostFooter = $('<div></div>');
        monthlyCostFooter.css("order", index);
        monthlyCostFooter.append('<div class="list-card-type"> ' + monthlyCostMsg + ' </div>');
        cardInfo.append(monthlyCostFooter);
    }

    function addRentalEstimate(article, cardInfo, index) {
        let numOfEstimates = 0;
        const url = article.find("div a").attr("href");
        console.debug("Fetching URL - " + url);
        $.get(url).then(function (data) {
            console.debug("Fetched URL - " + url);

            const secret = $('<div id="secret"></div>');
            $('body').append(secret);
            secret.hide();
            const nodes = jQuery.parseHTML(data);
            secret.append(nodes);

            const rentalEstimate = jQuery("#ds-rental-home-values").text().split("$")[1];
            secret.remove();

            let estimateMsg = "Rental Estimate: Not Available";
            if (rentalEstimate !== undefined) {
                numOfEstimates++;
                estimateMsg = "Rental Estimate: $" + rentalEstimate;
            }
            const footer = $('<div></div>');
            footer.css("order", index);
            footer.append('<div class="list-card-type"> ' + estimateMsg + ' </div>');

            return cardInfo.append(footer);
        });
    }
})();
