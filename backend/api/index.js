// Vercel Serverless Function entry point
// Vercel calls this file for every request — it wraps the Express app.
const app = require('../server');
module.exports = app;
