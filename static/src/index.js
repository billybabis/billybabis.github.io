import { fetchLayers }  from './fetchData.js';
import { _remove, getPalette, temporal_interval_folder} from './helper.js';
import { metricsInfo, getMetrics, gcm_cvar } from './metrics.js';
import { getDateIntervals } from './timescales.js';
import "leaflet-sidebar-v2";

/**
 * VISUALIZE MAP
 */
var map = L.map('map', {center: [38, -88], zoom: 4, minZoom: 4, maxZoom: 8, zoomDelta: 1, zoomControl: false});
var states_geojson = "./data/gadm_continental_us_states_simp.geojson";
var style = {color: "white", fillColor: "white", fillOpacity: 0, opacity: 0.2, weight: 3};
var stateBordersGeoJSON = new L.GeoJSON.AJAX(states_geojson, {style: style});
stateBordersGeoJSON.addTo(map);
L.control.sidebar({
    autopan: true,
    closeButton: false,   
    container: 'sidebar',
    position: 'right', 
}).addTo(map);
var layers, legend;

/** 
 * HELPER FUNCTIONS  
 */
function addLegend(metricInfo) {
    _remove(legend);
    legend = L.control({position: 'bottomleft'});
    var palette = getPalette();
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var grades = metricInfo.steps;
        for (var i = grades.length-1; i >= 0; i--) {
            div.innerHTML +=
                '<i style="background:' + palette[i] + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '<br>' );
        }
        return div;
    };
    legend.addTo(map);
}
// Fetch and display map from selected parameters
function displayLayers(cvar, metric, spatialScale, temporalScale, daterange){
    var metricInfo = metricsInfo(cvar, metric, spatialScale, temporalScale);
    fetchLayers(map, cvar, metricInfo, spatialScale, temporalScale, daterange);
    addLegend(metricInfo);
};



/**
 * CONTROL PANEL
 */
function dropdownListener(element) {
    $(element).parents(".dropdown").find('.btn').html($(element).text().trim() + ' <span class="caret right-caret pull-right"></span>');
    $(element).parents(".dropdown").find('.btn').val($(element).attr('value'));
}
function outputFilename(unit, daterange, fmt) {
    return  unit + "_volatility_" + daterange + fmt;
}
function dropdownHtml(items){
    var innerhtml = "";
    for (var i in items) {
        var item = items[i];
        innerhtml += '<li role="presentation"><a role="menuitem" tabindex="-1" value="'+item.val+'">'+item.lbl+'</a></li>';
    }
    return innerhtml;
}
function updateLayer(){
    var cvar = $("button#climate-var").val();
    var metric = $("button#metric").val();
    var spatialScale = $("button#spatial").val();
    var temporalScale = $("button#temporal").val();
    var daterange = $("button#daterange").val()
    displayLayers(cvar, metric, spatialScale, temporalScale, daterange);
};
$(function(){
    $('.info-modal-icon').each(function () {
        $(this).click(function(){
            var modalContent = $('#' + $(this).data('info-modal')).html();
            $("#parameter-info-modal-body").html(modalContent);
            $("#parameter-info-modal-title").html($(this).data("modal-header"));
            $("#parameter-info-modal").modal('show');
        });
    });
    $(".dropdown-menu li a").click(function(){
        dropdownListener(this);
    });
    $(".update-onselect-dropdown").click(function(){
        updateLayer();
    });
    // when climate-variable is selected (i.e. temperature or precipitation),
    //   populate the dropdown menu for specific statistics (i.e. std-dev, hpi, etc.)
    $("#climate-var-dropdown li a").click(function(){
        $("#metric").html('Select <span class="caret right-caret pull-right"></span>');
        var metrics = getMetrics($(this).attr('value'));
        var innerhtml = dropdownHtml(metrics);
        $("#metric-dropdown").html(innerhtml); 
        $("#metric-dropdown li a").click(function(){
            dropdownListener(this);
        });
    });
    // when temporal aggregation scale is selected (i.e. monthly or yearly),
    //   populate the dropdown menu for specific time inverval of interest (i.e. 2021-03)
    $("#temporal-dropdown li a").click(function(){
        $("#daterange").html('Select <span class="caret right-caret pull-right"></span>');
        var intervals = getDateIntervals($(this).attr('value'));
        var innerhtml = dropdownHtml(intervals);
        $("#date-dropdown").html(innerhtml); 
        // messy, but it works for now
        $("#date-dropdown li a").click(function(){
            dropdownListener(this);
        });
    });
    // update header for pixel-value info-div when spatial aggregator changes
    $("#spatial-dropdown li a").click(function(){
        $("#onhover-info-header").html("Value at selected pixel");
        $("#onhover-info-description").html("Hover Over the map");
    });
    // display modal when download button is clicked
    $("#download-btn").click(function(){
        var cvar = $("button#climate-var").val();
        var spatialScale = $("button#spatial").val();
        var temporalScale = $("button#temporal").val();
        var daterange = $("button#daterange").val();
        var daterangeLabel = $("button#daterange").text().trim();
        // update modal description
        var desc = "Download " + temporalScale + " data at " +spatialScale+ " scale for the continental US during "+ daterangeLabel + "."
        desc = desc + " The image includes the following bands in order: Standard Deviation, Skewness, Kurtosis, Heavy Precipitation Index."
        $("#download-modal-description").html(desc);
        // update download button listener
        var temporalFdr = temporal_interval_folder(temporalScale);
        var fname = "./data/prism/daily/"+spatialScale+"/"+temporalFdr+"/"+cvar+"/stats/"+daterange+".tif";
        $("a#confirm-download-btn").attr("href", fname);
    });
    // from the modal, execute the download when prompted
    $("#download-fmt-dropdown li a").click(function(){
        var downloadBtn = $("a#confirm-download-btn");
        var inputFname = downloadBtn.attr("href");
        var fileFmt = $("button#download-fmt").val();
        inputFname = inputFname.substring(0, inputFname.indexOf('.tif')) + fileFmt;
        downloadBtn.attr("href", inputFname);
        //update download attr
        var daterange = $("button#daterange").val();
        var outputFname = outputFilename("ppt", daterange, fileFmt)
        downloadBtn.attr("download", outputFname);
    });
    $("#temporal-dropdown li a[value='yearly']").click();
    $("#date-dropdown li a[value='2021']").click();
});