import React, { useEffect, useState } from "react";
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

export default function TeacherDetails() {
  const [teacherDetails, setTeacherDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrentTeacherProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No authentication token found. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${baseApi}/teachers/fetch-single`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.teacher) {
          setTeacherDetails(response.data.teacher);
        } else {
          setTeacherDetails(response.data);
        }
      } catch (err) {
        console.error("Error retrieving active session teacher details:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load your profile records from the database.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentTeacherProfile();
  }, []);

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
        py: 2.2,
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
          width: 44,
          height: 44,
          mr: 3,
        }}>
        {icon}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "#94a3b8",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "#0f172a", fontWeight: 600, mt: 0.2 }}>
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
        py: 6,
        px: 2,
      }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: "1050px",
          borderRadius: "32px",
          backgroundColor: "#ffffff",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
          border: "1px solid rgba(226, 232, 240, 0.8)",
        }}>
        <Grid container>
          {/* Left Hero Profile Column */}
          <Grid
            item
            xs={12}
            md={4.5}
            sx={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 5,
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
                teacherDetails?.teacher_image
                  ? `/images/uploaded/teachers/${teacherDetails.teacher_image}`
                  : "https://via.placeholder.com/240"
              }
              alt={teacherDetails?.name}
              sx={{
                width: 190,
                height: 190,
                border: "4px solid #a3e635",
                boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                mb: 3,
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
              {teacherDetails?.name}
            </Typography>

            <Box
              sx={{
                backgroundColor: "rgba(163, 230, 53, 0.15)",
                border: "1px solid rgba(163, 230, 53, 0.3)",
                borderRadius: "100px",
                px: 2.5,
                py: 0.6,
                zIndex: 1,
              }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: "#a3e635",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}>
                Faculty Member
              </Typography>
            </Box>
          </Grid>

          {/* Right Metrics Grid Column */}
          <Grid item xs={12} md={7.5} sx={{ p: { xs: 3, sm: 6 } }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <BadgeIcon sx={{ color: "#0f172a", mr: 1.5, fontSize: "28px" }} />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.8px",
                }}>
                Profile Overview
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{ color: "#64748b", mb: 4, fontWeight: 500 }}>
              Official administrative portfolio credentials and verification
              indexes registered within the system.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <InfoDetailRow
                icon={<PersonIcon />}
                label="Full Identity Name"
                value={teacherDetails?.name}
              />
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <InfoDetailRow
                icon={<EmailIcon />}
                label="Email Node Location"
                value={teacherDetails?.email}
              />
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <Grid container>
                <Grid item xs={12} sm={6}>
                  <InfoDetailRow
                    icon={<CakeIcon />}
                    label="Age Metric"
                    value={
                      teacherDetails?.age
                        ? `${teacherDetails.age} Years Old`
                        : null
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoDetailRow
                    icon={<WcIcon />}
                    label="Gender Classification"
                    value={teacherDetails?.gender}
                  />
                </Grid>
              </Grid>
              <Divider sx={{ borderColor: "#f1f5f9" }} />

              <InfoDetailRow
                icon={<SchoolIcon />}
                label="Professional Core Qualification"
                value={teacherDetails?.qualification}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
