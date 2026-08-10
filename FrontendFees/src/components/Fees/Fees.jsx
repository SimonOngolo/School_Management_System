import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import { baseApi as BASE_URL } from "../../assets/assets";
import "./Fees.css";

const Fees = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const studentData = location.state?.student || {};

  const [formData, setFormData] = useState({
    name: studentData.name || "",
    standard: studentData.standard || "",
    amountPaid: "",
    email: studentData.email || "",
    paymentMethod: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.standard ||
      !formData.amountPaid ||
      !formData.email ||
      !formData.paymentMethod
    ) {
      setErrorMsg("Please fill out all mandatory payment fields.");
      return;
    }
    if (Number(formData.amountPaid) <= 0) {
      setErrorMsg("The payment amount must be strictly greater than zero.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setReceipt(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/fees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 404) {
        alert("Student profile not found. Redirecting to registration.");
        navigate("/Student");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Transaction processing failed.");
      }

setReceipt({
  name: data.updatedStudent.name,
  standard: data.updatedStudent.standard,
  totalFees: data.updatedStudent.totalFees,
  feesPaid: data.updatedStudent.feesPaid,
  feesRemaining: data.updatedStudent.feesRemaining,
  paymentMethod: formData.paymentMethod,
  paymentDate: formData.date
    ? new Date(formData.date).toLocaleDateString()
    : new Date().toLocaleDateString(),
  receiptNo: data.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
  useraddress: data.address,
  userinsname: data.instituteName,
  usertagline: data.tagline,
  userPhone: data.phone,
  userEmail: data.email,
});
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleResetForm = () => {
    setReceipt(null);
    setFormData({
      name: "",
      standard: "",
      amountPaid: "",
      email: "",
      paymentMethod: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="fees-layout-modern">
      <aside className="sidebar-wrapper">
        <Sidebar />
      </aside>

      <main className="fees-main-content">
        <div className="fees-container">
          <div className="fees-header-block">
            <div>
              <h1>Fee Collection Terminal</h1>
              <p>
                Process secure transactions and dispatch instant digital
                invoices.
              </p>
            </div>
            {receipt && (
              <button
                className="btn-secondary-action"
                onClick={handleResetForm}>
                + New Transaction
              </button>
            )}
          </div>

          {errorMsg && <div className="alert-error-banner">{errorMsg}</div>}

          {!receipt ? (
            <form className="transaction-form-card" onSubmit={handleSubmit}>
              <div className="form-section-title">
                <span>1</span> Student & Billing Details
              </div>

              <div className="form-grid-dual">
                <div className="input-group">
                  <label>Student Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Standard / Course</label>
                  <input
                    type="text"
                    name="standard"
                    placeholder="e.g. Science / Grade 10"
                    value={formData.standard}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-dual">
                <div className="input-group">
                  <label>Recipient Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="student@domain.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-section-title" style={{ marginTop: "24px" }}>
                <span>2</span> Payment Execution
              </div>

              <div className="form-grid-dual">
                <div className="input-group">
                  <label>Amount Tendered (FCFA)</label>
                  <input
                    type="number"
                    name="amountPaid"
                    placeholder="0.00"
                    min="1"
                    step="any"
                    value={formData.amountPaid}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Payment Mode</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required>
                    <option value="">Select Channel</option>
                    <option value="Cash">Cash Currency</option>
                    <option value="Mobile Money">
                      Mobile Money / Digital Transfer
                    </option>
                    <option value="Bank Transfer">Direct Bank Wire</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary-action"
                disabled={loading}>
                {loading
                  ? "Authorizing & Emailing..."
                  : "Process Payment & Generate Invoice"}
              </button>
            </form>
          ) : (
            <div className="invoice-preview-card" id="print-receipt">
              <div className="invoice-top-bar">
                <div className="brand-info">
                  <h2>{receipt.userinsname}</h2>
                  <p>{receipt.usertagline}</p>
                  <small>
                    {receipt.useraddress} | Ph: {receipt.userPhone}
                  </small>
                </div>
                <div className="invoice-meta-badge">
                  <span className="badge-pill">OFFICIAL E-RECEIPT</span>
                  <span className="invoice-id">{receipt.receiptNo}</span>
                  <span className="invoice-timestamp">
                    {receipt.paymentDate}
                  </span>
                </div>
              </div>

              <hr className="invoice-divider" />

              <div className="invoice-parties-grid">
                <div className="party-box">
                  <span className="party-title">Billed To:</span>
                  <h4>{receipt.name}</h4>
                  <p>Course/Class: {receipt.standard}</p>
                  <p>Email: {formData.email}</p>
                </div>
                <div className="party-box text-right">
                  <span className="party-title">Payment Settlement:</span>
                  <p>
                    <strong>Method:</strong> {receipt.paymentMethod}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="status-success">Verified & Cleared</span>
                  </p>
                </div>
              </div>

              <div className="invoice-financial-table">
                <div className="table-header-row">
                  <span>Fee Description Component</span>
                  <span>Amount</span>
                </div>
                <div className="table-body-row">
                  <span>Tuition & Institutional Fee Installment</span>
                  <span>
                    FCFA {Number(formData.amountPaid).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="invoice-totals-box">
                <div className="totals-row">
                  <span>Total Institutional Fee Assessment:</span>
                  <span>FCFA {receipt.totalFees.toLocaleString()}</span>
                </div>
                <div className="totals-row">
                  <span>Cumulative Amount Cleared:</span>
                  <span>FCFA {receipt.feesPaid.toLocaleString()}</span>
                </div>
                <div className="totals-row outstanding-highlight">
                  <span>Remaining Ledger Balance Due:</span>
                  <span>FCFA {receipt.feesRemaining.toLocaleString()}</span>
                </div>
              </div>

              <div className="invoice-footer-notes">
                <p>
                  ✓ Electronic copy dispatched to student records and registered
                  email. Valid without manual signature.
                </p>
              </div>

              <div className="invoice-action-bar">
                <button onClick={handlePrint} className="btn-print-action">
                  🖨️ Print / Download PDF
                </button>
                <button onClick={handleResetForm} className="btn-new-action">
                  Process Another Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Fees;
