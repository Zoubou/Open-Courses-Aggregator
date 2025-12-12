const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllers.js');

router.get("/", controller.getCourses);
router.get("/:id", controller.getCourseById);
router.get("/:id/similar", controller.getSimilarCourses);

module.exports = router;