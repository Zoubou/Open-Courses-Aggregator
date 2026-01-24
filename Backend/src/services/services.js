import Course from "../../../harvester/src/models/course.js";
import { exec } from 'child_process';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Βοηθητική συνάρτηση: Αγνοεί τους ειδικούς χαρακτήρες στην αρχή και επιστρέφει το πρώτο γράμμα
 */
function extractFirstAlpha(str) {
    // Αφαιρούμε όλα τα μη-αλφαβητικά χαρακτήρα από την αρχή
    const match = str.replace(/^[^a-zA-Z0-9Ά-Ώά-ώ]+/, '');
    return match;
}

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

        // Αναζήτηση σε Τίτλο και Keywords (Case-insensitive)
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: "i" } },
                { keywords: { $regex: filters.search, $options: "i" } }
            ];
        }

        // Λογική Ταξινόμησης
        let sortObj = { last_update: -1 }; // Default sort
        let isTitleSort = false;
        
        if (filters.sort === 'oldest') {
            sortObj = { last_update: 1 };
        } else if (filters.sort === 'title-asc') {
            sortObj = { title: 1 };
            isTitleSort = true;
        } else if (filters.sort === 'title-desc') {
            sortObj = { title: -1 };
            isTitleSort = true;
        }

        // Εκτέλεση του query στη MongoDB - πρώτα φέρνε το total count
        const total = await Course.countDocuments(query);
        
        // Περιορίζουμε τα αποτελέσματα για καλύτερη απόδοση στο Front-end
        let courses = await Course.find(query)
                    .sort(sortObj)
                    .skip(offset)
                    .limit(limit);
        
        // Αν κάνουμε sort by title, ταξινόμησε client-side αγνοώντας τους ειδικούς χαρακτήρες
        if (isTitleSort) {
            courses = courses.sort((a, b) => {
                const titleA = extractFirstAlpha(a.title || '');
                const titleB = extractFirstAlpha(b.title || '');
                
                if (filters.sort === 'title-asc') {
                    return titleA.localeCompare(titleB, 'el', { sensitivity: 'base' });
                } else {
                    return titleB.localeCompare(titleA, 'el', { sensitivity: 'base' });
                }
            });
        }
        
        return {
            courses,
            total,
            limit,
            offset,
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
export async function getSimilarCourses(id) {
    try {
        const similaritiesCollection = Course.db.collection('courses_similarities');
        const similarityDoc = await similaritiesCollection.findOne({ course_id: id });
        
        if (!similarityDoc || !similarityDoc.similar_courses) {
            return [];
        }
        
        // Extract course IDs from similar_courses and fetch full course data
        const similarCourseIds = similarityDoc.similar_courses.map(sc => sc.course_id);
        const courses = await Course.find({ _id: { $in: similarCourseIds } });
        
        return courses;
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
    
    // Φίλτραρε τις γλώσσες - άφησε μόνο αυτές που υπάρχουν σε τουλάχιστον ένα course
    const languagesWithCourses = await Course.aggregate([
        {
            $group: {
                _id: "$language",
                count: { $sum: 1 }
            }
        },
        {
            $match: { count: { $gt: 0 } }
        },
        {
            $project: { _id: 1 }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    const filteredLanguages = languagesWithCourses
        .map(doc => doc._id)
        .filter(lang => lang !== null && lang !== undefined && lang !== '');

    return {
        languages: filteredLanguages,
        levels,
        sources,
        categories
    };
}