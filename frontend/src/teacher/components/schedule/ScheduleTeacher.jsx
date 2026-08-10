import * as React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Snackbar,
  Alert,
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

export default function ScheduleTeacher() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [currentView, setCurrentView] = React.useState("month");
  const [classes, setClasses] = React.useState([]);
  const [selectedClass, setSelectedClass] = React.useState("");
  const [events, setEvents] = React.useState([]);
  const [feedback, setFeedback] = React.useState(null);

  const fetchSchedules = React.useCallback(async () => {
    if (!selectedClass) return;
    const token = localStorage.getItem("token");
    try {
      // Added ?mySchedule=true to trigger the teacher-only filter in the backend
      const resp = await axios.get(
        `${baseApi}/schedule/class/${selectedClass}?mySchedule=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const formatted = (resp.data.data || []).map((ev) => ({
        ...ev,
        start: new Date(ev.start),
        end: new Date(ev.end),
      }));
      setEvents(formatted);
    } catch (e) {
      setFeedback({ type: "error", message: "Failed to load schedule." });
    }
  }, [selectedClass]);

  React.useEffect(() => {
    const fetchClasses = async () => {
      const token = localStorage.getItem("token");
      try {
        const resp = await axios.get(`${baseApi}/class/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = resp.data.data || [];
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0]._id || data[0].id);
      } catch (e) {
        console.error(e);
      }
    };
    fetchClasses();
  }, []);

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

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
            Teacher Schedule
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            label="Select Class"
            onChange={(e) => setSelectedClass(e.target.value)}>
            {classes.map((x) => (
              <MenuItem key={x._id || x.id} value={x._id || x.id}>
                {x.class_text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          titleAccessor={() => null} // Prevents double-text issues
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={() => ({
            style: { backgroundColor: "#1976d2", borderRadius: "4px" },
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
