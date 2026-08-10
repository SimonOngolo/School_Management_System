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
  Grid,
  CircularProgress,
} from "@mui/material";
import { useFormik } from "formik";
import { noticeSchema } from "../../../yupSchema/noticeSchema";
import { useEffect, useState } from "react";

// ICONS
import CampaignIcon from "@mui/icons-material/Campaign";

export default function NoticeTeacher() {
  const [notices, setnotices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Auth Guard: Verify user role on load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "TEACHER") {
      setIsAuthorized(true);
      fetchnotices();
    } else {
      setIsAuthorized(false);
    }
    setCheckingAuth(false);
  }, []);

  const fetchnotices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${baseApi}/notice/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filtered = (response.data.data || []).filter((n) => {
        const aud = (n.audience || "").toLowerCase().trim();
        return (
          ["teachers", "teacher"].includes(aud) ||
          ["all", "everyone"].includes(aud)
        );
      });

      setnotices(
        filtered.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        ),
      );
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  const formik = useFormik({
    initialValues: { title: "", message: "", audience: "teachers" },
    validationSchema: noticeSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const payload = {
          title: values.title,
          message: values.message,
          audience: "teachers",
        };

        await axios.post(`${baseApi}/notice/create`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedback({
          type: "success",
          message: "Notice created successfully!",
        });
        resetForm();
        fetchnotices();
      } catch (error) {
        setFeedback({
          type: "error",
          message: error.response?.data?.message || "Action failed.",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  if (checkingAuth)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );

  if (!isAuthorized) {
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <Alert severity="error">
          Access Denied. Only Teachers are permitted to manage these notices.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        p: { xs: 2, md: 5 },
      }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          mb: 4,
        }}>
        <CampaignIcon sx={{ color: "#D97706", fontSize: "2.5rem" }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Teacher Notice Board
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 800, mx: "auto", mb: 4, p: 2 }}>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            name="title"
            label="Title"
            value={formik.values.title}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.title && Boolean(formik.errors.title)}
            helperText={formik.touched.title && formik.errors.title}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            name="message"
            label="Message"
            value={formik.values.message}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.message && Boolean(formik.errors.message)}
            helperText={formik.touched.message && formik.errors.message}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: "#D97706" }}>
              {loading ? "Processing..." : "Publish Notice"}
            </Button>
          </Box>
          {feedback && (
            <Alert severity={feedback.type} sx={{ mt: 2 }}>
              {feedback.message}
            </Alert>
          )}
        </form>
      </Card>

      <Grid container spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
        {notices.map((x) => (
          <Grid item xs={12} sm={6} md={4} key={x._id}>
            <Card
              sx={{
                p: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {x.title || x.Title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ my: 2, color: "text.secondary" }}>
                  {x.message}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
