import React from "react";
import axios from "axios";
import { useState, useEffect } from "react";
import { baseApi } from "../../../environment";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Snackbar,
  Alert,
  Slide,
} from "@mui/material";

// MOVED OUTSIDE: This prevents the "TransitionComponent" warning
const Transition = (props) => <Slide {...props} direction="up" />;

export default function Attendee({ classId, handleMessage, message }) {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [attendee, setAttendee] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Slide transition for Snackbar
  const Transition = (props) => <Slide {...props} direction="up" />;

  const handleSubmit = async () => {
    try {
      if (!selectedTeacher) {
        setSnackbar({
          open: true,
          message: "Please select teacher first",
          severity: "warning",
        });
        return;
      }

      await axios.patch(`${baseApi}/class/update/${classId}`, {
        attendee: selectedTeacher,
      });

      // Optimistically update attendee in UI
      const updatedTeacher = teachers.find((t) => t._id === selectedTeacher);
      setAttendee(updatedTeacher);

      setSnackbar({
        open: true,
        message: "Attendee saved/updated successfully!",
        severity: "success",
      });

      // Confirm with backend
      fetchClassDetails();
    } catch (error) {
      console.log("ERROR", error);
      setSnackbar({
        open: true,
        message: "Failed to save attendee",
        severity: "error",
      });
    }
  };

  const fetchClassDetails = async () => {
    if (classId) {
      try {
        const response = await axios.get(`${baseApi}/class/single/${classId}`);
        const classData = response.data.data;

        if (Array.isArray(classData) && classData.length > 0) {
          setAttendee(classData[0].attendee || null);
        } else {
          setAttendee(null);
        }
      } catch (error) {
        console.log("ERROR", error);
      }
    }
  };

  const fetchTeachers = () => {
    axios
      .get(`${baseApi}/teachers/fetch-width-query`, { params: {} })
      .then((res) => {
        const teacherArray = res.data.data || [];
        setTeachers(teacherArray);
      })
      .catch((e) => {
        console.error("Failed to fetch teachers:", e);
      });
  };

  useEffect(() => {
    if (classId) {
      fetchTeachers();
      fetchClassDetails();
    }
  }, [classId, message]);

  if (!classId) {
    return null; // nothing shown until a class is selected
  }

  return (
    <>
      <h1>Attendee</h1>
      <Box>
        {attendee && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              border: "1px solid #1976d2",
              borderRadius: 2,
              backgroundColor: "#f5f9ff",
            }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#1976d2", mb: 1 }}>
              Current Attendee Teacher:
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontSize: "1.1rem", color: "#333" }}>
              {attendee.name}
            </Typography>
          </Box>
        )}

        <FormControl fullWidth margin="normal">
          <InputLabel id="teacher-select-label">Select a Teacher</InputLabel>
          <Select
            labelId="teacher-select-label"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            sx={{ borderRadius: 2, backgroundColor: "#fff" }}>
            <MenuItem value="">
              <em>Select a Teacher</em>
            </MenuItem>
            {teachers.map((x) => (
              <MenuItem key={x._id} value={x._id}>
                {x.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={!selectedTeacher}
          sx={{ mt: 2 }}>
          {attendee ? "Change Attendee" : "Select Attendee"}
        </Button>
      </Box>

      {/* Snackbar with slide animation */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        TransitionComponent={Transition}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
