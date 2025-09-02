import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Sidebar from "../../Component/Sidebar";

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [group, setGroup] = useState("WH");
  const [zone, setZone] = useState("RL"); // Initialize as empty to allow "All Zones"
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [selectedRole, setSelectedRole] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [totalWorkingDays, setTotalWorkingDays] = useState(null);
  const [pendingReq, setPendingReq] = useState(0);
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const dayCount = dayjs(selectedMonth).daysInMonth();

  // Available zones for the dropdown
  const zones = ["RL", "Damage", "GVI", "Delivery Department", "AMD"];

  useEffect(() => {
    if (!storedUser) {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    fetchWorkingDays(selectedMonth);
    fetchUserReports(
      selectedMonth,
      selectedRole,
      storedUser.group || (selectedRole === "super admin" ? "WH" : group),
      storedUser.zone || zone
    );
    fetchPendingRequest();
  }, [selectedMonth, selectedRole, group, zone]);

  const fetchPendingRequest = async () => {
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/pending-requests`
      );
      setPendingReq(response.data.pendingCount);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setPendingReq(0);
    }
  };

  const fetchWorkingDays = async (month) => {
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/workingdays`,
        {
          params: { month },
        }
      );
      const { workingDays } = response.data;
      setTotalWorkingDays(workingDays);
    } catch (error) {
      console.error("Error fetching working days:", error);
      setTotalWorkingDays(null);
    }
  };

  const fetchApprovedLeaves = async (userId, month, year) => {
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/leave-requests/user/${userId}/monthly`,
        {
          params: { month, year },
        }
      );
      const { leaveDays } = response.data;
      return leaveDays || 0;
    } catch (error) {
      console.error(
        `Error fetching approved leaves for user ${userId}:`,
        error
      );
      return 0;
    }
  };

  const fetchUserReports = async (month, role, group, zone) => {
    setLoading(true);
    setError(null);
    try {
      const [year, monthNumber] = month.split("-");
      const usersResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/getAllUser`,
        {
          params: { role, group, zone },
        }
      );
      const users = usersResponse.data;

      const reportsData = await Promise.all(
        users.map(async (user) => {
          const checkInsResponse = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkins/${user._id}`,
            {
              params: { month: monthNumber, year: year },
            }
          );
          const checkOutsResponse = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkouts/${user._id}`,
            {
              params: { month: monthNumber, year: year },
            }
          );

          const checkIns = checkInsResponse.data;
          const checkOuts = checkOutsResponse.data;
          const totalCheckIns = checkIns.length;

          const lateCheckInsCount = checkIns.filter(
            (checkin) => checkin.status === "Late"
          ).length;
          const lateCheckOutsCount = checkOuts.filter(
            (checkin) => checkin.status === "Overtime"
          ).length;

          const approvedLeaveDays = await fetchApprovedLeaves(
            user._id,
            monthNumber,
            year
          );

          return {
            username: user.name,
            number: user.number,
            role: user.role,
            userId: user._id,
            totalCheckIns,
            lateCheckIns: lateCheckInsCount,
            lateCheckOuts: lateCheckOutsCount,
            approvedLeaves: approvedLeaveDays,
            month: monthNumber,
            year: year,
            zone: user.zone,
          };
        })
      );
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  const handleZoneChange = (event) => {
    setZone(event.target.value);
  };

  const exportToExcel = () => {
    const worksheetData = reports.map((report) => ({
      Name: report.username,
      Number: report.number,
      Role: report.role,
      Zone: report.zone,
      "Total Working Days": totalWorkingDays,
      Holidays:
        dayCount -
        totalWorkingDays -
        (report.totalCheckIns - totalWorkingDays > 0
          ? report.totalCheckIns - totalWorkingDays
          : 0),
      "Approved Leave": report.approvedLeaves,
      Absent:
        totalWorkingDays - report.totalCheckIns - report.approvedLeaves > 0
          ? totalWorkingDays - report.totalCheckIns - report.approvedLeaves
          : 0,
      "Extra Day":
        report.totalCheckIns - totalWorkingDays > 0
          ? report.totalCheckIns - totalWorkingDays
          : 0,
      "Total Check-Ins": report.totalCheckIns,
      "Late Check-Ins (9.15 AM)": report.lateCheckIns,
      "Late Check-Outs (7.00 PM)": report.lateCheckOuts,
      "Late Adjustment": report.lateCheckIns - report.lateCheckOuts,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");
    XLSX.writeFile(workbook, `Monthly_Report_${selectedMonth}.xlsx`);
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen p-4 md:p-6 bg-gray-100">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="md:hidden mb-4 px-4 py-2 bg-gray-800 text-white rounded"
        >
          {isDrawerOpen ? "Close Menu" : "Open Menu"}
        </button>

        <h1 className="text-xl font-bold mb-4">Monthly Attendance Report</h1>

        <button
          onClick={exportToExcel}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export Report
        </button>

        <div className="mb-4 flex items-center space-x-4">
          <div>
            <label className="mr-2 font-semibold">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="border rounded px-2 py-1"
            />
          </div>
          {storedUser?.role === "super admin" && (
            <div>
              <label className="mr-2 font-semibold">Filter by Department:</label>
              <select
                value={zone}
                onChange={handleZoneChange}
                className="border rounded px-2 py-1"
              >
                {zones.map((zoneOption) => (
                  <option key={zoneOption} value={zoneOption}>
                    {zoneOption}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto w-[95vw] sm:w-[auto]">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Role</th>
                  <th className="border border-gray-300 px-4 py-2">Zone</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Total Working Days
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Holidays</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Approved Leave
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-red-500 text-white">
                    Absent
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-[#0B6222] text-white">
                    Extra Day
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Total Check-Ins
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-red-500 text-white">
                    Late Check-Ins (9.15 AM)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-[#0B6222] text-white">
                    Late Check-Outs (7.00 PM)
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Late Adjustment
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Daily Report
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {report.username}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report?.role}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report?.zone}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {totalWorkingDays}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {dayCount -
                        totalWorkingDays -
                        (report.totalCheckIns - totalWorkingDays > 0
                          ? report.totalCheckIns - totalWorkingDays
                          : 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.approvedLeaves}
                    </td>
                    <td className="border border-gray-300 bg-red-300 px-4 py-2">
                      {totalWorkingDays -
                        report.totalCheckIns -
                        report.approvedLeaves >
                      0
                        ? totalWorkingDays -
                          report.totalCheckIns -
                          report.approvedLeaves
                        : 0}
                    </td>
                    <td className="border border-gray-300 bg-[#9BB97F] px-4 py-2">
                      {report.totalCheckIns - totalWorkingDays > 0
                        ? report.totalCheckIns - totalWorkingDays
                        : 0}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.totalCheckIns}
                    </td>
                    <td className="border border-gray-300 bg-red-300 px-4 py-2">
                      {report.lateCheckIns}
                    </td>
                    <td className="border border-gray-300 bg-[#9BB97F] px-4 py-2">
                      {report.lateCheckOuts}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.lateCheckIns - report.lateCheckOuts}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Link to={`/admin/view-report/${report.userId}`}>
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No reports found for this month.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;