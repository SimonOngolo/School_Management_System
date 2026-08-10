import * as React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import axios from "axios";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
} from "@mui/material";
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { baseApi } from "../../../environment";
import ScheduleEvent from "./ScheduleEvent";

const localizer = momentLocalizer(moment);
const CALENDAR_VIEWS = ["week", "day", "agenda"];

const CustomEvent = ({ event }) => (
  <Box
    sx={{
      bgcolor: "#1976d2",
      color: "white",
      px: 0.8,
      py: 0.4,
      borderRadius: 1,
      height: "100%",
      width: "100%", // Ensures it fills the cell
      display: "flex",
      flexDirection: "column",
      justifyContent: "center", // Vertically center content
      fontSize: "0.70rem",
      overflow: "hidden",
      whiteSpace: "normal", // Allow text wrapping
      wordBreak: "break-word", // Prevent overflow
    }}>
    <Typography variant="caption" sx={{ fontWeight: "bold", display: "block" }}>
      {moment(event.start).format("h:mm A")} -{" "}
      {moment(event.end).format("h:mm A")}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
      {event.title}
    </Typography>
    <Typography
      variant="caption"
      sx={{ fontStyle: "italic", opacity: 0.9, lineHeight: 1.2 }}>
      {event.teacherName || "Instructor"}
    </Typography>
  </Box>
);


export default function Schedule() {
  const [newPeriod, setNewPeriod] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [currentView, setCurrentView] = React.useState("week");
  const [classes, setClasses] = React.useState([]);
  const [selectedClass, setSelectedClass] = React.useState("");
  const [events, setEvents] = React.useState([]);
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  const fetchSchedules = React.useCallback(() => {
    if (!selectedClass) return;
    const token = localStorage.getItem("token");
    axios
      .get(`${baseApi}/schedule/class/${selectedClass}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((resp) => {
        const formatted = (resp.data.data || []).map((ev) => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end),
          // Ensure teacherName is mapped if provided by your API
          teacherName: ev.teacher?.name,
        }));
        setEvents(formatted);
      })
      .catch((e) => console.error("Fetch Schedule Error", e));
  }, [selectedClass]);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${baseApi}/class/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((resp) => {
        const fetched = resp.data.data || [];
        setClasses(fetched);
        if (fetched.length > 0)
          setSelectedClass(fetched[0]._id || fetched[0].id);
      });
  }, []);

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100vh", p: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1,
          borderBottom: "1px solid #ddd",
        }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: "primary.main" }}>
          School Schedule
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass}
            label="Select Class"
            onChange={(e) => setSelectedClass(e.target.value)}>
            {classes.map((x) => (
              <MenuItem key={x._id} value={x._id}>
                {x.class_text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={newPeriod ? <CloseIcon /> : <AddIcon />}
          onClick={() => {
            setNewPeriod(!newPeriod);
            setSelectedEvent(null);
          }}>
          {newPeriod ? "Cancel" : "Add Period"}
        </Button>
      </Box>

      {newPeriod && (
        <Paper sx={{ p: 2, m: 1, bgcolor: "#f5f5f5" }}>
          <ScheduleEvent
            handleCloseForm={() => {
              setNewPeriod(false);
              setSelectedEvent(null);
            }}
            defaultClass={selectedClass}
            refreshCalendar={fetchSchedules}
            selectedEvent={selectedEvent}
          />
        </Paper>
      )}

      <Box sx={{ flexGrow: 1, p: 1 }}>
        <Calendar
          localizer={localizer}
          events={events}
          date={currentDate}
          onNavigate={setCurrentDate}
          view={currentView}
          onView={setCurrentView}
          views={CALENDAR_VIEWS}
          startAccessor="start"
          endAccessor="end"
          components={{
            event: CustomEvent, // Uses the custom renderer to match image_b00a4a.png
          }}
          onSelectEvent={(event) => {
            setSelectedEvent(event);
            setNewPeriod(true);
          }}
        />
      </Box>
    </Box>
  );
}
