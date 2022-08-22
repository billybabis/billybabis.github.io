export function temporal_interval_folder(temporal_interval_label){
    var temporal_folders = {"monthly": "agg_month", "yearly": "agg_year", "5year": "agg_5year"};
    return temporal_folders[temporal_interval_label]
}

// Format string of parameters for get-request
export function getRequestParamsStr(vals){
    var str = "";
    for (let key in vals){
        str += key + "=" + vals[key] + "&";
    }
    return str.slice(0,-1);
}

export function getPalette(detailed=false) {
    if (detailed) {
        return ["#50B161", "#77BA63", "#9DC263", "#C4CB66",
                "#EAD367", "#D2CF8A", "#B9CCAe", "#A1C8D1",
                "#88C4F4", "#78B1DD", "#679DC6", "#578AAF",
                "#467698", "#366281", "#254F6A", "#153B53", "#04273C"];
    } else {
        return ["#50B161", "#EAD367", "#88C4F4", "#467698", "#04273C"];
    }
    return palette;
}

export function _remove(mapObject){
    if (typeof mapObject !== 'undefined') {
        mapObject.remove();
    }
}

export function intervalSteps(minNum, maxNum, numSteps) {
    var steps = [];
    var stepLen = (maxNum - minNum) / (numSteps - 1);
    for (var i=0; i<numSteps; i++) {
        steps.push(minNum + i*stepLen);
    }
    return steps;
} 