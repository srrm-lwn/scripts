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
        const insuranceAndTax = getInsuranceAndTax(article);
        const url = article.find("div a").attr("href");
        const urlItems = url.split("/");
        const id = urlItems[urlItems.length - 2];

        $.get(url).then(function (data) {
            logDebug(id, "Fetched URL - " + url);

            const secret = $('<div id="secret"></div>');
            $('body').append(secret);
            secret.hide();
            const nodes = jQuery.parseHTML(data);
            secret.append(nodes);

            const rentalEstimate = jQuery("#ds-rental-home-values").text().split("$")[1];
            const hoa = getHOA();
            secret.remove();

            let monthlyCost = undefined;
            if (insuranceAndTax !== undefined) {
                monthlyCost = hoa + insuranceAndTax["insurance"] + insuranceAndTax["propertyTax"];
                logDebug(id, "Monthly Cost = " + monthlyCost);
                monthlyCost = monthlyCost.toFixed(0);
                logDebug(id, "HOA = " + hoa + " Insurance = " + insuranceAndTax["insurance"] + " Tax = " + insuranceAndTax["propertyTax"]);
            }

            const cardInfo = article.find(".list-card-info");
            let monthlyCostMsg = "Non-Mortgage Monthly Cost: Not Available";
            if (monthlyCost !== undefined) {
                monthlyCostMsg = "Non-Mortgage Monthly Cost: $" + monthlyCost + "/mo";
            }

            const monthlyCostFooter = $('<div></div>');
            monthlyCostFooter.css("order", 4);
            monthlyCostFooter.append('<div class="list-card-type"> ' + monthlyCostMsg + ' </div>');
            cardInfo.append(monthlyCostFooter);

            let estimateMsg = "Rental Estimate: Not Available";
            if (rentalEstimate !== undefined) {
                estimateMsg = "Rental Estimate: $" + rentalEstimate;
            }
            const footer = $('<div></div>');
            footer.css("order", 5);
            footer.append('<div class="list-card-type"> ' + estimateMsg + ' </div>');

            return cardInfo.append(footer);
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
    function getInsuranceAndTax(article) {
        let price = article.find(".list-card-price").text();
        if (price !== undefined) {
            price = price.replace("$", "").replace(",", "").replace("+", "");
            const insurance = insuranceMultiplier * price / 12;
            const propertyTax = propertyTaxRate[defaultState] * price / 12;
            return {"insurance": insurance, "propertyTax": propertyTax};
        }
        return undefined;
    }

    function getHOA() {
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

    function logInfo(id, msg) {
        console.info("["  + id + "] " + msg);
    }

    function logDebug(id, msg) {
        console.debug("["  + id + "] " + msg);
    }
})();
