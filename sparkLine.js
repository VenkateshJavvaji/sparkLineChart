/**
 * @author Venkatesh Javvaji <vjavvaj@emory.edu>
 *This is sparkLine chart implementation for spo2(oxygen),
 *hr(heartRate) and bp(bloodPressure) values for possible intubation.
 */
require.config({
    paths: {
        "d3": "https://d3js.org/d3.v5.min"
    }
});

/**
 * variable declaration section
 */
var currentPage = 1;
var numberPerPage = 10;
var numberOfPages = 0;
var uniqueTableData;
var spo2, hr, bp;
var n = 1,
    p = 1,
    o = 1,
    k = 1,
    l = 1,
    m = 1;

requirejs(["d3"], function(d3) {

    //function to construct missing data for spo2, hr and bp values
    function constructMissingDataElements(parent, childTobeModified) {

        var temp = [];
        for (var i = 0; i < parent.length; i++) {
            temp.push(parent[i][0]);
        }

        var constructMasterHashmap = {};
        var constructChildHashmap = {};
        var constructChildTobeModifiedKeys = [];
        var constructChildTobeModified = {};

        parent.map(function(item, index) {
            var key = item[0];
            var value = item[1];
            // create key:value pairs from master
            constructMasterHashmap[key] = value;
        });

        var parentKeys = Object.keys(constructMasterHashmap);
        parentKeys.forEach(key => {
            //console.log(key + '|' + constructMasterHashmap[key]);
        });

        childTobeModified.map(function(item, index) {
            var key = item[0];
            var value = item[1];
            // create key:value pairs from child
            constructChildHashmap[key] = value;
            constructChildTobeModifiedKeys.push(key);
        });
        var childKeys = Object.keys(constructChildHashmap);
        childKeys.forEach(key => {
            //console.log(key + '|' + constructChildHashmap[key]);
        });

        for (var j = 0; j < parent.length; j++) {
            var key = parent[j][0];
            if (!constructChildTobeModifiedKeys.includes(key) || (j + 1 < parent.length && parent[j][0] == parent[j + 1][0])) {
                constructChildTobeModified[key] = [
                    [0, 0]
                ];
            } else {
                const value = Object.values(constructChildHashmap).find(value => constructChildHashmap[key] === value);
                constructChildTobeModified[key] = value;
            }
        }

        var result = [];

        result.push(Object.entries(constructChildTobeModified));

        var temp1 = [];
        for (var k = 0; k < result[0].length; k++) {
            temp1.push(result[0][k][0]);
        }
        return result;
    }

    //function to parse JSON data
    function transformData(d) {
        if (!d.parameter_alias && !d.parameter && !d.acquired_time) {
            return [d.person_id, d.facility_disp, d.unit_disp, d.room_disp, d.name_full_formatted];
        } else if (!d.facility_disp && !d.unit_disp && !d.room_disp && !d.name_full_formatted) {
            //This is to standardize the acquired date to EST timezone
            var date = Date.parse(d.acquired_time) - 14400000;
            return [d.person_id, d.parameter_alias, d.parameter, date];
        }
    }

    //function to transform the data to array of arrays e.g. ([[patientID],[[data, parameterValue]]])
    function transformArray(data) {

        var result = [];
        // step 1:  get the records which are having similar id's
        var getSimilarIds = [];
        for (var i = 0; i < data.length; i++) {
            // compare 1st and seconds element if the id's are equal simply add  that to a temparory array(getSimilarIds).
            if (i + 1 < data.length && data[i][0] == data[i + 1][0]) {
                getSimilarIds.push(data[i]);
            } else {
                // when id's didn't match push the unmatched Id to temparory array.
                getSimilarIds.push(data[i]);
                // write a function to consolidate the data to desired output. 
                result.push([getSimilarIds[0][0], reshufflelogic(getSimilarIds)]);
                //result.push(reshufflelogic(getSimilarIds));
                // Once the first set is properly constructed empty the temporary array to process new id's
                getSimilarIds = [];
            }
        }
        return result;
    }

    //helper funtcion for transformArray
    function reshufflelogic(getSimilarIds) {

        var subset = [];

        for (var i = 0; i < getSimilarIds.length; i++) {
            var innerSubset = [];
            innerSubset.push(getSimilarIds[i][2], parseInt(getSimilarIds[i][1]));
            subset.push(innerSubset);
        }
        return subset;
    }

    //function to tabulate the data
    function tabulate(data, columns, selector) {

        //remove persoin_id from the data
        /*
        for (var i = 0; i < data.length; i++) {
            var data1 = data[i];
            data1.shift();
        }
        */

        var table = d3.select(selector).append('table').attr("class", "a-IRR-table");
        var thead = table.append('thead');
        var tbody = table.append('tbody');

        // append the header row
        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
            .attr("class", "a-IRR-header spark")
            .text(function(column) {
                return column;
            });

        // create a row for each object in the data
        var rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr");

        // create a cell in each row for each column
        rows.selectAll("td")
            .data(function(row) {
                return columns.map(function(column) {
                    if (column == 'SPO2') {
                        return {
                            column: column,
                            id: 'data' + k++,
                            value: ''
                        };
                    } else if (column == 'HR') {
                        return {
                            column: column,
                            id: 'hrdata' + l++,
                            value: ''
                        };
                    } else if (column == 'BP') {
                        return {
                            column: column,
                            id: 'bpdata' + m++,
                            value: ''
                        };
                    } else {
                        return {
                            column: column,
                            value: row[columns.indexOf(column)]
                        };
                    }
                });
            })
            .enter()
            .append("td")
            .attr("id", function(d) {
                return d.id ? d.id : null;
            })
            .attr("class", function(d) {
                return d.class ? d.class + " sparkcell" : "sparkcell";
            })
            .html(function(d) {
                return d.value;
            });

        return table;
    }

    //function to render sparkLineChart for spo2, hr and bp values (date, parameterValues)
    function renderSparklineChart(dataArray, timeSeriesName, colors, selector) {

        var chart_timeline = d3.select(selector)
            .append("div")
            .attr("id", "chart-timeline")
            .node();

        var options = {
            series: [],
            chart: {
                id: 'area-datetime',
                type: 'line',
                events: {
                    mounted: function(ctx, config) {
                        const lowest = ctx.getLowestValueInSeries(0);
                        const highest = ctx.getHighestValueInSeries(0);

                        //marker for max value
                        ctx.addPointAnnotation({
                            id: 'maxValue',
                            x: new Date(ctx.w.globals.seriesX[0][ctx.w.globals.series[0].indexOf(highest)]).getTime(),
                            y: highest,
                            label: {
                                //text: 'Max: ' + highest,
                                offsetX: 2,
                                offsetY: 2
                            }
                        });

                        //marker for min value
                        ctx.addPointAnnotation({
                            id: 'minValue',
                            x: new Date(ctx.w.globals.seriesX[0][ctx.w.globals.series[0].indexOf(lowest)]).getTime(),
                            y: lowest,
                            label: {
                                //text: 'Min: ' + lowest,
                                offsetX: 2,
                                offsetY: 2
                            }
                        });

                    }
                },
                width: 200,
                height: 35,
                sparkline: {
                    enabled: true
                }
            },
            xaxis: {
                type: 'datetime'
            },
            tooltip: {
                x: {
                    format: 'dd MMM yyyy, HH:mm:ss'
                }
            }
        };

        for (var idx = 0; idx < dataArray.length; idx++) {
            options.series.push({
                data: dataArray[idx],
                name: timeSeriesName
            });
        }

        var chart = new ApexCharts(chart_timeline, options);
        chart.render();
    }

    //function to clear the table to render new set
    function clearExistingTable() {
        d3.select('#my_data1').selectAll('table').remove();
    }

    //function to render the table and sparkLineChart in pagination
    function internalPlotData(currentPage) {

        console.log("currentPage :" + currentPage);

        var start = ((currentPage - 1) * numberPerPage);
        var end = start + numberPerPage;

        console.log("start :" + start);
        console.log("end :" + end);

        clearExistingTable();

        var colors = ["steelblue"];

        //function call to create a table for the data
        tabulate(uniqueTableData.slice(start, end), ['Person Id', 'Facility Disp', 'Unit Disp', 'Room Disp', 'Name Full Formatted', 'SPO2', 'HR', 'BP'], '#my_data1');
        //tabulate(uniqueTableData.slice(start, end), ['Facility Disp', 'Unit Disp', 'Room Disp', 'Name Full Formatted', 'SPO2', 'HR', 'BP'], '#my_data1');

        /**
         * function calls to render sparkLineChart for spo2, hr and bp values respectively
         */
        for (var i = start; i < end; i++) {
            var spo2SparkData = [];
            spo2SparkData.push(spo2[0][i][1]);
            renderSparklineChart(spo2SparkData, "SPO2", colors, '#data' + n++);
        }

        for (var j = start; j < end; j++) {
            var hrSparkData = [];
            hrSparkData.push(hr[0][j][1]);
            renderSparklineChart(hrSparkData, "HR", colors, '#hrdata' + p++);
        }

        for (var k = start; k < end; k++) {
            var bpSparkData = [];
            bpSparkData.push(bp[0][k][1]);
            renderSparklineChart(bpSparkData, "BP", colors, '#bpdata' + o++);
        }

        d3.select("#next").style("opacity", function(d) {
            return currentPage == numberOfPages ? 1.0 : 0;
        });

        d3.select("#previous").style("opacity", function(d) {
            return currentPage == 1 ? 1.0 : 0;
        });

        d3.select("#first").style("opacity", function(d) {
            return currentPage == 1 ? 1.0 : 0;
        });

        d3.select("#last").style("opacity", function(d) {
            return currentPage == numberOfPages ? 1.0 : 0;
        });
    }

    //Initialization function
    function plotData() {

        var urls = ["getVentilatorPatient", "getSPO2Values", "getHRValues", "getBPValues"];

        var promiseArray = [];

        //to fetch data from backEnd
        for (var i = 0; i < urls.length; i++) {
            promiseArray.push(apex.server.process(urls[i]));
        }

        Promise.all(promiseArray).then(function(dataArray) {

            dataArray = dataArray.map(function(x) {
                dataArray = x.map(transformData);
                return dataArray;
            });

            //to flatten the dataArray into one-dimensional array
            var data = dataArray.flat(1);

            //split data into 4 parts respectively for table data, data for spo2, data for hr and data for bp respectively 
            var tableData = [];
            var spo2Data = [];
            var hrData = [];
            var bpData = [];

            for (var i = 0; i < data.length; i++) {
                if (data[i].length > 4) {
                    tableData.push(data[i]);
                } else if (data[i].length == 4 && (data[i][1] == "SPO2-%" || data[i][1] == "SpO2" || data[i][1] == "SPO2_SPO2" || data[i][1] == "SPO2")) {
                    spo2Data.push(data[i]);
                } else if (data[i].length == 4 && (data[i][1] == "HR" || data[i][1] == "SPO2_PR" || data[i][1] == "ART_HR" || data[i][1] == "Heart rate")) {
                    hrData.push(data[i]);
                } else if (data[i].length == 4 && (data[i][1] == "NBP Mean" || data[i][1] == "ABP_MEAN" || data[i][1] == "NBP-M" || data[i][1] == "NIBP_MEAN" || data[i][1] == "ABPm" || data[i][1] == "NBPm" || data[i][1] == "AR3-M" || data[i][1] == "AR1-M" || data[i][1] == "AR2-M" || data[i][1] == "ART_MEAN" || data[i][1] == "ARTm" || data[i][1] == "AR4-M")) {
                    bpData.push(data[i]);
                }
            }
            
            //to eliminate duplicates
            uniqueTableData = Array.from(new Set(tableData.map(JSON.stringify)), JSON.parse);
            
            //remove unwanted data (parameter Alias: spo2)
            for (var a = 0; a < spo2Data.length; a++) {
                spo2Data[a].splice(1, 1);
            }

            //remove unwanted data (parameter Alias: hr)
            for (var b = 0; b < hrData.length; b++) {
                hrData[b].splice(1, 1);
            }

            //remove unwanted data (parameter Alias: bp)
            for (var c = 0; c < bpData.length; c++) {
                bpData[c].splice(1, 1);
            }

            //function calls to transform data to array of arrays e.g. ([[patientID],[[data, parameterValue]]])
            var spo2SparkLine = transformArray(spo2Data);
            var hrSparkLine = transformArray(hrData);
            var bpSparkLine = transformArray(bpData);

            //function calls to construct the missing data to maintain consistency between uniqueTableData, spo2, hr and bp values
            spo2 = constructMissingDataElements(uniqueTableData, spo2SparkLine);
            hr = constructMissingDataElements(uniqueTableData, hrSparkLine);
            bp = constructMissingDataElements(uniqueTableData, bpSparkLine);

            console.log("uniqueTableData :" + uniqueTableData.length);
            console.log("spo2SparkLine : " + spo2SparkLine.length);
            console.log("spo2 : " + spo2[0].length);
            console.log("hr : " + hr[0].length);
            console.log("bp : " + bp[0].length);

            //to get total numberOfPages for pagination
            numberOfPages = Math.ceil(uniqueTableData.length / numberPerPage);

            //initial call to plot the data along with sparkLineCharts
            internalPlotData(currentPage);

            //remove the spinner after loading the data
            d3.select("#chart_spinner").remove();

        });
    }

    /**
     * to add buttons (firstPage, previous, next and lastPage) for pagination
     */
    d3.select("#my_data1").append("div").text("firstPage").attr("class", "text2button").on('click', function() {
        currentPage = 1;
        internalPlotData(currentPage);
    });

    d3.select("#my_data1").append("div").text("previous").attr("class", "text2button").on('click', function() {
        currentPage -= 1;
        if (currentPage >= 1) {
            internalPlotData(currentPage);
        }
    });

    d3.select("#my_data1").append("div").text("next").attr("class", "text2button").on('click', function() {
        currentPage += 1;
        if (currentPage <= numberOfPages) {
            internalPlotData(currentPage);
        }
    });

    d3.select("#my_data1").append("div").text("lastPage").attr("class", "text2button").on('click', function() {
        currentPage = numberOfPages;
        internalPlotData(currentPage);
    });

    plotData();
});