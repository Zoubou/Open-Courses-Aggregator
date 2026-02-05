
import logging
import unittest
from pyspark.sql import SparkSession
from pyspark.ml.clustering import LDA
import os, sys
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from SparkML.featureExtraction import build_features

class TestClusteringPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.spark = SparkSession.builder \
            .master("local[2]") \
            .appName("ClusteringIntegrationTest") \
            .getOrCreate()
        logging.basicConfig(level=logging.INFO)
        cls.log = logging.getLogger("test_clustering")

    @classmethod
    def tearDownClass(cls):
        cls.spark.stop()

    def test_clustering_end_to_end(self):
        data = [
            ("1", "Cooking with Apples", "food recipes", "How to cook apple pie", "beginner", "english"),
            ("2", "Banana Bread Recipe", "food baking", "Baking banana bread", "beginner", "english"),
            ("3", "Java Programming", "code software", "Learn Java coding", "advanced", "english"),
            ("4", "Python Development", "code software", "Intro to Python dev", "advanced", "english")
        ]
        
        raw_df = self.spark.createDataFrame(data, ["_id", "title", "keywords", "description", "level", "language"])

        features_df, _ = build_features(raw_df, minDF=1) 
        
        
        lda = LDA(k=2, maxIter=20, featuresCol="countFeatures", seed=42)
        model = lda.fit(features_df)
        transformed = model.transform(features_df)
        
        
        results = transformed.select("_id", "topicDistribution").collect()

        topic_map = {row._id: int(row.topicDistribution.argmax()) for row in results}

        self.__class__.log.info("Predicted topics: %s", json.dumps(topic_map, sort_keys=True))

        self.assertEqual(topic_map["1"], topic_map["2"], "Cooking courses should be in the same cluster")

        self.assertEqual(topic_map["3"], topic_map["4"], "Programming courses should be in the same cluster")

        self.assertNotEqual(topic_map["1"], topic_map["3"], "Cooking and programming should be in different clusters")