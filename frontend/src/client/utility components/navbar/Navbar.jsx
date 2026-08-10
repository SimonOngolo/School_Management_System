import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import SchoolIcon from "@mui/icons-material/School";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useTheme } from "@mui/material/styles";

import { useNavigate } from "react-router-dom";
import { ColorModeContext } from "./ThemeContext";

const pages = [
  { link: "/", component: "Home" },
  { link: "/login", component: "Login" },
  { link: "/register", component: "Register" },
];

export default function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const navigate = useNavigate();

  const theme = useTheme();
  const { toggleColorMode } = React.useContext(ColorModeContext);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = (link) => {
    setAnchorElNav(null);
    if (link) {
      navigate(link);
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === "dark" ? "#0F172A" : "#FFFFFF",
        color: theme.palette.mode === "dark" ? "#F8FAFC" : "#0F172A",
        borderBottom:
          theme.palette.mode === "dark"
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(12px)",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1 }}>
          {/* Desktop Logo Icon */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              mr: 1.5,
              color: "primary.main",
            }}>
            <SchoolIcon sx={{ fontSize: 28 }} />
          </Box>

          {/* Desktop Title */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
            sx={{
              mr: 4,
              display: { xs: "none", md: "flex" },
              fontFamily: "Inter, sans-serif",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "inherit",
              textDecoration: "none",
              fontSize: "1.2rem",
            }}>
            EduManage
          </Typography>

          {/* Mobile Menu Toggle Button */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit">
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={() => handleCloseNavMenu(null)}
              sx={{
                display: { xs: "block", md: "none" },
                "& .MuiPaper-root": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#0F172A" : "#FFFFFF",
                  color: theme.palette.mode === "dark" ? "#F8FAFC" : "#0F172A",
                  borderRadius: 2,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  mt: 1.5,
                  minWidth: 160,
                  border:
                    theme.palette.mode === "dark"
                      ? "1px solid rgba(255, 255, 255, 0.08)"
                      : "1px solid rgba(0, 0, 0, 0.08)",
                },
              }}>
              {pages.map((page, i) => (
                <MenuItem
                  key={i}
                  onClick={() => handleCloseNavMenu(page.link)}
                  sx={{
                    py: 1.5,
                    "&:hover": {
                      backgroundColor: "rgba(56, 189, 248, 0.08)",
                      color: "primary.main",
                    },
                  }}>
                  <Typography
                    sx={{
                      textAlign: "center",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                    }}>
                    {page.component}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo Icon & Title */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
              flexGrow: 1,
            }}>
            <SchoolIcon sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
              sx={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                color: "inherit",
                textDecoration: "none",
                fontSize: "1rem",
              }}>
              EduManage
            </Typography>
          </Box>

          {/* Desktop Navigation Links and Theme Toggle */}
          <Box
            sx={{
              flexGrow: 1,
              display: { xs: "none", md: "flex" },
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1,
            }}>
            {pages.map((page, i) => (
              <Button
                key={i}
                onClick={() => handleCloseNavMenu(page.link)}
                sx={{
                  my: 2,
                  color: theme.palette.mode === "dark" ? "#94A3B8" : "#475569",
                  display: "block",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  px: 2,
                  borderRadius: 2,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color:
                      theme.palette.mode === "dark" ? "#FFFFFF" : "#0F172A",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.04)",
                  },
                }}>
                {page.component}
              </Button>
            ))}

            {/* Desktop Dark/Light Mode Toggle Button */}
            <IconButton
              onClick={toggleColorMode}
              color="inherit"
              aria-label="toggle dark and light mode"
              sx={{
                ml: 1,
                p: 1.2,
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.04)",
                "&:hover": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                },
              }}>
              {theme.palette.mode === "dark" ? (
                <Brightness7Icon sx={{ fontSize: 20, color: "#38BDF8" }} />
              ) : (
                <Brightness4Icon sx={{ fontSize: 20, color: "#0F172A" }} />
              )}
            </IconButton>
          </Box>

          {/* Mobile Dark/Light Mode Toggle Button */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton
              onClick={toggleColorMode}
              color="inherit"
              aria-label="toggle dark and light mode"
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.04)",
              }}>
              {theme.palette.mode === "dark" ? (
                <Brightness7Icon sx={{ fontSize: 20, color: "#38BDF8" }} />
              ) : (
                <Brightness4Icon sx={{ fontSize: 20, color: "#0F172A" }} />
              )}
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
