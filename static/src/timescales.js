import { map, range } from 'lodash';
var years_strs = map(range(1981, 2022), function(y){
    return {"lbl": y.toString(), "val": y.toString()};
});
var months_strs = [];
for (var i in years_strs) {
    var y = years_strs[i].val;
    months_strs = months_strs.concat(map(range(1, 13), function(m) {
        var label = y + "-" + ("0" + m).slice(-2);
        return {"lbl": label, "val": label.replace("-","")};
    }));
};
var fiveyear_intvls = ["2017-2021", "2012-2016", "2007-2011", "2002-2006", 
                       "1997-2001", "1992-1996", "1987-1991", "1982-1986"];
var fiveyear_strs = map(fiveyear_intvls, function(fiveyear){
    return {"lbl": fiveyear, "val": fiveyear.replace("-", "to")};
});
var date_intervals_labels = {
    "monthly": months_strs,
    "yearly": years_strs,
    "5year": fiveyear_strs
}
export function getDateIntervals(timescale) {
    return date_intervals_labels[timescale]
}