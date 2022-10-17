import {intervalSteps, getPalette, temporal_interval_folder, _remove} from './helper.js';
import { getDateIntervals } from './timescales.js';
import { metricsInfo } from './metrics.js';
import "leaflet-geotiff-2";
import "leaflet-geotiff-2/dist/leaflet-geotiff-plotty";
import "leaflet-ajax";
import * as plotty from "plotty";
const _ = require('lodash');
import Chart from 'chart.js/auto';

plotty.addColorScale("rff_palette", getPalette(), [0, 0.25, 0.5, 0.75, 1]);
const COUNTY_GEOJSON_FNAME ="./data/tl_2020_us_county_simplified.geojson";
var layers;


function temporalFldr_to_gdcLabel(tempFldr) {
    var mapping = {"agg_month": "P1M", "agg_year": "P1Y", "agg_5year": "P5Y"}
    return mapping[tempFldr];
}

function GDC_StatName(cvar, metricInfo){
    var metric = metricInfo.name
    var uniques = {"hpi": "HeavyPrecipitationIndex", "cdd": "ConsecutiveDryDays", 
        "spi": "StandardizedPrecipitationIndex_Atmosphere"};
    var prefixes = {"std-dev": "StandardDeviation_", "skewness": "Skewness_", "kurtosis": "Kurtosis_", 
        "count": "Count_", "length": "NumberOfDays_", "intensity": "Intensity_", "range": "InterannualRange_Monthly_"};
    var suffixes = {"ppt": "DailyPrecipitation", "tmin": "DailyMinTemperature", 
        "tmax": "DailyMaxTemperature", "heatwave": "HeatWaveEvent"};
    if (metric in uniques) {
        return uniques[metric]; 
    } else if (metric=="range") {
        return "InterannualRange_Monthly_" + suffixes[cvar].replace("Daily", "");
    } else {
        return prefixes[metric] + suffixes[cvar]
    }
}

function format_daterange(temporalFldr, daterange){
    if ((temporalFldr == "agg_year") || (temporalFldr == "agg_5year")) {
        return daterange.substring(0,4);
    } else {
        return daterange.substring(0,4) + "-" + daterange.substring(4,6);
    }
}

export function getDataUrl(spatialScale, cvar, metricInfo, temporalFldr, daterange) {
    if (spatialScale == "4km") {
        var gcsBaseUrl = "https://storage.googleapis.com/weave_datasets/tiles/"
        var dateIndex = getDateIndex(temporalFldr, daterange)
        var stat = metricInfo.name.replace("-", "_");  // for std-dev to std_dev
        if( (cvar == "heatwave") && (stat=="count") && (temporalFldr=="agg_year") ) {
            stat = "hw_count";   // ideosyncratic naming convention in google cloud
        }
        var gcsUrl = gcsBaseUrl + "tiles_"+temporalFldr+"_"+cvar+"_"+stat+"_"+dateIndex;
        console.log(gcsUrl);
        return gcsUrl;
    } else {
        // county data in google data commons
        var dcUrl = "https://api.datacommons.org/v1/bulk/observations/point/linked?entity_type=County&linked_entity=country/USA&linked_property=containedInPlace"
        var gdc_varname = GDC_StatName(cvar, metricInfo);
        console.log(gdc_varname);
        var daterange_fmtd = format_daterange(temporalFldr, daterange);
        dcUrl = dcUrl + "&variables="+gdc_varname+"&date="+daterange_fmtd;
        dcUrl = dcUrl + "&key=AIzaSyBcoGjRUxBYNMzSGt96BjCqG7QfC4ACPds";
        return dcUrl;
    }
}

/**
 * VISUALIZE COUNTY-LEVEL DATA
 */
// Fetch shapefile for specified county-level image
class RendererCounty {
    fetchLayers(map, cvar, metricInfo, temporalFldr, daterange) {
        var gdc_varname = GDC_StatName(cvar, metricInfo);
        var dcUrl = getDataUrl("county", cvar, metricInfo, temporalFldr, daterange)
        var palette = getPalette(true)
        $.ajax({
            url:(dcUrl),
            dataType:'json',
            type: 'get',
            contentType: "application/json",
            success:function(response){
                function styleFn(countyFeat){
                    var borderWeight = 1.8;
                    var style = {fillOpacity: 0.7, opacity: 0.1, weight: borderWeight, color:"black"};
                    var valPerCounty = response.observationsByVariable[0].observationsByEntity;
                    for (const countyVal of valPerCounty) {
                        var geoid = countyVal.entity.substring(6);
                        if (geoid == countyFeat.properties.GEOID) {
                            var value = countyVal.pointsByFacet[0].value
                            countyFeat.properties["VALUE"] = value;
                            var i=0;
                            var valueTiers = intervalSteps(0, metricInfo.displayMax, palette.length);
                            while (value > valueTiers[i]) {
                                if (i>=valueTiers.length-1) {break;}
                                i++;
                            }
                            style["fillColor"] = palette[i];
                            break;
                        }
                    }
                    return style;
                }
                function eachFn(countyFeat, layer) {
                    layer.on("mouseover", function(e){
                        var countyVal = e.target.feature.properties.VALUE;
                        var countyValFmtd = parseFloat(countyVal).toFixed(4)
                        updateInfoBox(e, countyValFmtd);
                    });
                    layer.on("click", function(e){
                        var obsPeriod = temporalFldr_to_gdcLabel(temporalFldr);
                        initTimeseries(e, gdc_varname, obsPeriod);
                    });
                    map.on('zoomend', function () {
                        var zlvl = map.getZoom()
                        var borderWeight = 2.5;
                        if (zlvl <= 5) {
                            borderWeight = 1.5;
                        } else if (zlvl >= 8) {
                            borderWeight = 3.5;
                        }
                        layer.setStyle({weight: borderWeight});
                    });
                }
                var countiesGeoJSON = new L.GeoJSON.AJAX(COUNTY_GEOJSON_FNAME, 
                    {style: styleFn, onEachFeature: eachFn});
                layers = [countiesGeoJSON];
                countiesGeoJSON.addTo(map);
            }
        });
    };
};

/**
 * VISUALIZE 4km DATA
 */
// Fetch geotiff for specified 4km image
function getDateIndex(tmp_fldr, d_range) {
    var dateRangesJSON = getDateIntervals(tmp_fldr)
    var dateRanges = [];
    for (var i=0;i<dateRangesJSON.length;i++){
        dateRanges.push(dateRangesJSON[i].val)
    }
    dateRanges.sort();
    for (var i=0; i<=dateRanges.length; i++) {
        if (d_range == dateRanges[i]) {
            return i+1;
        }
    }
}

class Renderer4km {
    fetchLayers(map, cvar, metricInfo, temporalFldr, daterange) {
        // Layer 1: raster
        var southWest = L.latLng(24, -125),
        northEast = L.latLng(50, -66),
        bounds = L.latLngBounds(southWest, northEast);
        var gcsUrl = getDataUrl("4km", cvar, metricInfo, temporalFldr, daterange);
        gcsUrl = gcsUrl + "/{z}/{x}/{y}.png"
        var layerOptions = {minZoom:4, maxZoom: 8, reuseTiles:true, bounds: bounds, attribution:"", tms:true}
        var layer = L.tileLayer(gcsUrl, layerOptions);
        layer.addTo(map);
        // Layer 2: county borders
        function eachFn(countyFeat, countyLayer) {
            countyLayer.on("mouseover", function(e){
                updateInfoBox(e, "Click on county to view timeseries");
            });
            countyLayer.on("click", function(e){
                var obsPeriod = temporalFldr_to_gdcLabel(temporalFldr);
                var gdc_varname = GDC_StatName(cvar, metricInfo);
                initTimeseries(e, gdc_varname, obsPeriod);
            });
        }
        var countyStyle = {fillOpacity: 0, opacity: 0.1, weight: 2, color:"white"};
        var countiesGeoJSON = new L.GeoJSON.AJAX(COUNTY_GEOJSON_FNAME, 
            {style: countyStyle, onEachFeature: eachFn});
        countiesGeoJSON.addTo(map);
        layers = [layer, countiesGeoJSON];
    };
};

// exported function for use in index.js file
const Renderers = { "4km": Renderer4km, "county": RendererCounty };
export function fetchLayers(map, cvar, metricInfo, spatialScale, temporalScale, daterange){
    if (layers) {
        layers.forEach(function (layer, i) {_remove(layer);});
        $('#chart-loading-spinner').show();
    }
    var temporalFldr = temporal_interval_folder(temporalScale);
    var layerRenderer = new Renderers[spatialScale]();
    return new Promise( function(resolve, reject) {
        resolve(layerRenderer.fetchLayers(map, cvar, metricInfo, temporalFldr, daterange));
    });
};


/**
 * DISPLAY TIME SERIES onCLICK
 */
 var currChart, county_geoid; 
 function displayTimeseries(geoid, cvarLabel, metricLabel, gdc_varname, obsPeriod, gcm){
    // include gcm in model when it's integrated into GDC
     var gdc_url = "https://api.datacommons.org/stat/series?place=geoId%2F"+geoid+
        "&stat_var="+gdc_varname+"&observation_period="+obsPeriod;
     var historicalYears = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021];
     var forecastYears = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
     $.ajax({
        url:(gdc_url),
        dataType:'json',
        type: 'get',
        contentType: "application/json",
        success:function(response){
            var totalTimeseries = response["series"];
            var historical = {}
            for (var i=0; i<historicalYears.length; i++) {
                var year = historicalYears[i];
                historical[year] = totalTimeseries[year.toString()];
            }
            var forecast = {}
            for (var i=0; i<forecastYears.length; i++) {
                var year = forecastYears[i];
                forecast[year] = totalTimeseries[year.toString()];
            }
            var historical_x = Object.keys(historical).sort();
            var forecast_x = Object.keys(forecast).sort();
            var ctx = document.getElementById('timeseries-chart').getContext('2d');
            if (currChart) {currChart.destroy();}
             currChart = new Chart(ctx, {
                 type: 'line',
                 data: {
                     labels: historical_x.concat(forecast_x),
                     datasets: [
                         {
                             fill: false,
                             label: 'Historical',
                             borderColor: "#04273C",
                             backgroundColor: "#04273C",
                             data: historical
                         },                
                         {
                             fill: false,
                             label: 'Forecast',
                             borderColor: "#88C4F4",
                             backgroundColor: "#88C4F4",
                             data: forecast
                         }
                     ]
                 },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                     elements: {
                         point:{
                             radius: 0
                         }
                     },
                     scales: {
                         x: {
                             grid: {
                                 display: false,
                                 color: "#C7E3FA"
                             },
                             ticks: {
                                 maxTicksLimit: 7,
                                 maxRotation: 0,
                                 minRotation: 0
                             }
                         },
                         y: {
                             title: {
                                 padding: {
                                     left: 15,
                                     right: 15
                                 },
                                 display: true,
                                 text: cvarLabel + " (" + metricLabel + ")",
                                 font: {
                                     weight: 'bold',
                                 }
                             },
                             ticks: {
                                 maxTicksLimit: 4
                             },
                             grid: {
                                 color: "#C7E3FA"
                             },
                             grace: '50%',
                             displayAtZero: true
                         }
                     }
                 }
             });
             $('#chart-loading-spinner').hide();
             $('#timeseries-chart-div').show();
        }
    });
}
 function clearChart(){
     $('#timeseries-chart-div').hide();
     $('#timeseries-chart').html("");
     $('#chart-loading-spinner').show();
 }
 function displayTimeseriesModal(e, gdc_varname, obsPeriod) {
     if (layers) {
         $('#timeseriesModal').modal('show');
         clearChart();
         county_geoid = e.target.feature.properties["GEOID"];
         var cvar = $("button#climate-var").text().trim();
         var metric = $("button#metric").text().trim();
         var gcm = $("button#select-gcm").val();
         displayTimeseries(county_geoid, cvar, metric, gdc_varname, obsPeriod, gcm);
     }
 }
 function initTimeseries(e, gdc_varname, obsPeriod) {
    var countyState = getCountyState(e);
    $("#timeseries-modal-title").html(countyState[0]);
    $("#timeseries-modal-subtitle").html(countyState[1]);
    displayTimeseriesModal(e, gdc_varname, obsPeriod);
} 
$("#view-timeseries-btn").click(function(){
    clearChart();
    var cvar = $("button#climate-var").text().trim();
    var metric = $("button#metric").text().trim();
    var spatialScale = $("button#spatial").val();
    var temporalScale = $("button#temporal").val();
    var metricInfo = metricsInfo(cvar, metric, spatialScale, temporalScale);
    var gdc_varname = GDC_StatName(cvar, metricInfo);
    var temporalFldr = temporal_interval_folder(temporalScale);
    var obsPeriod = temporalFldr_to_gdcLabel(temporalFldr);
    var gcm = $("button#select-gcm").val();
    displayTimeseries(county_geoid, cvar, metric, gdc_varname, obsPeriod, gcm);
});

/**
 * DISPLAY PIXEL-VALUE onHOVER
 */
function updateInfoBox(e, pixelVal){
    var countyState = getCountyState(e);
    $("#onhover-info-header").html(countyState[0]  + ', ' + countyState[1]);
    if (pixelVal) {
        $("#onhover-info-description").html(pixelVal);
    } else {
        var spatialScale = $("button#spatial").text();
        $("#onhover-info-header").html("Value at "+spatialScale+" scale");
        $("#onhover-info-description").html("Click on a county to view timeseries");
    }
}
function getCountyState(e) {
    var countyProperties = e.target.feature.properties;
    var stateFP = countyProperties["STATEFP"];
    return [countyProperties["NAMELSAD"], statesFP[stateFP]];
};

var statesFP = {
    "01": "Alabama",
    "02": "Alaska",
    "04": "Arizona",
    "05": "Arkansas",
    "06": "California",
    "08": "Colorado",
    "09": "Connecticut",
    "10": "Delaware",
    "11": "District of Columbia",
    "12": "Florida",
    "13": "Geogia",
    "15": "Hawaii",
    "16": "Idaho",
    "17": "Illinois",
    "18": "Indiana",
    "19": "Iowa",
    "20": "Kansas",
    "21": "Kentucky",
    "22": "Louisiana",
    "23": "Maine",
    "24": "Maryland",
    "25": "Massachusetts",
    "26": "Michigan",
    "27": "Minnesota",
    "28": "Mississippi",
    "29": "Missouri",
    "30": "Montana",
    "31": "Nebraska",
    "32": "Nevada",
    "33": "New Hampshire",
    "34": "New Jersey",
    "35": "New Mexico",
    "36": "New York",
    "37": "North Carolina",
    "38": "North Dakota",
    "39": "Ohio",
    "40": "Oklahoma",
    "41": "Oregon",
    "42": "Pennsylvania",
    "44": "Rhode Island",
    "45": "South Carolina",
    "46": "South Dakota",
    "47": "Tennessee",
    "48": "Texas",
    "49": "Utah",
    "50": "Vermont",
    "51": "Virginia",
    "53": "Washington",
    "54": "West Virginia",
    "55": "Wisconsin",
    "56": "Wyoming"
};