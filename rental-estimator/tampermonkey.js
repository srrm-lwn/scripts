// ==UserScript==
// @name         Zillow Rental Estimate Summary
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://www.zillow.com/homes/*
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    console.log("### Starting Zillow Rental Estimate Summary");

    var articles = $("article");
    console.log("Found " + articles.length + " articles");

    articles.map(function() {
        var article = $(this);
        var url = article.find("div a").attr("href");
        console.log("Fething URL - " + url);
        $.get(url).then(function(data) {
            console.log("Fetched URL - " + url);

            var secret = $('<div id="secret"></div>');
            $('body').append(secret);
            secret.hide();
            var nodes = jQuery.parseHTML(data);
            secret.append(nodes);

            var rentalEstimate = jQuery("#ds-rental-home-values").text().split("$")[1];
            secret.remove();

            var estimate = rentalEstimate === undefined
            ? "Rental Estimate is Not Available" :
            "Rental Estimate: $" + rentalEstimate;

            var footer = article.append('<div class="list-card-footer"></div>');
            footer.append('<div class="list-card-type"> ' + estimate + ' </div>');

            return article.append(footer);
        });
    });
})();
