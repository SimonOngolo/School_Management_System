import React from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import { baseApi } from "../../../environment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function ExaminationTeacher() {
  const [examinations, setExaminations] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [selectedClassFilter, setSelectedClassFilter] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      // Fetching both datasets
      const [examRes, classRes] = await Promise.all([
        axios.get(`${baseApi}/examinations/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${baseApi}/class/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Map according to your controller's specific response keys
      setExaminations(examRes.data.examinations || []);
      setClasses(classRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const filteredExaminations = examinations.filter((exam) => {
    if (!selectedClassFilter) return true;
    const examClassId =
      typeof exam.class === "object" ? exam.class?._id : exam.class;
    return String(examClassId) === String(selectedClassFilter);
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CalendarMonthIcon sx={{ color: "#1976d2", fontSize: "2rem" }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Examination Schedule
          </Typography>
        </Box>

        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filter by Class</InputLabel>
          <Select
            value={selectedClassFilter}
            label="Filter by Class"
            onChange={(e) => setSelectedClassFilter(e.target.value)}>
            <MenuItem value="">
              <em>All Classes</em>
            </MenuItem>
            {classes.map((x) => (
              <MenuItem key={x._id} value={x._id}>
                {x.class_text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : filteredExaminations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No examinations found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExaminations
                  .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                  .map((ex) => (
                    <TableRow key={ex._id} hover>
                      <TableCell>
                        {dayjs(ex.examDate).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell>{ex.period || "—"}</TableCell>
                      <TableCell>{ex.class?.class_text || "—"}</TableCell>
                      <TableCell>{ex.subject?.subject_name || "—"}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            display: "inline-block",
                            bgcolor: "#e3f2fd",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}>
                          {ex.examType}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
