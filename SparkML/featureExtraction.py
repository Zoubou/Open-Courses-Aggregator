from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    RegexTokenizer, CountVectorizer, IDF,
    Normalizer, StopWordsRemover
)
from pyspark.sql.functions import col, concat_ws,when,lower, regexp_replace, lit

def build_features(df, minDF=5, maxDF=0.7, vocabSize=20000):
    #weight data 
    df_processed = df.withColumn(
    "description",
    when(col("description").isNull() | (col("description") == "nan") | (~col("description").cast("string").isNotNull()), lit(""))
    .otherwise(col("description").cast("string"))
    ).withColumn(
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
        regexp_replace(lower(col("text")), "[^\\p{L}\\s]", " ")
    )

   

    # tokenization
    tokenizer = RegexTokenizer(inputCol="text", outputCol="raw_tokens", pattern="\\s+")

    specific_stop_words = [
        
        # 1. Γενικές λέξεις μαθημάτων (Course Jargon)
        "course", "courses", "introduction", "intro", "advanced", "beginner", "intermediate",
        "fundamental", "fundamentals", "basics", "basic", "overview", "complete", "comprehensive",
        "tutorial", "guide", "syllabus", "module", "modules", "lesson", "lessons",
        "lecture", "lectures", "video", "videos", "content", "capstone", "specialization",
        "certificate", "certification", "degree", "program", "class", "classes",
        "bootcamp", "masterclass", "series", "seminar", "workshop", "curriculum",
        
        # 2. Ρήματα μάθησης & "Call to Action"
        "learn", "learning", "teach", "teaching", "taught", "student", "students",
        "instructor", "instructors", "understand", "understanding", "explore", "exploring",
        "build", "building", "create", "creating", "develop", "developing",
        "use", "using", "uses", "used", "master", "mastering", "apply", "applying",
        "practical", "hands-on", "real-world", "step-by-step", "best", "practices",
        "designing", "working", "writing", "concepts", "principles", "theory",
        "topics", "topic", "context", "issues", "perspective", "perspectives",
        
        # 3. Διοικητικοί Όροι & Πανεπιστημιακή Ορολογία
        "prerequisite", "prerequisites", "requisite", "req", 
        "credit", "credits", "unit", "units", "u",            
        "grading", "graded", "grade", "grades",
        "approved", "approval", "requirement", "requirements",
        "repeated", "repeat", "completion", "completed",
        "thesis", "dissertation", "independent", "study",     # "study" ήταν στο Cluster 9
        "graduate", "undergraduate", "grad", "undergrad",
        "major", "minor", "department", "dept",
        "hours", "hour", "hr", "hrs",
        "week", "weeks", "wk", "wks",
        "semester", "term", "year", "annual", "spring", "fall", "summer", "winter",
        "may", "can", "will", "must",
        
        # 4. Λέξεις "σκουπίδια" από tokenization & HTML
        "nan", "null", "none", "undefined", "description", "title", "keywords", "id",
        "copyright", "rights", "reserved", "author", "published", "updated",
        "ll", "ve", "re", "don", "won", "t", "s", "m", "d", 
        "end", "unknown", "separate",                         # Από Cluster 12
        "span", "div", "br", "href", "src",                   # HTML tags (Cluster 18 είχε 'span')
        "english", "spanish", "french", "german",             
        
        # 5. Κωδικοί Τμημάτων & Συντομογραφίες (Από τα Clusters 1, 7, 16)
        "phys", "biol", "chem", "eng", "edu", 
        "npre",                                               # Nuclear Engineering code (Cluster 7)
        "accy",                                               # Accountancy code (Cluster 16)
        "ece", "cs", "badm", "adv", "mus",                    # Συνηθισμένοι κωδικοί
        "ib", "ii", "iii", "iv",                              
        "imba",                                               # (Cluster 4)
        "fr",                                                 # (Cluster 4 - πιθανόν Freshman ή French)
        "lls", "aas",                                         # (Cluster 1)
        
        # 6. Περιορισμοί Εγγραφής (ΝΕΟ - Από Cluster 12)
        "consent", "instructor", "standing",                  # "consent of instructor", "standing"
        "maximum", "minimum", "limit",                        # "maximum hours"
        "restricted", "restriction", "enrollment",            
        "majors", "only", "non", "open",                      # "open to majors only"
        
        # 7. Αριθμητικά (γραμμένα ως λέξεις)
        "one", "two", "three", "four", "five", "six",         # "six" (Cluster 14)
        "seven", "eight", "nine", "ten", "first", "second",
        
        # 8. Ξενόγλωσσες λέξεις
        "curso", "módulo", "para", "como", "cómo", "datos", "dados", "neste", 
        "una", "uma", "con", "com", "del", "do", "da", "em", "en", "el", "la",
        "los", "las", "und", "für", "mit", "sur", "pour"
    ]
    # stopwords setup
    languages = ["english", "spanish", "french", "german", "portuguese", "italian", "russian"]
    all_stop_words = []
    for lang in languages:
        try:
            all_stop_words += StopWordsRemover.loadDefaultStopWords(lang)
        except: 
            pass

    all_stop_words += specific_stop_words
    all_stop_words += ["course", "introduction", "online", "tutorial", "video", "free", "learn","data","using"]
    
    remover = StopWordsRemover(inputCol="raw_tokens", outputCol="tokens", stopWords=all_stop_words)
    
    #tf-idf setup
    cv = CountVectorizer(
        inputCol="tokens",
        outputCol="countFeatures",
        vocabSize=vocabSize,
        minDF=minDF,
        maxDF=maxDF
    )
    idf = IDF(
        inputCol="countFeatures",
        outputCol="tfidfFeatures"
    )
    normalizer = Normalizer(
        inputCol="tfidfFeatures",
        outputCol="normFeatures",
        p=2.0
    )

    # pipeline build
    pipeline = Pipeline(stages=[tokenizer, remover, cv, idf, normalizer])
    model = pipeline.fit(df_processed)
    cv_model = model.stages[2]

    full_df = model.transform(df_processed).select("_id", "title","countFeatures", "normFeatures", "tokens")

    full_df = full_df.cache()
    full_df.count()
    
    return full_df,cv_model
