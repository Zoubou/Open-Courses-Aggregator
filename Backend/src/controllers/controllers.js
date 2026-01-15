// Χρησιμοποιούμε import αντί για require
import * as services from '../services/services.js';

export async function getCourses(req, res) {
    try {
        // Συγκέντρωση φίλτρων από το query string
        const filters = {
            language: req.query.language,
            level: req.query.level,
            source: req.query.source,
            category: req.query.category,
            search: req.query.search,
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort
        };

        const result = await services.getCourses(filters);
        res.json(result);
    } 
    catch (error) {
        console.error("Controller Error (getCourses):", error);
        res.status(500).json({ error: "Server error" });
    }
}

export async function getCourseById(req, res) {
    try {
        const id = req.params.id;
        const course = await services.getCourseById(id);
        
        if (!course) {
            return res.status(404).json({ error: "Course not found!" });
        }

        res.json(course);
    } 
    catch (error) {
        console.error("Controller Error (getCourseById):", error);
        res.status(500).json({ error: "Server error" });
    }
}


export async function getSimilarCourses(req, res) {
    try {
        const { id } = req.params;
        const result = await services.getSimilarCourses(id);
        
        if (!result) {
            return res.status(404).json({ message: "No similar courses found for this ID" });
        }

        res.json(result.similar_courses); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function syncSource(req, res) {
    const { source } = req.params; // π.χ. kaggle ή kaggle2
    
    try {
        
        res.status(202).json({ message: `Sync started for ${source}. This may take a while.` });
        
        await services.triggerSync(source);
    } catch (error) {
        console.error("Sync Error:", error);
    }
}

export async function getAnalytics(req, res) {
    try {
        const stats = await services.getStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
}

export async function getMetadata(req, res) {
    try {
        const metadata = await services.getMetadata();
        res.json(metadata);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch metadata" });
    }
}