import mongoose from "mongoose";

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
      name: { type: String, required: true }, // e.g. "kaggle", "mit_ocw"
      url: String
    },
    link: String,
    last_update: Date,
    source_course_id: { type: String, required: true }
  },
  { timestamps: true }
);

courseSchema.index(
  { "source.name": 1, source_course_id: 1 },
  { unique: true }
);

export default mongoose.model("Course", courseSchema);
