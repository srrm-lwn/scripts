// ==UserScript==
// @name         Zillow Rental Estimate Summary
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://www.zillow.com/homes/for_sale*
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    console.log("### Starting Zillow Rental Estimate Summary");

    var urls = $("article div a").map(function() {
        return $(this).attr("href");
    }).get();
    console.log("Retrieved " + urls.length + " URLs");

    var priceCards = $(".list-card-price");
    console.log("Retrieved " + priceCards.length + " Price Cards");

    var rentalEstimates = $('<div id="rentalEstimates"></div>');
    var estimatesTable = $('<table style="border: 1px solid black;"></table>');
    rentalEstimates.append(estimatesTable);
    estimatesTable.append('<tr><th>URL</th><th>Monthly Estimate</th><th>Rental Estimate</th></tr>');
    $('body').append(rentalEstimates);

    urls.forEach(function(url) {
        jQuery.get(url).then(function(data) {
            console.log("Fetched URL - " + url);
            var secret = $('<div id="secret"></div>');
            $('body').append(secret);
            secret.hide();
            var nodes = jQuery.parseHTML(data);
            secret.append(nodes);
            var monthlyCost = jQuery('span:contains("Estimated monthly cost")').next().text();
            var rentalEstimate = jQuery("#ds-rental-home-values").text().split("$")[1];
            secret.remove();

            estimatesTable.append('<tr><td>' + url + '</td><td>' + monthlyCost + '</td><td>' + rentalEstimate + '</td></tr>');
        });
    });
})();
