import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./guard/ProtectedRoute";

// Components
import School from "./school/School";
import Dashboard from "./school/components/dashboard/Dashboard";
import AttendanceStudentList from "./school/components/attendance/AttendanceStudentList";
import AttendanceDetails from "./school/components/attendance/AttendanceDetails";
import Schedule from "./school/components/schedule/Schedule";
import Students from "./school/components/students/Students";
import Subjects from "./school/components/subjects/Subjects";
import Teachers from "./school/components/teachers/Teachers";
import Notice from "./school/components/notice/Notice";
import Class from "./school/components/class/Class";
import Examination from "./school/components/examinations/Examination";

import Client from "./client/Client";
import Home from "./client/components/home/Home";
import Login from "./client/components/login/Login";
import Register from "./client/components/register/Register";
import LogOut from "./client/components/logout/LogOut";

import Teacher from "./teacher/Teacher";
import TeacherDetails from "./teacher/components/teacher details/TeacherDetails";
import ScheduleTeacher from "./teacher/components/schedule/ScheduleTeacher";

import AttendanceTeacher from "./teacher/components/attendance/AttendanceTeacher";
import ExaminatonsTeacher from "./teacher/components/examinations/ExaminatonsTeacher";
import NoticeTeacher from "./teacher/components/notice/NoticeTeacher";

import Student from "./student/Students";
import StudentDetails from "./student/components/students details/StudentDetails";
import AttendanceStudent from "./student/components/attendance/AttendanceStudent";
import NoticeStudent from "./student/components/notice/NoticeStudent";
import ExaminationsStudent from "./student/components/examination/ExaminationsStudent";
import ScheduleStudent from "./student/components/schedule/ScheduleStudent";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* SCHOOL ROUTES */}
          <Route
            path="school"
            element={
              <ProtectedRoute allowedRoles={["SCHOOL"]}>
                <School />
              </ProtectedRoute>
            }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<AttendanceStudentList />} />
            <Route path="attendance/:id" element={<AttendanceDetails />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="students" element={<Students />} />
            <Route path="subject" element={<Subjects />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="notice" element={<Notice />} />
            <Route path="class" element={<Class />} />
            <Route path="examinations" element={<Examination />} />
          </Route>

          {/* STUDENT ROUTES */}
          <Route
            path="student"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <Student />
              </ProtectedRoute>
            }>
            <Route index element={<StudentDetails />} />
            <Route path="attendance" element={<AttendanceStudent />} />
            <Route path="notice" element={<NoticeStudent />} />
            <Route path="examinations" element={<ExaminationsStudent />} />
            <Route path="schedule" element={<ScheduleStudent />} />
          </Route>

          {/* TEACHER ROUTES */}
          <Route
            path="teacher"
            element={
              <ProtectedRoute allowedRoles={["TEACHER"]}>
                <Teacher />
              </ProtectedRoute>
            }>
            <Route index element={<TeacherDetails />} />
            <Route path="schedule" element={<ScheduleTeacher />} />
            <Route path="attendance" element={<AttendanceTeacher />} />
            <Route path="examinations" element={<ExaminatonsTeacher />} />
            <Route path="notice" element={<NoticeTeacher />} />
          </Route>

          {/* CLIENT ROUTES */}
          <Route path="/" element={<Client />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="logout" element={<LogOut />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
