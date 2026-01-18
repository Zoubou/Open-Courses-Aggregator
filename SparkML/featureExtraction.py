from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    RegexTokenizer, CountVectorizer, IDF,
    Normalizer, StopWordsRemover, PCA
)
from pyspark.sql.functions import col, concat_ws, lower, regexp_replace

def build_features(df):
    #weight data 
    df_processed = df.withColumn(
        "text",
        concat_ws(" ",
            col("title"), col("title"), col("title"),     # title x3 weight
            col("keywords"), col("keywords"),             # keywords x2 weight
            col("level"),
            col("description")
        )
    )

    # text cleaning
    df_processed = df_processed.withColumn(
        "text", 
        regexp_replace(lower(col("text")), "[^\\p{L}\\p{Nd}\\s]", " ")
    )

    # tokenization
    tokenizer = RegexTokenizer(inputCol="text", outputCol="raw_tokens", pattern="\\s+")

    # stopwords setup
    languages = ["english", "spanish", "french", "german", "portuguese", "italian", "russian"]
    all_stop_words = []
    for lang in languages:
        try:
            all_stop_words += StopWordsRemover.loadDefaultStopWords(lang)
        except: pass
    all_stop_words += ["course", "introduction", "online", "tutorial", "video", "free", "learn"]
    
    remover = StopWordsRemover(inputCol="raw_tokens", outputCol="tokens", stopWords=all_stop_words)
    
    #tf-idf setup
    cv = CountVectorizer(inputCol="tokens", outputCol="rawFeatures", vocabSize=2000, minDF=2)
    idf = IDF(inputCol="rawFeatures", outputCol="features")
    normalizer = Normalizer(inputCol="features", outputCol="normFeatures", p=2.0)
    pca = PCA(k=100, inputCol="normFeatures", outputCol="pcaFeatures")

    # pipeline build
    pipeline = Pipeline(stages=[tokenizer, remover, cv, idf, normalizer, pca])
    model = pipeline.fit(df_processed)
    full_df = model.transform(df_processed).select("_id", "title", "normFeatures", "tokens", "pcaFeatures")
    
    return full_df