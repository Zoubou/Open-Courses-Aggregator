from config import get_spark_session
from featureExtraction import build_features
from pyspark.ml.clustering import BisectingKMeans
from pyspark.sql.functions import col, explode, row_number
from pyspark.sql.window import Window

# initialize spark and load data
spark, mongo_uri = get_spark_session("CourseClusteringJob")
df = spark.read.format("mongodb").load()
df = df.filter(col("language") == "english")
# feature extraction
full_df = build_features(df).cache()

# clustering logic
k = 12
bkm = BisectingKMeans(featuresCol="pcaFeatures", predictionCol="cluster_id", k=k, maxIter=20)
cluster_model = bkm.fit(full_df)
clustered_df = cluster_model.transform(full_df)

# write clusters to DB
clustered_df.select(col("_id").alias("course_id"), "cluster_id") \
    .write.format("mongodb") \
    .option("spark.mongodb.write.connection.uri", mongo_uri + ".course_to_cluster") \
    .mode("overwrite").save()

# extract keywords
cluster_words = clustered_df.select(col("_id").alias("course_id"), "cluster_id", explode("tokens").alias("word"))

word_counts = cluster_words.groupBy("cluster_id", "word").count()
window_keywords = Window.partitionBy("cluster_id").orderBy(col("count").desc())
top_words = word_counts.withColumn("rank", row_number().over(window_keywords)) \
    .filter(col("rank") <= 10)

# write keywords
top_words.write.format("mongodb") \
    .option("spark.mongodb.write.connection.uri", mongo_uri + ".cluster_keywords") \
    .mode("overwrite").save()

print("Clustering Job Finished!")
spark.stop()


