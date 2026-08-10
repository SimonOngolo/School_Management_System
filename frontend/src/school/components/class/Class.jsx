import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useFormik } from "formik";
import { baseApi } from "../../../environment";
import { classSchema } from "../../../yupSchema/classSchema";
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
import ClassIcon from "@mui/icons-material/Class";

export default function Class() {
  const [classes, setClasses] = React.useState([]);
  const [edit, setEdit] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      class_text: "",
      class_num: "",
    },
    validationSchema: classSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let response;

        if (edit && editId) {
          response = await axios.patch(
            `${baseApi}/class/update/${editId}`,
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
            message: "Class modified successfully!",
          });
        } else {
          response = await axios.post(`${baseApi}/class/create`, values, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          setFeedback({
            type: "success",
            message: "Class created successfully!",
          });
        }

        resetForm();
        setEdit(false);
        setEditId(null);
        fetchClasses();
      } catch (error) {
        console.error("Error submitting class:", error);
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to save class. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApi}/class/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sorted = response.data.data.sort(
        (a, b) => Number(a.class_num) - Number(b.class_num),
      );
      setClasses(sorted);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleEdit = (id, class_num, class_text) => {
    setEdit(true);
    setEditId(id);
    formik.setValues({
      class_text,
      class_num,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEdit(false);
    setEditId(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${baseApi}/class/delete/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedback({
          type: "success",
          message: "Class deleted successfully!",
        });
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message ||
            "Failed to delete class. Please try again.",
        });
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#1e3d73", // Matching background foundation
        minHeight: "100vh",
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
      {/* 1. Class Registration Form Container */}
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
          {edit ? "Modify Class Record" : "New Class Entry Registration"}
        </Typography>

        {/* Form Inputs Row */}
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="class_text"
              label="Class Name / Text"
              placeholder="e.g. Class Two"
              value={formik.values.class_text}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.class_text && Boolean(formik.errors.class_text)
              }
              helperText={formik.touched.class_text && formik.errors.class_text}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="class_num"
              label="Class Number Index"
              placeholder="e.g. 2"
              type="number"
              value={formik.values.class_num}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.class_num && Boolean(formik.errors.class_num)
              }
              helperText={formik.touched.class_num && formik.errors.class_num}
            />
          </Grid>
        </Grid>

        {/* Submission Commands Group */}
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
                ? "Save Class Modifications"
                : "Register Class Record"}
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

      {/* 2. Directory Listing Container Panel */}
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
          Academic Class Directory Listing
        </Typography>

        <Grid container spacing={3}>
          {!classes || classes.length === 0 ? (
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  textAlign: "center",
                  my: 2,
                }}>
                No active class tracks found within database registers.
              </Typography>
            </Grid>
          ) : (
            classes.map((x) => (
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
                  {/* Decorative Title Area */}
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
                    <ClassIcon sx={{ color: "#244e96", fontSize: "1.25rem" }} />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", color: "#0f172a" }}>
                      {x.class_text}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 2.5 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "#475569", fontWeight: 500, mb: 3 }}>
                      Class Numeric Designation: <strong>{x.class_num}</strong>
                    </Typography>

                    {/* Operational Row Controls */}
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
                          handleEdit(x._id, x.class_num, x.class_text)
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
