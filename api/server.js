require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");

const schoolRouter = require("./routers/school.router");
const classRouter = require("./routers/class.router");
const subjectRouter = require("./routers/subject.router");
const studentRouter = require("./routers/student.router");
const teacherRouter = require("./routers/teacher.router");
const scheduleRouter = require("./routers/schedule.router");
const attendanceRouter = require("./routers/attendance.router");
const examinationRouter = require("./routers/examination.router");
const noticeRouter = require("./routers/notice.router");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const corsOption = { exposedHeaders: "Authorization" };
app.use(cors(corsOption));
app.use(cookieParser());

// Serve the uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const MONGO_URI = process.env.MONGO_URI || "mongodb://mongo:27017/school_management1986";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log(`✅ Connected to MongoDB (${MONGO_URI})`))
  .catch((e) => console.error("❌ Error connecting to MongoDB", e));

// ROUTERS

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
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
