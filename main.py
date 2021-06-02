import csv 
import json
import random
def read_categories_json(categories_json_path):
    #read csv file
    with open(categories_json_path) as csvf: 
        reader = csv.reader(csvf)
        mydict = {rows[1]:rows[0] for rows in reader}
        return mydict

def read_csv_file(csv_file_path):
    json_array = []

    with open(csv_file_path) as csvf: 
        csv_reader = csv.DictReader(csvf) 
        for row in csv_reader: 
            json_array.append(row)

    return json_array

def dict_with_only_domains(input_dict, domains):
    return {key: input_dict[key] for key in domains if key in input_dict}

def write_json_to_file(json_dict, json_file_path):
    # write json
    with open(json_file_path, 'w') as jsonf: 
        json_string = json.dumps(json_dict, indent=4)
        jsonf.write(json_string)

def generate_random_follow_up_score(entry_level_score, domain):
    follow_up_object = {}
    if int(entry_level_score) > 7 or int(entry_level_score) < 3:
        if domain == "planning and organization" or domain == "reading" or domain == "writing" or domain == "math" or domain == "processing speed" or domain == "learning new things":
            follow_up_object["score"] = random.randrange(12)
            follow_up_object["max_severity"] = 2
            if follow_up_object["score"] < 5:
                follow_up_object["severity"] = 0
            elif follow_up_object["score"] <= 9:
                follow_up_object["severity"] = 1
            else: 
                follow_up_object["severity"] = 2
        if domain == "cooperativeness" or domain == "following rules" or domain == "risk taking":
            follow_up_object["score"] = random.randrange(10)
            follow_up_object["max_severity"] = 1
            if follow_up_object["score"] < 7:
                follow_up_object["severity"] = 0
            else :
                follow_up_object["severity"] = 1
    return follow_up_object


def entry_level_to_json(csv_file_path, categories_dict):
    json_array = read_csv_file(csv_file_path)
    json_final = {}
    json_final["students"] = []

    categories = set(categories_dict.values())
    domain_list = set(categories_dict.keys())
      
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
    
    #print(json.dumps(json_final, indent=4))

    # get student/date/domain
    for student in json_final["students"]:
        for date in student["dates"]:
            nested_data = []
            for item in date["nested_data"]:
                for key, value in item.items():
                    if key in domain_list:
                        domain_object = {}
                        domain_object["domain"] = key
                        domain_object["teacher_id"] = item["teacher_id"]
                        domain_object["entry-level-score"] = value
                        nested_data.append(dict(domain_object))
            date["nested_data"] = nested_data
    #print(json.dumps(json_final, indent=4))

    # aggregate domain scores by teacher
    for student in json_final["students"]:
        for date in student["dates"]:
            teacher_id_list = set([d['teacher_id'] for d in date["nested_data"]])
            date["domains"] = []
            for domain in domain_list:
                domain_object = {}
                domain_object["domain"] = domain
                domain_object["teachers"] = [{"teacher_id":teacher_id} for teacher_id in teacher_id_list]
                for item in date["nested_data"]:
                    if item["domain"] == domain:
                        # look for the corresponding teacher item in domains/teachers
                        for teacher in domain_object["teachers"]:
                            if teacher["teacher_id"] == item["teacher_id"]:
                                teacher["entry-level-score"] = item["entry-level-score"]
                                follow_up_object = generate_random_follow_up_score(item["entry-level-score"], domain)
                                if follow_up_object:
                                    teacher["follow-up-score"] = follow_up_object["score"]
                                    teacher["follow-up-severity"] = follow_up_object["severity"]
                                    teacher["follow-up-max-severity"] = follow_up_object["max_severity"]
                date["domains"].append(dict(domain_object))
            date.pop("nested_data", None)
    print(json.dumps(json_final, indent=4))

    return json_final      

entry_level_csv_file_path = r'entry-level.csv'
follow_up_csv_file_path = r'follow-up.csv'
json_file_path = r'output.json'
categories_json_path = r'categories.csv'
categories_dict = read_categories_json(categories_json_path)
entry_level_json = entry_level_to_json(entry_level_csv_file_path, categories_dict)
write_json_to_file(entry_level_json, json_file_path)
#print("categories")
#print(categories_dict)

