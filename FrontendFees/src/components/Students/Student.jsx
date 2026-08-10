import React, { useState, useEffect } from "react";
import "./Student.css";
import Sidebar from "../Sidebar/Sidebar";
import { baseApi as BASE_URL } from "../../assets/assets";
import { useNavigate } from "react-router-dom";

export default function Student() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    standard: "",
    email: "",
    totalFees: "",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        alert("You must be logged in to register a student.");
        return;
      }
      const res = await fetch(`${BASE_URL}/students`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        alert("You must be logged in to register a student.");
        return;
      }

      const res = await fetch(`${BASE_URL}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Student registered successfully.");
        setFormData({ name: "", standard: "", email: "", totalFees: "" });
        fetchStudents();
      } else {
        alert("Failed to register student.");
      }
    } catch (err) {
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (student) => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      setLoading(true);
      fetch(`${BASE_URL}/deletStudent/${student._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Student deleted successfully.");
            fetchStudents();
            setSelectedStudents((prev) => {
              const newSet = new Set(prev);
              newSet.delete(student._id);
              return newSet;
            });
          } else {
            alert("Failed to delete student.");
          }
        })
        .catch((err) => console.error("Delete error:", err))
        .finally(() => setLoading(false));
    }
  };

  const handleStudentSelect = (studentId, isChecked) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isChecked) => {
    setSelectAll(isChecked);
    if (isChecked) {
      const allFilteredIds = new Set(
        filteredStudents.map((student) => student._id),
      );
      setSelectedStudents(allFilteredIds);
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) {
      alert("Please select students to delete.");
      return;
    }

    const selectedCount = selectedStudents.size;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedCount} selected student(s)?`,
      )
    ) {
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const deletePromises = Array.from(selectedStudents).map((studentId) =>
        fetch(`${BASE_URL}/deletStudent/${studentId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((res) => res.json()),
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((result) => result.success).length;

      if (successCount === selectedCount) {
        alert(`Successfully deleted ${successCount} student(s).`);
      } else {
        alert(
          `Deleted ${successCount} out of ${selectedCount} students. Some deletions failed.`,
        );
      }

      fetchStudents();
      setSelectedStudents(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("An error occurred during bulk deletion.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.standard.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.stdID &&
        student.stdID.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  useEffect(() => {
    if (filteredStudents.length === 0) {
      setSelectAll(false);
    } else {
      const allFilteredSelected = filteredStudents.every((student) =>
        selectedStudents.has(student._id),
      );
      setSelectAll(allFilteredSelected);
    }
  }, [selectedStudents, filteredStudents]);

  return (
    <div className="student-container">
      <div className="sidebar">
        <Sidebar />
      </div>

      <div className="student-content-area">
        <div className="student-header">
          <h1>Student Management</h1>
          <p>Register new students and manage existing records</p>
        </div>

        {/* Registration Form */}
        <div className="form-section">
          <div className="form-card">
            <h2>Register New Student</h2>
            <form onSubmit={handleSubmit} className="student-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter student's full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="standard">Standard/Class</label>
                <input
                  id="standard"
                  name="standard"
                  value={formData.standard}
                  onChange={handleChange}
                  placeholder="Enter class/standard"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  type="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalFees">Total Fees</label>
                <input
                  id="totalFees"
                  name="totalFees"
                  value={formData.totalFees}
                  onChange={handleChange}
                  placeholder="Enter total fees amount"
                  type="number"
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Registering..." : "Register Student"}
              </button>
            </form>
          </div>
        </div>

        {/* Students List */}
        <div className="students-section">
          <div className="students-header">
            <h2>All Students ({filteredStudents.length})</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search name/email/stdID/course"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <div className="bulk-actions">
              <span className="selected-count">
                {selectedStudents.size} student(s) selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="bulk-delete-btn"
                disabled={loading}>
                {loading
                  ? "Deleting..."
                  : `Delete Selected (${selectedStudents.size})`}
              </button>
            </div>
          )}

          <div className="table-container">
            {loading ? (
              <div className="loading">Loading students...</div>
            ) : (
              <table className="students-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={filteredStudents.length === 0}
                      />
                    </th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Standard</th>
                    <th>Email</th>
                    <th>Total Fees</th>
                    <th>Fees Paid</th>
                    <th>Pay</th>
                    <th>History</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="no-data">
                        {searchTerm
                          ? "No students found matching your search."
                          : "No students found."}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStudents.has(student._id)}
                            onChange={(e) =>
                              handleStudentSelect(student._id, e.target.checked)
                            }
                          />
                        </td>
                        <td className="student-id">{student.stdID}</td>
                        <td className="student-name">{student.name}</td>
                        <td>{student.standard}</td>
                        <td>{student.email}</td>
                        <td className="fees">FCFA {student.totalFees}</td>
                        <td className="fees-paid">
                          FCFA {student.feesPaid || 0}
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              navigate("/fees", { state: { student } })
                            }>
                            Pay
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              navigate("/student-info", { state: { student } })
                            }>
                            History
                          </button>
                        </td>
                        <td>
                          <button onClick={() => handleClick(student)}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
