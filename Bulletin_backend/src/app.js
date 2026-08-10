const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ==========================================
// 1. PLACE PUBLIC HEALTH CHECK FIRST
// ==========================================
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "API Bulletins opérationnelle" });
});

// ==========================================
// 2. THEN REGISTER OTHER ROUTES
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api", teacherGroupRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/bulletins", bulletinRoutes);
app.use("/api/import-export", importExportRoutes);
app.use("/api/absences", absenceRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/ues", ueRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/student", studentGradesRoutes);
app.use("/api", groupUERoutes);

// Gestion d'erreurs
app.use(errorMiddleware);

module.exports = app;
