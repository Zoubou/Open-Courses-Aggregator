import logging
import unittest
from pyspark.sql import SparkSession
from pyspark.ml.feature import BucketedRandomProjectionLSH
from pyspark.sql.functions import col, expr
from SparkML.featureExtraction import build_features

class TestSimilarityPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.spark = SparkSession.builder \
            .master("local[2]") \
            .appName("SimilarityIntegrationTest") \
            .getOrCreate()
        logging.basicConfig(level=logging.INFO)
        cls.log = logging.getLogger("test_similarity")

    @classmethod
    def tearDownClass(cls):
        cls.spark.stop()

    def test_similarity_end_to_end(self):
        data = [
            ("A", "Complete Python Course", "python coding", "Learn python from scratch", "all", "english"),
            ("B", "Ultimate Python Guide", "python coding", "Learning python from scratch", "all", "english"),
            ("C", "Ancient Greek History", "history greece", "Study about ancient Athens", "all", "english")
        ]
        
        raw_df = self.spark.createDataFrame(data, ["_id", "title", "keywords", "description", "level", "language"])

        features_df, _ = build_features(raw_df, minDF=1)
        
        lsh = BucketedRandomProjectionLSH(
            inputCol="normFeatures", 
            outputCol="hashes", 
            bucketLength=2.0, 
            numHashTables=3
        )
        lsh_model = lsh.fit(features_df)
        
        candidates = lsh_model.approxSimilarityJoin(
            features_df, features_df, threshold=100, distCol="lsh_distance"
        )
        
        candidates = candidates.withColumn(
            "cosine_similarity", 
            expr("1 - (pow(lsh_distance, 2) / 2)")
        )

        row_ab = candidates.filter((col("datasetA._id") == "A") & (col("datasetB._id") == "B")).first()
        similarity_ab = row_ab["cosine_similarity"] if row_ab else 0.0

        row_ac = candidates.filter((col("datasetA._id") == "A") & (col("datasetB._id") == "C")).first()
        similarity_ac = row_ac["cosine_similarity"] if row_ac else 0.0
        
        self.__class__.log.info("Similarity A-B (Python-Python): %s", similarity_ab)
        self.__class__.log.info("Similarity A-C (Python-History): %s", similarity_ac)

        self.assertGreater(similarity_ab, 0.6, "Similar Python courses should have a high similarity score")

        self.assertLess(similarity_ac, 0.3, "Python and History should not be similar")