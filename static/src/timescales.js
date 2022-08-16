var _ = require('lodash');
var years_strs = _.map(_.range(2006, 2022), function(y){
    return {"lbl": y.toString(), "val": y.toString()};
});
var months_strs = [];
for (var i in years_strs) {
    var y = years_strs[i].val;
    months_strs = months_strs.concat(_.map(_.range(1, 13), function(m) {
        var label = y + "-" + ("0" + m).slice(-2);
        return {"lbl": label, "val": label.replace("-","")};
    }));
};
var fiveyear_intvls = ["2017-2021", "2012-2016", "2007-2011"];
var fiveyear_strs = _.map(fiveyear_intvls, function(fiveyear){
    return {"lbl": fiveyear, "val": fiveyear.replace("-", "to")};
});
var date_intervals_labels = {
    "monthly": months_strs,
    "yearly": years_strs,
    "5year": fiveyear_strs
}
export function getDateIntervals(timescale) {
    return date_intervals_labels[timescale]
};