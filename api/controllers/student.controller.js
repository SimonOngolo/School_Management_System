// CRUD Applications for Student Management System - CREATE, READ, UPDATE, DELETE
// AUTHENTICATION - Student, Teacher

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const Student = require("../models/student.model");

module.exports = {
  // REGISTER
  registerStudent: async (req, res) => {
    try {
      const {
        email,
        name,
        age,
        gender,
        student_class,
        guardian,
        guardian_phone,
        password,
        ecole_origine,
        bac,
        lieu_naissance,
        date_naissance,
        groupe,
      } = req.body;

      const existing = await Student.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already registered" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No image uploaded" });
      }

      const originalFileName = req.file.filename; // Multer generates a unique filename

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newStudent = new Student({
        school: req.user.schoolId,
        name,
        email,
        age,
        gender,
        student_class,
        ecole_origine,
        bac,
        lieu_naissance,
        date_naissance,
        groupe,
        student_image: originalFileName,
        guardian,
        guardian_phone,
        password: hashedPassword,
      });

      await newStudent.save();

      res.status(200).json({
        success: true,
        data: newStudent,
        message: "Student registered successfully",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to register student" });
    }
  },

  // LOGIN
  loginStudent: async (req, res) => {
    try {
      const student = await Student.findOne({ email: req.body.email });
      if (!student)
        return res
          .status(401)
          .json({ success: false, message: "Email is not registered" });

      const isAuth = await bcrypt.compare(req.body.password, student.password);
      if (!isAuth)
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });

      const jwtSecret = process.env.JWT_SECRET;
      const token = jwt.sign(
        {
          id: student._id,
          role: "STUDENT",
          schoolId: student.school,
          class: student.student_class,
          name: student.name,
          image_url: student.student_image,
        },
        jwtSecret,
        { expiresIn: "1d" },
      );

      res.header("Authorization", token);
      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: student._id,
          role: "STUDENT",
          schoolId: student.school,
          class: student.student_class,
          name: student.name,
          image_url: student.student_image,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error [STUDENT LOGIN]",
      });
    }
  },

  // READ WITH FILTER PARAMETERS
  getStudentsWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      filterQuery["school"] = schoolId;

      if (req.query.search) {
        filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      }

      if (req.query.student_class) {
        filterQuery["student_class"] = req.query.student_class;
      }

      const students = await Student.find(filterQuery)
        .select(["-password"])
        .populate("student_class");

      res.status(200).json({
        success: true,
        data: students,
        message: "All Student data retrieved successfully",
      });
    } catch (error) {
      console.error("Backend Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error [ALL STUDENTS]",
      });
    }
  },

  // READ OWN DATA
  getStudentOwnData: async (req, res) => {
    try {
      const id = req.user.id;
      const schoolId = req.user.schoolId;
      const student = await Student.findOne({
        _id: id,
        school: schoolId,
      })
        .select(["-password"])
        .populate("student_class");

      if (student) {
        res.status(200).json({
          success: true,
          student,
          message: "Student data retrieved successfully",
        });
      } else {
        res.status(404).json({ success: false, message: "Student not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error [OWN Student DATA].",
      });
    }
  },

  // READ BY ID
  getStudentWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;
      const student = await Student.findOne({
        _id: id,
        school: schoolId,
      })
        .select(["-password"])
        .populate("student_class");

      if (student) {
        res.status(200).json({
          success: true,
          student,
          message: "Student data retrieved successfully",
        });
      } else {
        res.status(404).json({ success: false, message: "Student not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error [ID Student DATA].",
      });
    }
  },

  // UPDATE STUDENT
  updateStudent: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const student = await Student.findOne({ _id: id, school: schoolId });
      if (!student)
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });

      if (req.file) {
        const uploadDir = path.join(__dirname, "../uploads");
        if (student.student_image) {
          const oldImagePath = path.join(uploadDir, student.student_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        student.student_image = req.file.filename;
      }

      Object.keys(req.body).forEach((field) => {
        if (field !== "password" && field !== "confirm_password") {
          student[field] = req.body[field];
        }
      });

      let plainPassword = req.body.password;
      if (plainPassword && plainPassword.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(plainPassword, salt);
      }

      await student.save();

      // Automatically sync student update to port 3002
      try {
        const nameParts = (student.name || "").trim().split(" ");
        const firstName = nameParts[0] || student.name;
        const lastName = nameParts.slice(1).join(" ") || "N/A";
        const matricule = `STU_${student._id.toString().slice(-6).toUpperCase()}`;

        await axios.put(
          `http://localhost:3002/api/students/${matricule}`,
          { firstName, lastName },
          {
            headers: {
              "x-internal-secret": process.env.INTERNAL_SYNC_SECRET,
            },
          },
        );
      } catch (syncError) {
        console.error(
          "Sync update failed:",
          syncError.response?.data || syncError.message,
        );
      }

      res.status(200).json({
        success: true,
        data: student,
        message: "Student updated and synced successfully",
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to Update Student" });
    }
  },

  // DELETE
  deleteStudentWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const student = await Student.findOneAndDelete({
        _id: id,
        school: schoolId,
      });
      if (!student) {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      // Automatically sync student deletion to port 3002
      try {
        const matricule = `STU_${student._id.toString().slice(-6).toUpperCase()}`;
        await axios.delete(`http://localhost:3002/api/students/${matricule}`, {
          headers: {
            "x-internal-secret": process.env.INTERNAL_SYNC_SECRET,
          },
        });
      } catch (syncError) {
        console.error(
          "Sync deletion failed:",
          syncError.response?.data || syncError.message,
        );
      }

      res.status(200).json({
        success: true,
        message: "Student deleted and synced successfully",
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to Delete Student" });
    }
  },
};
