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
    var maxVals = {
        "ppt": {
            "4km": {
                "monthly": {"std-dev": 30, "skewness": 50, "kurtosis": 50, "hpi": 100, "cdd": 200}, 
                "yearly": {"std-dev": 30, "skewness": 10, "kurtosis": 100, "hpi": 100, "cdd": 200}, 
                "5year": {"std-dev": 30, "skewness": 10, "kurtosis": 100, "hpi": 100, "cdd": 200}
            },
            "county": {
                "monthly": {"std-dev": 20, "skewness": 10, "kurtosis": 50, "hpi": 100, "cdd": 200},
                "yearly":  {"std-dev": 20, "skewness": 10, "kurtosis": 50, "hpi": 100, "cdd": 200},
                "5year": {"std-dev": 20, "skewness": 10, "kurtosis": 50, "hpi": 100, "cdd": 200}
            }
        },
        "tmin": {
            "4km": {
                "monthly": {"std-dev": 10, "skewness": 5, "kurtosis": 5}, 
                "yearly": {"std-dev": 10, "skewness": 5, "kurtosis": 5}, 
                "5year": {"std-dev": 10, "skewness": 5, "kurtosis": 5}
            },
            "county": {
                "monthly": {"std-dev": 10, "skewness": 5, "kurtosis": 5},
                "yearly":  {"std-dev": 10, "skewness": 5, "kurtosis": 5},
                "5year": {"std-dev": 10, "skewness": 10, "kurtosis": 5}
            }
        }
    };
    var maxVal = maxVals[cvar][spatialScale][temporalScale][metric];
    var steps = intervalSteps(0, maxVal, 5);
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