import { useFormik } from 'formik';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import * as React from 'react';
import { registerSchema } from '../../../yupSchema/registerSchema';
import { Button, CardMedia, Typography, Alert, Paper } from '@mui/material';
import axios from 'axios';

export default function Register() {
  const [file, setFile] = React.useState(null);
  const [imageUrl, setImageUrl] = React.useState(null);
  const [feedback, setFeedback] = React.useState(null);

  const fileInputRef = React.useRef(null);

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

  const initialValues = {
    school_name: "",
    email: "",
    owner_name: "",
    password: "",
    confirm_password: ""
  };

  const formik = useFormik({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const fd = new FormData();
        if (file) fd.append("image", file, file.name);
        fd.append("school_name", values.school_name);
        fd.append("email", values.email);
        fd.append("owner_name", values.owner_name);
        fd.append("password", values.password);

        await axios.post(`${baseApi}/school/register`, fd);
        setFeedback({ type: "success", message: "School registered successfully!" });
        resetForm();
        handleClearFile();
      } catch (e) {
        setFeedback({ type: "error", message: e.response?.data?.message || "Registration failed" });
      }
    }
  });

  return (
    <Box
      sx={{
        backgroundImage: "url(https://core-docs.s3.amazonaws.com/hillsborough_county_public_schools_ar/article/image/large_23df8dd6-af10-4085-b5b2-7f9aa97a2a4b.png)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative"
      }}
    >
      {/* Dark overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.5)"
        }}
      />

      {/* Form Card */}
      <Paper
        elevation={6}
        sx={{
          position: "relative",
          zIndex: 1,
          width: "45vw",
          minWidth: "300px",
          padding: 4,
          borderRadius: 3,
          backgroundColor: "#fff",
        }}
        component="form"
        onSubmit={formik.handleSubmit}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#1976d2" }}
        >
          Register School
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Add School Picture
        </Typography>
        <input
          type="file"
          ref={fileInputRef}
          onChange={addImage}
          accept="image/*"
        />
        {imageUrl && (
          <Box sx={{ mt: 2 }}>
            <CardMedia
              component="img"
              height="200"
              image={imageUrl}
              sx={{ borderRadius: 2, border: "2px solid #eee" }}
            />
          </Box>
        )}

        {/* Inputs */}
        <TextField
          name="school_name"
          label="School Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formik.values.school_name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.school_name && Boolean(formik.errors.school_name)}
          helperText={formik.touched.school_name && formik.errors.school_name}
        />

        <TextField
          name="email"
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
        />

        <TextField
          name="owner_name"
          label="Owner Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formik.values.owner_name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.owner_name && Boolean(formik.errors.owner_name)}
          helperText={formik.touched.owner_name && formik.errors.owner_name}
        />

        <TextField
          name="password"
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
        />

        <TextField
          name="confirm_password"
          label="Confirm Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={formik.values.confirm_password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.confirm_password && Boolean(formik.errors.confirm_password)}
          helperText={formik.touched.confirm_password && formik.errors.confirm_password}
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3, py: 1.5, fontSize: "16px", fontWeight: "bold" }}
        >
          Register
        </Button>

        {feedback && (
          <Alert severity={feedback.type} sx={{ mt: 3 }}>
            {feedback.message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
