// CRUD Applications for Teacher Management System - CREATE, READ, UPDATE, DELETE
// AUTHENTICATION - Teacher, School

require("dotenv").config();
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Teacher = require("../models/teacher.model");

module.exports = {
  // REGISTER TEACHER
  registerTeacher: async (req, res) => {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err)
          return res.status(400).json({ success: false, message: err.message });

        // 1. Extract and sanitize values from formidable array format cleanly
        const email = Array.isArray(fields.email)
          ? fields.email[0]
          : fields.email;
        const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
        const age = Array.isArray(fields.age) ? fields.age[0] : fields.age;
        const gender = Array.isArray(fields.gender)
          ? fields.gender[0]
          : fields.gender;
        const qualification = Array.isArray(fields.qualification)
          ? fields.qualification[0]
          : fields.qualification;
        const password = Array.isArray(fields.password)
          ? fields.password[0]
          : fields.password;

        const schoolId = req.user.schoolId;

        // 2. Validate user uniqueness
        const existing = await Teacher.findOne({ email });
        if (existing) {
          return res
            .status(400)
            .json({ success: false, message: "Email is already registered" });
        }

        // 3. Process File Attachment
        const photo = Array.isArray(files.image) ? files.image[0] : files.image;
        if (!photo)
          return res
            .status(400)
            .json({ success: false, message: "No image uploaded" });

        const filepath = photo.filepath;
        const originalFileName = photo.originalFilename.replace(/\s+/g, "_");
        const newPath = path.join(
          __dirname,
          process.env.TEACHER_IMAGE_PATH ||
            "../public/images/uploaded/teachers",
          originalFileName,
        );

        fs.copyFileSync(filepath, newPath);

        // 4. Secure Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Instantiate and Save Model Record (Fixed sequence positioning)
        const newTeacher = new Teacher({
          school: schoolId,
          name,
          email,
          qualification,
          age,
          gender,
          teacher_image: originalFileName,
          password: hashedPassword,
        });

        await newTeacher.save();
        res.status(200).json({
          success: true,
          data: newTeacher,
          message: "Teacher registered successfully",
        });
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to register Teacher" });
    }
  },

  // LOGIN TEACHER
  loginTeacher: async (req, res) => {
    console.log("teacher login", req.body)
    try {
      const activeTeacher = await Teacher.findOne({ email: req.body.email });
      if (!activeTeacher)
        return res
          .status(401)
          .json({ success: false, message: "Email is not registered" });

      const isAuth = await bcrypt.compare(
        req.body.password,
        activeTeacher.password,
      );
      if (!isAuth)
        return res
          .status(401)
          .json({ success: false, message: "Invalid password" });

      const jwtSecret = process.env.JWT_SECRET;
      const token = jwt.sign(
        {
          id: activeTeacher._id,
          role: "TEACHER",
          schoolId: activeTeacher.school,
          name: activeTeacher.name,
          image_url: activeTeacher.teacher_image,
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
          id: activeTeacher._id,
          role: "TEACHER",
          schoolId: activeTeacher.school,
          name: activeTeacher.name,
          image_url: activeTeacher.teacher_image,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error [Teacher LOGIN]",
      });
    }
  },

  // READ WITH FILTER PARAMETERS
  getTeachersWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      filterQuery["school"] = schoolId;

      if (req.query.search) {
        filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      }

      const teachers = await Teacher.find(filterQuery).select(["-password"]);

      res.status(200).json({
        success: true,
        data: teachers,
        message: "All Teacher data retrieved successfully",
      });
    } catch (error) {
      console.error("Backend Error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error [ALL TEACHERS]",
      });
    }
  },

  // READ OWN DATA
  getTeacherOwnData: async (req, res) => {
    try {
      const id = req.user.id;
      const schoolId = req.user.schoolId;
      const profile = await Teacher.findOne({
        _id: id,
        school: schoolId,
      }).select(["-password"]);

      if (profile) {
        res.status(200).json({
          success: true,
          teacher: profile,
          message: "Teacher data retrieved successfully",
        });
      } else {
        res.status(404).json({ success: false, message: "Teacher not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error [OWN Teacher DATA].",
      });
    }
  },

  // READ BY ID
  getTeacherWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;
      const targetTeacher = await Teacher.findOne({
        _id: id,
        school: schoolId,
      }).select(["-password"]);

      if (targetTeacher) {
        res.status(200).json({
          success: true,
          teacher: targetTeacher,
          message: "Teacher data retrieved successfully",
        });
      } else {
        res.status(404).json({ success: false, message: "Teacher not found" });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error [ID Teacher DATA].",
      });
    }
  },

  // UPDATE TEACHER
  updateTeacher: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;
      const form = new formidable.IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err)
          return res.status(400).json({ success: false, message: err.message });

        const targetTeacher = await Teacher.findOne({
          _id: id,
          school: schoolId,
        });
        if (!targetTeacher)
          return res
            .status(404)
            .json({ success: false, message: "Teacher not found" });

        // Handle Image File Replace
        const incomingFile = Array.isArray(files.image)
          ? files.image[0]
          : files.image;
        if (incomingFile) {
          const filepath = incomingFile.filepath;
          const originalFileName = incomingFile.originalFilename.replace(
            /\s+/g,
            "_",
          );
          const newPath = path.join(
            __dirname,
            process.env.TEACHER_IMAGE_PATH ||
              "../public/images/uploaded/teachers",
            originalFileName,
          );

          if (targetTeacher.teacher_image) {
            const oldImagePath = path.join(
              __dirname,
              process.env.TEACHER_IMAGE_PATH ||
                "../public/images/uploaded/teachers",
              targetTeacher.teacher_image,
            );
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }

          fs.copyFileSync(filepath, newPath);
          targetTeacher.teacher_image = originalFileName;
        }

        // Loop and map text updates safely out of Formidable array containers
        Object.keys(fields).forEach((field) => {
          if (
            field !== "password" &&
            field !== "confirm_password" &&
            field !== "school"
          ) {
            const value = Array.isArray(fields[field])
              ? fields[field][0]
              : fields[field];
            targetTeacher[field] = value;
          }
        });

        // Patch clean password string update explicitly
        let plainPassword = Array.isArray(fields.password)
          ? fields.password[0]
          : fields.password;
        if (plainPassword && plainPassword.trim() !== "") {
          const salt = await bcrypt.genSalt(10);
          targetTeacher.password = await bcrypt.hash(plainPassword, salt);
        }

        await targetTeacher.save();
        res.status(200).json({
          success: true,
          data: targetTeacher,
          message: "Teacher updated successfully",
        });
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Failed to Update Teacher" });
    }
  },

  // DELETE TEACHER
  deleteTeacherWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      await Teacher.findOneAndDelete({ _id: id, school: schoolId });

      res.status(200).json({
        success: true,
        message: "Teacher deleted successfully",
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to Delete Teacher" });
    }
  },
};
