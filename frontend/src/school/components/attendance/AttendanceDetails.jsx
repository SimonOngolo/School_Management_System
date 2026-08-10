import { useEffect, useState } from "react";
import { baseApi } from "../../../environment";
import { useNavigate, useParams } from "react-router-dom";
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
import { PieChart } from "@mui/x-charts/PieChart"; // ✅ correct import

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

export default function AttendanceDetails() {
    const [present, setPresent] = useState(0);
    const [absent, setabsent] = useState(0);
  const [attendanceData, setAttendanceData] = useState([]);
  const { id: studentId } = useParams();
  const navigate = useNavigate();

  const convertDate = (dateData) => {
    const date = new Date(dateData);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  };

  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get(`${baseApi}/attendance/${studentId}`);
      console.log("RESPONSE ATTENDANCE", response);
        setAttendanceData(response.data);

        const respData = response.data;
        console.log("RESPDATA", respData)
        if (respData) {


                    respData.forEach((attendance) => {
                      if (attendance.status === "Present") {
                        setPresent(present + 1);
                      } else if (attendance.status === "Absent") {
                        setabsent(absent + 1);
                      }
                    });
            
        }
        

    } catch (error) {
      console.log("Error in fetching student attendance", error);
      navigate("/school/attendance");
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  return (
    <>
      <h1>Attendance Details</h1>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
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
              width={200}
              height={200}
            />
          </Item>
        </Grid>
        <Grid item xs={12} md={6}>
          <Item>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="attendance table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceData.map((attendance) => (
                    <TableRow
                      key={attendance._id}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}>
                      <TableCell component="th" scope="row">
                        {convertDate(attendance.date)}
                      </TableCell>
                      <TableCell align="right">{attendance.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Item>
        </Grid>
      </Grid>
    </>
  );
}
