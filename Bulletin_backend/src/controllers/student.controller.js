const { Student, Group, User } = require("../models");
const bcrypt = require("bcryptjs");

// Get all students
const getAllStudents = async (req, res, next) => {
  try {
    const { groupId, academicYear, search } = req.query;
    const where = {};

    if (search) {
      // Basic search support matching frontend search input
      const { Op } = require("sequelize");
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { matricule: { [Op.like]: `%${search}%` } },
      ];
    }

    let groupWhere = {};
    if (academicYear) groupWhere.academicYear = academicYear;

    const includeOptions = [
      {
        model: Group,
        where: Object.keys(groupWhere).length > 0 ? groupWhere : undefined,
        required: false,
      },
    ];

    if (groupId) {
      where.groupId = groupId;
    }

    const students = await Student.findAll({
      where,
      include: includeOptions,
    });
    res.json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};

// Get a student by ID
const getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [{ model: Group }],
    });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// Create a student (Adapted for Frontend Mappings)
const createStudent = async (req, res, next) => {
  try {
    const {
      name,
      email,
      groupe, // Frontend sends group name string
      date_naissance,
      lieu_naissance,
      bac,
      ecole_origine,
      password,
      matricule: customMatricule,
    } = req.body;

    // Split full name into firstName and lastName
    const nameParts = (name || "").trim().split(" ");
    const firstName = nameParts[0] || "Unknown";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Resolve group name to groupId if groupe is provided
    let resolvedGroupId = null;
    if (groupe) {
      const groupRecord = await Group.findOne({ where: { name: groupe } });
      if (groupRecord) {
        resolvedGroupId = groupRecord.id;
      } else {
        // Fallback if group model uses id directly or if groupe is an ID
        const groupById = await Group.findByPk(groupe);
        if (groupById) resolvedGroupId = groupById.id;
      }
    }

    // Generate or assign matricule
    const matricule =
      customMatricule || `STU-${Date.now().toString().slice(-6)}`;

    const existingStudent = await Student.findOne({ where: { matricule } });
    if (existingStudent) {
      return res
        .status(400)
        .json({ success: false, message: "Matricule already exists" });
    }

    const student = await Student.create({
      matricule,
      groupId: resolvedGroupId,
      firstName,
      lastName,
      birthDate: date_naissance || null,
      birthPlace: lieu_naissance || null,
      bacType: bac || null,
      originSchool: ecole_origine || "INPTIC",
    });

    // Automatically create a user account for the student
    const defaultPassword = password || matricule;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const userEmail = email || `${matricule.toLowerCase()}@student.inptic.ga`;

    try {
      await User.create({
        email: userEmail,
        password: hashedPassword,
        role: "student",
        firstName,
        lastName,
        active: true,
      });
    } catch (userError) {
      console.log(`⚠️ Unable to create user account: ${userError.message}`);
    }

    const studentWithGroup = await Student.findByPk(student.id, {
      include: [{ model: Group }],
    });

    res.status(201).json({
      success: true,
      data: studentWithGroup,
      message: `Student created successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

// Update a student
const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const { name, groupe, date_naissance, lieu_naissance, bac, ecole_origine } =
      req.body;

    let updateData = { ...req.body };

    // Handle name split if name is updated
    if (name) {
      const nameParts = name.trim().split(" ");
      updateData.firstName = nameParts[0] || student.firstName;
      updateData.lastName = nameParts.slice(1).join(" ") || student.lastName;
      delete updateData.name;
    }

    // Resolve group name if provided
    if (groupe) {
      const groupRecord = await Group.findOne({ where: { name: groupe } });
      if (groupRecord) {
        updateData.groupId = groupRecord.id;
      }
      delete updateData.groupe;
    }

    // Map snake_case to camelCase model fields if present
    if (date_naissance) updateData.birthDate = date_naissance;
    if (lieu_naissance) updateData.birthPlace = lieu_naissance;
    if (bac) updateData.bacType = bac;
    if (ecole_origine) updateData.originSchool = ecole_origine;

    await student.update(updateData);

    const updatedStudent = await Student.findByPk(student.id, {
      include: [{ model: Group }],
    });

    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    next(error);
  }
};

// Delete a student
const deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    await student.destroy();
    res.json({ success: true, message: "Student deleted" });
  } catch (error) {
    next(error);
  }
};

const createMissingStudentAccounts = async (req, res, next) => {
  try {
    const students = await Student.findAll();
    const results = { created: [], skipped: [], errors: [] };

    for (const student of students) {
      const email = `${student.matricule.toLowerCase()}@student.inptic.ga`;
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        results.skipped.push({
          matricule: student.matricule,
          email,
          reason: "Account already exists",
        });
        continue;
      }

      try {
        const defaultPassword = student.matricule;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await User.create({
          email,
          password: hashedPassword,
          role: "student",
          firstName: student.firstName,
          lastName: student.lastName,
          active: true,
        });

        results.created.push({ matricule: student.matricule, email });
      } catch (error) {
        results.errors.push({
          matricule: student.matricule,
          email,
          error: error.message,
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  createMissingStudentAccounts,
};
