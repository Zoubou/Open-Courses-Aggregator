from config import get_spark_session
from featureExtraction import build_features
from pyspark.ml.feature import BucketedRandomProjectionLSH
from pyspark.sql.functions import col, expr, collect_list, struct, row_number, explode
from pyspark.sql.window import Window
import time

# initialize spark and load data
spark, mongo_uri = get_spark_session("CourseSimilarity")
df = spark.read.format("mongodb").load()

# features extraction
full_df = build_features(df)

# lsh bucketing
lsh = BucketedRandomProjectionLSH(
    inputCol="normFeatures", 
    outputCol="hashes", 
    bucketLength=2.0, 
    numHashTables=3
)

lsh_df_fixed = full_df.select("_id", "title", "normFeatures").cache()
lsh_df_fixed.count()

lsh_model = lsh.fit(lsh_df_fixed)

# similarity join
candidates = lsh_model.approxSimilarityJoin(
    lsh_df_fixed,
    lsh_df_fixed,
    threshold=0.9,
    distCol="lsh_distance"
).filter(col("datasetA._id") < col("datasetB._id")) \
 .select(
     col("datasetA._id").alias("course_a_id"),
     col("datasetA.title").alias("course_a_title"),
     col("datasetB._id").alias("course_b_id"),
     col("datasetB.title").alias("course_b_title"),
     col("lsh_distance")
 )

# cosine sim
candidates = candidates.withColumn(
    "cosine_similarity",
    expr("1 - (pow(lsh_distance, 2) / 2)")
)

# keep top 8
window = Window.partitionBy("course_a_id").orderBy(col("cosine_similarity").desc())

topk = candidates \
    .filter(col("cosine_similarity") > 0.5) \
    .withColumn("rank", row_number().over(window)) \
    .filter(col("rank") <= 8)

# format results
result_df = topk.select(
    col("course_a_id").alias("course_id"),
    col("course_a_title").alias("course_title"),
    struct(
        col("course_b_id").alias("course_id"),
        col("course_b_title").alias("title"),
        col("cosine_similarity").alias("score")
    ).alias("similar_course")
).groupBy("course_id", "course_title") \
 .agg(collect_list(col("similar_course")).alias("similar_courses"))

 # καταγράφει την τρέχουσα ώρα
# Write to DB
result_df = result_df.cache()
result_df.count()

result_df = result_df.coalesce(4)
result_df.write.format("mongodb") \
    .option("spark.mongodb.write.connection.uri", mongo_uri + "/courses_aggregator.courses_similarities") \
    .mode("overwrite").save()

print("Similarity Job Finished!")
spark.stop()
