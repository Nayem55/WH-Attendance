import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Sidebar from "../../Component/Sidebar";

const DetailedSummary = () => {
  const [reports, setReports] = useState([]);
  const [zone, setZone] = useState("RL"); // Default to RL
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
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
      "WH", // Hardcoded group to WH
      storedUser.role === "super admin" ? zone : storedUser.zone
    );
    fetchPendingRequest();
  }, [selectedMonth, zone]);

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

  const fetchUserReports = async (month, group, zone) => {
    setLoading(true);
    setError(null);
    try {
      const [year, monthNumber] = month.split("-");
      const usersResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/getAllUser`,
        {
          params: { group, zone },
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

          // Create an object to store daily check-in/check-out times
          const dailyTimes = {};
          for (let day = 1; day <= dayCount; day++) {
            const date = `${year}-${monthNumber}-${String(day).padStart(
              2,
              "0"
            )}`;
            const checkIn = checkIns.find(
              (checkin) => dayjs(checkin.time).format("YYYY-MM-DD") === date
            );
            const checkOut = checkOuts.find(
              (checkout) => dayjs(checkout.time).format("YYYY-MM-DD") === date
            );

            dailyTimes[day] = {
              in: checkIn ? dayjs(checkIn.time).format("hh:mm A") : "",
              out: checkOut ? dayjs(checkOut.time).format("hh:mm A") : "",
            };
          }

          return {
            username: user.name,
            number: user.number,
            outlet: user.outlet || "N/A",
            zone: user.zone,
            dailyTimes,
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

  const exportToExcel = () => {
    const worksheetData = [];

    // Add headers
    const headers = ["Name", "Number", "Outlet", "Zone"];
    for (let day = 1; day <= dayCount; day++) {
      headers.push(day);
      headers.push(""); // Empty cell for merged "In" and "Out"
    }
    worksheetData.push(headers);

    // Add sub-headers for "In" and "Out"
    const subHeaders = ["", "", "", ""];
    for (let day = 1; day <= dayCount; day++) {
      subHeaders.push("In", "Out");
    }
    worksheetData.push(subHeaders);

    // Add employee data
    reports.forEach((report) => {
      const row = [report.username, report.number, report.outlet, report.zone];
      for (let day = 1; day <= dayCount; day++) {
        row.push(report.dailyTimes[day].in, report.dailyTimes[day].out);
      }
      worksheetData.push(row);
    });

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge date headers
    for (let day = 1; day <= dayCount; day++) {
      const startCol = 4 + (day - 1) * 2;
      const endCol = startCol + 1;
      worksheet["!merges"] = worksheet["!merges"] || [];
      worksheet["!merges"].push({
        s: { r: 0, c: startCol },
        e: { r: 0, c: endCol },
      });
    }

    // Create workbook and trigger download
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
          className="md:hidden mb-4 px-4 py-2 bg-gray-800 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          {isDrawerOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <h1 className="text-xl font-bold mb-4">Monthly Attendance Report</h1>

        <button
          onClick={exportToExcel}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Export Report
        </button>

        <div className="mb-4 flex items-center space-x-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="border border-gray-300 rounded px-3 py-2 w-[200px]"
            />
          </div>
          {storedUser?.role === "super admin" && (
            <div>
              <label className="block text-gray-700 font-bold mb-2">Filter by Zone:</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-[200px]"
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
                  <th className="border border-gray-300 px-4 py-2">Number</th>
                  <th className="border border-gray-300 px-4 py-2">Outlet</th>
                  <th className="border border-gray-300 px-4 py-2">Zone</th>
                  {Array.from({ length: dayCount }, (_, i) => (
                    <th
                      key={i + 1}
                      colSpan={2}
                      className="border border-gray-300 px-4 py-2"
                    >
                      {i + 1}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                  <th className="border border-gray-300 px-4 py-2"></th>
                  {Array.from({ length: dayCount }, (_, i) => (
                    <React.Fragment key={i + 1}>
                      <th className="border border-gray-300 px-4 py-2">In</th>
                      <th className="border border-gray-300 px-4 py-2">Out</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {report.username}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.number}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.outlet}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.zone}
                    </td>
                    {Array.from({ length: dayCount }, (_, i) => (
                      <React.Fragment key={i + 1}>
                        <td className="border border-gray-300 px-4 py-2 bg-green-300">
                          {report.dailyTimes[i + 1]?.in}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 bg-red-300">
                          {report.dailyTimes[i + 1]?.out}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No reports found for this month and zone.</p>
        )}
      </div>
    </div>
  );
};

export default DetailedSummary;