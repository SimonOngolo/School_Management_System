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
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { useFormik } from "formik";
import { examinationSchema } from "../../../yupSchema/examinationSchema";
import dayjs from "dayjs";
import { baseApi } from "../../../environment";

export default function Examination() {
  const [examinations, setExaminations] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [classes, setClasses] = React.useState([]);
  const [feedback, setFeedback] = React.useState(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editingExamId, setEditingExamId] = React.useState(null);

  // Dedicated state to hold the filter selection separate from the creation form
  const [selectedClassFilter, setSelectedClassFilter] = React.useState("");

  const periods = [
    {
      value: "Period 1 (10:00 AM - 11:00 AM)",
      label: "Period 1 (10:00 AM - 11:00 AM)",
    },
    {
      value: "Period 2 (11:00 AM - 12:00 PM)",
      label: "Period 2 (11:00 AM - 12:00 PM)",
    },
    {
      value: "Period 3 (12:00 PM - 01:00 PM)",
      label: "Period 3 (12:00 PM - 01:00 PM)",
    },
    {
      value: "Break (01:00 PM - 01:30 PM)",
      label: "Break (01:00 PM - 01:30 PM)",
    },
    {
      value: "Period 4 (01:30 PM - 02:30 PM)",
      label: "Period 4 (01:30 PM - 02:30 PM)",
    },
    {
      value: "Period 5 (02:30 PM - 03:30 PM)",
      label: "Period 5 (02:30 PM - 03:30 PM)",
    },
    {
      value: "Period 6 (03:30 PM - 04:30 PM)",
      label: "Period 6 (03:30 PM - 04:30 PM)",
    },
    {
      value: "Period 7 (04:30 PM - 05:30 PM)",
      label: "Period 7 (04:30 PM - 05:30 PM)",
    },
  ];

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseApi}/subjects/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error("ERROR -> (Fetching Subjects)", err);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseApi}/class/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("ERROR -> (Fetching Classes)", err);
    }
  };

  const fetchExaminations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${baseApi}/examinations/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExaminations(res.data.examinations || []);
    } catch (err) {
      console.error("ERROR -> (Fetching Examinations)", err);
    }
  };

  React.useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  React.useEffect(() => {
    fetchSubjects();
    fetchClasses();
    fetchExaminations();
  }, []);

  const initialValues = {
    date: "",
    subject: "",
    examType: "",
    classId: "",
    period: "",
  };

  const Formik = useFormik({
    initialValues,
    validationSchema: examinationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const token = localStorage.getItem("token");
        const payload = {
          date: values.date,
          subjectId: values.subject,
          examType: values.examType,
          classId: values.classId,
          period: values.period,
        };

        if (editingExamId) {
          await axios.put(
            `${baseApi}/examinations/update/${editingExamId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          setFeedback({
            type: "success",
            message: "Examination updated successfully!",
          });
          setEditingExamId(null);
        } else {
          await axios.post(`${baseApi}/examinations/create`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFeedback({
            type: "success",
            message: "Examination created successfully!",
          });
        }

        resetForm();
        setShowForm(false);
        fetchExaminations();
      } catch (err) {
        console.error("ERROR -> (Saving/Updating Examination)", err);
        setFeedback({ type: "error", message: "Failed to save examination." });
      }
    },
  });

  // Clean, reactive array filtering logic
  const filteredExaminations = examinations.filter((exam) => {
    if (!selectedClassFilter) return true; // Show everything if no filter chosen
    const examClassId = exam.class?._id || exam.class;
    return examClassId === selectedClassFilter;
  });

  return (
    <Box sx={{ p: 4, bgcolor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Upper Control Bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#1a202c" }}>
          Examination Management
        </Typography>
        <FormControl sx={{ minWidth: 220 }} size="small">
          <InputLabel id="class-filter-label">Filter by Class</InputLabel>
          <Select
            labelId="class-filter-label"
            id="class-filter"
            label="Filter by Class"
            value={selectedClassFilter} // 👈 Tied directly to filter state, separate from Formik creation state
            onChange={(e) => setSelectedClassFilter(e.target.value)}>
            <MenuItem value="">
              <em>All Classes</em>
            </MenuItem>
            {classes.map((x) => (
              <MenuItem key={x._id || x.id} value={x._id || x.id}>
                {x.class_text || "Unnamed Class"}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {feedback && (
        <Alert
          severity={feedback.type}
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
          onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Styled Form Container */}
      {showForm && (
        <Paper
          elevation={0}
          component="form"
          onSubmit={Formik.handleSubmit}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
            bgcolor: "#ffffff",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              bgcolor: editingExamId ? "warning.main" : "primary.main",
            },
          }}
          noValidate
          autoComplete="off">
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 3, color: "#2d3748" }}>
            {editingExamId
              ? "✍️ Modify Examination Record"
              : "📅 Arrange New Examination"}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 3,
              mb: 3,
            }}>
            <Box>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DemoContainer
                  components={["DatePicker"]}
                  sx={{ pt: 0, width: "100%" }}>
                  <DatePicker
                    label="Exam Date"
                    slotProps={{
                      textField: { fullWidth: true, size: "small" },
                    }}
                    value={
                      Formik.values.date ? dayjs(Formik.values.date) : null
                    }
                    onChange={(newValue) => {
                      Formik.setFieldValue(
                        "date",
                        newValue ? newValue.toISOString() : "",
                      );
                    }}
                  />
                </DemoContainer>
              </LocalizationProvider>
            </Box>

            <FormControl fullWidth size="small">
              <InputLabel id="period-select-label">Select Period</InputLabel>
              <Select
                labelId="period-select-label"
                id="period-select"
                name="period"
                label="Select Period"
                value={Formik.values.period}
                onChange={Formik.handleChange}
                onBlur={Formik.handleBlur}>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {periods.map((p, idx) => (
                  <MenuItem key={idx} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="class-select-form-label">Assign Class</InputLabel>
              <Select
                labelId="class-select-form-label"
                id="class-select-form"
                name="classId"
                label="Assign Class"
                value={Formik.values.classId}
                onChange={Formik.handleChange}
                onBlur={Formik.handleBlur}>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {classes.map((x) => (
                  <MenuItem key={x._id || x.id} value={x._id || x.id}>
                    {x.class_text}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="subject-select-label">Select Subject</InputLabel>
              <Select
                labelId="subject-select-label"
                id="subject-select"
                name="subject"
                label="Select Subject"
                value={Formik.values.subject}
                onChange={Formik.handleChange}
                onBlur={Formik.handleBlur}>
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.subject_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              id="examType"
              name="examType"
              label="Exam Type (e.g., CA, Exam)"
              variant="outlined"
              size="small"
              value={Formik.values.examType}
              onChange={Formik.handleChange}
              onBlur={Formik.handleBlur}
            />
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ px: 3, borderRadius: 2, border: "1px solid #cbd5e1" }}
              onClick={() => {
                Formik.resetForm();
                setEditingExamId(null);
                setShowForm(false);
              }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={editingExamId ? "warning" : "primary"}
              sx={{
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
                boxShadow: "none",
              }}>
              {editingExamId ? "Update Record" : "Save Exam"}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Modern Data Presentation Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e2e8f0",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
          overflow: "hidden",
        }}>
        <TableContainer>
          <Table
            sx={{ minWidth: 700 }}
            aria-label="examination scheduling ledger">
            <TableHead sx={{ bgcolor: "#f1f5f9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>
                  Exam Date
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>
                  Period
                </TableCell>
                <TableCell
                  align="left"
                  sx={{ fontWeight: 700, color: "#475569" }}>
                  Class
                </TableCell>
                <TableCell
                  align="left"
                  sx={{ fontWeight: 700, color: "#475569" }}>
                  Subject
                </TableCell>
                <TableCell
                  align="left"
                  sx={{ fontWeight: 700, color: "#475569" }}>
                  Exam Type
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: "#475569", pr: 3 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExaminations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 6, color: "#94a3b8" }}>
                    No examinations found for this selection.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExaminations
                  .slice()
                  .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
                  .map((examination, index) => (
                    <TableRow
                      key={examination._id || index}
                      sx={{
                        "&:hover": { bgcolor: "#f8fafc" },
                        transition: "background-color 0.2s",
                      }}>
                      <TableCell sx={{ fontWeight: 500, color: "#334155" }}>
                        {dayjs(examination.examDate).format("DD MMM YYYY")}
                      </TableCell>
                      <TableCell sx={{ color: "#0f172a", fontWeight: 500 }}>
                        {examination.period || "—"}
                      </TableCell>
                      <TableCell align="left" sx={{ color: "#334155" }}>
                        {examination.class?.class_text || "—"}
                      </TableCell>
                      <TableCell align="left" sx={{ color: "#334155" }}>
                        {examination.subject?.subject_name || "—"}
                      </TableCell>
                      <TableCell align="left">
                        <Box
                          component="span"
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            bgcolor:
                              examination.examType === "CA"
                                ? "#e0f7fa" // light teal
                                : examination.examType === "Normal"
                                  ? "#e3f2fd" // light blue
                                  : "#fff3e0", // light orange for others
                            color:
                              examination.examType === "CA"
                                ? "#00695c" // dark teal text
                                : examination.examType === "Normal"
                                  ? "#0d47a1" // deep blue text
                                  : "#e65100", // orange text
                          }}>
                          {examination.examType || "—"}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3 }}>
                        <Button
                          variant="text"
                          color="warning"
                          size="small"
                          sx={{ mr: 1, fontWeight: 600 }}
                          onClick={() => {
                            Formik.setValues({
                              date: examination.examDate,
                              subject:
                                examination.subject?._id ||
                                examination.subject ||
                                "",
                              examType: examination.examType,
                              classId:
                                examination.class?._id ||
                                examination.class ||
                                "",
                              period: examination.period || "",
                            });
                            setEditingExamId(examination._id);
                            setShowForm(true);
                          }}>
                          Edit
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 600 }}
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              await axios.delete(
                                `${baseApi}/examinations/delete/${examination._id}`,
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                },
                              );
                              setExaminations(
                                examinations.filter(
                                  (e) => e._id !== examination._id,
                                ),
                              );
                              setFeedback({
                                type: "success",
                                message:
                                  "Examination record deleted successfully.",
                              });
                            } catch (err) {
                              console.error(
                                "ERROR -> (Deleting Examination)",
                                err,
                              );
                              setFeedback({
                                type: "error",
                                message: "Failed to erase document.",
                              });
                            }
                          }}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {!showForm && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-start" }}>
          <Button
            variant="contained"
            color="primary"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              boxShadow: "none",
            }}
            onClick={() => {
              Formik.resetForm();
              setEditingExamId(null);
              setShowForm(true);
            }}>
            Add Exam
          </Button>
        </Box>
      )}
    </Box>
  );
}
