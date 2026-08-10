require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");

function tryRequireRouter(relPath) {
  // relPath is expected like './routers/school.router'
  try {
    const baseName = relPath.replace(/^(\.\/routers\/)?/, '').replace(/\.js$/,'');
    const filePath = path.join(__dirname, 'routers', baseName + '.js');
    const filePathAlt = path.join(__dirname, 'routers', baseName + '.router.js');
    if (fs.existsSync(filePath)) return require(filePath);
    if (fs.existsSync(filePathAlt)) return require(filePathAlt);
    console.warn(`Router file not found: ${baseName} — mounting empty router`);
    return express.Router();
  } catch (e) {
    console.warn(`Error requiring router ${relPath}:`, e.message);
    return express.Router();
  }
}

const schoolRouter = tryRequireRouter('./routers/school.router');
const classRouter = tryRequireRouter('./routers/class.router');
const subjectRouter = tryRequireRouter('./routers/subject.router');
const studentRouter = tryRequireRouter('./routers/student.router');
const teacherRouter = tryRequireRouter('./routers/teacher.router');
const scheduleRouter = tryRequireRouter('./routers/schedule.router');
const attendanceRouter = tryRequireRouter('./routers/attendance.router');
const examinationRouter = tryRequireRouter('./routers/examination.router');
const noticeRouter = tryRequireRouter('./routers/notice.router');
const authRouter = tryRequireRouter('./routers/auth.router');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: explicitly allow frontend and BFF dev origins for local development
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:4000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin like curl, postman
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization'],
};

// Use CORS for all routes and let the middleware handle preflight responses
app.use(cors(corsOptions));

app.use(cookieParser());

// Serve the uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/school_management1986";
const SKIP_DB = (process.env.SKIP_DB || '').toLowerCase() === 'true';

async function maybeConnectDb() {
  if (SKIP_DB) {
    console.log('SKIP_DB is set — skipping MongoDB connection');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB (${MONGO_URI})`);
  } catch (e) {
    console.error('❌ Error connecting to MongoDB', e);
    console.warn('Continuing without database. Set SKIP_DB=true to suppress connection attempts for local development.');
  }
}

// ROUTERS

app.use("/api/auth", authRouter);
app.use("/api/school", schoolRouter);
app.use("/api/class", classRouter);
app.use("/api/students", studentRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/teachers", teacherRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/examinations", examinationRouter);
app.use("/api/notice", noticeRouter);

const PORT = process.env.PORT || 3002;

// Start server regardless of DB connection — DB is optional in local dev with SKIP_DB
maybeConnectDb().finally(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
