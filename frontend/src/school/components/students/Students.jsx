import * as React from "react";
import { useFormik } from "formik";
import axios from "axios";
import {
  Box,
  TextField,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Alert,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Button,
  Grid,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";

import { studentSchema } from "../../../yupSchema/studentSchema";
import { baseApi } from "../../../environment";

export default function Students() {
  const [editId, setEditId] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [imageUrl, setImageUrl] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [params, setParams] = React.useState({});
  const [students, setStudents] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fileInputRef = React.useRef(null);
  // --- API Handlers ---
  const fetchStudents = () => {
    const token = localStorage.getItem("token");
    axios
      .get(`${baseApi}/students/fetch-width-query`, {
        params,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
      .then((res) => setStudents(res.data.data || res.data.students || []))
      .catch((e) => console.error("Failed to fetch students:", e));
  };

  const fetchFields = () => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:3002/api/groups", {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
      .then((res) => setFields(res.data.data || res.data || []))
      .catch((e) => console.error("Failed to fetch fields:", e));
  };

  React.useEffect(() => {
    fetchStudents();
    fetchFields();
  }, [params]);

  // --- UI Helpers ---
  const addImage = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setImageUrl(URL.createObjectURL(selectedFile));
      setFile(selectedFile);
    }
  };

  const handleClearFile = () => {
    if (fileInputRef.current) fileInputRef.current.value = null;
    setFile(null);
    setImageUrl(null);
  };

  const handleEdit = (id) => {
    const studentToEdit = students.find((x) => x._id === id);
    if (studentToEdit) {
      setEditId(id);
      formik.setValues({
        name: studentToEdit.name || "",
        email: studentToEdit.email || "",
        groupe: studentToEdit.groupe || "",
        date_naissance: studentToEdit.date_naissance || "",
        lieu_naissance: studentToEdit.lieu_naissance || "",
        bac: studentToEdit.bac || "",
        ecole_origine: studentToEdit.ecole_origine || "",
        password: "",
        confirm_password: "",
      });
      if (studentToEdit.student_image) {
        setImageUrl(`/images/uploaded/students/${studentToEdit.student_image}`);
      } else {
        setImageUrl(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this student record?")
    ) {
      try {
        await axios.delete(`${baseApi}/students/delete/${id}`);
        setFeedback({
          type: "success",
          message: "Student deleted successfully!",
        });
        fetchStudents();
      } catch (e) {
        setFeedback({ type: "error", message: "Failed to delete student." });
      }
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setParams((prev) => ({ ...prev, search: value || undefined }));
  };

  // --- Form Logic ---
  const formik = useFormik({
    initialValues: {
      email: "",
      name: "",
      groupe: "",
      date_naissance: "",
      lieu_naissance: "",
      bac: "",
      ecole_origine: "",
      password: "",
      confirm_password: "",
    },
    validationSchema: studentSchema,
    onSubmit: async (values, { resetForm }) => {
      console.log("Form submitted with values:", values);
      try {
        const fd = new FormData();
        if (file) fd.append("image", file, file.name);
        Object.keys(values).forEach((key) => {
          if (values[key] && key !== "confirm_password")
            fd.append(key, values[key]);
        });

        console.log("Sending API request...");
        if (editId) {
          await axios.put(`${baseApi}/students/update/${editId}`, fd);
          setFeedback({
            type: "success",
            message: "Student updated successfully!",
          });
          setEditId(null);
        } else {
          await axios.post(`${baseApi}/students/register`, fd);
          setFeedback({
            type: "success",
            message: "Student registered successfully!",
          });
        }
        resetForm();
        handleClearFile();
        fetchStudents();
      } catch (e) {
        console.error("API Error:", e);
        setFeedback({
          type: "error",
          message: e.response?.data?.message || "Submission failed.",
        });
      }
    },
  });

  return (
    <Box
      sx={{
        backgroundColor: "#1e3d73",
        minHeight: "100vh",
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}>
      {/* 1. Registration White Container Card */}
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
          {editId ? "Update Student Details" : "New Student Registration"}
        </Typography>

        {/* Dynamic Image Upload Zone */}
        <Box
          sx={{
            mb: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={addImage}
            accept="image/*"
            style={{ display: "none" }}
            id="student-photo-upload"
          />
          <label htmlFor="student-photo-upload" style={{ width: "100%" }}>
            <Box
              sx={{
                border: "1px dashed #b5c2d6",
                borderRadius: "12px",
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                transition: "background-color 0.2s",
                "&:hover": { backgroundColor: "#f0f4f8" },
              }}>
              {imageUrl ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}>
                  <CardMedia
                    component="img"
                    image={imageUrl}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #10316b",
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="error"
                    onClick={(e) => {
                      e.preventDefault();
                      handleClearFile();
                    }}
                    sx={{ fontWeight: "bold" }}>
                    Remove Photo
                  </Typography>
                </Box>
              ) : (
                <>
                  <UploadIcon sx={{ color: "#788da8", fontSize: "2rem" }} />
                  <Typography
                    variant="body2"
                    sx={{ color: "#4a5568", fontSize: "0.85rem" }}>
                    Click to upload student portrait photo
                  </Typography>
                </>
              )}
            </Box>
          </label>
        </Box>

        {/* Input Fields Grid Layout */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              name="name"
              label="Full Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              name="email"
              label="Email Address"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              size="small"
              error={formik.touched.groupe && Boolean(formik.errors.groupe)}>
              <InputLabel>Field</InputLabel>
              <Select
                name="groupe"
                label="Field"
                value={formik.values.groupe || ""}
                onChange={formik.handleChange}>
                {fields.map((fieldItem, index) => {
                  const fieldVal = fieldItem.name || fieldItem;
                  return (
                    <MenuItem key={index} value={fieldVal}>
                      {fieldVal}
                    </MenuItem>
                  );
                })}
              </Select>
              {formik.touched.groupe && (
                <FormHelperText>{formik.errors.groupe}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              name="date_naissance"
              label="Date of Birth"
              placeholder="DD/MM/YYYY"
              value={formik.values.date_naissance}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.date_naissance &&
                Boolean(formik.errors.date_naissance)
              }
              helperText={
                formik.touched.date_naissance && formik.errors.date_naissance
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              name="lieu_naissance"
              label="Place of Birth"
              value={formik.values.lieu_naissance}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.lieu_naissance &&
                Boolean(formik.errors.lieu_naissance)
              }
              helperText={
                formik.touched.lieu_naissance && formik.errors.lieu_naissance
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              name="bac"
              label="Baccalaureate"
              value={formik.values.bac}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bac && Boolean(formik.errors.bac)}
              helperText={formik.touched.bac && formik.errors.bac}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              name="ecole_origine"
              label="Origin School"
              value={formik.values.ecole_origine}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.ecole_origine &&
                Boolean(formik.errors.ecole_origine)
              }
              helperText={
                formik.touched.ecole_origine && formik.errors.ecole_origine
              }
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="password"
              label="Password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              name="confirm_password"
              label="Confirm Password"
              type="password"
              value={formik.values.confirm_password}
              onChange={formik.handleChange}
            />
          </Grid>
        </Grid>

        {/* Form Action Commands */}
        <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#244e96",
              color: "#FFFFFF",
              fontWeight: "bold",
              py: 1.2,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              "&:hover": { backgroundColor: "#1a3a70" },
            }}>
            {editId ? "Update Student Record" : "Register Student Record"}
          </Button>

          {editId && (
            <Button
              variant="text"
              fullWidth
              color="inherit"
              onClick={() => {
                setEditId(null);
                formik.resetForm();
                handleClearFile();
              }}
              sx={{
                fontWeight: "bold",
                textTransform: "none",
                color: "#5a6a85",
              }}>
              Cancel Changes
            </Button>
          )}
        </Box>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mt: 2, borderRadius: "8px" }}>
            {feedback.message}
          </Alert>
        )}
      </Paper>

      {/* 2. Directory White Container Card */}
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
          sx={{ fontWeight: "bold", color: "#0f172a", mb: 3 }}>
          Student Directory Listing
        </Typography>

        {/* Realtime Filtration Input Field */}
        <Box sx={{ maxWidth: "340px", mb: 4 }}>
          <TextField
            fullWidth
            size="small"
            label="Search Directory by Name"
            value={searchTerm}
            onChange={handleSearch}
          />
        </Box>

        {/* Grid Loop */}
        <Grid container spacing={3}>
          {students.length === 0 ? (
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  textAlign: "center",
                  my: 2,
                }}>
                No student records detected inside system memory.
              </Typography>
            </Grid>
          ) : (
            students.map((s) => (
              <Grid item xs={12} sm={6} md={4} key={s._id}>
                <Card
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "16px",
                    border: "1px solid #eef2f6",
                    backgroundColor: "#fdfdfd",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}>
                  <CardMedia
                    component="img"
                    image={
                      s.student_image
                        ? `/images/uploaded/students/${s.student_image}`
                        : "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200"
                    }
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      objectFit: "cover",
                      mb: 2,
                      border: "1px solid #e2e8f0",
                    }}
                  />

                  <CardContent sx={{ p: 0, width: "100%", flexGrow: 1 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", color: "#0f172a" }}>
                      {s.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "text.secondary",
                        fontWeight: 600,
                        mb: 1.5,
                      }}>
                      🏫 Field: {s.groupe || "Unassigned"}
                    </Typography>

                    <Box
                      sx={{
                        borderTop: "1px solid #f1f5f9",
                        pt: 1.5,
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                      }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#475569",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        ✉️ {s.email}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", display: "block" }}>
                        📅 Birth: {s.date_naissance || "N/A"} (
                        {s.lieu_naissance || "N/A"})
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", display: "block" }}>
                        🎓 Bac: {s.bac || "N/A"} • School:{" "}
                        {s.ecole_origine || "N/A"}
                      </Typography>
                    </Box>
                  </CardContent>

                  {/* Operational Controls Footer Block */}
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                      gap: 1,
                      mt: 2,
                      pt: 1,
                      borderTop: "1px solid #f8fafc",
                    }}>
                    <Button
                      size="small"
                      startIcon={
                        <EditIcon sx={{ fontSize: "14px !important" }} />
                      }
                      onClick={() => handleEdit(s._id)}
                      sx={{
                        textTransform: "none",
                        color: "#244e96",
                        fontWeight: "bold",
                      }}>
                      EDIT
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={
                        <DeleteIcon sx={{ fontSize: "14px !important" }} />
                      }
                      onClick={() => handleDelete(s._id)}
                      sx={{ textTransform: "none", fontWeight: "bold" }}>
                      DELETE
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>
    </Box>
  );
}
