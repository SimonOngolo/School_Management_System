import * as React from "react";
import { useFormik } from "formik";
import axios from "axios";
import * as yup from "yup";
import { baseApi } from "../../../environment";

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Typography,
  CircularProgress,
  FormHelperText,
} from "@mui/material";
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  EventNote as EventIcon,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const periodSchema = yup.object().shape({
  teacher: yup.string().required("Teacher is required"),
  subject: yup.string().required("Subject is required"),
  period: yup.string().required("Period is required"),
  date: yup.mixed().required("Date is required").nullable(),
});

export default function ScheduleEvent({
  handleCloseForm,
  defaultClass,
  refreshCalendar,
  selectedEvent,
  setFeedback = () => {},
}) {
  const [teachers, setTeachers] = React.useState([]);
  const [subjects, setSubjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const periods = [
    { value: "10:00,11:00", label: "Period 1 (10:00 AM - 11:00 AM)" },
    { value: "11:00,12:00", label: "Period 2 (11:00 AM - 12:00 PM)" },
    { value: "12:00,13:00", label: "Period 3 (12:00 PM - 01:00 PM)" },
    { value: "13:00,13:30", label: "Break (01:00 PM - 01:30 PM)" },
    { value: "13:30,14:30", label: "Period 4 (01:30 PM - 02:30 PM)" },
    { value: "14:30,15:30", label: "Period 5 (02:30 PM - 03:30 PM)" },
    { value: "15:30,16:30", label: "Period 6 (03:30 PM - 04:30 PM)" },
    { value: "16:30,17:30", label: "Period 7 (04:30 PM - 05:30 PM)" },
  ];

  const formik = useFormik({
    initialValues: {
      teacher: selectedEvent?.teacher?._id || "",
      subject: selectedEvent?.subject?._id || "",
      period: selectedEvent
        ? `${dayjs(selectedEvent.start).format("HH:mm")},${dayjs(selectedEvent.end).format("HH:mm")}`
        : "",
      date: selectedEvent ? dayjs(selectedEvent.start) : null,
    },
    enableReinitialize: true,
    validationSchema: periodSchema,
    onSubmit: async (values) => {
      try {
        const [start, end] = values.period.split(",");
        const dateStr = dayjs(values.date).format("YYYY-MM-DD");

        const formattedPayload = {
          teacher: values.teacher,
          subject: values.subject,
          classId: defaultClass,
          date: dayjs(values.date).format("DD-MM-YYYY"),
          startTime: new Date(`${dateStr}T${start}:00`).toISOString(),
          endTime: new Date(`${dateStr}T${end}:00`).toISOString(),
        };

        const token = localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        if (selectedEvent) {
          await axios.patch(
            `${baseApi}/schedule/update/${selectedEvent._id}`,
            formattedPayload,
            config,
          );
          setFeedback({
            type: "success",
            message: "Schedule updated successfully!",
          });
        } else {
          await axios.post(
            `${baseApi}/schedule/create`,
            formattedPayload,
            config,
          );
          setFeedback({
            type: "success",
            message: "Schedule created successfully!",
          });
        }

        if (refreshCalendar) refreshCalendar();
        handleCloseForm();
      } catch (error) {
        console.error(error);
        const errorMsg =
          error.response?.data?.message || "Error saving schedule.";
        setFeedback({ type: "error", message: errorMsg });
      }
    },
  });

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${baseApi}/schedule/delete/${selectedEvent._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedback({
        type: "success",
        message: "Schedule deleted successfully!",
      });
      if (refreshCalendar) refreshCalendar();
      handleCloseForm();
    } catch (err) {
      console.error(err);
      const errorMsg =
        err.response?.data?.message || "Error deleting schedule.";
      setFeedback({ type: "error", message: errorMsg });
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const [teacherRes, subjectRes] = await Promise.all([
          axios.get(`${baseApi}/teachers/fetch-width-query`, config),
          axios.get(`${baseApi}/subjects/all`, config),
        ]);
        if (isMounted) {
          setTeachers(teacherRes.data?.data || []);
          setSubjects(subjectRes.data?.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: "flex", justifyContent: "center", py: 4, px: 2 }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "500px",
            padding: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.05)",
            background: "linear-gradient(to bottom, #ffffff, #fdfdfd)",
          }}
          component="form"
          onSubmit={formik.handleSubmit}
          noValidate>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              mb: 3,
            }}>
            <EventIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography
              variant="h5"
              align="center"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.5px",
              }}>
              {selectedEvent ? "Edit Schedule" : "Add New Period"}
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                my: 6,
              }}>
              <CircularProgress size={40} thickness={4} />
              <Typography variant="body2" color="text.secondary">
                Loading options...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Teacher */}
              <FormControl
                fullWidth
                margin="normal"
                error={
                  formik.touched.teacher && Boolean(formik.errors.teacher)
                }>
                <InputLabel id="teacher-select-label">Teacher</InputLabel>
                <Select
                  labelId="teacher-select-label"
                  name="teacher"
                  label="Teacher"
                  value={formik.values.teacher}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}>
                  {teachers.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.teacher && formik.errors.teacher && (
                  <FormHelperText>{formik.errors.teacher}</FormHelperText>
                )}
              </FormControl>
              {/* Subject */}
              <FormControl
                fullWidth
                margin="normal"
                error={
                  formik.touched.subject && Boolean(formik.errors.subject)
                }>
                <InputLabel id="subject-select-label">Subject</InputLabel>
                <Select
                  labelId="subject-select-label"
                  name="subject"
                  label="Subject"
                  value={formik.values.subject}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}>
                  {subjects.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.subject_name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.subject && formik.errors.subject && (
                  <FormHelperText>{formik.errors.subject}</FormHelperText>
                )}
              </FormControl>
              {/* Period */}
              <FormControl
                fullWidth
                margin="normal"
                error={formik.touched.period && Boolean(formik.errors.period)}>
                <InputLabel id="period-select-label">Period</InputLabel>
                <Select
                  labelId="period-select-label"
                  name="period"
                  label="Period"
                  value={formik.values.period}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}>
                  {periods.map((p) => (
                    <MenuItem key={p.value} value={p.value}>
                      {p.label}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.period && formik.errors.period && (
                  <FormHelperText>{formik.errors.period}</FormHelperText>
                )}
              </FormControl>
              {/* Date */}
              <Box sx={{ mt: 2, mb: 1 }}>
                <DatePicker
                  label="Date"
                  format="DD-MM-YYYY"
                  value={formik.values.date}
                  onChange={(val) => formik.setFieldValue("date", val)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: formik.touched.date && Boolean(formik.errors.date),
                      helperText: formik.touched.date && formik.errors.date,
                      onBlur: () => formik.setFieldTouched("date", true),
                    },
                  }}
                />
              </Box>
              {/* Actions Area */}5{" "}
              <Box sx={{ mt: 4 }}>
                {selectedEvent ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        fullWidth
                        sx={{
                          py: 1.2,
                          borderRadius: 2,
                          fontWeight: 600,
                          transform: "none",
                        }}>
                        Update
                      </Button>
                      <Button
                        type="button"
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDelete}
                        fullWidth
                        sx={{
                          py: 1.2,
                          borderRadius: 2,
                          fontWeight: 600,
                          transform: "none",
                        }}>
                        Delete
                      </Button>
                    </Box>
                    <Button
                      type="button"
                      variant="outlined"
                      color="inherit"
                      startIcon={<CloseIcon />}
                      onClick={handleCloseForm}
                      fullWidth
                      sx={{
                        py: 1,
                        borderRadius: 2,
                        borderColor: "divider",
                        color: "text.secondary",
                      }}>
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        boxShadow: 2,
                      }}>
                      Submit Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="text"
                      color="inherit"
                      onClick={handleCloseForm}
                      fullWidth
                      sx={{ py: 1, color: "text.secondary" }}>
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </LocalizationProvider>
  );
}
