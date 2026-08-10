import axios from "axios";
import * as React from "react";
import { baseApi } from "../../../environment";
import {
  Box,
  Typography,
  Alert,
  Card,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";

// ICONS
import CampaignIcon from "@mui/icons-material/Campaign";

export default function NoticeStudent() {
  const [notices, setnotices] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Auth Guard: Verify user role on load
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "STUDENT") {
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

      // Updated filter to include "all" and "everyone" alongside students
      const filtered = (response.data.data || []).filter((n) => {
        const aud = (n.audience || "").toLowerCase().trim();
        return (
          ["students", "student"].includes(aud) ||
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
          Access Denied. Only Students are permitted to view these notices.
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
        <CampaignIcon sx={{ color: "#2563EB", fontSize: "2.5rem" }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Student Notice Board
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ maxWidth: 1200, mx: "auto" }}>
        {notices.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary">
              No notices found for students.
            </Typography>
          </Grid>
        ) : (
          notices.map((x) => (
            <Grid item xs={12} sm={6} md={4} key={x._id}>
              <Card
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: 3,
                  boxShadow: "0 4px 6px -1px rgb(0 0 / 0.1)",
                }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {x.title || x.Title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", whiteSpace: "pre-line" }}>
                    {x.message}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
}
