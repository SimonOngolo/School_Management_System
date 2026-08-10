import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// Stepping out 2 levels to access /src/environment.js
import { baseApi } from "../../../environment.js";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Grid,
  Divider,
} from "@mui/material";
// Premium UI Icons
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import CakeIcon from "@mui/icons-material/Cake";
import WcIcon from "@mui/icons-material/Wc";
import SchoolIcon from "@mui/icons-material/School";
import BadgeIcon from "@mui/icons-material/Badge";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PhoneIcon from "@mui/icons-material/Phone";

export default function StudentDetails() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Grab studentId from URL parameters if available (e.g., /students/details/:studentId)
  const { studentId } = useParams();

useEffect(() => {
  const fetchStudentProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      // If no studentId is provided in the URL params,
      // ensure we only call fetch-single if the user is actually a STUDENT.
      // If an admin accesses this route without an ID, prevent the 404 call.
      if (!studentId) {
        // Optional: decode token role if stored, or check route context
        const userRole = localStorage.getItem("role"); // Assuming role is stored on login
        if (userRole && userRole !== "STUDENT") {
          setLoading(false);
          return; // Exit cleanly so admins don't hit the student-only self route
        }
      }

      const endpoint = studentId
        ? `${baseApi}/students/fetch/${studentId}` // Matches your backend: router.get("/fetch/:id", ...)
        : `${baseApi}/students/fetch-single`; // Matches your backend: router.get("/fetch-single", ...)

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.student) {
        setStudent(response.data.student);
      } else {
        setStudent(response.data);
      }
    } catch (err) {
      console.error("Error retrieving student details:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load profile records from the database.",
      );
    } finally {
      setLoading(false);
    }
  };

  fetchStudentProfile();
}, [studentId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
        }}>
        <CircularProgress sx={{ color: "#0f172a" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 4,
          minHeight: "100vh",
          backgroundColor: "#f8fafc",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Alert severity="error" sx={{ width: "100%", maxWidth: "600px" }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Info Row Component for clean reuse
  const InfoDetailRow = ({ icon, label, value }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        py: 1.5,
        px: 1,
        transition: "all 0.2s ease",
        "&:hover": {
          backgroundColor: "rgba(241, 245, 249, 0.6)",
          borderRadius: "12px",
        },
      }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f1f5f9",
          color: "#475569",
          borderRadius: "12px",
          width: 40,
          height: 40,
          mr: 2.5,
          flexShrink: 0,
        }}>
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: "#94a3b8",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            fontSize: "0.7rem",
          }}>
          {label}
        </Typography>
        <Typography
          variant="body1"
          noWrap
          sx={{
            color: "#0f172a",
            fontWeight: 600,
            mt: 0.1,
            fontSize: "0.95rem",
          }}>
          {value || "N/A"}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        backgroundColor: "#f4f6f9",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 4,
        px: 2,
      }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "1100px",
          borderRadius: "32px",
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}>
        <Grid container>
          {/* Left Hero Profile Column */}
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 4,
              textAlign: "center",
              position: "relative",
            }}>
            {/* Ambient Background Accent Glow */}
            <Box
              sx={{
                position: "absolute",
                width: "150px",
                height: "150px",
                background: "rgba(163, 230, 53, 0.15)",
                filter: "blur(50px)",
                top: "10%",
                borderRadius: "50%",
              }}
            />

            <Avatar
              src={
                student?.student_image
                  ? `/images/uploaded/students/${student.student_image}`
                  : "https://via.placeholder.com/240"
              }
              alt={student?.name}
              sx={{
                width: 160,
                height: 160,
                border: "4px solid #a3e635",
                boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                mb: 2.5,
                zIndex: 1,
              }}
            />

            <Typography
              variant="h5"
              sx={{
                color: "#ffffff",
                fontWeight: 700,
                letterSpacing: "-0.5px",
                mb: 1,
                zIndex: 1,
              }}>
              {student?.name}
            </Typography>

            <Box
              sx={{
                backgroundColor: "rgba(163, 230, 53, 0.15)",
                border: "1px solid rgba(163, 230, 53, 0.3)",
                borderRadius: "100px",
                px: 2.5,
                py: 0.5,
                zIndex: 1,
              }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <SchoolIcon sx={{ fontSize: 16, color: "#a3e635" }} />
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{
                    color: "#a3e635",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                  }}>
                  Class: {student?.student_class?.class_text || "N/A"}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right Metrics Grid Column */}
          <Grid size={{ xs: 12, md: 8 }} sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <BadgeIcon sx={{ color: "#0f172a", mr: 1.5, fontSize: "26px" }} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.5px",
                }}>
                Profile Overview
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                mb: 2,
                fontWeight: 500,
                fontSize: "0.85rem",
              }}>
              Official student academic portfolio credentials and verification
              indexes registered within the system.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <InfoDetailRow
                icon={<PersonIcon />}
                label="Full Identity Name"
                value={student?.name}
              />
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <InfoDetailRow
                icon={<EmailIcon />}
                label="Email Node Location"
                value={student?.email}
              />
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoDetailRow
                    icon={<CakeIcon />}
                    label="Age Metric"
                    value={student?.age ? `${student.age} Years Old` : null}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoDetailRow
                    icon={<WcIcon />}
                    label="Gender Classification"
                    value={student?.gender}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <InfoDetailRow
                icon={<SchoolIcon />}
                label="Enrolled Class / Grade"
                value={
                  student?.student_class?.class_text
                    ? `${student.student_class.class_text} ${student.student_class?.class_num ? `(${student.student_class.class_num})` : ""}`
                    : "N/A"
                }
              />
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoDetailRow
                    icon={<SupervisorAccountIcon />}
                    label="Guardian Name"
                    value={student?.guardian}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <InfoDetailRow
                    icon={<PhoneIcon />}
                    label="Guardian Phone"
                    value={student?.guardian_phone}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
