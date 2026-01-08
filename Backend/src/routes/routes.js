import express from 'express';
const router = express.Router();
import * as controller from '../controllers/controllers.js'; 

// 1. Λίστα μαθημάτων & Αναζήτηση/Φιλτράρισμα
router.get("/", controller.getCourses);

// 2. Επιλογές για φιλτράρισμα
router.get("/metadata", controller.getMetadata);

// 3. Στατιστικά
router.get("/Analytics", controller.getAnalytics);

// 4. Λεπτομέρειες συγκεκριμένου μαθήματος
router.get("/:id", controller.getCourseById);

// 5. Συστάσεις παρόμοιων μαθημάτων (Spark-based)
router.get("/:id/similar", controller.getSimilarCourses);

// 6. Συγχρονισμός με εξωτερικό repo
router.post("/sync/:source", controller.syncSource);

export default router;