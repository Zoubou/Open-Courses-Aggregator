// Χρησιμοποιούμε import αντί για require
import * as services from '../services/services.js';

export async function getCourses(req, res) {
    try {
        // Συγκέντρωση φίλτρων από το query string
        const filters = {
            language: req.query.language,
            level: req.query.level,
            source: req.query.source,
            cluster: req.query.cluster,
            search: req.query.search,
            offset: req.query.offset,
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
        if (!result || !Array.isArray(result)) {
            return res.status(200).json([]);
        }

        res.json(result); 
    } catch (error) {
        console.error("getSimilarCourses error:", error);
        res.status(200).json([]);
    }
}
export async function syncSourceStream(req, res) {
    const source = req.query.source;
    if (!source) return res.status(400).json({ error: 'Missing source query param' });

    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    const send = (data) => {
        try {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        } catch (e) {
            console.error('SSE write error:', e);
        }
    };

    send({ stage: 'started', message: `Sync started for ${source}` });
    // Call service that accepts a progress callback for a single source
    services.triggerSyncWithProgress(source, (progress) => {
        send(progress);
    }).then(() => {
        send({ stage: 'finished', message: `Sync finished for ${source}` });
        res.end();
    }).catch((err) => {
        console.error('SyncStream error:', err);
        send({ stage: 'error', message: String(err) });
        res.end();
    });
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