import express from 'express';
const router = express.Router();
// Προσοχή: Προσθέτουμε το .js στο τέλος γιατί στα ES Modules είναι υποχρεωτικό
import * as controller from '../controllers/controllers.js'; 

// 1. Λίστα μαθημάτων & Αναζήτηση/Φιλτράρισμα
// Εδώ θα γίνεται η αναζήτηση βάσει τίτλου, γλώσσας, επιπέδου κ.λπ.
router.get("/", controller.getCourses);

// 2. Στατιστικά
router.get("/Analytics", controller.getAnalytics);

// 3. Λεπτομέρειες συγκεκριμένου μαθήματος
router.get("/:id", controller.getCourseById);

// 4. Συστάσεις παρόμοιων μαθημάτων (Spark-based)
// Αυτό το endpoint θα επιστρέφει τα αποτελέσματα του Spark ML job
router.get("/:id/similar", controller.getSimilarCourses);

// 5. Συγχρονισμός με εξωτερικό repo
router.post("/sync/:source", controller.syncSource);

export default router;