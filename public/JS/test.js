$(document).ready(function() {
    getSchoolsDropDown('getSchools', null, '#UniversityDropDown');
    $('#MajorsDropDown').attr('disabled', true).selectpicker('refresh');
    $('#reset').attr('disabled', true);
});

var host = "http://localhost:3000/"; //http://35.162.231.0:3000/

var courseList;
var notTakenCourseList = null;
var takenCourseList = [];
var colorPost = '#ffc500';

function getSum(array) {
    var sum = 0;
    for (var i in array) {
        sum += array[i];
    }
    return sum;
}

/**
 * Creates the matrix and list of names used to generate the d3 wheel using the courselist
 * @return {Object} JSON object of the matrix and list of course abbrs for the d3 wheel
 */
function createChartData() {
    var zRow = new Array(courseList.length).fill(0);
    var matrix = new Array(courseList.length).fill(zRow);
    var names = [];
    for (var i in courseList) {
        names[i] = courseList[i].schoolCourseID;
        var row = zRow.slice();
        //find prereqs
        for (var j in courseList) {
            if (courseList[i].prereqs.includes(courseList[j].idtCourse)) {
                row[j] = 1;
            }
        }
        var sum = getSum(row);
        if (sum == 0) { // course i has no prereqs
            row[i] = 1;
        } else if (sum > 1) { // course i has multiple prereqs
            row[i] = 0;
        }
        matrix[i] = row;
    }
    //creating JSON obj to return 
    var data = {
        packageNames: names,
        matrix: matrix
    };
    return data;
}

/**
 * Effectively untakes all classes and returns user to point of selecting major
 */
function reset() {
    $('#target').empty();
    createChart();
    $('#takenList').empty();
    takenCourseList = [];
    $('#notTakenList').empty();
    notTakenCourseList = [];
    for (var i in courseList) {
        notTakenCourseList.push(i);
        $("#notTakenList").append('<li id="course' + i + '" class="list-group-item" value="' + i + '" onclick="dispCourseInfo(' + i + ')">' + courseList[i].schoolCourseID + '<span class="glyphicon glyphicon-move"/></li>');
    }
    $('#courseName').empty();
    $('#courseDescription').empty();
    $('#courseLink').empty();
    $('#courseCredits').empty();

    checkAvailable();
}

/**
 * Creates the d3 wheel in the div marked with he #target id
 */
function createChart() {
    var data = createChartData();
    var chart = d3.chart.dependencyWheel();
    d3.select('#target')
        .datum(data)
        .call(chart);
};

/**
 * Clears all client lists, data and visual, so that a new major can be loaded
 */
function clearLists() {
    courseList = [];
    notTakenCourseList = [];
    takenCourseList = [];
    $('#takenList').empty();
    $('#notTakenList').empty();
}

/**
 * Event listener for changing course list when a major is selected
 */
function majorSelected() {
    clearLists();
    var majorID = $('#MajorsDropDown option:selected').val();
    getCoursesList('getCoursesFromMajors', "?majorID=" + majorID);
    $('#reset').attr('disabled', false); //.btn('refresh');
    $('#target').empty();
}

/**
 * Displays the course information on the course information panel
 * @param {Number} masterIndex - Used to index into courselist  
 */
function dispCourseInfo(masterIndex) {
    $('#courseName').text(courseList[masterIndex].name);
    $('#courseDescription').text(courseList[masterIndex].description);
    $('#courseLink').text(courseList[masterIndex].courseLink);
    $('#courseCredits').text("Credits: " + courseList[masterIndex].credits);
}

/**
 * Finds the index of the array that holds teh specified value -1 if doesn't exist
 * @param {*} val - The searchable value
 * @param {Array} arr - array of values
 * @return {Number} - The index that holds the specified val or -1
 */
function findIndex(val, arr) {
    for (var i in arr) {
        if (val == arr[i]) {
            return i;
        }
    }
    return -1;
}

/**
 * Checks for courses that have their prereqs satisfied and colors them appropriately 
 */
function checkAvailable() {
    for (var i in notTakenCourseList) {
        //if every course in the prereq array of this course is in 
        //takenList then highlight yellow
        var allPrereqsAreTaken = true;
        for (var j in courseList[notTakenCourseList[i]].prereqs) {
            var index = -1;
            //find index
            for (var k in courseList) {
                if (courseList[k].idtCourse == courseList[notTakenCourseList[i]].prereqs[j]) {
                    index = k;
                    break;
                }
            }
            if (findIndex(index, takenCourseList) < 0 && (index > -1)) {
                allPrereqsAreTaken = false;
            }
        }
        if (allPrereqsAreTaken) {
            $('#course' + notTakenCourseList[i]).css("background-color", colorPost);
        } else {
            $('#course' + notTakenCourseList[i]).css("background-color", "#e6e6e6");
        }
    }
    for (var i in takenCourseList) {
        $('#course' + takenCourseList[i]).css("background-color", "#54dea7");

    }
}

/**
 * Flag that when false allows an alert to inform the user to be notified of auto take prereq if true blocks alert
 */
prereqAlert = false;

/**
 * Flag that when false allows an alert to inform the user to be notified of auto untake postreqs if true blocks alert
 */
postreqAlert = false;

/**
 * Moves all postreqs of a class to untaken list when their prereq is untaken
 * @param {Number} masterIndex - index of untaken course in courelist
 */
function movePostreqs(masterIndex) { //should be called at end of untake class
    console.log("Moving postreqs for " + courseList[masterIndex].schoolCourseID);
    var courseID = courseList[masterIndex].idtCourse;
    for (var j in courseList) {
        var postreqIndex = -1;
        var prereqArr = courseList[j].prereqs;
        var prereqIndex = findIndex(courseID, prereqArr);
        if (prereqIndex > -1) {
            postreqIndex = j;
            if (findIndex(postreqIndex, notTakenCourseList) < 0) {
                if (!postreqAlert) {
                    postreqAlert = true;
                    alert("Automatically moving over postreqs for " + courseList[masterIndex].schoolCourseID + " (" + courseList[masterIndex].name + ")");
                }
            }
        }
        if (postreqIndex > -1) {
            console.log("Auto-untaking " + courseList[postreqIndex].schoolCourseID);
            $('#courseWheel' + postreqIndex).d3Click();
            //unTakeClass(postreqIndex);
        }
    }
}

/**
 * Moves all prereqs of taken course into taken courselist
 * @param {Number} masterIndex - index of taken course in courselist
 */
function movePrereqs(masterIndex) {
    var prereqArr = courseList[masterIndex].prereqs;
    for (var i in prereqArr) {
        var prereqIndex = -1;
        for (var j in courseList) {
            if (courseList[j].idtCourse == prereqArr[i]) {
                prereqIndex = j;
                if (findIndex(j, takenCourseList) < 0) {
                    if (!prereqAlert) {
                        prereqAlert = true;
                        alert("Automatically moving over prereqs for " + courseList[j].schoolCourseID + " (" + courseList[j].name + ")");
                    }
                }
                break;
            }
        }
        if (prereqIndex > -1) {
            takeClass(prereqIndex);
        }
    }
    //prereqAlert = false;
}

/**
 * Moves class to taken courselist and handles all prereqs
 * @param {Number} masterIndex - Index of course to be taken in courselist
 * @param {Boolean} local - flag indicating caller, true for local false for d3 wheel
 */
function takeClass(masterIndex, local) {
    local = local || false;
    if (local) { //Doesn't work and unused
        console.log("Clicking #courseWheel" + masterIndex);
        $('#courseWheel' + masterIndex).trigger("click");
        return;
    }
    var index = findIndex(masterIndex, notTakenCourseList); //notTakenCourseList.indexOf(masterIndex);
    if (index > -1) {
        //moves backend data
        notTakenCourseList.splice(index, 1);
        takenCourseList.push(masterIndex);
        //move ui list items
        var itm = document.getElementById("course" + masterIndex);
        var cln = itm.cloneNode(true);
        document.getElementById("takenList").appendChild(cln);
        itm.parentNode.removeChild(itm);
    } else {
        //error
        console.log("Bad " + masterIndex + " not in " + notTakenCourseList + " index: " + index);
    }
    checkAvailable();
    movePrereqs(masterIndex);
}

/**
 * Moves class to untaken courselist and handles all postreqs
 * @param {Number} masterIndex - Index of course to be taken in courselist
 * @param {Boolean} local - flag indicating caller, true for local false for d3 wheel
 */
function unTakeClass(masterIndex, local) {
    local = local || false;
    if (local) { //Doesn't work and unused
        $('#courseWheel' + masterIndex).trigger("click");
        return;
    }
    var index = findIndex(masterIndex, takenCourseList);
    if (index > -1) {
        //move backend data
        takenCourseList.splice(index, 1);
        notTakenCourseList.push(masterIndex);
        //move ui list items
        var itm = document.getElementById("course" + masterIndex);
        var cln = itm.cloneNode(true);
        document.getElementById("notTakenList").appendChild(cln);
        itm.parentNode.removeChild(itm);
    } else { //error
        console.log("Bad " + masterIndex + " not in " + takenCourseList + " index: " + index);
    }
    checkAvailable();
    //movePostreqs(masterIndex);
}

/**
 * Calls database to get prereq information for major courses
 * @param {String} func - Name of server call
 * @param {String} params - Parameters for call
 */
function getPrereqsForCourses(func, params) {
    var url = host + func;
    var xhr = new XMLHttpRequest();
    if (params) {
        url += params;
    }
    xhr.open("GET", url);
    xhr.onload = function() {
        var jsonRes = JSON.parse(xhr.responseText);
        for (i in courseList) {
            for (j in jsonRes) {
                //if the parentID in the jsonRes object is a course in our courselist
                //then add the prereq to the array of prereqs in the courselist object
                if (jsonRes[j].parentID == courseList[i].idtCourse) {
                    courseList[i].prereqs.push(jsonRes[j].prereqID);
                }
            }
        }
        populateListAndChart();
    };
    xhr.send();
}

/**
 * Calls database to get list of courses from a major
 * @param {String} func - Name of server call
 * @param {String} params - Parameters for call
 */
function getCoursesList(func, params) {
    var url = host + func;
    var xhr = new XMLHttpRequest();
    if (params) {
        url += params;
    }
    xhr.open("GET", url);
    xhr.onload = function() {
        var jsonRes = JSON.parse(xhr.responseText);
        var courseIDList = [];
        courseList = new Array(jsonRes.length);
        notTakenCourseList = new Array(jsonRes.length);

        for (i in jsonRes) {
            courseIDList[i] = jsonRes[i].idtCourse;
            jsonRes[i].prereqs = [];
        }
        courseList = jsonRes;
        getPrereqsForCourses('getCoursesWithPrereqs', '?courseIDs= ' + courseIDList);
    };

    xhr.send();
};

/**
 * Populates the legend with courses based on the major selected in the dropdown
 */
function populateListAndChart() {
    courseList = sortCourseList(courseList);
    $("#notTakenList").empty();
    $('#takenList').empty();
    notTakenCourseList = new Array();
    for (var i in courseList) {
        notTakenCourseList.push(i);
        $("#notTakenList").append('<li id="course' + i + '" class="list-group-item" value="' + i + '" onclick="dispCourseInfo(' + i + ')">' + courseList[i].schoolCourseID + '<span class="glyphicon glyphicon-move"/></li>');
    }
    checkAvailable();
    createChart();
}

/**
 * Event listener for changing major list when a school is selected
 */
function schoolSelected() {
    $('#MajorsDropDown').attr('disabled', false).selectpicker('refresh');
    var schoolID = $('#UniversityDropDown option:selected').val();
    getMajorsDropDown('getMajorsFromSchool', "?schoolID=" + schoolID, '#MajorsDropDown');
    $('#MajorsDropDown').attr('disabled', false).selectpicker('refresh');
}

/**
 * Populates the Majors drop down from the database based on what school is selected
 * @param {String} func - Name of server call
 * @param {String} params - Parameters for call
 * @param {*} listID - HTML ID of list to be modified
 */
function getMajorsDropDown(func, params, listID) {
    var url = host + func;
    var xhr = new XMLHttpRequest();
    if (params) {
        url += params;
    }
    xhr.open("GET", url);
    xhr.onload = function() {
        var jsonRes = JSON.parse(xhr.responseText);
        $(listID).empty();
        for (var i in jsonRes) {
            $(listID).append('<option value="' + jsonRes[i].idtMajors + '">' +
                (jsonRes[i].name) + '</option>');
        }
        $(listID).selectpicker('refresh');
    };

    xhr.send();
};

/**
 * Populates the Schools/University Dropdown on page load 
 * @param {String} func - Name of server call
 * @param {String} params - Parameters for call
 * @param {*} listID - HTML ID of list to be modified
 */
function getSchoolsDropDown(func, params, listID) {
    var url = host + func;
    var xhr = new XMLHttpRequest();
    if (params) {
        url += params;
    }
    xhr.open("GET", url);
    xhr.onload = function() {
        var jsonRes = JSON.parse(xhr.responseText);
        $(listID).empty();
        for (var i in jsonRes) {
            $(listID).append('<option value="' + jsonRes[i].idtSchool + '">' +
                (jsonRes[i].name) + '</option>');
        }
        $(listID).selectpicker('refresh');
    };

    xhr.send();
};

/**
 * Takes array of elements and returns array of numbers
 * @param {Array} arr - array of values representing numbers
 * @return {Array} - array of numbers
 */
function strToInt(arr) {
    var ret = [];
    for (var i in arr) {
        ret.push(Number(arr[i]));
    }
    return ret;
}

/**
 * Sends click event to d3 wheel element
 */
jQuery.fn.d3Click = function() {
    this.each(function(i, e) {
        var evt = new MouseEvent("click");
        e.dispatchEvent(evt);
    });
};

//DragNdrop
$(function() {
    $("#takenList").sortable({
        forcePlaceholderSize: true,
        receive: function(event, ui) {
            takenCourseList = strToInt($(this).sortable('toArray', { attribute: 'value' }));
            notTakenCourseList = strToInt($('#notTakenList').sortable('toArray', { attribute: 'value' }));
            var masterIndex = takenCourseList[ui.item.index()];

            prereqAlert = false; // allows for alert to notify of auto prereq moving
            $('#courseWheel' + masterIndex).d3Click(); // sends click to d3 wheel         
            checkAvailable();
        }
    });
    $("#notTakenList").sortable({
        receive: function(event, ui) {
            notTakenCourseList = strToInt($(this).sortable('toArray', { attribute: 'value' }));
            takenCourseList = strToInt($('#takenList').sortable('toArray', { attribute: 'value' }));
            var masterIndex = notTakenCourseList[ui.item.index()];
            $('#courseWheel' + masterIndex).d3Click(); // sends click to d3 wheel 
            checkAvailable();
        }
    });
    $("#takenList, #notTakenList").sortable({
        cancel: "li.fixed",
        items: "li:not('.fixed')",
        connectWith: ".legendTable",
        change: function(event, ui) {}
    });
    $(".legendTable").disableSelection();
});

/*
var customCSBChart = {
    packageNames: ['BUS001', 'MATH021', 'ECO001', 'CSE002', 'CSE001', 'ENGL001', 'MATH022', 'CSE017', 'ENGL002', 'ECO029', 'ACCT151', 'CSE241 or CSE341',
'CSE109', 'CSE202', 'CSE262', 'FIN125', 'ACCT152', 'CSE216', 'CSE303', 'CSE261', 'MATH231', 'ECO146', 'MKT111', 'SCM186', 'CSE252', 'MATH205', 
'CSB311', 'CSE340', 'LAW201', 'CSB312', 'CSB313', 'MGT301'],
    matrix: [
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //BUS001
        [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //MATH021
        [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ECO001
        [ 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE001
        [ 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE002
        [ 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ENGL001
        [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //MATH022
        [ 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE017
        [ 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ENGL002
        [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ECO029
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ACCT151
        [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSe or CSE341
        [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE109
        [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE202
        [ 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE262
        [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //FIN125
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ACCT152
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE216
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE303
        [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE261
        [ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //MATH231
        [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //ECO146
        [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //MKT111
        [ 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //SCM186
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], //CSE252
        [ 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //MATH205
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSB311
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //CSE340
        [ 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //LAW201
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0], //CSB312
        [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0], //CSB313
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0] //MGT301
    ]
};
*/