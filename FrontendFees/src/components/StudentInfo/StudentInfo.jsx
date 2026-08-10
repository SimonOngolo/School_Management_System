import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./StudentInfo.css";

export default function StudentInfo() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const student = state?.student;

  if (!student) {
    return (
      <div className="error-container">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>No Student Data Found</h2>
          <p>The student information could not be loaded. Please try again.</p>
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const totalPaid =
    student.feePayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const remainingBalance = (student.totalFees || 0) - totalPaid;

  const handlePrintResit = () => {
    window.print();
  };

  const handlePrintAllReceipts = () => {
    const printWindow = window.open("", "_blank");
    const allReceiptsHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Consolidated Payment Statement - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              background: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
            }
            .receipt-sheet {
              width: 100%;
              max-width: 800px;
              margin: 20px auto;
              padding: 40px;
              box-sizing: border-box;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
            }
            .receipt-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 24px;
              margin-bottom: 24px;
            }
            .brand-name {
              font-size: 22px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .brand-sub {
              font-size: 13px;
              color: #64748b;
              margin: 0;
            }
            .receipt-title-box {
              text-align: right;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: 700;
              color: #2563eb;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0 0 4px 0;
            }
            .receipt-meta {
              font-size: 12px;
              color: #64748b;
              margin: 2px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              background: #f8fafc;
              padding: 16px 20px;
              border-radius: 8px;
              margin-bottom: 24px;
            }
            .info-label {
              font-size: 11px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 15px;
              font-weight: 600;
              color: #0f172a;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            .items-table th {
              background: #0f172a;
              color: #ffffff;
              text-align: left;
              padding: 12px 16px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .items-table td {
              padding: 14px 16px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
              color: #334155;
            }
            .summary-box {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }
            .summary-table {
              width: 320px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 8px 12px;
              font-size: 14px;
            }
            .summary-table tr.total-line td {
              font-weight: 700;
              font-size: 16px;
              color: #0f172a;
              border-top: 2px solid #0f172a;
              padding-top: 12px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 1px dashed #cbd5e1;
              padding-top: 24px;
              margin-top: 40px;
            }
            .footer-note {
              font-size: 11px;
              color: #94a3b8;
              max-width: 350px;
            }
            .signature-line {
              text-align: center;
              font-size: 12px;
              font-weight: 600;
              color: #475569;
              border-top: 1px solid #cbd5e1;
              width: 180px;
              padding-top: 6px;
            }
            @media print {
              body { padding: 0; }
              .receipt-sheet { border: none; margin: 0; padding: 10px; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-sheet">
            <div class="receipt-header">
              <div>
                <h1 class="brand-name">Educational Communication System</h1>
                <p class="brand-sub">Bangui, Central African Republic | Contact: 697119343</p>
              </div>
              <div class="receipt-title-box">
                <p class="receipt-title">Consolidated Statement</p>
                <p class="receipt-meta"><strong>Generated On:</strong> ${new Date().toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-label">Student Name</div>
                <div class="info-value">${student.name}</div>
              </div>
              <div>
                <div class="info-label">Class / Standard</div>
                <div class="info-value">${student.standard}</div>
              </div>
              <div style="margin-top: 12px;">
                <div class="info-label">Student Email</div>
                <div class="info-value" style="font-size: 13px; font-weight: 500;">${student.email || "N/A"}</div>
              </div>
              <div style="margin-top: 12px;">
                <div class="info-label">Total Records</div>
                <div class="info-value">${student.feePayments?.length || 0} Transactions</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Payment Date</th>
                  <th>Mode</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${
                  student.feePayments && student.feePayments.length > 0
                    ? student.feePayments
                        .map(
                          (entry, idx) => `
                    <tr>
                      <td><strong>TXN-${idx + 1001}</strong></td>
                      <td>${new Date(entry.paymentDate).toLocaleDateString("en-GB")}</td>
                      <td>${entry.paymentMode || "Cash"}</td>
                      <td style="text-align: right; font-weight: 600;">FCFA ${entry.amount?.toLocaleString()}</td>
                    </tr>
                  `,
                        )
                        .join("")
                    : '<tr><td colspan="4" style="text-align: center;">No transactions found.</td></tr>'
                }
              </tbody>
            </table>

            <div class="summary-box">
              <table class="summary-table">
                <tr>
                  <td style="color: #64748b;">Total Assessment:</td>
                  <td style="text-align: right; font-weight: 600;">FCFA ${(student.totalFees || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">Total Paid:</td>
                  <td style="text-align: right; font-weight: 600; color: #16a34a;">FCFA ${totalPaid.toLocaleString()}</td>
                </tr>
                <tr class="total-line">
                  <td>Balance Due:</td>
                  <td style="text-align: right; color: #dc2626;">FCFA ${remainingBalance.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <div class="footer-note">
                This is an official computer-generated fee statement containing all recorded transactions. No physical signature is required unless requested by administration.
              </div>
              <div class="signature-line">
                Authorized Signature
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(allReceiptsHtml);
    printWindow.document.close();
  };

  const handlePrintReceipt = (entry, index) => {
    const printWindow = window.open("", "_blank");

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Receipt - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              background: #ffffff;
              margin: 0;
              padding: 20px;
              -webkit-print-color-adjust: exact;
            }
            .receipt-sheet {
              max-width: 700px;
              margin: 0 auto;
              padding: 30px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              background: #ffffff;
            }
            .receipt-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .brand-name {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
              margin: 0 0 4px 0;
            }
            .brand-sub {
              font-size: 12px;
              color: #64748b;
              margin: 0;
            }
            .receipt-title {
              font-size: 14px;
              font-weight: 700;
              color: #2563eb;
              text-transform: uppercase;
              text-align: right;
              margin: 0 0 4px 0;
            }
            .receipt-meta {
              font-size: 11px;
              color: #64748b;
              text-align: right;
              margin: 2px 0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              background: #f8fafc;
              padding: 14px 16px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .info-label {
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background: #0f172a;
              color: #ffffff;
              text-align: left;
              padding: 10px 14px;
              font-size: 11px;
              text-transform: uppercase;
            }
            .items-table td {
              padding: 12px 14px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
              color: #334155;
            }
            .summary-box {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            .summary-table {
              width: 260px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 6px 10px;
              font-size: 13px;
            }
            .summary-table tr.total-line td {
              font-weight: 700;
              font-size: 15px;
              color: #0f172a;
              border-top: 2px solid #0f172a;
              padding-top: 8px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 1px dashed #cbd5e1;
              padding-top: 16px;
            }
            .footer-note {
              font-size: 10px;
              color: #94a3b8;
              max-width: 300px;
            }
            .signature-line {
              text-align: center;
              font-size: 11px;
              font-weight: 600;
              color: #475569;
              border-top: 1px solid #cbd5e1;
              width: 150px;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-sheet">
            <div class="receipt-header">
              <div>
                <h1 class="brand-name">Educational Communication System</h1>
                <p class="brand-sub">Bangui, Central African Republic</p>
              </div>
              <div>
                <p class="receipt-title">Payment Receipt</p>
                <p class="receipt-meta"><strong>Ref:</strong> TXN-${index + 1001}</p>
                <p class="receipt-meta"><strong>Date:</strong> ${new Date(entry.paymentDate).toLocaleDateString("en-GB")}</p>
              </div>
            </div>

            <div class="info-grid">
              <div>
                <div class="info-label">Student Name</div>
                <div class="info-value">${student.name}</div>
              </div>
              <div>
                <div class="info-label">Class</div>
                <div class="info-value">${student.standard}</div>
              </div>
              <div>
                <div class="info-label">Email</div>
                <div class="info-value">${student.email || "N/A"}</div>
              </div>
              <div>
                <div class="info-label">Payment Mode</div>
                <div class="info-value">${entry.paymentMode || "Cash"}</div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>School Fee Installment</td>
                  <td style="text-align: right; font-weight: 600;">FCFA ${entry.amount?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary-box">
              <table class="summary-table">
                <tr>
                  <td style="color: #64748b;">Total Paid:</td>
                  <td style="text-align: right; font-weight: 600;">FCFA ${entry.amount?.toLocaleString()}</td>
                </tr>
                <tr class="total-line">
                  <td>Status:</td>
                  <td style="text-align: right; color: #16a34a;">CLEARED</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <div class="footer-note">
                Computer-generated official document from the Educational Communication System. No signature required.
              </div>
              <div class="signature-line">
                Authorized Signature
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (
    <div className="student-info-container">
      <div className="student-info-wrapper">
        {/* Professional Header Section */}
        <div
          className="student-header-pro"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
          }}>
          <div
            className="student-avatar-badge"
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#2563eb",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "700",
              flexShrink: 0,
            }}>
            {student.name ? student.name.charAt(0).toUpperCase() : "S"}
          </div>
          <div className="header-details" style={{ flexGrow: 1 }}>
            <h1
              style={{
                margin: "0 0 8px 0",
                fontSize: "24px",
                color: "#0f172a",
              }}>
              {student.name}
            </h1>
            <div
              className="meta-tags"
              style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <span
                className="meta-tag"
                style={{ color: "#475569", fontSize: "14px" }}>
                <strong>Class:</strong> {student.standard || "N/A"}
              </span>
              <span
                className="meta-tag"
                style={{ color: "#475569", fontSize: "14px" }}>
                <strong>Email:</strong> {student.email || "N/A"}
              </span>
            </div>
          </div>
          <div className="header-actions"> </div>
        </div>
        {/* Financial Overview Metrics */}
        <div className="fee-summary-grid">
          <div className="summary-card total-fees">
            <div className="card-content">
              <span className="card-label">Total Assessment</span>
              <p className="amount">
                FCFA {(student.totalFees || 0).toLocaleString()}
              </p>
            </div>
            <div className="card-icon-wrapper blue">📊</div>
          </div>

          <div className="summary-card paid-fees">
            <div className="card-content">
              <span className="card-label">Total Settled</span>
              <p className="amount">FCFA {totalPaid.toLocaleString()}</p>
            </div>
            <div className="card-icon-wrapper green">✅</div>
          </div>

          <div className="summary-card remaining-fees">
            <div className="card-content">
              <span className="card-label">Outstanding Balance</span>
              <p className="amount">FCFA {remainingBalance.toLocaleString()}</p>
            </div>
            <div className="card-icon-wrapper amber">⏳</div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="payment-history-section">
          <div className="section-header">
            <h2>Transaction Ledger</h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div className="payment-count">
                {student.feePayments?.length || 0} Recorded Payment
                {(student.feePayments?.length || 0) !== 1 ? "s" : ""}
              </div>
              {student.feePayments && student.feePayments.length > 0 && (
                <button
                  className="action-btn primary"
                  style={{
                    padding: "8px 16px",
                    fontSize: "0.85em",
                    borderRadius: "16px",
                  }}
                  onClick={handlePrintAllReceipts}>
                  🖨️ Print All Transactions
                </button>
              )}
            </div>
          </div>

          {student.feePayments && student.feePayments.length > 0 ? (
            <div className="payments-container">
              <div className="payments-table-wrapper">
                <table className="payments-table">
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.feePayments.map((entry, idx) => (
                      <tr key={idx} className="payment-row">
                        <td>
                          <span className="payment-number">
                            TXN-{idx + 1001}
                          </span>
                        </td>
                        <td>
                          <span className="payment-amount">
                            FCFA {entry.amount?.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`payment-method-pill ${entry.paymentMode?.toLowerCase()}`}>
                            {entry.paymentMode || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className="payment-date">
                            {new Date(entry.paymentDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge-pro completed">
                            Cleared
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            className="btn-print-receipt-sm"
                            onClick={() => handlePrintReceipt(entry, idx)}
                            title="Print Individual Receipt">
                            🖨️ Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="no-payments">
              <div className="no-payments-icon">📂</div>
              <h3>No Transactions Recorded</h3>
              <p>
                There are no registered fee payments for this student profile
                yet.
              </p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => navigate("/fees", { state: { student } })}>
            Process New Payment
          </button>
          <button className="action-btn secondary" onClick={() => navigate(-1)}>
            ← Return to Directory
          </button>
        </div>
      </div>
    </div>
  );
}
