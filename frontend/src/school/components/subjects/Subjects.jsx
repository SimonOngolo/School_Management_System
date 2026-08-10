import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import { baseApi } from "../../../environment";
import { subjectSchema } from "../../../yupSchema/subjectSchema";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Paper,
  Grid,
} from "@mui/material";

// ICONS
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BookIcon from "@mui/icons-material/Book";

export default function Subject() {
  const [subjects, setSubjects] = React.useState([]);
  const [edit, setEdit] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApi}/subjects/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sorted = response.data.data.sort((a, b) =>
        a.subject_codename.localeCompare(b.subject_codename),
      );

      setSubjects(sorted);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setFeedback({
        type: "error",
        message: "Failed to load subjects. Please try again.",
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      subject_name: "",
      subject_codename: "",
    },
    validationSchema: subjectSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let response;

        if (edit && editId) {
          response = await axios.patch(
            `${baseApi}/subjects/update/${editId}`,
            values,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );

          setFeedback({
            type: "success",
            message: "Subject modified successfully!",
          });
        } else {
          response = await axios.post(`${baseApi}/subjects/create`, values, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          setFeedback({
            type: "success",
            message: "Subject created successfully!",
          });
        }

        resetForm();
        setEdit(false);
        setEditId(null);
        fetchSubjects();
      } catch (error) {
        console.error("Error submitting subject:", error);
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to save subject. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleEdit = (id, subject_name, subject_codename) => {
    setEdit(true);
    setEditId(id);

    formik.setValues({
      subject_name,
      subject_codename,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEdit(false);
    setEditId(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${baseApi}/subjects/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedback({
          type: "success",
          message: "Subject deleted successfully!",
        });
        fetchSubjects();
      } catch (error) {
        console.error("Error deleting subject:", error);
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to delete subject. Please try again.",
        });
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#1e3d73", // Matching structural layout background
        minHeight: "100vh",
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
      {/* 1. Registration Container Block */}
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          p: { xs: 3, md: 4 },
          borderRadius: "24px",
          backgroundColor: "#FFFFFF",
        }}
        component="form"
        onSubmit={formik.handleSubmit}>
        <Typography
          variant="h5"
          align="center"
          sx={{ fontWeight: "bold", color: "#10316b", mb: 4 }}>
          {edit ? "Modify Course Subject Details" : "New Subject Registration"}
        </Typography>

        {/* Input Fields Row */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="subject_name"
              label="Subject Name"
              placeholder="e.g. Mathematics"
              value={formik.values.subject_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.subject_name &&
                Boolean(formik.errors.subject_name)
              }
              helperText={
                formik.touched.subject_name && formik.errors.subject_name
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="subject_codename"
              label="Subject Code / Reference"
              placeholder="e.g. MATH-101"
              value={formik.values.subject_codename}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.subject_codename &&
                Boolean(formik.errors.subject_codename)
              }
              helperText={
                formik.touched.subject_codename &&
                formik.errors.subject_codename
              }
            />
          </Grid>
        </Grid>

        {/* Form Execution Menu */}
        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "#244e96",
              color: "#FFFFFF",
              fontWeight: "bold",
              py: 1.2,
              textTransform: "uppercase",
              "&:hover": { backgroundColor: "#1a3a70" },
            }}>
            {loading
              ? "Processing..."
              : edit
                ? "Save Subject Changes"
                : "Register Subject"}
          </Button>

          {edit && (
            <Button
              variant="text"
              fullWidth
              color="inherit"
              onClick={cancelEdit}
              sx={{
                fontWeight: "bold",
                textTransform: "none",
                color: "#5a6a85",
              }}>
              Cancel Modification
            </Button>
          )}
        </Box>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mt: 2, borderRadius: "8px" }}>
            {feedback.message}
          </Alert>
        )}
      </Paper>

      {/* 2. Listing Inventory Display Panel */}
      <Paper
        elevation={2}
        sx={{
          width: "100%",
          p: { xs: 3, md: 4 },
          borderRadius: "24px",
          backgroundColor: "#FFFFFF",
        }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#0f172a", mb: 4 }}>
          Curriculum Subject Catalog
        </Typography>

        <Grid container spacing={3}>
          {!subjects || subjects.length === 0 ? (
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  textAlign: "center",
                  my: 2,
                }}>
                No registered subject entities cataloged inside the system.
              </Typography>
            </Grid>
          ) : (
            subjects.map((x) => (
              <Grid item xs={12} sm={6} md={4} key={x._id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: "16px",
                    border: "1px solid #eef2f6",
                    backgroundColor: "#fdfdfd",
                    overflow: "hidden",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)",
                    },
                  }}>
                  {/* Subject Decorative Top Section */}
                  <Box
                    sx={{
                      backgroundColor: "#f8fafc",
                      borderBottom: "1px solid #eef2f6",
                      px: 2.5,
                      py: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}>
                    <BookIcon sx={{ color: "#244e96", fontSize: "1.25rem" }} />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", color: "#0f172a" }}>
                      {x.subject_name}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#475569", fontWeight: 500, mb: 3 }}>
                      Catalog ID Reference:{" "}
                      <strong>{x.subject_codename}</strong>
                    </Typography>

                    {/* Operational Row Execution Block */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        borderTop: "1px solid #f1f5f9",
                        pt: 1.5,
                      }}>
                      <Button
                        onClick={() =>
                          handleEdit(x._id, x.subject_name, x.subject_codename)
                        }
                        variant="text"
                        size="small"
                        startIcon={
                          <EditIcon sx={{ fontSize: "14px !important" }} />
                        }
                        sx={{
                          textTransform: "none",
                          color: "#475569",
                          fontWeight: "bold",
                          "&:hover": { color: "#244e96" },
                        }}>
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(x._id)}
                        variant="text"
                        size="small"
                        color="error"
                        startIcon={
                          <DeleteIcon sx={{ fontSize: "14px !important" }} />
                        }
                        sx={{ textTransform: "none", fontWeight: "bold" }}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
