import connectDB from '../config/db.js';
import Course from '../src/models/course.js';

async function inspect() {
  try {
    await connectDB();
    const docs = await Course.find({}).limit(10).lean();
    console.log(JSON.stringify(docs.map(d => ({ _id: d._id, title: d.title, description: d.description, link: d.link })), null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Inspect error', e);
    process.exit(1);
  }
}

inspect();
