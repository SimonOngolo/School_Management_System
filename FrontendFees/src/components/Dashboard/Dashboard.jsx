import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import StatCard from "../StatCard/StatCard";
import GrowthChart from "../AreaChart/AreaChart";
import RevenueChart from "../BarChart/BarChart";
import "./Dashboard.css";
import axios from "axios";
import { baseApi as BASE_URL } from "../../assets/assets";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    fullyPaid: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${BASE_URL}/dashboard-stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="dashboard-sidebar">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main-content">
        <header className="dashboard-topbar-wrapper">
          <Topbar />
        </header>

        <div className="dashboard-content-body">
          {/* Welcome / Overview Banner */}
          <div className="dashboard-welcome-banner">
            <div>
              <h1 className="banner-title">Dashboard Overview</h1>
              <p className="banner-subtitle">
                Monitor student registration metrics, institutional revenue, and
                fee settlements in real-time.
              </p>
            </div>
            <div className="banner-badge">
              <span className="live-indicator"></span> System Online
            </div>
          </div>

          {/* Stat Cards Grid */}
          <section className="stat-grid">
            <StatCard
              title="Total Students"
              value={loading ? "..." : stats.totalStudents.toLocaleString()}
              color="blue"
              icon="👥"
            />
            <StatCard
              title="Total Revenue"
              value={
                loading ? "..." : `FCFA ${stats.totalRevenue.toLocaleString()}`
              }
              color="green"
              icon="💰"
            />
            <StatCard
              title="Fully Cleared"
              value={loading ? "..." : stats.fullyPaid.toLocaleString()}
              color="purple"
              icon="✅"
            />
            <StatCard
              title="Pending Balances"
              value={loading ? "..." : stats.remaining.toLocaleString()}
              color="orange"
              icon="⚠️"
            />
          </section>

          {/* Charts Section */}
          <section className="dashboard-charts-grid">
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">Student Enrollment Growth</h3>
                <span className="chart-subtitle-tag">
                  Academic Year Performance
                </span>
              </div>
              <div className="chart-wrapper">
                <GrowthChart />
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">Revenue & Fee Inflows</h3>
                <span className="chart-subtitle-tag">Monthly Breakdown</span>
              </div>
              <div className="chart-wrapper">
                <RevenueChart />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
