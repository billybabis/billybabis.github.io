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
        "cdd": {"name": "consecutive_dry_days", "bandNum": 4}
    };
    var minVals = {
        "ppt": {
            "4km": {
                "monthly": {"std-dev": 0, "skewness": -1, "kurtosis": -3, "hpi": 0, "cdd": 0}, 
                "yearly": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 0, "cdd": 0}, 
                "5year": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 6.65, "cdd": 0}
            },
            "county":  {
                "monthly": {"std-dev": 0, "skewness": -1, "kurtosis": -3, "hpi": 0, "cdd": 0}, 
                "yearly": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 0, "cdd": 0}, 
                "5year": {"std-dev": 0, "skewness": 0, "kurtosis": -3, "hpi": 6.65, "cdd": 0}
            }
        },
        "tmin": {
            "4km": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3}, 
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3}, 
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3}
            },
            "county": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3}, 
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3}, 
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3}
            }
        },
        "tmax": {
            "4km": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3}, 
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3}, 
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3}
            },
            "county": {
                "monthly": {"std-dev": 0, "skewness": -4.5, "kurtosis": -3}, 
                "yearly": {"std-dev": 0, "skewness": -2, "kurtosis": -3}, 
                "5year": {"std-dev": 0, "skewness": -1.4, "kurtosis": -3}
            }
        }
    };
    var maxVals = {
        "ppt": {
            "4km": {
                "monthly": {"std-dev": 130, "skewness": 5, "kurtosis": 25, "hpi": 100, "cdd": 30}, 
                "yearly": {"std-dev": 48, "skewness": 19, "kurtosis": 360, "hpi": 100, "cdd": 365}, 
                "5year": {"std-dev": 38, "skewness": 30, "kurtosis": 1000, "hpi": 100, "cdd": 380}
            },
            "county": {
                "monthly": {"std-dev": 130, "skewness": 5, "kurtosis": 25, "hpi": 100, "cdd": 30}, 
                "yearly": {"std-dev": 48, "skewness": 19, "kurtosis": 360, "hpi": 100, "cdd": 365}, 
                "5year": {"std-dev": 38, "skewness": 30, "kurtosis": 1000, "hpi": 100, "cdd": 380}
            }
        },
        "tmin": {
            "4km": {
                "monthly": {"std-dev": 15, "skewness": 4, "kurtosis": 20}, 
                "yearly": {"std-dev": 16, "skewness": 1.5, "kurtosis": 5}, 
                "5year": {"std-dev": 14, "skewness": 1, "kurtosis": 3}
            },
            "county": {
                "monthly": {"std-dev": 15, "skewness": 4, "kurtosis": 20}, 
                "yearly": {"std-dev": 16, "skewness": 1.5, "kurtosis": 5}, 
                "5year": {"std-dev": 14, "skewness": 1, "kurtosis": 3}
            }
        },
        "tmax": {
            "4km": {
                "monthly": {"std-dev": 14, "skewness": 4, "kurtosis": 23}, 
                "yearly": {"std-dev": 17, "skewness": 2, "kurtosis": 10}, 
                "5year": {"std-dev": 15, "skewness": 1.4, "kurtosis": 6}
            },
            "county":{
                "monthly": {"std-dev": 14, "skewness": 4, "kurtosis": 23}, 
                "yearly": {"std-dev": 17, "skewness": 2, "kurtosis": 10}, 
                "5year": {"std-dev": 15, "skewness": 1.4, "kurtosis": 6}
            }
        }
    };
    var minVal = minVals[cvar][spatialScale][temporalScale][metric];
    var maxVal = maxVals[cvar][spatialScale][temporalScale][metric];
    var steps = intervalSteps(minVal, maxVal, 5);
    var metricInfo = metricInfos[metric];
    metricInfo["displayMax"] = maxVal;
    metricInfo["steps"] = steps;
    metricInfo["name"] = metric
    return metricInfo;
};


export function getMetrics(climateVar) {
    var metrics = [
        {"lbl": "Standard Deviation", "val": "std-dev"},
        {"lbl": "Skewness", "val": "skewness"},
        {"lbl": "Kurtosis", "val": "kurtosis"}
    ];
    if (climateVar == "ppt") {
        metrics.push({"lbl": "Heavy Precipitation Index", "val": "hpi"});
    }
    return metrics;
}

export function gcm_cvar(cvar){
    var cvars = {"ppt": "pr", "tmin": "tasmin", "tmax": "tasmax"};
    return cvars[cvar];
}