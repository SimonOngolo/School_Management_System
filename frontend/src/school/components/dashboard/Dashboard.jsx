import { useEffect, useState, useRef } from "react";
import { baseApi } from "../../../environment";
import {
  Box,
  Typography,
  Button,
  CardMedia,
  Paper,
  TextField,
  Alert,
  Snackbar,
  IconButton,
  Fade,
  Container,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import React from "react";

// ICONS
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraBackIcon from "@mui/icons-material/PhotoCameraBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [school, setSchool] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [edit, setEdit] = useState(false);

  const fileInputRef = useRef(null);

  const addImage = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setImageUrl(URL.createObjectURL(selectedFile));
      setFile(selectedFile);
    }
  };

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setFile(null);
    setImageUrl(null);
  };

  const handleEditSubmit = () => {
    if (!schoolName.trim()) {
      setFeedback({ type: "error", message: "School name cannot be empty." });
      return;
    }

    setLoading(true);
    const fd = new FormData();
    if (file) {
      fd.append("image", file, file.name);
    }
    fd.append("school_name", schoolName);

    const token = localStorage.getItem("token");
    axios
      .patch(`${baseApi}/school/update`, fd, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((resp) => {
        setFeedback({
          type: "success",
          message: "School updated successfully!",
        });
        setEdit(false);
        handleClearFile();
        fetchSchool();
      })
      .catch((err) => {
        console.error("Error editing school:", err);
        setFeedback({
          type: "error",
          message:
            err.response?.data?.message || "Error updating school profile.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const cancelEdit = () => {
    setEdit(false);
    if (school) {
      setSchoolName(school.school_name || "");
    }
    handleClearFile();
  };

  const fetchSchool = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setFetching(false);
      return;
    }

    axios
      .get(`${baseApi}/school/fetch-single`, {
        headers: { Authorization: token },
      })
      .then((resp) => {
        setSchool(resp.data.school);
        setSchoolName(resp.data.school?.school_name || "");
      })
      .catch((e) => {
        console.error("Error fetching the school:", e);
        setFeedback({
          type: "error",
          message: "Failed to load school profile.",
        });
      })
      .finally(() => {
        setFetching(false);
      });
  };

  useEffect(() => {
    fetchSchool();
  }, []);

  if (fetching) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#F8FAFC", minHeight: "100vh", pb: 6 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* Header Title Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
          }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#1E293B",
                letterSpacing: "-0.5px",
              }}>
              School Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
              Manage your institution profile and visual branding
            </Typography>
          </Box>
        </Box>

        {/* Snackbar Notification Feedbacks */}
        {feedback && (
          <Snackbar
            open={true}
            autoHideDuration={4000}
            onClose={() => setFeedback(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}>
            <Alert
              onClose={() => setFeedback(null)}
              severity={feedback.type}
              sx={{
                width: "100%",
                borderRadius: 2,
                boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
              }}>
              {feedback.message}
            </Alert>
          </Snackbar>
        )}

        {/* Edit Modal Overlay Form */}
        {edit && (
          <Box
            sx={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(6px)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1300,
              p: 2,
            }}>
            <Fade in={edit}>
              <Paper
                elevation={12}
                sx={{
                  width: "100%",
                  maxWidth: "520px",
                  padding: { xs: 3, sm: 4 },
                  borderRadius: 4,
                  backgroundColor: "#fff",
                  position: "relative",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
                }}
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditSubmit();
                }}>
                {/* Close Button */}
                <IconButton
                  onClick={cancelEdit}
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    color: "#64748B",
                    backgroundColor: "#F1F5F9",
                    "&:hover": { backgroundColor: "#E2E8F0" },
                  }}>
                  <CloseIcon fontSize="small" />
                </IconButton>

                <Typography
                  variant="h5"
                  sx={{ fontWeight: 800, color: "#1E293B", mb: 1 }}>
                  Edit School Profile
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748B", mb: 3 }}>
                  Update your school name and display banner image.
                </Typography>

                {/* File Picker Selection Area */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#334155", mb: 1.5 }}>
                    School Banner Picture
                  </Typography>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<PhotoCameraBackIcon />}
                    sx={{
                      width: "100%",
                      py: 1.5,
                      borderStyle: "dashed",
                      borderWidth: 2,
                      borderColor: "#CBD5E1",
                      borderRadius: 2,
                      color: "#475569",
                      textTransform: "none",
                      fontWeight: 600,
                      backgroundColor: "#F8FAFC",
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: "#F0F9FF",
                      },
                    }}>
                    Upload New Image
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={addImage}
                      accept="image/*"
                      hidden
                    />
                  </Button>
                </Box>

                {/* Preview Display Container */}
                {(imageUrl || school?.school_image) && (
                  <Box sx={{ mb: 3, position: "relative" }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={
                        imageUrl ||
                        `/images/uploaded/schools/${school.school_image}`
                      }
                      sx={{
                        borderRadius: 2,
                        objectFit: "cover",
                        border: "1px solid #E2E8F0",
                      }}
                    />
                    {imageUrl && (
                      <Button
                        size="small"
                        color="error"
                        variant="contained"
                        onClick={handleClearFile}
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          textTransform: "none",
                          fontSize: "0.75rem",
                        }}>
                        Remove New Image
                      </Button>
                    )}
                  </Box>
                )}

                {/* School Name Text Field */}
                <TextField
                  label="School Name"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: 2, backgroundColor: "#F8FAFC" },
                  }}
                />

                {/* Action Buttons Row */}
                <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                    }}>
                    {loading ? "Saving Changes..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={cancelEdit}
                    fullWidth
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      textTransform: "none",
                      borderColor: "#CBD5E1",
                      color: "#475569",
                    }}>
                    Cancel
                  </Button>
                </Box>
              </Paper>
            </Fade>
          </Box>
        )}

        {/* School Showcase Banner Hero Card */}
        {school && (
          <Paper
            elevation={0}
            sx={{
              height: "420px",
              width: "100%",
              backgroundImage: `linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%), url(/images/uploaded/schools/${school.school_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
              borderRadius: 4,
              overflow: "hidden",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              p: { xs: 3, md: 5 },
            }}>
            {/* Status Badge */}
            <Box
              sx={{
                position: "absolute",
                top: 24,
                left: 24,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                px: 2,
                py: 0.75,
                borderRadius: 50,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}>
              <CheckCircleIcon sx={{ color: "#38BDF8", fontSize: 18 }} />
              <Typography
                variant="caption"
                sx={{ color: "#fff", fontWeight: 600, letterSpacing: "0.5px" }}>
                Verified Institution Portal
              </Typography>
            </Box>

            {/* School Name & Info */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                width: "100%",
              }}>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    color: "#fff",
                    fontWeight: 800,
                    letterSpacing: "-1px",
                    fontSize: { xs: "1.75rem", md: "2.5rem" },
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}>
                  {school.school_name}
                </Typography>
                <Typography variant="body2" sx={{ color: "#94A3B8", mt: 0.5 }}>
                  Administered via School Management System Platform
                </Typography>
              </Box>

              {/* Floating Edit Button */}
              <IconButton
                color="primary"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(8px)",
                  color: "#0F172A",
                  borderRadius: "50%",
                  width: 56,
                  height: 56,
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#FFFFFF",
                    transform: "scale(1.05)",
                  },
                }}
                onClick={() => setEdit(true)}>
                <EditIcon />
              </IconButton>
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
