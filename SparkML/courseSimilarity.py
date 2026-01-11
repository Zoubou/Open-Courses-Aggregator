import pandas as pd
from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, concat_ws, lower, regexp_replace,
    row_number, collect_list, struct, pandas_udf,expr
)
from pyspark.sql.window import Window

from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    RegexTokenizer,
    CountVectorizer,
    IDF,
    Normalizer,
    BucketedRandomProjectionLSH,
    StopWordsRemover
)

# spark session
spark = SparkSession.builder \
    .appName("CourseSimilarity") \
    .config("spark.mongodb.read.connection.uri", "mongodb://127.0.0.1:27017/courses_aggregator.courses") \
    .config("spark.mongodb.write.connection.uri", "mongodb://127.0.0.1:27017/courses_aggregator.courses_similarities") \
    .getOrCreate()

#load data
df = spark.read.format("mongodb").load()

df = df.withColumn(
    "text",
    concat_ws(" ",
        col("title"), col("title"), col("title"),     # weight title
        col("keywords"), col("keywords"),             # weight keywords
        col("level"),
        col("description")
    )
)
#format text
df = df.withColumn("text", lower(col("text")))
df = df.withColumn("text", regexp_replace(col("text"), "[^\\p{L}\\p{Nd}\\s]", " "))

# process and feature extraction of data
# tokenization
tokenizer = RegexTokenizer(
    inputCol="text",
    outputCol="raw_tokens",
    pattern="\\s+"
)

# stop words removal
languages = ["english", "spanish", "french", "german", "portuguese","italian","russian"]
all_stop_words = []
for lang in languages:
    all_stop_words += StopWordsRemover.loadDefaultStopWords(lang)
all_stop_words += ["course", "introduction", "online", "tutorial", "video"]
remover = StopWordsRemover(
    inputCol="raw_tokens", 
    outputCol="tokens", 
    stopWords=all_stop_words  
)

# TF-IDF
cv = CountVectorizer(
    inputCol="tokens",
    outputCol="rawFeatures",
    vocabSize=5000,
    minDF=5
)
idf = IDF(
    inputCol="rawFeatures", 
    outputCol="features"
)

# normalization
normalizer = Normalizer(
    inputCol="features",
    outputCol="normFeatures",
    p=2.0
)

#pipeline build
pipeline = Pipeline(stages=[tokenizer,remover, cv, idf, normalizer])
model = pipeline.fit(df)

tfidf_df = model.transform(df).select("_id", "title", "normFeatures")

lsh = BucketedRandomProjectionLSH(
    inputCol="normFeatures",
    outputCol="hashes",
    bucketLength=2.0,
    numHashTables=4
)

lsh_model = lsh.fit(tfidf_df)
lsh_df = lsh_model.transform(tfidf_df)

candidates = lsh_model.approxSimilarityJoin(
    lsh_df,
    lsh_df,
    threshold=1.2,
    distCol="lsh_distance"
).filter(col("datasetA._id") != col("datasetB._id"))

candidates = candidates.withColumn(
    "cosine_similarity", 
    expr("1 - (pow(lsh_distance, 2) / 2)")
)


# keep 10 most similar courses 
window = Window.partitionBy("datasetA._id").orderBy(col("cosine_similarity").desc())

topk = candidates.withColumn("rank", row_number().over(window)) \
                 .filter(col("rank") <= 10)

# append similar courses to list 
result_df = topk.groupBy("datasetA._id", "datasetA.title") \
    .agg(
        collect_list(
            struct(
                col("datasetB._id").alias("similar_id"),
                col("datasetB.title").alias("similar_title"),
                col("cosine_similarity")
            )
        ).alias("similar_courses")
    )


# store to db
result_df = result_df \
    .withColumnRenamed("_id", "course_id") \
    .withColumnRenamed("title", "course_title")
result_df.write.format("mongodb").mode("overwrite").save()

print("Course similarity computation finished!")
