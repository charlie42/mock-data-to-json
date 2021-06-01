const util = require('util')
const obj = require('./output.json')
console.log(obj)

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

        console.log(util.inspect(date, false, null, true /* enable colors */))

        // date["domains"].forEach(domain => {
        //     console.log(domain)
            
        // })
        
    })
});
