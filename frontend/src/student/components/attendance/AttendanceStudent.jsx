import { useEffect, useState, useCallback } from "react";
import { baseApi } from "../../../environment";
import { useParams } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { styled } from "@mui/material/styles";
import axios from "axios";
import { PieChart } from "@mui/x-charts/PieChart";

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

export default function AttendanceStudent() {
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [attendanceData, setAttendanceData] = useState([]);
  const { id: studentIdParam } = useParams();

  const convertDate = (dateData) => {
    const date = new Date(dateData);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  };

  const fetchAttendanceData = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      let targetId = studentIdParam;
      if (!targetId) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          targetId = userObj.id || userObj._id;
        }
      }

      if (!targetId) {
        console.error("No student ID available to fetch attendance.");
        return;
      }

      const response = await axios.get(`${baseApi}/attendance/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("RESPONSE ATTENDANCE", response);
      const respData =
        response.data.data || response.data.attendance || response.data;

      if (Array.isArray(respData)) {
        setAttendanceData(respData);

        let presentCount = 0;
        let absentCount = 0;

        respData.forEach((attendance) => {
          if (attendance.status === "Present") {
            presentCount += 1;
          } else if (attendance.status === "Absent") {
            absentCount += 1;
          }
        });

        setPresent(presentCount);
        setAbsent(absentCount);
      }
    } catch (error) {
      console.log("Error in fetching student attendance", error);
    }
  }, [studentIdParam]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  return (
    <>
      <h1>Attendance Details</h1>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Item>
            <PieChart
              series={[
                {
                  data: [
                    { id: 0, value: present, label: "Present" },
                    { id: 1, value: absent, label: "Absent" },
                  ],
                },
              ]}
              width={300}
              height={200}
            />
          </Item>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Item>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 350 }} aria-label="attendance table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No attendance logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceData.map((attendance) => (
                      <TableRow
                        key={attendance._id || attendance.date}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}>
                        <TableCell component="th" scope="row">
                          {convertDate(attendance.date)}
                        </TableCell>
                        <TableCell align="right">{attendance.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Item>
        </Grid>
      </Grid>
    </>
  );
}
