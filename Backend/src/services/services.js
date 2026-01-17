import Course from "../../../harvester/src/models/course.js";
import { exec } from 'child_process';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Φέρνει μαθήματα με βάση τα φίλτρα (Αναζήτηση, Γλώσσα, Επίπεδο, Πηγή)
 */
export async function getCourses(filters) {
    try {
        let query = {};

        const rawLimit = Number.parseInt(filters?.limit, 10);
        const rawOffset = Number.parseInt(filters?.offset, 10);

        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
        const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0;

        // Φίλτρο Γλώσσας
        if (filters.language) {
            query.language = filters.language;
        }

        // Φίλτρο Επιπέδου (beginner, intermediate, κλπ)
        if (filters.level) {
            query.level = filters.level;
        }

        // Φίλτρο Πηγής (π.χ. kaggle)
        if (filters.source) {
            query["source.name"] = filters.source;
        }

        // Φίλτρο Κατηγορίας
        if (filters.category) {
            query.category = filters.category;
        }

        // Αναζήτηση σε Τίτλο και Keywords (Case-insensitive)
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: "i" } },
                { keywords: { $regex: filters.search, $options: "i" } }
            ];
        }

        // Εκτέλεση του query στη MongoDB
                // Περιορίζουμε τα αποτελέσματα για καλύτερη απόδοση στο Front-end
                return await Course.find(query)
                    .sort({ last_update: -1 })
                    .skip(offset)
                    .limit(limit);
    } catch (error) {
        throw new Error("Database error while fetching courses: " + error.message);
    }
}

/**
 * Φέρνει ένα συγκεκριμένο μάθημα βάσει ID
 */
export async function getCourseById(id) {
    try {
        return await Course.findById(id);
    } catch (error) {
        throw new Error("Database error while fetching course by ID: " + error.message);
    }
}

/**
 * Endpoint για Spark Recommendations
 */
export async function getSimilarCourses(id) {
    try {
        const courseObjectId = new mongoose.Types.ObjectId(id);

        // Preferred: read Spark output collection.
        // SparkML writes recommendations into `courses_similarities`.
        const similaritiesCollection = Course.db.collection('courses_similarities');
        const similarityDoc = await similaritiesCollection.findOne({ course_id: courseObjectId });

        if (similarityDoc?.similar_courses?.length) {
            const sorted = [...similarityDoc.similar_courses]
              .filter((r) => r?.similar_id)
              .sort((a, b) => (Number(b?.cosine_similarity ?? 0) - Number(a?.cosine_similarity ?? 0)));

            const similarIds = sorted.slice(0, 10).map((r) => r.similar_id);
            const courses = await Course.find({ _id: { $in: similarIds } });

            // Preserve similarity order.
            const byId = new Map(courses.map((c) => [String(c._id), c]));
            return similarIds.map((sid) => byId.get(String(sid))).filter(Boolean);
        }

        // Fallback: legacy approach (if course docs contain `similar_ids`).
        const course = await Course.findById(courseObjectId);
        if (!course?.similar_ids?.length) return [];
        return await Course.find({ _id: { $in: course.similar_ids } });
    } catch (error) {
        return [];
    }
}

/**
 * Endpoint για συγχρονισμό με harvester
 */
export function triggerSync(source) {
    return new Promise((resolve, reject) => {
        const harvesterDir = path.resolve(__dirname, '../../../harvester');
        const harvesterFile = path.resolve(harvesterDir, 'index.js');

        exec(`node "${harvesterFile}" --source=${source}`, { cwd: harvesterDir }, (error, stdout, stderr) => {
            if (error) {
                console.error("EXEC ERROR:", error); 
            }
            if (stderr) {
                console.error("HARVESTER STDERR:", stderr);
            }
            console.log("HARVESTER STDOUT:", stdout); 
        });
    });
}

/**
 * Endpoint για στατιστικά
 */
export async function getStats() {
  const stats = await Course.aggregate([
    {
      $facet: {
        "bySource": [
          { $group: { _id: "$source.name", count: { $sum: 1 } } }
        ],
                "byLanguage": [
                    { $group: { _id: "$language", count: { $sum: 1 } } }
                ],
                "byCategory": [
                    { $group: { _id: "$category", count: { $sum: 1 } } }
                ],
        "byLevel": [
          { $group: { _id: "$level", count: { $sum: 1 } } }
        ],
        "total": [
          { $count: "count" }
        ]
      }
    }
  ]);
  return stats[0];
}

/**
 * Endpoint για επιλογές φίλτρων
 */
export async function getMetadata() {
    const languages = await Course.distinct("language");
    const levels = await Course.distinct("level");
    const sources = await Course.distinct("source.name");
    const categories = await Course.distinct("category"); 

    return {
        languages,
        levels,
        sources,
        categories
    };
}