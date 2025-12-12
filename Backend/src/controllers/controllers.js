const services = require('../services/services.js');

async function getCourses(req, res){
    try{
        const filters = {
            language: req.query.language,
            level: req.query.level,
            source: req.query.source,
            category: req.query.category,
            search: req.query.search
        };

        const courses = await services.getCourses(filters);
        res.json(courses);
    } 
    catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
    }
}

async function getCourseById(req, res) {
    try{
        const id = req.params.id;

        const course = await services.getCourseById(id);
        if(!course) return res.status(404).json({error: "Course not found!"});

        res.json(course);
    } 
    catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
    }
}

async function getSimilarCourses(req, res) {
  const id = req.params.id;

  // MOCK DATA — replace with Spark output later
  res.json([
    { id: 10, title: "Intro to AI" },
    { id: 22, title: "Machine Learning Basics" }
  ]);
}

module.exports = {
    getCourses,
    getCourseById,
    getSimilarCourses
};