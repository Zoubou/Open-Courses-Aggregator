import Course from "../../../harvester/src/models/course.js";
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Φέρνει μαθήματα με βάση τα φίλτρα (Αναζήτηση, Γλώσσα, Επίπεδο, Πηγή)
 */
export async function getCourses(filters) {
    try {
        let query = {};

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

        // Pagination
        const page = Math.max(1, parseInt(filters.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
        const skip = (page - 1) * limit;

        // Sorting
        let sortOptions = { last_update: -1 }; // default
        if (filters.sort) {
            if (filters.sort === "newest") {
                sortOptions = { createdAt: -1 };
            } else if (filters.sort === "oldest") {
                sortOptions = { createdAt: 1 };
            } else if (filters.sort === "title-asc") {
                sortOptions = { title: 1 };
            } else if (filters.sort === "title-desc") {
                sortOptions = { title: -1 };
            }
        }

        // Εκτέλεση του query στη MongoDB με pagination
        const [courses, total] = await Promise.all([
            Course.find(query).skip(skip).limit(limit).sort(sortOptions),
            Course.countDocuments(query)
        ]);

        return {
            courses,
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        };
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
export async function getSimilarCourses(courseId) {
    const Similarity = mongoose.connection.collection('courses_similarities');
    
    return await Similarity.findOne({ course_id: courseId });
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