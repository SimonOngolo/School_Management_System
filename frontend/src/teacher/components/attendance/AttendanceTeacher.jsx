import axios from "axios";
import { useEffect, useState } from "react";
import { baseApi } from "../../../environment";
import Alert from "@mui/material/Alert";
import CheckIcon from "@mui/icons-material/Check";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Fade,
  Container,
} from "@mui/material";

export default function AttendanceTeacher() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const handleMessageClose = () => {
    setMessage("");
  };

  // Automatically make success messages disappear after 4 seconds
  useEffect(() => {
    if (message && messageType === "success") {
      const timer = setTimeout(() => {
        setMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, messageType]);

  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [alreadyChecked, setAlreadyChecked] = useState(false);

  const handleAttendance = (studentId, status) => {
    setAttendanceStatus((prevStatus) => ({
      ...prevStatus,
      [studentId]: status,
    }));
  };

  const singleStudentAttendance = async (studentId, status) => {
    try {
      await axios.post(`${baseApi}/attendance/mark`, {
        studentId,
        date: new Date(),
        classId: selectedClass,
        status,
      });
    } catch (error) {
      console.log("Error marking attendee", error);
      throw error;
    }
  };

  const submitAttendance = async () => {
    try {
      await Promise.all(
        students.map((student) =>
          singleStudentAttendance(
            student._id,
            attendanceStatus[student._id] || "Present",
          ),
        ),
      );
      setMessage("Attendance submitted successfully!");
      setMessageType("success");
      setAlreadyChecked(true);

      const submissionTimeKey = `attendance_time_${selectedClass}`;
      localStorage.setItem(submissionTimeKey, Date.now().toString());
    } catch (error) {
      console.log("Error => All submit error [marking attendee] ", error);
      setMessage("Failed to submit attendance.");
      setMessageType("error");
    }
  };

  const fetchAttendeeClass = async () => {
    try {
      const response = await axios.get(`${baseApi}/class/attendee`);
      const classData = response.data?.data || response.data;
      const classArray = Array.isArray(classData) ? classData : [];
      setClasses(classArray);

      if (classArray.length > 0) {
        setSelectedClass(classArray[0]._id);
      }
    } catch (error) {
      console.error("Error fetching attendee class:", error);
      setClasses([]);
    }
  };

  useEffect(() => {
    fetchAttendeeClass();
  }, []);

  const checkAttendaceAndFetchStudents = async () => {
    try {
      if (selectedClass) {
        setLoading(true);
        let classIsChecked = false;

        const responseStudent = await axios.get(
          `${baseApi}/students/fetch-width-query`,
          {
            params: { student_class: selectedClass },
          },
        );

        try {
          const responseCheck = await axios.get(
            `${baseApi}/attendance/check/${selectedClass}`,
          );
          if (
            responseCheck.data?.attendanceChecked === true ||
            responseCheck.data?.checked === true ||
            responseCheck.data?.exists === true
          ) {
            classIsChecked = true;
          }
        } catch (checkErr) {
          console.log(
            "No previous attendance found or check restricted",
            checkErr,
          );
        }

        const submissionTimeKey = `attendance_time_${selectedClass}`;
        const savedTimestamp = localStorage.getItem(submissionTimeKey);

        if (savedTimestamp) {
          const elapsedTime = Date.now() - parseInt(savedTimestamp, 10);
          const twoHoursInMs = 2 * 60 * 60 * 1000;

          if (elapsedTime < twoHoursInMs) {
            classIsChecked = true;
          } else {
            localStorage.removeItem(submissionTimeKey);
          }
        }

        setAlreadyChecked(classIsChecked);

        const studentList =
          responseStudent.data.students || responseStudent.data.data || [];
        setStudents(studentList);

        studentList.forEach((student) => {
          handleAttendance(student._id, "Present");
        });

        setLoading(false);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      setAlreadyChecked(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAttendaceAndFetchStudents();
  }, [selectedClass]);

  return (
    <Box
      sx={{
        backgroundColor: "#F8FAFC",
        minHeight: "100vh",
        py: 4,
        px: { xs: 2, md: 4 },
      }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 4,
          }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#0F172A",
                letterSpacing: "-0.5px",
              }}>
              Attendance Dashboard
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B", mt: 0.5 }}>
              Manage and track class attendance seamlessly.
            </Typography>
          </Box>
          {classes.length > 0 && (
            <Chip
              icon={<EventAvailableIcon />}
              label={`Assigned Classes: ${classes.length}`}
              sx={{
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                fontWeight: 600,
                borderRadius: "12px",
                px: 1,
                py: 2,
              }}
            />
          )}
        </Box>

        {message && (
          <Fade in={true}>
            <Alert
              severity={messageType}
              onClose={handleMessageClose}
              sx={{
                mb: 3,
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}>
              {message}
            </Alert>
          </Fade>
        )}

        {/* Selection Card */}
        {classes.length > 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              bgcolor: "#FFFFFF",
            }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}>
              <FormControl
                sx={{ minWidth: "260px", flex: { xs: 1, sm: "unset" } }}
                size="small">
                <InputLabel id="class-select-label" sx={{ fontWeight: 500 }}>
                  Select Class Subject
                </InputLabel>
                <Select
                  labelId="class-select-label"
                  label="Select Class Subject"
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setAlreadyChecked(false);
                  }}
                  sx={{
                    borderRadius: "10px",
                    bgcolor: "#F8FAFC",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#CBD5E1",
                    },
                  }}>
                  <MenuItem value="">
                    <em>Choose a class...</em>
                  </MenuItem>
                  {classes.map((x) => (
                    <MenuItem key={x._id} value={x._id}>
                      {x.class_text}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
            }}>
            <Typography variant="body1" color="text.secondary">
              No classes available assigned to you.
            </Typography>
          </Paper>
        )}

        {selectedClass && (
          <Fade in={true}>
            <Box>
              {/* Status Indicator Bar */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  mb: 3,
                }}>
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                  <Chip
                    icon={<PeopleAltIcon />}
                    label={`${students.length} Students Enrolled`}
                    sx={{
                      bgcolor: "#F1F5F9",
                      color: "#334155",
                      fontWeight: 600,
                      borderRadius: "8px",
                    }}
                  />
                </Box>

                {alreadyChecked && (
                  <Chip
                    icon={<AccessTimeIcon />}
                    label="Attendance recorded. Locked for 2 hours."
                    color="info"
                    variant="outlined"
                    sx={{ borderRadius: "8px", fontWeight: 500 }}
                  />
                )}
              </Box>

              {/* Students Table */}
              {students.length > 0 ? (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    mb: 4,
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
                    overflow: "hidden",
                  }}>
                  <Table>
                    <TableHead sx={{ bgcolor: "#F8FAFC" }}>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: 700, color: "#475569", py: 2 }}>
                          Student Name
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: "#475569", py: 2 }}>
                          Gender
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 700, color: "#475569", py: 2 }}
                          align="right">
                          Status Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                            <Typography variant="body2" color="text.secondary">
                              Loading students roster...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((student) => (
                          <TableRow
                            key={student._id}
                            hover
                            sx={{
                              "&:last-child td, &:last-child th": { border: 0 },
                            }}>
                            <TableCell
                              sx={{ fontWeight: 600, color: "#1E293B" }}>
                              {student.name || student.student_name || "—"}
                            </TableCell>
                            <TableCell sx={{ color: "#64748B" }}>
                              {student.gender || "—"}
                            </TableCell>
                            <TableCell align="right">
                              <FormControl
                                size="small"
                                sx={{ minWidth: "130px" }}>
                                <Select
                                  value={
                                    attendanceStatus[student._id] || "Present"
                                  }
                                  disabled={alreadyChecked}
                                  onChange={(e) => {
                                    handleAttendance(
                                      student._id,
                                      e.target.value,
                                    );
                                  }}
                                  sx={{
                                    borderRadius: "8px",
                                    bgcolor: "#FFFFFF",
                                    fontWeight: 500,
                                    fontSize: "0.875rem",
                                  }}>
                                  <MenuItem
                                    value="Present"
                                    sx={{ color: "#16A34A", fontWeight: 600 }}>
                                    Present
                                  </MenuItem>
                                  <MenuItem
                                    value="Absent"
                                    sx={{ color: "#DC2626", fontWeight: 600 }}>
                                    Absent
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 5,
                    textAlign: "center",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    mb: 4,
                  }}>
                  <Typography variant="body1" color="text.secondary">
                    {loading
                      ? "Loading roster..."
                      : "No students found for this class select option."}
                  </Typography>
                </Paper>
              )}

              {/* Submit Action */}
              {!alreadyChecked && !loading && students.length > 0 && (
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<SaveIcon />}
                    onClick={submitAttendance}
                    sx={{
                      bgcolor: "#4F46E5",
                      fontWeight: 600,
                      borderRadius: "12px",
                      px: 4,
                      py: 1.5,
                      boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
                      textTransform: "none",
                      "&:hover": {
                        bgcolor: "#4338CA",
                      },
                    }}>
                    Save Class Attendance
                  </Button>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Container>
    </Box>
  );
}
