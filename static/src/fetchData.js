import { intervalSteps, getPalette, temporal_interval_folder, _remove } from './helper.mjs'
import "leaflet-geotiff-2";
import "leaflet-geotiff-2/dist/leaflet-geotiff-plotty";
import "leaflet-ajax";
import * as plotty from "plotty";
import _ from 'lodash';
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
    if (metric == "hpi") {
        return "HeavyPrecipitationIndex"; 
    } else if (metric == "cdd") {
        return "ConsecutiveDryDays";
    } else {
        var prefixes = {"std-dev": "StandardDeviation_", "skewness": "Skewness_", "kurtosis": "Kurtosis_"}
        var suffixes = {"ppt": "DailyPrecipitation", "tmin": "DailyMinTemperature", "tmax": "DailyMaxTemperature"}
        return prefixes[metric] + suffixes[cvar]
    }
}

function format_daterange(temporalFldr, daterange){
    console.log(temporalFldr);
    if ((temporalFldr == "agg_year") || (temporalFldr == "agg_5year")) {
        return daterange.substring(0,4);
    } else {
        return daterange.substring(0,4) + "-" + daterange.substring(4,6);
    }
}

/**
 * VISUALIZE COUNTY-LEVEL DATA
 */
// Fetch shapefile for specified county-level image
class RendererCounty {
    fetchLayers(map, cvar, metricInfo, temporalFldr, daterange) {
        var gdc_varname = GDC_StatName(cvar, metricInfo);
        var daterange_fmtd = format_daterange(temporalFldr, daterange);
        var dcUrl = "https://api.datacommons.org/v1/bulk/observations/point/linked?entity_type=County&linked_entity=country/USA&linked_property=containedInPlace"
        dcUrl = dcUrl + "&variables="+gdc_varname+"&date="+daterange_fmtd;
        var palette = getPalette(true)
        $.ajax({
            url:(dcUrl),
            dataType:'json',
            type: 'get',
            contentType: "application/json",
            success:function(response){
                function styleFn(countyFeat){
                    var borderWeight = 1;
                    if (map.getZoom() > 5) {
                        borderWeight = 3;
                    }
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
                        updateInfoBox(e);
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
                        } else if (zlvl >= 8 && zlvl <= 10) {
                            borderWeight = 3.5;
                        } else if (zlvl > 10){
                            borderWeight = 4.5;
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
class Renderer4km {
    constructor(cvar, metricInfo, temporalFldr, daterange) {
        this.cvar = cvar;
        this.metricInfo = metricInfo;
        this.temporalFldr = temporalFldr;
        this.daterange = daterange;
    };
    fetchLayers() {
        var renderer = L.LeafletGeotiff.plotty({displayMax: this.metricInfo.displayMax, applyDisplayRange: false, colorScale: "rff_palette"});
        var layer_options = {renderer: renderer, useWorker: false};
        var fname = "./datacommons/data/scripts/rff/raw_data/prism/daily/4km/"+this.temporalFldr+"/"+this.cvar+"/stats/"+this.daterange+".tif";
        var layer = L.leafletGeotiff(fname, layer_options);
        layer.options.rBand = this.metricInfo.bandNum;
        return [layer];
    };
};

// exported function for use in index.js file
const Renderers = { "4km": Renderer4km, "county": RendererCounty };
export function fetchLayers(map, cvar, metricInfo, spatialScale, temporalScale, daterange){
    if (layers) {
        layers.forEach(function (layer, i) {_remove(layer);});
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
 function displayTimeseries(geoid, cvarLabel, metricLabel, gdc_varname, obsPeriod){
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
         displayTimeseries(county_geoid, cvar, metric, gdc_varname, obsPeriod);
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
    displayTimeseries(county_geoid, cvar, metric);
});

/**
 * DISPLAY PIXEL-VALUE onHOVER
 */
function updateInfoBox(e){
    var countyState = getCountyState(e);
    $("#onhover-info-header").html(countyState[0]  + ', ' + countyState[1]);
    var pixelVal = e.target.feature.properties.VALUE;
    if (pixelVal) {
        $("#onhover-info-description").html(parseFloat(pixelVal).toFixed(4));
    } else {
        var spatialScale = $("button#spatial").text();
        $("#onhover-info-header").html("Value at "+spatialScale+" scale");
        $("#onhover-info-description").html("Hover over the map");
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