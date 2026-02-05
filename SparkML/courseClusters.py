from config import get_spark_session
from featureExtraction import build_features
from pyspark.ml.clustering import LDA
from pyspark.sql.functions import col, udf, posexplode
from pyspark.sql.types import IntegerType, ArrayType, StringType

# initialize spark and load data
spark, mongo_uri = get_spark_session("CourseClusteringJob")
df = spark.read.format("mongodb").load()
df_filtered = df.filter(col("language") == "english")

# feature extraction
full_df, cv_model = build_features(df_filtered)
vocab = cv_model.vocabulary
full_df.count()

# clustering logic
lda = LDA(
    k=20,
    maxIter=30,
    featuresCol="countFeatures",
    seed=42
)

lda_model = lda.fit(full_df)
clustered_df = lda_model.transform(full_df)

# assign dominant topic to each course
def dominant_topic(dist):
    return int(max(range(len(dist)), key=lambda i: dist[i]))

dominant_topic_udf = udf(dominant_topic, IntegerType())

course_topics = clustered_df.withColumn(
    "cluster_id",
    dominant_topic_udf(col("topicDistribution"))
)

# write clusters to DB
course_topics.select(
    col("_id").alias("course_id"),
    col("cluster_id")
).write.format("mongodb") \
 .option("spark.mongodb.write.connection.uri", mongo_uri + "/courses_aggregator.course_to_cluster") \
 .mode("overwrite").save()

# extract keywords for each topic
topics = lda_model.describeTopics(15)

def idx_to_word(indices):
    return [vocab[i] for i in indices if i < len(vocab)]

idx_to_word_udf = udf(idx_to_word, ArrayType(StringType()))

topic_keywords = topics.withColumn(
    "keywords",
    idx_to_word_udf(col("termIndices"))
)

keywords_expanded = topic_keywords.select(
    col("topic").alias("cluster_id"),
    posexplode(col("keywords")).alias("pos", "word")
).select(
    col("cluster_id"),
    col("word"),
    (col("pos") + 1).alias("rank")
)

keywords_expanded.write.format("mongodb") \
    .option("spark.mongodb.write.connection.uri", mongo_uri + "/courses_aggregator.cluster_keywords") \
    .mode("overwrite").save()

print("Clustering Job Finished!")
spark.stop()
