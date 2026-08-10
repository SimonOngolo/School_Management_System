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
  CircularProgress,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import { baseApi } from "../../../environment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function ExaminationStudent() {
  const [examinations, setExaminations] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      // 1. Get student user object from local storage
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const studentClassId =
        typeof user.class === "object" ? user.class?._id : user.class;

      if (!studentClassId) {
        setError("Your student profile does not have an assigned class ID.");
        setLoading(false);
        return;
      }

      // 2. Fetch examinations specifically for this student's class
      const examRes = await axios.get(
        `${baseApi}/examinations/class/${studentClassId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setExaminations(examRes.data.examinations || []);
    } catch (err) {
      console.error("Error fetching student examinations:", err);
      setError(
        "Failed to load your examination schedule. Please check your permissions.",
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}>
        <CalendarMonthIcon sx={{ color: "#1976d2", fontSize: "2rem" }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Examination Schedule
        </Typography>
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
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : examinations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No examinations found for your class.
                  </TableCell>
                </TableRow>
              ) : (
                examinations
                  .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                  .map((ex) => (
                    <TableRow key={ex._id} hover>
                      <TableCell>
                        {dayjs(ex.examDate).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell>{ex.period || "—"}</TableCell>
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
