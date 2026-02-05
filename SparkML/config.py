import os
from dotenv import load_dotenv, find_dotenv
from pyspark.sql import SparkSession

def get_spark_session(app_name):
    load_dotenv(find_dotenv())
    mongo_uri = os.getenv("MONGO_URI")
    print("MONGO_URI from .env:", mongo_uri)

    if not mongo_uri:
        print("WARNING: .env file not found or MONGO_URI is empty. Using localhost default.")
        mongo_uri = "mongodb://localhost:27017"

    print(f"Initializing Spark for {app_name} with MongoDB: {mongo_uri}")

    spark = SparkSession.builder \
        .appName(app_name) \
        .config("spark.jars.packages", "org.mongodb.spark:mongo-spark-connector_2.13:10.5.0") \
        .config("spark.mongodb.read.connection.uri", mongo_uri + "/courses_aggregator.courses") \
        .config("spark.mongodb.write.connection.uri", mongo_uri + "/courses_aggregator.output") \
        .config("spark.driver.memory", "3g") \
        .config("spark.executor.memory", "3g") \
        .config("spark.sql.shuffle.partitions", "8") \
        .config("spark.default.parallelism", "8") \
        .config("spark.shuffle.spill.compress", "true") \
        .config("spark.shuffle.compress", "true") \
        .getOrCreate()
            
    return spark, mongo_uri