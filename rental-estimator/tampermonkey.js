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

    // Your code here...
    console.info("### Starting Rental Estimate Summary");

    var articles = $("article");
    console.info("Found " + articles.length + " articles");

    var numOfEstimates = 0;
    articles.map(function() {
        var article = $(this);
        var url = article.find("div a").attr("href");
        console.debug("Fetching URL - " + url);
        $.get(url).then(function(data) {
            console.debug("Fetched URL - " + url);

            var secret = $('<div id="secret"></div>');
            $('body').append(secret);
            secret.hide();
            var nodes = jQuery.parseHTML(data);
            secret.append(nodes);

            var rentalEstimate = jQuery("#ds-rental-home-values").text().split("$")[1];
            secret.remove();

            var estimateMsg = "Rental Estimate: Not Available";
            if (rentalEstimate !== undefined) {
                numOfEstimates++;
                estimateMsg = "Rental Estimate: $" + rentalEstimate;
            }
            var cardInfo = article.find(".list-card-info");
            var footer = $('<div></div>');
            footer.css("order", "4");
            footer.append('<div class="list-card-type"> ' + estimateMsg + ' </div>');

            return cardInfo.append(footer);
        });
    });
})();
