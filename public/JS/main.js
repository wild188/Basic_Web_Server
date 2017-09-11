

/**
 * Compares two course abbreviations in the forms ABC###
 * @param {String} abbr1 - Abbreviation of course 1
 * @param {String} abbr2 - Abbreviation of course 2
 */
function compareAbbrs(abbr1, abbr2){
    var num1 = Number(abbr1.match(/\d+/)[0]);
    var num2 = Number(abbr2.match(/\d+/)[0]);
    //compares number
    if(num1 != num2){
        return num1 - num2;
    }
    /*
    var text1 = abbr1.replace(/[0-9]/g, '');
    var text2 = abbr2.replace(/[0-9]/g, '');
    if(text1.localeCompare(text2) != 0){
        return text1.localeCompare(text2)
    }
    */
    //then whole string
    return abbr1.localeCompare(abbr2);
}

/**
 * Insertion sort on list by abbreviation
 * @param {Object} list - list of courses to be sorted
 * @return {Object} - sorted list of courses
 */
function sortCourseList(list){
    list = list || courseList;
    var j;
    for(var i in list){
        var min = i;
        for(j = i; j < list.length; j++){
            if(compareAbbrs(list[j].schoolCourseID, list[min].schoolCourseID) < 0){
                min = j;
            }
        }
        //swap
        var temp = list[i]
        list[i] = list[min];
        list[min] = temp;
    }
    return list;
}