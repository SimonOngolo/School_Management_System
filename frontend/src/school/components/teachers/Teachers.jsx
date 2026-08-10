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

import { teacherSchema } from "../../../yupSchema/teacherSchema";
import { baseApi } from "../../../environment";

export default function Teachers() {
  const [editId, setEditId] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [imageUrl, setImageUrl] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);
  const [params, setParams] = React.useState({});
  const [teachers, setTeachers] = React.useState([]);
  const [schools, setSchools] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fileInputRef = React.useRef(null);

  // --- API Handlers ---
  const fetchTeachers = () => {
    axios
      .get(`${baseApi}/teachers/fetch-width-query`, { params })
      .then((res) => setTeachers(res.data.data || res.data.teachers || []))
      .catch((e) => console.error("Failed to fetch teachers:", e));
  };

  const fetchSchools = () => {
    axios
      .get(`${baseApi}/schools/all`)
      .then((res) => setSchools(res.data.data || []))
      .catch((e) => console.error("Failed to fetch schools:", e));
  };

  React.useEffect(() => {
    fetchTeachers();
    fetchSchools();
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
    const teacherToEdit = teachers.find((x) => x._id === id);
    if (teacherToEdit) {
      setEditId(id);
      formik.setValues({
        name: teacherToEdit.name || "",
        email: teacherToEdit.email || "",
        qualification: teacherToEdit.qualification || "",
        age: teacherToEdit.age || "",
        gender: teacherToEdit.gender || "",
        school: teacherToEdit.school?._id || teacherToEdit.school || "",
        password: "",
        confirm_password: "",
      });
      if (teacherToEdit.teacher_image) {
        setImageUrl(`/images/uploaded/teachers/${teacherToEdit.teacher_image}`);
      } else {
        setImageUrl(null);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this teacher record?")
    ) {
      try {
        await axios.delete(`${baseApi}/teachers/delete/${id}`);
        setFeedback({
          type: "success",
          message: "Teacher deleted successfully!",
        });
        fetchTeachers();
      } catch (e) {
        setFeedback({ type: "error", message: "Failed to delete teacher." });
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
      name: "",
      email: "",
      qualification: "",
      age: "",
      gender: "",
      school: "",
      password: "",
      confirm_password: "",
    },
    validationSchema: teacherSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const fd = new FormData();
        if (file) fd.append("teacher_image", file, file.name);
        Object.keys(values).forEach((key) => {
          if (values[key] && key !== "confirm_password")
            fd.append(key, values[key]);
        });

        if (editId) {
          await axios.put(`${baseApi}/teachers/update/${editId}`, fd);
          setFeedback({
            type: "success",
            message: "Teacher updated successfully!",
          });
          setEditId(null);
        } else {
          await axios.post(`${baseApi}/teachers/register`, fd);
          setFeedback({
            type: "success",
            message: "Teacher registered successfully!",
          });
        }
        resetForm();
        handleClearFile();
        fetchTeachers();
      } catch (e) {
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
          {editId ? "Update Teacher Details" : "New Teacher Registration"}
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
            id="teacher-photo-upload"
          />
          <label htmlFor="teacher-photo-upload" style={{ width: "100%" }}>
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
                    Click to upload teacher portrait photo
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
            <TextField
              fullWidth
              size="small"
              name="qualification"
              label="Qualification"
              value={formik.values.qualification}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.qualification &&
                Boolean(formik.errors.qualification)
              }
              helperText={
                formik.touched.qualification && formik.errors.qualification
              }
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              name="age"
              label="Age"
              value={formik.values.age}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.age && Boolean(formik.errors.age)}
              helperText={formik.touched.age && formik.errors.age}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl
              fullWidth
              size="small"
              error={formik.touched.gender && Boolean(formik.errors.gender)}>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                label="Gender"
                value={formik.values.gender || ""}
                onChange={formik.handleChange}>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
              {formik.touched.gender && (
                <FormHelperText>{formik.errors.gender}</FormHelperText>
              )}
            </FormControl>
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
            {editId ? "Update Teacher Record" : "Register Teacher Record"}
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
          Teacher Directory Listing
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
          {teachers.length === 0 ? (
            <Grid item xs={12}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  textAlign: "center",
                  my: 2,
                }}>
                No teacher records detected inside system memory.
              </Typography>
            </Grid>
          ) : (
            teachers.map((t) => (
              <Grid item xs={12} sm={6} md={4} key={t._id}>
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
                      t.teacher_image
                        ? `/images/uploaded/teachers/${t.teacher_image}`
                        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200"
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
                      {t.name}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        color: "text.secondary",
                        fontWeight: 600,
                        mb: 1.5,
                      }}>
                      🏫 School:{" "}
                      {t.school?.school_name || t.school?.name || "Unassigned"}
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
                        ✉️ {t.email}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", display: "block" }}>
                        🎓 Qualification: {t.qualification || "N/A"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", display: "block" }}>
                        🎂 Age: {t.age || "N/A"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#475569", display: "block" }}>
                        👤 Gender: {t.gender || "N/A"}
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
                      onClick={() => handleEdit(t._id)}
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
                      onClick={() => handleDelete(t._id)}
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
