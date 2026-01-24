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
            col("language"),
            col("description")
        )
    )

    # text cleaning
    df_processed = df_processed.withColumn(
        "text", 
        regexp_replace(lower(col("text")), "[^\\p{L}\\p{Nd}\\s]", " ")
    )
    df = df.filter(col("description").isNotNull() & (col("description") != "") & (col("description") != "nan"))
    # tokenization
    tokenizer = RegexTokenizer(inputCol="text", outputCol="raw_tokens", pattern="\\s+")
    specific_stop_words = [
    
    # 1. Γενικές λέξεις μαθημάτων (Course Jargon)
    "course", "courses", "introduction", "intro", "advanced", "beginner", "intermediate",
    "fundamental", "fundamentals", "basics", "basic", "overview", "complete", "comprehensive",
    "tutorial", "guide", "syllabus", "module", "modules", "lesson", "lessons",
    "lecture", "lectures", "video", "videos", "content", "capstone", "specialization",
    "certificate", "certification", "degree", "program", "class", "classes",
    
    # 2. Ρήματα μάθησης & "Call to Action"
    "learn", "learning", "teach", "teaching", "taught", "student", "students",
    "instructor", "instructors", "understand", "understanding", "explore", "exploring",
    "build", "building", "create", "creating", "develop", "developing",
    "use", "using", "uses", "used", "master", "mastering", "apply", "applying",
    "practical", "hands-on", "real-world", "step-by-step", "best", "practices",
    
    # 3. Λέξεις "σκουπίδια" από tokenization & data quality (που είδαμε στο JSON σου)
    "nan", "null", "none", "undefined", "description", "title", "keywords", "id",
    "copyright", "rights", "reserved", "author", "published", "updated",
    "ll", "ve", "re", "don", "won", "t", "s", "m", "d", # Συστολές (we'll, we've)
    
    
    "curso", "módulo", "para", "como", "cómo", "datos", "dados", "neste", 
    "una", "uma", "con", "com", "del", "do", "da", "em", "en", "el", "la"
]
    # stopwords setup
    languages = ["english", "spanish", "french", "german", "portuguese", "italian", "russian"]
    all_stop_words = []
    for lang in languages:
        try:
            all_stop_words += StopWordsRemover.loadDefaultStopWords(lang)
        except: pass
    all_stop_words +=specific_stop_words
    all_stop_words += ["course", "introduction", "online", "tutorial", "video", "free", "learn","data","using"]
    
    remover = StopWordsRemover(inputCol="raw_tokens", outputCol="tokens", stopWords=all_stop_words)
    
    #tf-idf setup
    cv = CountVectorizer(inputCol="tokens", outputCol="rawFeatures", vocabSize=2000, minDF=5.0, maxDF=0.7)
    idf = IDF(inputCol="rawFeatures", outputCol="features")
    normalizer = Normalizer(inputCol="features", outputCol="normFeatures", p=2.0)
    pca = PCA(k=100, inputCol="normFeatures", outputCol="pcaFeatures")

    # pipeline build
    pipeline = Pipeline(stages=[tokenizer, remover, cv, idf, normalizer, pca])
    model = pipeline.fit(df_processed)
    full_df = model.transform(df_processed).select("_id", "title", "normFeatures", "tokens", "pcaFeatures")
    
    return full_df