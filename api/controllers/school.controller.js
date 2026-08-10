// CRUD Applications for School Management System - CREATE, READ, UPDATE, DELETE
// AUTHENTICATION - SCHOOL, TEACHER, STUDENT

require("dotenv").config();
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const School = require("../models/school.model");

module.exports = {
  // REGISTER
  registerSchool: async (req, res) => {
    try {
      const form = new formidable.IncomingForm();
      form.parse(req, async (err, fields, files) => {
        if (err) return res.status(400).json({ success: false, message: err.message });

        const existing = await School.findOne({ email: fields.email });
        if (existing) {
          return res.status(400).json({ success: false, message: "Email is already registered" });
        }

        const photo = files.image;
        if (!photo) return res.status(400).json({ success: false, message: "No image uploaded" });

        const filepath = photo.filepath;
        const originalFileName = photo.originalFilename.replace(/\s+/g, "_");
        const newPath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, originalFileName);

        fs.copyFileSync(filepath, newPath);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(fields.password, salt);

        const newSchool = new School({
          school_name: fields.school_name,
          email: fields.email,
          owner_name: fields.owner_name,
          school_image: originalFileName,
          password: hashedPassword,
        });

        await newSchool.save();
        res.status(200).json({ success: true, data: newSchool, message: "School registered successfully" });
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to register school" });
    }
  },

  // LOGIN
  loginSchool: async (req, res) => {
    try {
      const school = await School.findOne({ email: req.body.email });
      if (!school) return res.status(401).json({ success: false, message: "Email is not registered" });

      const isAuth = await bcrypt.compare(req.body.password, school.password);
      if (!isAuth) return res.status(401).json({ success: false, message: "Invalid password" });

      const jwtSecret = process.env.JWT_SECRET;
      const token = jwt.sign(
        {
          id: school._id,
          role: "SCHOOL",
          schoolId: school._id,
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
          id: school._id,
          owner_name: school.owner_name,
          school_name: school.school_name,
          school_image: school.school_image,
          role: "SCHOOL",
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error [SCHOOL LOGIN]" });
    }
  },

  // READ ALL
  getAllSchools: async (req, res) => {
    try {
      const schools = await School.find().select(['-password','-_id','-email','-owner_name','-createdAt'])
      res.status(200).json({ success: true, data: schools, message: "All school data retrieved successfully",schools });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error [ALL SCHOOLS]" });
    }
  },

  // READ OWN
getSchoolOwnData: async (req, res) => {
  try {
    const id = req.user.id; // comes from authMiddleware
    const school = await School.findOne({_id:id}).select(['-password'])
    if (school) {
      res.status(200).json({ success: true, school, message: "School data retrieved successfully" });
    } else {
      res.status(404).json({ success: false, message: "School not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error [OWN SCHOOL DATA]" });
  }
},


  // UPDATE
  updateSchool: async (req, res) => {
    try {
      const id = req.user.id; // ✅ use JWT user id
      const form = new formidable.IncomingForm();

      form.parse(req, async (err, fields, files) => {
        if (err) return res.status(400).json({ success: false, message: err.message });

        const school = await School.findById(id);
        if (!school) return res.status(404).json({ success: false, message: "School not found" });

        // ✅ Handle image upload
        if (files.image) {
          const photo = files.image;
          const filepath = photo.filepath;
          const originalFileName = photo.originalFilename.replace(/\s+/g, "_");
          const newPath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, originalFileName);

          // delete old image if exists
          if (school.school_image) {
            const oldImagePath = path.join(__dirname, process.env.SCHOOL_IMAGE_PATH, school.school_image);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
            }
          }

          fs.copyFileSync(filepath, newPath);
          school.school_image = originalFileName;
        }

        // ✅ Update text fields
        Object.keys(fields).forEach((field) => {
          school[field] = fields[field];
        });

        await school.save();
        res.status(200).json({ success: true, data: school, message: "School updated successfully" });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Failed to update school" });
    }
  },
};
