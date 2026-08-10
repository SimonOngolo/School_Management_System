import * as React from "react";
import { useFormik } from "formik";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { baseApi } from "../../../environment";
import {
  Button,
  Typography,
  Alert,
  Paper,
  Box,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  InputAdornment,
  IconButton,
  Fade,
} from "@mui/material";

// ICONS
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { AuthContext } from "../../../context/AuthContext";
import { loginSchema } from "../../../yupSchema/loginSchema";

export default function Login() {
  const [role, setRole] = React.useState("");
  const [feedback, setFeedback] = React.useState(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useNavigate();

  const { login } = React.useContext(AuthContext);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values, { resetForm }) => {
      if (!role) {
        setFeedback({
          type: "error",
          message: "Please select your user role before proceeding.",
        });
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      let endpointRole = role === "student" ? "students" : role;
      let URL = `${baseApi}/${endpointRole}/login`;

      try {
        const resp = await axios.post(URL, values);
        const token =
          resp.headers["authorization"] || resp.headers["Authorization"];
        const user = resp.data.user;

        if (token && user) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          login(user);

          if (role === "school") navigate("/school");
          else if (role === "teacher") navigate("/teacher");
          else if (role === "student") navigate("/student");
        }
      } catch (e) {
        setFeedback({
          type: "error",
          message:
            e.response?.data?.message ||
            "Invalid credentials or network error.",
        });
        setTimeout(() => setFeedback(null), 5000);
      }
    },
  });

  return (
    <Box
      sx={{
        backgroundImage:
          "linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(https://core-docs.s3.amazonaws.com/hillsborough_county_public_schools_ar/article/image/large_23df8dd6-af10-4085-b5b2-7f9aa97a2a4b.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItem: "center",
        alignItems: "center",
        p: 2,
      }}>
      <Fade in={true} timeout={800}>
        <Paper
          elevation={12}
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: "440px",
            padding: { xs: 3, sm: 5 },
            borderRadius: 4,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          }}
          component="form"
          onSubmit={formik.handleSubmit}>
          {/* Header Branding */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 1.5,
                boxShadow: "0 8px 16px rgba(25, 118, 210, 0.3)",
              }}>
              <SchoolOutlinedIcon sx={{ color: "#fff", fontSize: 30 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#1E293B",
                letterSpacing: "-0.5px",
              }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
              Sign in to your school management portal
            </Typography>
          </Box>

          {/* Role Selector */}
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel id="role-select-label">Select Role</InputLabel>
            <Select
              labelId="role-select-label"
              value={role}
              label="Select Role"
              onChange={(e) => setRole(e.target.value)}
              sx={{
                borderRadius: 2,
                backgroundColor: "#F8FAFC",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                },
              }}>
              <MenuItem value={"student"}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <PersonOutlineOutlinedIcon color="primary" fontSize="small" />
                  Student Portal
                </Box>
              </MenuItem>
              <MenuItem value={"teacher"}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <SchoolOutlinedIcon color="primary" fontSize="small" />
                  Teacher Portal
                </Box>
              </MenuItem>
              <MenuItem value={"school"}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <AdminPanelSettingsOutlinedIcon
                    color="primary"
                    fontSize="small"
                  />
                  School Administration
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Email Field */}
          <TextField
            name="email"
            label="Email Address"
            fullWidth
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon color="action" />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, backgroundColor: "#F8FAFC" },
            }}
          />

          {/* Password Field */}
          <TextField
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 2, backgroundColor: "#F8FAFC" },
            }}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "1rem",
              textTransform: "none",
              boxShadow: "0 8px 16px rgba(25, 118, 210, 0.24)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                boxShadow: "0 12px 20px rgba(25, 118, 210, 0.4)",
                transform: "translateY(-1px)",
              },
            }}>
            Sign In
          </Button>

          {/* Feedback Alert */}
          {feedback && (
            <Fade in={true}>
              <Alert severity={feedback.type} sx={{ mt: 2, borderRadius: 2 }}>
                {feedback.message}
              </Alert>
            </Fade>
          )}
        </Paper>
      </Fade>
    </Box>
  );
}
