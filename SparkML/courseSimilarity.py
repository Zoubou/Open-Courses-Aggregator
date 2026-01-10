from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF, BucketedRandomProjectionLSH
from pyspark.ml import Pipeline
from pyspark.sql.functions import struct, collect_list, col, row_number
from pyspark.sql.window import Window

# spark session
spark = SparkSession.builder \
    .appName("CourseSimilarity") \
    .config("spark.mongodb.read.connection.uri", "mongodb://127.0.0.1:27017/courses_aggregator.courses") \
    .config("spark.mongodb.write.connection.uri", "mongodb://127.0.0.1:27017/courses_aggregator.courses_similarities") \
    .getOrCreate()

#load data
df = spark.read.format("mongodb").load()

# process and feature extraction of data
tokenizer = Tokenizer(inputCol="title", outputCol="words")
stopWordsRemover = StopWordsRemover(inputCol="words", outputCol="filtered")
hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=5000)
idf = IDF(inputCol="rawFeatures", outputCol="features")
brp = BucketedRandomProjectionLSH(inputCol="features", outputCol="hashes", bucketLength=2.0, numHashTables=3)

#pipeline build
pipeline = Pipeline(stages=[tokenizer, stopWordsRemover, hashingTF, idf, brp])
model = pipeline.fit(df)
transformed_df = model.transform(df)

# compute similarity
similarity = model.stages[-1].approxSimilarityJoin(
    transformed_df, transformed_df, 7.0, distCol="distance"
)

# remove self matches
similarity = similarity.filter((col("datasetA._id") != col("datasetB._id")) & (col("datasetA.title") != col("datasetB.title")))

# keep 10 most similar courses 
window = Window.partitionBy("datasetA._id").orderBy(col("distance").asc())
similarity_ranked = similarity.withColumn("rank", row_number().over(window)) \
                               .filter(col("rank") <= 10)

# append similar courses to list 
result_df = similarity_ranked.groupBy("datasetA._id", "datasetA.title") \
    .agg(
        collect_list(
            struct(
                col("datasetB._id").alias("similar_id"),
                col("datasetB.title").alias("similar_title"),
                col("distance")
            )
        ).alias("similar_courses")
    )

# store to db
result_df = result_df.withColumnRenamed("_id", "course_id").withColumnRenamed("title", "course_title")
result_df.write.format("mongodb").mode("overwrite").save()

print("Course similarity computation finished!")
