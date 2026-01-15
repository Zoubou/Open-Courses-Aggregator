import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from harvester directory
dotenv.config({ path: path.resolve(__dirname, "harvester/.env") });

// Course Model
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    keywords: [String],
    language: String,
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "unknown"],
      default: "unknown"
    },
    source: {
      name: { type: String, required: true },
      url: String
    },
    link: String,
    last_update: Date,
    source_course_id: { type: String, required: true },
    similar_ids: [mongoose.Schema.Types.ObjectId]
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

async function seedTestCourses() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("Missing MONGO_URI in harvester/.env");
    }

    await mongoose.connect(mongoUri, {
      dbName: "courses_aggregator"
    });

    console.log("Connected to MongoDB");

    // Clear existing test courses
    await Course.deleteMany({
      source_course_id: { $regex: "^test_" }
    });

    console.log("Cleared existing test courses");

    // Create test courses
    const testCourses = [
      {
        title: "Introduction to Machine Learning",
        description: "Learn the fundamentals of machine learning, including supervised and unsupervised learning, regression, classification, and clustering techniques. This comprehensive course covers practical implementations using Python and popular ML libraries.",
        keywords: ["machine learning", "AI", "python", "data science", "algorithms", "classification", "regression", "clustering"],
        language: "English",
        level: "beginner",
        source: {
          name: "kaggle",
          url: "https://www.kaggle.com"
        },
        link: "https://www.kaggle.com/learn/intro-to-machine-learning",
        source_course_id: "test_ml_intro_001",
        last_update: new Date()
      },
      {
        title: "Advanced Deep Learning with TensorFlow",
        description: "Master advanced deep learning concepts including convolutional neural networks, recurrent neural networks, transformers, and GANs. Build state-of-the-art models for computer vision, natural language processing, and generative tasks.",
        keywords: ["deep learning", "neural networks", "TensorFlow", "CNN", "RNN", "transformers", "computer vision", "NLP"],
        language: "English",
        level: "advanced",
        source: {
          name: "coursera",
          url: "https://www.coursera.org"
        },
        link: "https://www.coursera.org/specializations/deep-learning",
        source_course_id: "test_dl_advanced_002",
        last_update: new Date()
      },
      {
        title: "Data Science with Python",
        description: "Comprehensive guide to data science using Python. Learn data manipulation, visualization, statistical analysis, and machine learning. Work with real datasets and build end-to-end data science projects.",
        keywords: ["python", "data science", "pandas", "numpy", "matplotlib", "data visualization", "statistics", "analytics"],
        language: "English",
        level: "intermediate",
        source: {
          name: "udemy",
          url: "https://www.udemy.com"
        },
        link: "https://www.udemy.com/course/python-for-data-science",
        source_course_id: "test_ds_python_003",
        last_update: new Date()
      },
      {
        title: "Natural Language Processing Essentials",
        description: "Understand the core concepts of NLP including tokenization, sentiment analysis, topic modeling, and transformer models. Implement NLP projects using popular libraries like NLTK, spaCy, and Hugging Face.",
        keywords: ["NLP", "natural language processing", "text mining", "sentiment analysis", "BERT", "transformers", "deep learning"],
        language: "English",
        level: "intermediate",
        source: {
          name: "kaggle",
          url: "https://www.kaggle.com"
        },
        link: "https://www.kaggle.com/learn/nlp",
        source_course_id: "test_nlp_essentials_004",
        last_update: new Date()
      },
      {
        title: "Computer Vision Fundamentals",
        description: "Explore the foundations of computer vision including image processing, feature detection, object detection, and image segmentation. Learn to build CV applications using OpenCV and deep learning frameworks.",
        keywords: ["computer vision", "image processing", "object detection", "segmentation", "OpenCV", "CNN", "deep learning"],
        language: "English",
        level: "intermediate",
        source: {
          name: "coursera",
          url: "https://www.coursera.org"
        },
        link: "https://www.coursera.org/learn/computer-vision-basics",
        source_course_id: "test_cv_fundamentals_005",
        last_update: new Date()
      }
    ];

    // Insert courses and collect IDs for linking
    const insertedCourses = await Course.insertMany(testCourses);
    console.log(`Inserted ${insertedCourses.length} test courses`);

    // Create similar_ids relationships
    // Link ML intro to DS Python and NLP
    insertedCourses[0].similar_ids = [insertedCourses[2]._id, insertedCourses[3]._id];
    await insertedCourses[0].save();

    // Link Advanced DL to CV and NLP
    insertedCourses[1].similar_ids = [insertedCourses[3]._id, insertedCourses[4]._id];
    await insertedCourses[1].save();

    // Link DS Python to ML intro and CV
    insertedCourses[2].similar_ids = [insertedCourses[0]._id, insertedCourses[4]._id];
    await insertedCourses[2].save();

    // Link NLP to Advanced DL and DS Python
    insertedCourses[3].similar_ids = [insertedCourses[1]._id, insertedCourses[2]._id];
    await insertedCourses[3].save();

    // Link CV to Advanced DL and DS Python
    insertedCourses[4].similar_ids = [insertedCourses[1]._id, insertedCourses[2]._id];
    await insertedCourses[4].save();

    console.log("Added similar course relationships");
    console.log("\nTest courses created successfully!");
    console.log("You can now:");
    console.log("1. Search for keywords like 'python', 'machine learning', 'deep learning'");
    console.log("2. Click on any course to see full details and keywords");
    console.log("3. Click on keywords to see filtered results");
    console.log("4. Click on similar courses to see recommendations");

  } catch (error) {
    console.error("Error seeding test courses:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedTestCourses();
