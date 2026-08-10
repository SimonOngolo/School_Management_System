import * as React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import {
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { CalendarMonth as CalendarIcon } from "@mui/icons-material";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { baseApi } from "../../../environment";

const localizer = momentLocalizer(moment);

const CustomEvent = ({ event }) => (
  <Box
    sx={{
      p: "2px",
      color: "#fff",
      fontSize: "0.75rem",
      height: "100%",
      overflow: "hidden",
    }}>
    <div style={{ fontWeight: "bold" }}>
      {moment(event.start).format("h:mm A")} -{" "}
      {moment(event.end).format("h:mm A")}
    </div>
    <div>{event.subject?.subject_name || "No Subject"}</div>
    <div style={{ fontStyle: "italic", opacity: 0.8 }}>
      {event.teacher?.name || "Unassigned"}
    </div>
  </Box>
);

export default function StudentSchedule({ studentId }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [currentView, setCurrentView] = React.useState("month");
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [feedback, setFeedback] = React.useState(null);
  const [student, setStudent] = React.useState(null);

  const fetchStudentSchedule = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);

      // Support concurrent admin and student views securely
      let profileEndpoint = `${baseApi}/students/fetch-single`;
      if (studentId) {
        profileEndpoint = `${baseApi}/students/fetch/${studentId}`;
      } else {
        const userRole = localStorage.getItem("role");
        if (userRole && userRole !== "STUDENT" && !studentId) {
          setFeedback({
            type: "warning",
            message:
              "Please select a specific student to view schedule details.",
          });
          setLoading(false);
          return;
        }
      }

      const profileResp = await axios.get(profileEndpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const studentData = profileResp.data.student || profileResp.data;
      setStudent(studentData);
      const classId =
        studentData?.student_class?._id || studentData?.student_class;

      if (!classId) {
        setFeedback({
          type: "warning",
          message: "No class assigned to this student profile.",
        });
        setLoading(false);
        return;
      }

      const resp = await axios.get(`${baseApi}/schedule/class/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formatted = (resp.data.data || []).map((ev) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
      setEvents(formatted);
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", message: "Failed to load the schedule." });
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    fetchStudentSchedule();
  }, [fetchStudentSchedule]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 2, height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CalendarIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {student?.student_class?.class_text
              ? `Class ${student.student_class.class_text} Schedule`
              : student?.name
                ? `${student.name}'s Schedule`
                : "Student Schedule"}
          </Typography>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          flexGrow: 1,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #ddd",
        }}>
        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          view={currentView}
          views={["month", "week", "day", "agenda"]}
          onView={(view) => setCurrentView(view)}
          onNavigate={(date) => setCurrentDate(date)}
          components={{ event: CustomEvent }}
          titleAccessor={() => null}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={() => ({
            style: { backgroundColor: "#6366f1", borderRadius: "4px" },
          })}
        />
      </Paper>

      <Snackbar
        open={!!feedback}
        autoHideDuration={4000}
        onClose={() => setFeedback(null)}>
        <Alert severity={feedback?.type}>{feedback?.message}</Alert>
      </Snackbar>
    </Box>
  );
}
