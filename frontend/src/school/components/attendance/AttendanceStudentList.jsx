import * as React from "react";
import axios from "axios";
import { baseApi } from "../../../environment";

// Material-UI Imports
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";
import Grid from "@mui/material/Grid";
import {
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import Attendee from "./Attendee";
import { Link } from "react-router-dom";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

export default function AttendanceStudentList() {
  const [classes, setClasses] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [params, setParams] = React.useState({});
  const [selectedClass, setSelectedClass] = React.useState(null);
  const [attendanceData, setAttendanceData] = React.useState({});
  const [message, setMessage] = React.useState(null);
  const [messageType, setMessageType] = React.useState(null);
  const handleMessage = (message, type) => {
    setMessageType(type);
    setMessage(message);
  };

  const fetchClasses = () => {
    axios
      .get(`${baseApi}/class/all`)
      .then((res) => setClasses(res.data.data))
      .catch((e) => console.error("Failed to fetch classes:", e));
  };

  const handleClass = (e) => {
    setSelectedClass(e.target.value);
    setParams((prevParams) => ({
      ...prevParams,
      student_class: e.target.value || undefined,
    }));
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setParams((prevParams) => ({ ...prevParams, search: value || undefined }));
  };

  const fetchStudents = () => {
    axios
      .get(`${baseApi}/students/fetch-width-query`, { params })
      .then((res) => {
        const studentArray = res.data.data || [];
        setStudents(studentArray);
        fetchAttendanceForStudents(studentArray);
      })
      .catch((e) => {
        console.error("Failed to fetch students:", e);
      });
  };

  const fetchAttendanceForStudents = async (studentsList) => {
    const attendancePromises = studentsList.map((student) =>
      fetchAttendanceForStudent(student._id),
    );
    const results = await Promise.all(attendancePromises);
    const updateAttendanceData = {};
    results.forEach(({ studentId, attendancePercentage }) => {
      updateAttendanceData[studentId] = attendancePercentage;
    });
    setAttendanceData(updateAttendanceData);
  };

  const fetchAttendanceForStudent = async (studentId) => {
    try {
      const response = await axios.get(`${baseApi}/attendance/${studentId}`);
      const attendanceRecords = response.data;
      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(
        (record) => record.status === "Present",
      ).length;
      const attendancePercentage =
        totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
      return { studentId, attendancePercentage };
    } catch (error) {
      console.error(
        `Error fetching attendance for student ${studentId}:`,
        error,
      );
      return { studentId, attendancePercentage: 0 };
    }
  };

  React.useEffect(() => {
    fetchClasses();
  }, []);

  React.useEffect(() => {
    fetchStudents();
  }, [params]);

  return (
    <Box sx={{ minHeight: "100%", py: 4 }}>
      <Paper
        elevation={6}
        sx={{
          mb: 4,
          width: "90vw", // ✅ longer unified container
          minWidth: "320px",
          p: 4,
          borderRadius: 3,
          margin: "0 auto",
        }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#1976d2" }}>
          Student's Attendance
        </Typography>

        <Grid container spacing={2}>
          {/* Left side: filters + Attendee */}
          <Grid item="true" xs={12} md={4}>
            <Item>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Search by Name"
                  value={searchTerm}
                  onChange={handleSearch}
                  margin="normal"
                  sx={{ backgroundColor: "#fff", borderRadius: 2 }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel id="search-student-class-label">
                    Student Class
                  </InputLabel>
                  <Select
                    labelId="search-student-class-label"
                    onChange={handleClass}
                    value={selectedClass || ""}
                    sx={{ borderRadius: 2, backgroundColor: "#fff" }}>
                    <MenuItem value="">
                      <em>Select a class</em>
                    </MenuItem>
                    {classes.map((x) => (
                      <MenuItem key={x._id} value={x._id}>
                        {x.class_text} ({x.class_num})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Attendee only appears when class is selected */}
              {selectedClass && (
                <Attendee
                  classId={selectedClass}
                  handleMessage={handleMessage}
                  message={message}
                />
              )}
            </Item>
          </Grid>

          {/* Right side: table */}
          <Grid item="true" xs={12} md={8}>
            <Item>
              <TableContainer component={Paper} sx={{ width: "100%" }}>
                <Table sx={{ minWidth: 650 }} aria-label="students table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell align="right">Gender</TableCell>
                      <TableCell align="right">Guardian Phone</TableCell>
                      <TableCell align="right">Class</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">View</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell align="right">{student.gender}</TableCell>
                        <TableCell align="right">
                          {student.guardian_phone}
                        </TableCell>
                        <TableCell align="right">
                          {student.student_class?.class_text ||
                            student.student_class}
                        </TableCell>
                        <TableCell align="right">
                          {attendanceData[student._id] !== undefined
                            ? `${attendanceData[student._id].toFixed(2)}%`
                            : "No Data"}
                        </TableCell>
                        <TableCell align="right"><Link to={`/school/attendance/${student._id}`}>Details </Link></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Item>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
