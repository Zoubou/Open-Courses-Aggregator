import Course from "../../../harvester/src/models/course.js";
import { exec, spawn, spawnSync } from 'child_process';
import { ObjectId } from 'mongodb';
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

        // Φίλτρο Κατηγορίας: τα clusters αποθηκεύονται σε ξεχωριστή συλλογή `course_to_cluster`
        // Η συλλογή περιέχει docs { course_id, cluster_id }.
        if (filters.cluster) {
            const cat = String(filters.cluster).trim();
            const courseToClusterColl = Course.db.collection('course_to_cluster');

            // Αν το category είναι αριθμητικό, θεωρούμε ότι είναι cluster_id
            if (/^[0-9]+$/.test(cat)) {
                const clusterId = Number(cat);
                const docs = await courseToClusterColl.find({ cluster_id: clusterId }).project({ course_id: 1 }).toArray();
                if (!docs || docs.length === 0) {
                    // Δεν υπάρχουν μαθήματα για αυτή την κατηγορία -> επιστρέψτε κενό αποτέλεσμα
                    return { courses: [], total: 0, limit, offset, pages: 0 };
                }

                const courseIds = docs.map(d => d.course_id).filter(Boolean);
                if (courseIds.length === 0) {
                    return { courses: [], total: 0, limit, offset, pages: 0 };
                }

                const normalizedCourseIds = courseIds.map(id => {
                    const sid = String(id);
                    return ObjectId.isValid(sid) ? new ObjectId(sid) : id;
                });

                query._id = { $in: normalizedCourseIds };
            } else {
                const maybeNum = Number(cat);
                if (!Number.isNaN(maybeNum)) {
                    const docs = await Course.db.collection('course_to_cluster').find({ cluster_id: maybeNum }).project({ course_id: 1 }).toArray();
                    const courseIds = docs.map(d => d.course_id).filter(Boolean);
                    if (courseIds.length === 0) return { courses: [], total: 0, limit, offset, pages: 0 };

                    const normalizedCourseIds = courseIds.map(id => {
                        const sid = String(id);
                        return ObjectId.isValid(sid) ? new ObjectId(sid) : id;
                    });
                    query._id = { $in: normalizedCourseIds };
                }
            }
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
        const course = await Course.findById(id);
        if (!course) return null;

        const courseObj = course.toObject ? course.toObject() : course;

        try {
            const coll = Course.db.collection('course_to_cluster');
            // try to find mapping by ObjectId or string id
                const mapping = await coll.findOne({
                    course_id: course._id.toString()  // !! string now
                });            
                if (mapping && mapping.cluster_id !== undefined && mapping.cluster_id !== null) {
                const clusterId = mapping.cluster_id;
                // fetch top keywords for this cluster to use as label
                const keywordsColl = Course.db.collection('cluster_keywords');
                const kws = await keywordsColl.find({ cluster_id: clusterId }).sort({ rank: 1 }).toArray();

                // Prefer the `word` field from cluster_keywords and limit to top 15
                const extractedKeywords = (kws || []).map(k => (k && k.word) ? k.word : null).filter(Boolean).slice(0, 15);

                courseObj.cluster = {
                    id: clusterId,
                    keywords: extractedKeywords
                };
            }
        } catch (e) {
            console.warn('Failed to lookup cluster info for course', id, e);
        }

        return courseObj;
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


function runHarvester(singleSource, progressCb) {
    return new Promise((resolve, reject) => {
        const harvesterDir = path.resolve(__dirname, '../../../harvester');
        const harvesterFile = path.resolve(harvesterDir, 'index.js');

        // Update progress message to show which specific source is running
        progressCb({ stage: 'harvester_start', percent: 10, message: `Harvesting source: ${singleSource}` });

        // Pass the specific source to the script
        // Note: We pass singleSource for both args to ensure the script focuses on just this one
        const harvesterEnv = { ...process.env, IMPORT_SOURCES: singleSource };
        
        const harvester = spawn('node', [harvesterFile, `--source=${singleSource}`, `--import-sources=${singleSource}`], {
            cwd: harvesterDir,
            env: harvesterEnv
        });

        harvester.stdout.on('data', (data) => {
            const raw = String(data).trim();
            console.log(`[harvester-${singleSource}] ${raw}`);
            
            // Optional: finer progress updates based on logs
            if (/imported/i.test(raw)) {
                progressCb({ stage: 'harvester_active', message: `Importing ${singleSource}...` });
            }
        });

        harvester.stderr.on('data', (data) => {
            console.error(`[harvester-${singleSource} stderr] ${String(data).trim()}`);
        });

        harvester.on('error', (err) => reject(err));

        harvester.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Harvester for ${singleSource} exited with code ${code}`));
            }
        });
    });
}
function runSparkJobs(progressCb) {
    return new Promise((resolve, reject) => {
        const sparkDir = path.resolve(__dirname, '../../../SparkML');
        const pythonPath = "/usr/bin/python3";

        const pyScripts = [
            { name: 'Clustering courses', file: 'courseClusters.py', start: 40, end: 75 },
            { name: 'Calculating course similarities', file: 'coursesSimilarity.py', start: 75, end: 95 }
        ];

        // Helper to run a single script
        const runPython = ({ file, name, start, end }) => new Promise((res, rej) => {
            progressCb({ stage: 'spark_start', message: name, percent: start });

            // IMPORTANT: passing process.env here so Python sees MONGO_URI
            const py = spawn(pythonPath, [file], { 
                cwd: sparkDir,
                env: process.env 
            });

            py.stdout.on('data', (d) => {
                const txt = String(d).trim();
                console.log(`[${name} stdout] ${txt}`);
                progressCb({ stage: 'spark_output', message: `${name}...` });
            });

            py.stderr.on('data', (d) => {
                const txt = String(d).trim();
                console.error(`[${name} stderr] ${txt}`);
            });

            py.on('error', (err) => {
                console.error(`${name} spawn error:`, err);
                progressCb({ stage: 'spark_error', message: `Failed to start ${name}. Check Python installation.` });
                rej(err);
            });

            py.on('close', (code) => {
                if (code === 0) {
                    progressCb({ stage: 'spark_done', message: `${name} completed`, percent: end });
                    res();
                } else {
                    progressCb({ stage: 'spark_done', message: `${name} failed`, percent: end });
                    rej(new Error(`${name} exited with code ${code}`));
                }
            });
        });

        // Run scripts sequentially
        runPython(pyScripts[0])
            .then(() => runPython(pyScripts[1]))
            .then(() => resolve())
            .catch((err) => reject(err));
    });
}
export function triggerSyncWithProgress(source, progressCb = () => {}) {
    return new Promise(async (resolve) => {
        try {
            // --- Step A: Determine which sources to run ---
            let sourcesToRun = [];
            
            if (source === 'all') {
                // Get list from env or default, and split by comma
                const list = 'kaggle,kaggle2,illinois';
                sourcesToRun = list.split(',').map(s => s.trim());
            } else {
                sourcesToRun = [source];
            }

            console.log(`Starting sync for sources: ${sourcesToRun.join(', ')}`);

            // --- Step B: Run Harvester for each source sequentially ---
            for (const src of sourcesToRun) {
                await runHarvester(src, progressCb);
            }
            
            progressCb({ stage: 'harvester_done', message: 'All sources imported', percent: 40 });

            // --- Step C: Run Spark Jobs ---
            await runSparkJobs(progressCb);

            // --- Done ---
            progressCb({ stage: 'all_done', percent: 100, message: 'Sync Complete' });
            resolve();

        } catch (err) {
            console.error('Sync process failed:', err);
            progressCb({ stage: 'error', message: String(err) });
            resolve(); // Resolve anyway so UI doesn't hang
        }
    });
}
/**
 * Return current running sync or last sync status
 */
// (Previously added getSyncStatus removed)


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