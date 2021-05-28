import csv 
import json 

def read_categories_json(categories_json_path):
    #read csv file
    with open(categories_json_path) as csvf: 
        reader = csv.reader(csvf)
        mydict = {rows[1]:rows[0] for rows in reader}
        return mydict

def dict_with_only_domains(input_dict, domains):
    return {key: input_dict[key] for key in domains if key in input_dict}

def csv_to_json(csvFilePath, json_file_path, categories_dict):
    json_array = []
    json_final = {}
    json_final["students"] = []

    categories = set(categories_dict.values())
    domains = set(categories_dict.keys())
      
    # read csv file
    with open(csv_file_path) as csvf: 
        csv_reader = csv.DictReader(csvf) 
        for row in csv_reader: 
            json_array.append(row)
      
    # merge by student id
    student_ids = set([d['learner_id'] for d in json_array])
    for student_id in student_ids:
        student_object = {}
        student_object["student_id"] = student_id
        nested_data = []
        for item in json_array:
            if item['learner_id'] == student_id:
                nested_data.append(dict(item))
        student_object["nested_data"] = nested_data 
        #print(student_object)
        json_final["students"].append(dict(student_object))

    # merge by student/date
    for student in json_final["students"]:
        dates = set([d['activity_end_time'] for d in student["nested_data"]])
        student["dates"] = []
        for date in dates:
            date_object = {}
            date_object["date"] = date
            nested_data = []
            for item in student["nested_data"]:
                if item["activity_end_time"] == date:
                    nested_data.append(dict(item))
            date_object["nested_data"] = nested_data
            student["dates"].append(dict(date_object))
        student.pop("nested_data", None)

    # merge by student/date/teacher
    for student in json_final["students"]:
        for date in student["dates"]:
            teachers = set([d['teacher_id'] for d in date["nested_data"]])
            date["teachers"] = []
            for teacher in teachers:
                teacher_object = {}
                teacher_object["teacher_id"] = teacher
                nested_data = {}
                for item in date["nested_data"]:
                    if item["teacher_id"] == teacher:
                        nested_data = item
                teacher_object["nested_data"] = nested_data
                date["teachers"].append(dict(teacher_object))
            date.pop("nested_data", None)
    
    # get domain scores  
    for student in json_final["students"]:
        for date in student["dates"]:  
            for teacher in date["teachers"]:
                teacher["domains"] = []
                # remove teacher id etc from nested data, only leave domains
                teacher["nested_data"] = dict_with_only_domains(teacher["nested_data"], domains)
                for domain in domains:
                    domain_object = {}
                    domain_object["domain"] = domain
                    for key, value in teacher["nested_data"].items():
                        if key == domain:
                            domain_object["entry-level-score"] = value
                    teacher["domains"].append(dict(domain_object))
                teacher.pop("nested_data", None)
    print(json.dumps(json_final, indent=4))
            
    # write json
    with open(json_file_path, 'w') as jsonf: 
        json_string = json.dumps(json_array, indent=4)
        jsonf.write(json_string)

    #print(json.dumps(json_final, indent=4))
          
csv_file_path = r'entry-level.csv'
json_file_path = r'output.json'
categories_json_path = r'categories.csv'
categories_dict = read_categories_json(categories_json_path)
csv_to_json(csv_file_path, json_file_path, categories_dict)
#print("categories")
#print(categories_dict)

