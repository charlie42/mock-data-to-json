// npm i -s csv-parser

const util = require('util')
const csv = require('csv-parser');
const fs = require('fs');

function groupByTeacher(obj) {

    obj["students"].forEach(student => {
        let studentDateResult = student["dates"].map(date => {
            dateResult = date

            //add every teacher entry level score to an array
            dateResult["domains"] = Object.values(
                date["domains"].reduce((a, v) => {
                    if (!a[v.domain]) {
                        a[v.domain] = {
                            domain: v.domain,
                            entry_level_scores: [],
                            teachers: v.teachers
                        }
                    }
                    Object.entries(v.teachers).forEach(([key, value]) => {
                        if (!a[v.domain].entry_level_scores) {
                            a[v.domain].entry_level_scores = []
                        }
                        a[v.domain].entry_level_scores.push(parseFloat(value["entry-level-score"]))
                    })
                    return a
                }, {})
            )

            //get avg min and max scores from the array
            dateResult["domains"].forEach(domain => {
                domain.avg_entry_level_score = getAvgOfArray(domain.entry_level_scores)
                domain.min_entry_level_score = Math.min(...domain.entry_level_scores)
                domain.max_entry_level_score = Math.max(...domain.entry_level_scores)
            })

            return dateResult  
        })
        student["dates"] = studentDateResult
        // console.log(util.inspect(student, false, null, true /* enable colors */))  
        //console.log(util.inspect(studentDateResult, false, null, true /* enable colors */))  
    });
    
    //console.log(util.inspect(obj, false, null, true /* enable colors */))  
    return obj
}

function groupByCategory(obj, categoryDictList) {
    obj["students"].forEach(student => {
        student["dates"].forEach(date => {
            date["categories"] = []
            categorySet = new Set(getValuesFromDictList(categoryDictList))
            categorySet.forEach(category => {
                domainsInCategory = getDomainsForCategory(category, categoryDictList)
                domainObjectsInCategory = []
                date["domains"].forEach(domain => {
                    if (domainsInCategory.includes(domain.domain)) {
                        domainObjectsInCategory.push(domain)
                    }
                })
                date["categories"].push({
                    category: category,
                    domains: domainObjectsInCategory
                })
            })
            delete date.domains;
        })
    })
    return obj
}

function aggregateScoredByCategory(obj) {
    obj.students.forEach(student => {
        let studentDateResult = student.dates.map(date => {
            dateResult = date

            //add every teacher entry level score to an array
            dateResult.categories = Object.values(
                date.categories.reduce((a, v) => {
                    if (!a[v.category]) {
                        a[v.category] = {
                            category: v.category,
                            entry_level_scores: [],
                            domains: v.domains
                        }
                    }
                    Object.entries(v.domains).forEach(([key, value]) => {
                        if (!a[v.category].entry_level_scores) {
                            a[v.category].entry_level_scores = []
                        }
                        a[v.category].entry_level_scores.push(parseFloat(value.avg_entry_level_score))
                    })
                    return a
                }, {})
            )

            //get avg min and max scores from the array
            dateResult.categories.forEach(category => {
                category.avg_entry_level_score = getAvgOfArray(category.entry_level_scores)
                category.min_entry_level_score = Math.min(...category.entry_level_scores)
                category.max_entry_level_score = Math.max(...category.entry_level_scores)
            })

            return dateResult  
        })
        student.dates = studentDateResult
    })
    return obj
}

function writeToFile(obj, outputFilePath) {
    var json = JSON.stringify(obj, null, 2);
    fs.writeFileSync(outputFilePath, json, 'utf8');
}


function getValuesFromDictList(categoryDictList) {
    return categoryDictList.map(function(obj) {
        return obj.category;
    });
}

function getDomainsForCategory(category, categoryDictList) {
    domains = []
    categoryDictList.map(function(obj) {
        if (obj.category == category) {
            domains.push(obj.domain);
        }
    });
    return domains
}

function getAvgOfArray(arr) {
    return arr.reduce((a,b) => parseFloat(a) + parseFloat(b), 0) / arr.length
}

let obj = require('./output.json')

//console.log(util.inspect(obj, false, null, true /* enable colors */))
obj = groupByTeacher(obj)
//console.log(util.inspect(obj, false, null, true /* enable colors */))


categoriesFilePath = "categories.csv"
outputFilePath = "aggregated.json"

let categoryDictList = []
fs.createReadStream(categoriesFilePath)
    .pipe(csv())
    .on('data', (r) => {
        categoryDictList.push(r);        
    })
    .on('end', () => {
        //console.log("categoryDict", categoryDictList)
        obj = groupByCategory(obj, categoryDictList)
        

        obj = aggregateScoredByCategory(obj)
        console.log(util.inspect(obj, false, null, true /* enable colors */))

        writeToFile(obj, outputFilePath)

    });


