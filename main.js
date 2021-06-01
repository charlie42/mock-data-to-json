// npm i -s csv-parser

const util = require('util')
const csv = require('csv-parser');
const fs = require('fs');
let obj = require('./output.json')

function groupByTeacher(obj) {
    obj["students"].forEach(student => {
    student["dates"].forEach(date => {
        date = Object.values(
            date["domains"].reduce((a, v) => {
                if (!a[v.domain]) {
                    a[v.domain] = {
                        domain_name: v.domain,
                        entry_level_scores: [],
                        teachers: v.teachers
                    }
                }
                Object.entries(v.teachers).forEach(([key, value]) => {
                    if (!a[v.domain].entry_level_scores) {
                        a[v.domain].entry_level_scores = []
                    }
                    a[v.domain].entry_level_scores.push(value["entry-level-score"])
                })
                return a
            }, {})
        )        
        })
    });
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

obj = groupByTeacher(obj)
//console.log(util.inspect(obj, false, null, true /* enable colors */))

categoriesFilePath = "categories.csv"
let categoryDictList = []
fs.createReadStream(categoriesFilePath)
    .pipe(csv())
    .on('data', (r) => {
        categoryDictList.push(r);        
    })
    .on('end', () => {
        //console.log("categoryDict", categoryDictList)
        obj = groupByCategory(obj, categoryDictList)
        console.log(util.inspect(obj, false, null, true /* enable colors */))

    });


