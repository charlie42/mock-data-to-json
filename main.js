// npm i -s csv-parser

const util = require('util')
const csv = require('csv-parser');
const fs = require('fs');

function groupByTeacher(obj) {

    obj.students.forEach(student => {
        let studentDateResult = student["dates"].map(date => {
            dateResult = date

            //calculate color intensities scaled follow-up scores and for each teacher
            dateResult.domains.forEach(domain => {
                domain.teachers.forEach(teacher => {
                    teacher.color_intensity_entry_level = calculateColorIntensity(teacher.entry_level_score, MAX_SCALE_VALUE) 
                    if (teacher.follow_up_score) {
                        teacher.scaled_follow_up_score = calculateScaledScore(teacher.follow_up_score, teacher.follow_up_max_score, MAX_SCALE_VALUE)
                        teacher.color_intensity_follow_up = calculateColorIntensity(teacher.follow_up_severity, teacher.follow_up_max_severity)
                    }
                })
            })

            //add every teacher entry and follow-up scores and color intensities to an array
            dateResult.domains = Object.values(
                date.domains.reduce((a, v) => {
                    if (!a[v.domain]) {
                        a[v.domain] = {
                            domain: v.domain,
                            entry_level_scores: [],
                            scaled_follow_up_scores: [],
                            color_intensities_follow_up: [],
                            teachers: v.teachers
                        }
                    }
                    Object.entries(v.teachers).forEach(([key, value]) => {
                        if (!a[v.domain].entry_level_scores) {
                            a[v.domain].entry_level_scores = []
                        }
                        a[v.domain].entry_level_scores.push(parseFloat(value.entry_level_score))
                    }
                    )
                    Object.entries(v.teachers).forEach(([key, value]) => {
                        if (!a[v.domain].color_intensities_follow_up) {
                            a[v.domain].color_intensities_follow_up = []
                        }
                        if ("color_intensity_follow_up" in value) {
                            a[v.domain].color_intensities_follow_up.push(parseFloat(value.color_intensity_follow_up))
                        }
                    }
                    )
                    Object.entries(v.teachers).forEach(([key, value]) => {
                        if (!a[v.domain].scaled_follow_up_scores) {
                            a[v.domain].scaled_follow_up_scores = []
                        }
                        if ("scaled_follow_up_score" in value) {
                            a[v.domain].scaled_follow_up_scores.push(parseFloat(value.scaled_follow_up_score))
                        }
                    }
                    )
                    return a
                }, {})
            )

            //get avg min and max scores from the array
            dateResult.domains.forEach(domain => {
                domain.avg_entry_level_score = getAvgOfArray(domain.entry_level_scores)
                domain.min_entry_level_score = Math.min(...domain.entry_level_scores)
                domain.max_entry_level_score = Math.max(...domain.entry_level_scores)
                domain.color_intensity_entry_level = calculateColorIntensity(domain.avg_entry_level_score, MAX_SCALE_VALUE)
                if (domain.scaled_follow_up_scores.length != 0) {
                    domain.avg_scaled_follow_up_score = getAvgOfArray(domain.scaled_follow_up_scores)
                    domain.min_scaled_follow_up_score = Math.min(...domain.scaled_follow_up_scores)
                    domain.max_scaled_follow_up_score = Math.max(...domain.scaled_follow_up_scores)
                    domain.avg_color_intensity_follow_up = getAvgOfArray(domain.color_intensities_follow_up)
                }
            })

            return dateResult  
        })
        student.dates = studentDateResult
        // console.log(util.inspect(student, false, null, true /* enable colors */))  
        //console.log(util.inspect(studentDateResult, false, null, true /* enable colors */))  
    });
    
    //console.log(util.inspect(obj, false, null, true /* enable colors */))  
    return obj
}

function groupByCategory(obj, categoryDictList) {
    obj.students.forEach(student => {
        student.dates.forEach(date => {
            date.categories = []
            categorySet = new Set(getValuesFromDictList(categoryDictList))
            categorySet.forEach(category => {
                domainsInCategory = getDomainsForCategory(category, categoryDictList)
                domainObjectsInCategory = []
                date.domains.forEach(domain => {
                    if (domainsInCategory.includes(domain.domain)) {
                        domainObjectsInCategory.push(domain)
                    }
                })
                date.categories.push({
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
                            scaled_follow_up_scores: [],
                            color_intensities_follow_up: [],
                            domains: v.domains
                        }
                    }
                    Object.entries(v.domains).forEach(([key, value]) => {
                        if (!a[v.category].entry_level_scores) {
                            a[v.category].entry_level_scores = []
                        }
                        a[v.category].entry_level_scores.push(parseFloat(value.avg_entry_level_score))
                    })
                    Object.entries(v.domains).forEach(([key, value]) => {
                        if (!a[v.category].color_intensities_follow_up) {
                            a[v.category].color_intensities_follow_up = []
                        }
                        if ("avg_color_intensity_follow_up" in value) {
                            a[v.category].color_intensities_follow_up.push(parseFloat(value.avg_color_intensity_follow_up))
                        }
                    })
                    Object.entries(v.domains).forEach(([key, value]) => {
                        if (!a[v.category].scaled_follow_up_scores) {
                            a[v.category].scaled_follow_up_scores = []
                        }
                        if ("avg_scaled_follow_up_score" in value) {
                            a[v.category].scaled_follow_up_scores.push(parseFloat(value.avg_scaled_follow_up_score))
                        }
                    })
                    return a
                }, {})
            )

            //get avg min and max scores from the array
            dateResult.categories.forEach(category => {
                category.avg_entry_level_score = getAvgOfArray(category.entry_level_scores)
                category.min_entry_level_score = Math.min(...category.entry_level_scores)
                category.max_entry_level_score = Math.max(...category.entry_level_scores)
                category.color_intensity_entry_level = calculateColorIntensity(category.avg_entry_level_score, MAX_SCALE_VALUE)
                if (category.scaled_follow_up_scores.length != 0) {
                    category.avg_scaled_follow_up_score = getAvgOfArray(category.scaled_follow_up_scores)
                    category.min_scaled_follow_up_score = Math.min(...category.scaled_follow_up_scores)
                    category.max_scaled_follow_up_score = Math.max(...category.scaled_follow_up_scores)
                    category.avg_color_intensity_follow_up = getAvgOfArray(category.color_intensities_follow_up)
                }
            })

            return dateResult  
        })
        student.dates = studentDateResult
    })
    console.log(util.inspect(obj, false, null, true /* enable colors */))
    return obj
}

function calculateScaledScore(score, maxScore, maxScaleValue) {
    console.log(score)
    console.log(maxScore)
    console.log(maxScaleValue)
    console.log(score * maxScaleValue / maxScore)
    return score * maxScaleValue / maxScore
}

function calculateColorIntensity(value, maxValue) {
    return value / maxValue
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

const MAX_SCALE_VALUE = 10

let obj = require('./output.json')



categoriesFilePath = "categories.csv"
outputFilePath = "aggregated.json"

let categoryDictList = []
fs.createReadStream(categoriesFilePath)
    .pipe(csv())
    .on('data', (r) => {
        categoryDictList.push(r);        
    })
    .on('end', () => {

        //console.log(util.inspect(obj, false, null, true /* enable colors */))
        obj = groupByTeacher(obj)
        //console.log(util.inspect(obj, false, null, true /* enable colors */))

        //console.log("categoryDict", categoryDictList)
        obj = groupByCategory(obj, categoryDictList)
        

        obj = aggregateScoredByCategory(obj)
        //console.log(util.inspect(obj, false, null, true /* enable colors */))

        writeToFile(obj, outputFilePath)

    });


