function intervalSteps(minNum, maxNum, numSteps) {
    var steps = [];
    var stepLen = (maxNum - minNum) / (numSteps - 1);
    for (var i=0; i<numSteps; i++) {
        steps.push(minNum + i*stepLen);
    }
    return steps;
}

export function metricsInfo(cvar, metric, spatialScale, temporalScale) {
    var metricInfos = {
        "std-dev": {"name": "std-dev", "bandNum": 0},
        "skewness": {"name": "skewness", "bandNum": 1},
        "kurtosis": {"name": "kurtosis", "bandNum": 2},
        "hpi": {"name": "heavy_precip_index", "bandNum": 3},
        "cdd": {"name": "consecutive_dry_days", "bandNum": 4},
        "spi": {"name": "spi"},
        "range": {"name": "range"},
        "count": {"name": "count"},
        "length": {"name": "length"},
        "intensity": {"name": "intensity"}
    };
    var minVals = {
        "ppt": {
            "4km": {
                "monthly": {"std-dev": 0, "skewness": -1, "kurtosis": -3, "hpi": 0, "cdd": 0, "spi": -3, "range": 0}, 
                "yearly": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 0, "cdd": 0, "spi": -3, "range": 0}, 
                "5year": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 6.65, "cdd": 0, "spi": 0, "range": 0}
            },
            "county":  {
                "monthly": {"std-dev": 0, "skewness": -1, "kurtosis": -3, "hpi": 0, "cdd": 0, "spi": -3, "range": 0},  
                "yearly": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 0, "cdd": 0, "spi": -3, "range": 0},  
                "5year": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 6.65, "cdd": 0, "spi": 0, "range": 0}
            }
        },
        "tmin": {
            "4km": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3, "range": 0},
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3, "range": 0},
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3, "range": 0}
            },
            "county": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3, "range": 0},
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3, "range": 0},
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3, "range": 0}
            }
        },
        "tmax": {
            "4km": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3, "range": 0},
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3, "range": 0},
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3, "range": 0}
            },
            "county": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3, "range": 0},
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3, "range": 0}, 
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3, "range": 0}
            }
        }, 
        "heatwave": {
            "4km": {
                "monthly": {"count": 0, "length": 0, "intensity": 0}, 
                "yearly":  {"count": 0, "length": 0, "intensity": 0}, 
                "5year":  {"count": 0, "length": 0, "intensity": 0}
            },
            "county":{
                "monthly": {"count": 0, "length": 0, "intensity": 0}, 
                "yearly":  {"count": 0, "length": 0, "intensity": 0}, 
                "5year":  {"count": 0, "length": 0, "intensity": 0}
            }
        }
    };
    var maxVals = {
        "ppt": {
            "4km": {
                "monthly": {"std-dev": 130, "skewness": 5, "kurtosis": 25, "hpi": 100, "cdd": 30, "spi": 3, "range":1000},  
                "yearly": {"std-dev": 48, "skewness": 19, "kurtosis": 360, "hpi": 100, "cdd": 365, "spi": 3, "range": 1000}, 
                "5year": {"std-dev": 38, "skewness": 30, "kurtosis": 1000, "hpi": 100, "cdd": 380, "spi": 10, "range":10}
            },
            "county": {
                "monthly": {"std-dev": 130, "skewness": 5, "kurtosis": 25, "hpi": 100, "cdd": 30, "spi": 3, "range":1000},
                "yearly": {"std-dev": 48, "skewness": 19, "kurtosis": 360, "hpi": 100, "cdd": 365, "spi": 3, "range":1000}, 
                "5year": {"std-dev": 38, "skewness": 30, "kurtosis": 1000, "hpi": 100, "cdd": 380, "spi": 10, "range":10}
            }
        },
        "tmin": {
            "4km": {
                "monthly": {"std-dev": 15, "skewness": 4, "kurtosis": 20, "range":40},
                "yearly": {"std-dev": 16, "skewness": 1.5, "kurtosis": 5, "range":40},
                "5year": {"std-dev": 14, "skewness": 1, "kurtosis": 3, "range":10}
            },
            "county": {
                "monthly": {"std-dev": 15, "skewness": 4, "kurtosis": 20, "range":40}, 
                "yearly": {"std-dev": 16, "skewness": 1.5, "kurtosis": 5, "range":40},
                "5year": {"std-dev": 14, "skewness": 1, "kurtosis": 3, "range":10}
            }
        },
        "tmax": {
            "4km": {
                "monthly": {"std-dev": 14, "skewness": 4, "kurtosis": 23, "range": 40}, 
                "yearly": {"std-dev": 17, "skewness": 2, "kurtosis": 10, "range": 40}, 
                "5year": {"std-dev": 15, "skewness": 1.4, "kurtosis": 6, "range":10}
            },
            "county":{
                "monthly": {"std-dev": 14, "skewness": 4, "kurtosis": 23, "range":40},
                "yearly": {"std-dev": 17, "skewness": 2, "kurtosis": 10, "range": 40},
                "5year": {"std-dev": 15, "skewness": 1.4, "kurtosis": 6, "range":10}
            }
        },
        "heatwave": {
            "4km": {
                "monthly": {"count": 20, "length": 15, "intensity": 5}, 
                "yearly":  {"count": 20, "length": 15, "intensity": 5}, 
                "5year":  {"count": 75, "length": 15, "intensity": 5}
            },
            "county":{
                "monthly": {"count": 20, "length": 15, "intensity": 5}, 
                "yearly":  {"count": 20, "length": 15, "intensity": 5}, 
                "5year":  {"count": 75, "length": 15, "intensity": 5}
            }
        }
    };
    var minVal = minVals[cvar][spatialScale][temporalScale][metric];
    var maxVal = maxVals[cvar][spatialScale][temporalScale][metric];
    var steps = intervalSteps(minVal, maxVal, 5);
    console.log(metric);
    var metricInfo = {}; //metricInfos[metric];
    metricInfo["displayMax"] = maxVal;
    metricInfo["steps"] = steps;
    metricInfo["name"] = metric
    return metricInfo;
};


export function getMetrics(climateVar) {
    if (climateVar == "ppt") {
        return [
            {"lbl": "Standard Deviation", "val": "std-dev"},
            {"lbl": "Skewness", "val": "skewness"},
            {"lbl": "Kurtosis", "val": "kurtosis"},
            {"lbl": "Standard Precipitation Index", "val": "spi"},
            {"lbl": "Heavy Precipitation Index", "val": "hpi"},
            {"lbl": "Consecutive Dry Days", "val": "cdd"},
            {"lbl": "Intra-annual Variability", "val": "range"}
        ]
    } else if ((climateVar == "tmin") || (climateVar == "tmax")){
        return [
            {"lbl": "Standard Deviation", "val": "std-dev"},
            {"lbl": "Skewness", "val": "skewness"},
            {"lbl": "Kurtosis", "val": "kurtosis"},
            {"lbl": "Intra-annual Variability", "val": "range"}
        ]
    } else { // heatwave
        return [
            {"lbl": "Count", "val": "count"},
            {"lbl": "Length", "val": "length"},
            {"lbl": "Intensity", "val": "intensity"}
        ]
    }
}

export function gcm_cvar(cvar){
    var cvars = {"ppt": "pr", "tmin": "tasmin", "tmax": "tasmax"};
    return cvars[cvar];
}