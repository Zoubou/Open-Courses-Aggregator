#print from db for verification
from pymongo import MongoClient

mongo_uri = "mongodb://127.0.0.1:27017/courses_aggregator"
client = MongoClient(mongo_uri)
db = client.courses_aggregator
print("Course Similarities:")
for doc in db.courses_similarities.find().limit(5):
    print(doc)

print("Course to Cluster Assignments:")
for doc in db.course_to_cluster.find().limit(5):
    print(doc)

print("Cluster Keywords:")
for doc in db.cluster_keywords.find().limit(5):
    print(doc)