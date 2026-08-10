import { Box, Typography, Divider, Container } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "#0F172A",
        color: "#94A3B8",
        py: 4,
        px: { xs: 2, md: 4 },
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
      }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            mb: 3,
          }}>
          {/* Brand/Logo Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
              }}>
              <SchoolOutlinedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "-0.5px",
                fontSize: "1.1rem",
              }}>
              School Management System
            </Typography>
          </Box>

          {/* Quick Links or Status */}
          <Typography variant="body2" sx={{ color: "#64748B" }}>
            Empowering education through seamless digital administration.
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 3 }} />

        {/* Copyright Row */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            textAlign: { xs: "center", sm: "left" },
          }}>
          <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
            Copyright &copy; {currentYear} School Management System. All rights
            reserved.
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.85rem", color: "#64748B" }}>
            Designed for Excellence
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
