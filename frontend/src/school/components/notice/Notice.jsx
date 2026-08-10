import axios from "axios";
import * as React from "react";
import { baseApi } from "../../../environment";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  MenuItem,
} from "@mui/material";
import { useFormik } from "formik";
import { noticeSchema } from "../../../yupSchema/noticeSchema";
import { useEffect } from "react";

// ICONS
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CampaignIcon from "@mui/icons-material/Campaign";

export default function Notice() {
  const [notices, setnotices] = React.useState([]);
  const [edit, setEdit] = React.useState(false);
  const [editId, setEditId] = React.useState(null);
  const [filter, setFilter] = React.useState("all");

  const [feedback, setFeedback] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      title: "",
      message: "",
      audience: "all",
    },
    validationSchema: noticeSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      setFeedback(null);
      try {
        const token = localStorage.getItem("token");
        const targetAudience = values.audience;

        const payload = {
          title: values.title,
          Title: values.title,
          message: values.message,
          audience: targetAudience,
        };

        if (edit && editId) {
          await axios.patch(`${baseApi}/notice/update/${editId}`, payload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          setFeedback({
            type: "success",
            message: "Notice modified successfully!",
          });
        } else {
          await axios.post(`${baseApi}/notice/create`, payload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          setFeedback({
            type: "success",
            message: "Notice created successfully!",
          });
        }

        resetForm();
        setEdit(false);
        setEditId(null);

        // Auto-switch tab to the specific bucket you just populated
        setFilter(targetAudience);

        fetchnotices();
      } catch (error) {
        console.error("Form submission failed!", error);
        setFeedback({
          type: "error",
          message:
            error.response?.data?.message || "Failed to save notice record.",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchnotices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApi}/notice/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.data.length === 0 && response.data.message) {
        setnotices([]);
        return;
      }

      const sorted = response.data.data.sort(
        (a, b) =>
          new Date(b.createdAt || b.createAt || 0) -
          new Date(a.createdAt || a.createAt || 0),
      );
      setnotices(sorted);
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  useEffect(() => {
    fetchnotices();
  }, []);

  const handleEdit = (id, message, title, audience) => {
    setEdit(true);
    setEditId(id);
    formik.setValues({
      title: title || "",
      message: message || "",
      audience: audience || "all",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEdit(false);
    setEditId(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseApi}/notice/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback({ type: "success", message: "Notice deleted successfully!" });
      fetchnotices();
    } catch (error) {
      console.error("Error deleting notice:", error);
    }
  };

  const getFilterLabel = () => {
    if (filter === "students") return "Students";
    if (filter === "teachers") return "Teachers";
    return "All";
  };

  const getFilterColor = () => {
    if (filter === "students") return "#16A34A";
    if (filter === "teachers") return "#D97706";
    return "#1976D2";
  };

  // Helper function to handle filter matching rules
  const matchesFilter = (noticeAudience) => {
    const normalizedAudience = (noticeAudience || "").toLowerCase().trim();
    const normalizedFilter = filter.toLowerCase().trim();

    // If filter is "all", show everything
    if (normalizedFilter === "all") return true;

    // If notice audience is "all" or "everyone", show it in both student and teacher tabs
    if (normalizedAudience === "all" || normalizedAudience === "everyone") {
      return true;
    }

    // Exact or singular/plural match (e.g., "student" vs "students")
    return (
      normalizedAudience === normalizedFilter ||
      normalizedAudience === normalizedFilter.replace(/s$/, "")
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        width: "100%",
        color: "#1E293B",
        p: { xs: 2, md: 5 },
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}>
      {/* Header Area */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          mb: 4,
        }}>
        <CampaignIcon sx={{ color: "#1976D2", fontSize: "2.5rem" }} />
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px" }}>
          Notice Board Management
        </Typography>
      </Box>

      {/* Input Form Card */}
      <Card
        elevation={0}
        sx={{
          width: "100%",
          mx: "auto",
          mb: 4,
          borderRadius: "12px",
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
        }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <form onSubmit={formik.handleSubmit}>
            <Typography
              variant="h6"
              sx={{ color: "#0F172A", fontWeight: 700, mb: 3 }}>
              {edit ? "✏️ Modify Selected Notice" : "Create New Notice"}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Notice Title"
                  placeholder="Enter notice title description..."
                  variant="outlined"
                  fullWidth
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F8FAFC",
                      borderRadius: "8px",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  name="audience"
                  label="Select Audience"
                  value={formik.values.audience}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.audience && Boolean(formik.errors.audience)
                  }
                  helperText={formik.touched.audience && formik.errors.audience}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F8FAFC",
                      borderRadius: "8px",
                    },
                  }}>
                  <MenuItem value="all">Everyone (All)</MenuItem>
                  <MenuItem value="students">Student Body</MenuItem>
                  <MenuItem value="teachers">Faculty Staff</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  name="message"
                  label="Notice Body Message"
                  placeholder="Write your complete notice announcement description text details here..."
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={8}
                  value={formik.values.message}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.message && Boolean(formik.errors.message)
                  }
                  helperText={formik.touched.message && formik.errors.message}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#F8FAFC",
                      borderRadius: "8px",
                    },
                  }}
                />
              </Grid>
            </Grid>

            {Object.keys(formik.errors).length > 0 &&
              formik.submitCount > 0 && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 3,
                    borderRadius: "8px",
                    border: "1px solid #FCA5A5",
                  }}>
                  <div style={{ fontWeight: "bold" }}>
                    Validation Errors Found:
                  </div>
                  {formik.errors.title && <div>• {formik.errors.title}</div>}
                  {formik.errors.message && (
                    <div>• {formik.errors.message}</div>
                  )}
                  {formik.errors.audience && (
                    <div>• {formik.errors.audience}</div>
                  )}
                </Alert>
              )}

            <Box
              sx={{
                display: "flex",
                gap: 2,
                mt: 4,
                justifyContent: "flex-start",
              }}>
              <Button
                type="submit"
                disabled={loading}
                variant="contained"
                sx={{
                  backgroundColor: "#1976D2",
                  color: "#FFFFFF",
                  textTransform: "none",
                  px: 4,
                  py: 1.2,
                  borderRadius: "8px",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": { backgroundColor: "#1565C0", boxShadow: "none" },
                }}>
                {edit
                  ? loading
                    ? "Saving..."
                    : "Save Changes"
                  : loading
                    ? "Publishing..."
                    : "ADD NOTICE"}
              </Button>

              {edit && (
                <Button
                  onClick={cancelEdit}
                  variant="outlined"
                  sx={{
                    color: "#64748B",
                    borderColor: "#CBD5E1",
                    textTransform: "none",
                    px: 4,
                    borderRadius: "8px",
                    "&:hover": {
                      borderColor: "#94A3B8",
                      backgroundColor: "#F1F5F9",
                    },
                  }}>
                  Cancel
                </Button>
              )}
            </Box>

            {feedback && (
              <Alert
                severity={feedback.type}
                sx={{ mt: 3, borderRadius: "8px" }}>
                {feedback.message}
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Control Navigation Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 2,
          mb: 4,
          gap: 2,
        }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 600, color: "#0F172A", letterSpacing: "-1px" }}>
          Notice For{" "}
          <span style={{ color: getFilterColor() }}>{getFilterLabel()}</span>
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
          {["students", "teachers", "all"].map((type) => (
            <Button
              key={type}
              onClick={() => setFilter(type)}
              variant="outlined"
              size="small"
              sx={{
                borderColor: filter === type ? getFilterColor() : "#CBD5E1",
                color: filter === type ? getFilterColor() : "#64748B",
                textTransform: "uppercase",
                px: 2.5,
                py: 0.8,
                borderRadius: "6px",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "0.5px",
                backgroundColor: filter === type ? "#FFFFFF" : "transparent",
                boxShadow:
                  filter === type ? "0 2px 4px rgb(0 0 0 / 0.05)" : "none",
                "&:hover": {
                  borderColor: filter === type ? getFilterColor() : "#94A3B8",
                  backgroundColor: "#F8FAFC",
                },
              }}>
              {type === "all"
                ? "ALL NOTICES"
                : type === "students"
                  ? "STUDENT NOTICES"
                  : "TEACHER NOTICES"}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Grid Layout Cards */}
      <Grid container spacing={3}>
        {notices.filter((n) => matchesFilter(n.audience)).length === 0 ? (
          <Grid item xs={12}>
            <Box
              sx={{
                fontStyle: "italic",
                color: "#64748B",
                p: 4,
                textAlign: "center",
                backgroundColor: "#FFFFFF",
                borderRadius: "8px",
                border: "1px dashed #CBD5E1",
              }}>
              No specific notices active inside this tab.
            </Box>
          </Grid>
        ) : (
          notices
            .filter((n) => matchesFilter(n.audience))
            .map((x) => (
              <Grid item xs={12} sm={6} lg={4} key={x._id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: "12px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.05)",
                    },
                  }}>
                  <Box
                    sx={{
                      borderBottom: "1px solid #F1F5F9",
                      px: 3,
                      py: 2,
                      backgroundColor: "#F8FAFC",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: "#1E293B" }}>
                      {x.title || x.Title}
                    </Typography>
                    {x.audience && (
                      <Box
                        sx={{
                          backgroundColor: ["teachers", "teacher"].includes(
                            x.audience.toLowerCase(),
                          )
                            ? "#FEF3C7"
                            : ["students", "student"].includes(
                                  x.audience.toLowerCase(),
                                )
                              ? "#DCFCE7"
                              : "#E0F2FE",
                          color: ["teachers", "teacher"].includes(
                            x.audience.toLowerCase(),
                          )
                            ? "#D97706"
                            : ["students", "student"].includes(
                                  x.audience.toLowerCase(),
                                )
                              ? "#16A34A"
                              : "#0284C7",
                          fontSize: "11px",
                          fontWeight: 700,
                          px: 1.5,
                          py: 0.4,
                          borderRadius: "12px",
                          textTransform: "uppercase",
                        }}>
                        {x.audience}
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#475569",
                        mb: 3,
                        minHeight: "60px",
                        lineHeight: 1.6,
                      }}>
                      {x.message}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                        borderTop: "1px solid #F1F5F9",
                        pt: 2,
                      }}>
                      <Button
                        onClick={() =>
                          handleEdit(
                            x._id,
                            x.message,
                            x.title || x.Title,
                            x.audience,
                          )
                        }
                        variant="text"
                        size="small"
                        startIcon={<EditIcon />}
                        sx={{
                          textTransform: "none",
                          color: "#475569",
                          "&:hover": { color: "#1976D2" },
                        }}>
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(x._id)}
                        variant="text"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        sx={{
                          textTransform: "none",
                          "&:hover": { backgroundColor: "#FEF2F2" },
                        }}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
        )}
      </Grid>
    </Box>
  );
}
