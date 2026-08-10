const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const User = require("../models/User");
const StudentFee = require("../models/StudentFee");
const PendingUser = require("../models/PendingUser");
const authenticateToken = require("../middleware/auth");
const verificationSecret = process.env.JWT_SECRET;
const PDFDocument = require("pdfkit");
const streamBuffers = require("stream-buffers");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

router.post("/register", async (req, res) => {
  const { username, password, email, phone, insaddress, insname } = req.body;
  const tagline = req.body.tagline || " "; // Default tagline if not provided
  try {
    const existingUser = await User.findOne({ username });
    const existingPending = await PendingUser.findOne({ username });
    if (existingUser || existingPending) {
      return res
        .status(400)
        .json({ error: "Username already taken or pending" });
    }

    const pendingUser = new PendingUser({
      username,
      password,
      email,
      phone,
      insname,
      tagline,
      insaddress,
    });
    await pendingUser.save();

    // Notify admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // your own email from .env
      subject: "New Registration Request",
      html: `
        <p>A new user has requested to register:</p>
        <ul>
          <li>Username: ${username}</li>
          <li>Email: ${email}</li>
        </ul>
        <p><a href="http://localhost:5006/approve?username=${username}">Click here to approve</a></p>
      `,
    });

    res
      .status(201)
      .json({ message: "Registration request sent. Await admin approval." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.get("/approve", async (req, res) => {
  const username = req.query.username;
  console.log("Approval request received for username:", username);
  try {
    const pendingUser = await PendingUser.findOne({ username });
    if (!pendingUser) return res.status(404).send("User not found");

    const newUser = new User({
      username: pendingUser.username,
      password: pendingUser.password,
      email: pendingUser.email,
      phone: pendingUser.phone,
      insname: pendingUser.insname,
      tagline: pendingUser.tagline,
      insaddress: pendingUser.insaddress,
      role: "admin",
      verified: false,
    });

    await newUser.save();
    await PendingUser.deleteOne({ username });

    // Send verification email
    const token = jwt.sign({ email: newUser.email }, verificationSecret, {
      expiresIn: "1h",
    });
    const verificationLink = `http://localhost:5006/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: newUser.email,
      subject: "Verify your Career Compass account",
      html: `<p>Hi ${username},</p><p>Your registration is approved. Click to verify:</p><a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.send("User approved and verification email sent");
  } catch (err) {
    res.status(500).send("Approval failed");
  }
});

router.get("/verify-email", async (req, res) => {
  const token = req.query.token;
  try {
    const { email } = jwt.verify(token, verificationSecret);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found");

    if (user.verified) {
      return res.send("Email already verified. You can now login.");
    }

    user.verified = true;
    await user.save();

    res.send("Email verified successfully! You can now login.");
  } catch (err) {
    console.error("Verification error:", err.message);
    res.status(400).send("Invalid or expired verification link");
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  console.log("Login attempt for user:", username);
  try {
    const user = await User.findOne({ username });
    const pendingUser = await PendingUser.findOne({ username });
    console.log("Pending user found:", pendingUser);
    if (pendingUser) {
      return res
        .status(404)
        .json({ error: "Please wait for Approval from admin" });
    }

    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    if (!user.verified) {
      return res
        .status(403)
        .json({ error: "Please check your inbox to verify your email." });
    }

    // Include _id for tracking the user
    const token = jwt.sign(
      { _id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Initiate Google login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT
    const token = jwt.sign(
      { _id: req.user._id, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    // Dynamically detect frontend URL to support both local network IPs and localhost
    const frontendUrl =
      process.env.FRONTEND_URL ||
      `${req.protocol}://${req.get("host").replace(/:\d+$/, "")}:5173`;

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/google-success?token=${token}`);
  },
);

// Middleware to validate token
router.get("/validate-token", (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ valid: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (err) {
    res.status(403).json({ valid: false });
  }
});

router.post("/fees", authenticateToken, async (req, res) => {
  const { name, standard, amountPaid, email, date, paymentMethod } = req.body;
  console.log("Received fee payment request:", req.body);
  try {
    const loggedInUser = await User.findById(req.user._id);
    const userName = loggedInUser.username;
    const userEmail = loggedInUser.email;
    const userPhone = loggedInUser.phone;
    const useraddress = loggedInUser.insaddress;
    const userinsname = loggedInUser.insname;
    const usertagline = loggedInUser.tagline;

    let student = await StudentFee.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      owner: req.user._id,
      standard,
      email,
    });

    if (!student) {
      return res.status(404).json({
        error: "Student not found. Please register the student first.",
      });
    }
    if (student.feesPaid + parseFloat(amountPaid) > student.totalFees) {
      return res.status(400).json({
        error: "Payment exceeds total fees. Please check the amount.",
      });
    }

    // Update payment details
    student.feesPaid += parseFloat(amountPaid);
    student.feePayments.push({
      amount: parseFloat(amountPaid),
      paymentMode: paymentMethod,
      paymentDate: date ? new Date(date) : new Date(),
    });

    await student.save();

    // Generate professional PDF receipt
    const doc = new PDFDocument({ margin: 50 });
    const bufferStream = new streamBuffers.WritableStreamBuffer();
    doc.pipe(bufferStream);

    // Header section with styling
    doc.rect(50, 50, 495, 120).fillAndStroke("#f8f9fa", "#dee2e6");
    doc
      .fillColor("#1e3a8a")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(`${userinsname}`, 70, 70, { width: 455 });

    doc
      .fillColor("#475569")
      .fontSize(10)
      .font("Helvetica")
      .text(`${usertagline}`, 70, 98, { width: 455 });

    doc
      .fillColor("#64748b")
      .fontSize(9)
      .text(
        `Address: ${useraddress} | Phone: +237 ${userPhone} | Email: ${userEmail}`,
        70,
        118,
        {
          width: 455,
        },
      );

    // Receipt title banner
    doc.fillColor("#1e3a8a").rect(50, 185, 495, 35).fill("#1e3a8a");
    doc
      .fillColor("#ffffff")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("OFFICIAL FEE SETTLEMENT RECEIPT", 50, 196, {
        align: "center",
        width: 495,
      });

    const receiptNumber = `RCP-${Date.now()}`;
    const paymentDate = date
      ? new Date(date).toLocaleDateString()
      : new Date().toLocaleDateString();

    doc
      .fillColor("#334155")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`Receipt Ref: ${receiptNumber}`, 50, 235)
      .text(`Date: ${paymentDate}`, 400, 235, { align: "right" });

    // Student Information Section
    doc
      .fillColor("#1e3a8a")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Student Profile", 50, 265);
    doc.rect(50, 280, 495, 1).fill("#cbd5e1");

    const studentInfo = [
      ["Full Name:", student.name],
      ["Program / Class:", student.standard],
      ["Institutional ID:", student.stdID],
      ["Contact Email:", student.email],
    ];

    let yPos = 295;
    studentInfo.forEach(([label, value]) => {
      doc
        .fillColor("#64748b")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(label, 50, yPos, { width: 130 });
      doc
        .fillColor("#1e293b")
        .fontSize(10)
        .font("Helvetica")
        .text(value, 180, yPos);
      yPos += 18;
    });

    // Financial breakdown table
    yPos += 15;
    doc
      .fillColor("#1e3a8a")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Transaction Breakdown", 50, yPos);
    doc.rect(50, yPos + 15, 495, 1).fill("#cbd5e1");

    yPos += 30;
    doc.fillColor("#f1f5f9").rect(50, yPos, 495, 22).fill("#f1f5f9");
    doc
      .fillColor("#334155")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Description", 60, yPos + 6)
      .text("Amount (FCFA)", 400, yPos + 6);

    yPos += 22;
    doc.fillColor("#ffffff").rect(50, yPos, 495, 22).stroke();
    doc
      .fillColor("#1e293b")
      .fontSize(10)
      .font("Helvetica")
      .text("Tuition / Fee Installment Deposit", 60, yPos + 6)
      .text(`${parseFloat(amountPaid).toLocaleString()} XAF`, 400, yPos + 6);

    // Summary block
    yPos += 40;
    const remainingAmount = student.totalFees - student.feesPaid;
    const summaryItems = [
      ["Total Program Fees:", `${student.totalFees.toLocaleString()} XAF`],
      ["Cumulative Paid To Date:", `${student.feesPaid.toLocaleString()} XAF`],
      ["Outstanding Balance:", `${remainingAmount.toLocaleString()} XAF`],
    ];

    summaryItems.forEach(([label, value], index) => {
      const isBalance = index === 2;
      doc
        .fillColor(isBalance ? "#eff6ff" : "#ffffff")
        .rect(300, yPos, 245, 20)
        .fillAndStroke(isBalance ? "#eff6ff" : "#ffffff", "#e2e8f0");
      doc
        .fillColor(isBalance ? "#1d4ed8" : "#334155")
        .fontSize(10)
        .font(isBalance ? "Helvetica-Bold" : "Helvetica")
        .text(label, 310, yPos + 5)
        .text(value, 430, yPos + 5, { align: "right", width: 105 });
      yPos += 20;
    });

    yPos += 10;
    doc
      .fillColor("#475569")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Payment Mode:", 50, yPos);
    doc.fillColor("#1e293b").font("Helvetica").text(paymentMethod, 150, yPos);

    // Footer Signatures
    yPos += 60;
    doc
      .fillColor("#64748b")
      .fontSize(9)
      .font("Helvetica")
      .text(
        "This is an electronically generated document. Valid without physical signature.",
        50,
        yPos,
      );
    doc.font("Helvetica-Bold").text("Authorized Finance Seal", 400, yPos, {
      align: "right",
      width: 145,
    });
    doc.rect(400, yPos - 10, 145, 1).fill("#cbd5e1");

    doc.end();

    bufferStream.on("finish", async () => {
      const pdfBuffer = bufferStream.getContents();

      // 1. Email sent to the Student
      const studentMailOptions = {
        from: `"${userinsname}" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: `Official Payment Confirmation & E-Receipt | ${userinsname}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h2 style="color: #1e3a8a;">Payment Confirmation</h2>
            <p>Dear <strong>${student.name}</strong>,</p>
            <p>We have received your payment of <strong>${parseFloat(amountPaid).toLocaleString()} XAF</strong> via ${paymentMethod}.</p>
            <p>Please find your official electronic receipt attached to this email.</p>
            <br/>
            <p>Best regards,<br/><strong>${userinsname}</strong></p>
          </div>
        `,
        attachments: [
          {
            filename: `Fee_Receipt_${student.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      // 2. Email sent to the Administrator
      const adminMailOptions = {
        from: `"${userinsname} System" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: `[Finance Audit] Payment Logged - ${student.name} (${student.stdID})`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
            <h2 style="color: #1e3a8a;">New Fee Transaction Recorded</h2>
            <p>A payment of <strong>${parseFloat(amountPaid).toLocaleString()} XAF</strong> was successfully processed for student <strong>${student.name}</strong> (${student.stdID}).</p>
            <ul>
              <li><strong>Remaining Balance:</strong> ${remainingAmount.toLocaleString()} XAF</li>
              <li><strong>Payment Mode:</strong> ${paymentMethod}</li>
            </ul>
          </div>
        `,
      };

      // Send both emails out concurrently
      await Promise.all([
        transporter.sendMail(studentMailOptions),
        transporter.sendMail(adminMailOptions),
      ]);

      res.status(200).json({
        message: "Fee recorded successfully and notifications dispatched",
        receiptNumber: receiptNumber,
        user: {
          address: useraddress,
          instituteName: userinsname,
          tagline: usertagline,
          phone: userPhone,
          email: userEmail,
        },
        updatedStudent: {
          name: student.name,
          standard: student.standard,
          totalFees: student.totalFees,
          feesPaid: student.feesPaid,
          feesRemaining: student.totalFees - student.feesPaid,
          paymentMethod: paymentMethod,
          paymentDate: paymentDate,
        },
      });
    });
  } catch (error) {
    console.error("Fee processing error:", error);
    res.status(500).json({ error: "Fee processing failed. Please try again." });
  }
});

router.get("/students", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching students for user:", req.user._id);
    const students = await StudentFee.find({ owner: req.user._id });
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/students", authenticateToken, async (req, res) => {
  const { name, standard, email, totalFees } = req.body;
  const course =
    standard.charAt(0).toUpperCase() + standard.slice(1).toLowerCase();
  const admissionYear = new Date().getFullYear();
  console.log("Creating student for user:", req.user._id);
  if (!name || !standard || !email || !totalFees) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const lastStudent = await StudentFee.findOne({
      standard: course,
      owner: req.user._id,
    }).sort({ stdID: -1 });

    let newIndex = 1;
    if (lastStudent) {
      const lastStdID = lastStudent.stdID;
      const lastNumber = parseInt(lastStdID.slice(-4));
      newIndex = lastNumber + 1;
    }
    const courseCodes = {
      Commerce: "80",
      Science: "70",
      School: "90",
    };

    const stdID = `${admissionYear}${courseCodes[course] || "9999"}${newIndex.toString().padStart(4, "0")}`;
    const newStudent = new StudentFee({
      stdID,
      name,
      standard: course,
      email,
      totalFees: Number(totalFees),
      feesPaid: 0,
      feePayments: [],
      owner: req.user._id,
    });

    await newStudent.save();
    console.log("Student saved!");
    res.status(201).json(newStudent);
  } catch (err) {
    console.error("Error creating student:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/deletStudent/:id", authenticateToken, async (req, res) => {
  const studentId = req.params.id;
  console.log("Deleting student with ID:", studentId);
  try {
    const result = await StudentFee.deleteOne({
      _id: studentId,
      owner: req.user._id,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard-stats", authenticateToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const students = await StudentFee.find({ owner: userId });

    const totalStudents = students.length;
    const totalRevenue = students.reduce(
      (sum, student) => sum + student.feesPaid,
      0,
    );
    console.log(
      "In /dashboard-stats Total Students:",
      totalStudents,
      "Total Revenue:",
      totalRevenue,
    );
    const fullyPaid = students.filter(
      (student) => student.feesPaid === student.totalFees,
    ).length;
    const remaining = totalStudents - fullyPaid;

    res.json({
      totalStudents,
      totalRevenue,
      fullyPaid,
      remaining,
    });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

router.get("/monthly-growth", authenticateToken, async (req, res) => {
  const userid = new mongoose.Types.ObjectId(req.user._id);
  try {
    const result = await StudentFee.aggregate([
      {
        $match: { owner: userid },
      },
      {
        $group: {
          _id: { $month: "$dateOfAdmission" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formatted = result.map((item) => ({
      name: monthNames[item._id - 1],
      students: item.count,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
});

router.get("/monthly-revenue", authenticateToken, async (req, res) => {
  const userid = new mongoose.Types.ObjectId(req.user._id);
  try {
    const result = await StudentFee.aggregate([
      {
        $match: { owner: userid },
      },
      {
        $unwind: "$feePayments",
      },
      {
        $group: {
          _id: { $month: "$feePayments.paymentDate" },
          revenue: { $sum: "$feePayments.amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const data = result.map((item) => ({
      month: monthNames[item._id - 1],
      revenue: item.revenue,
    }));
    res.json(data);
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
});

module.exports = router;
