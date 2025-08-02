import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import Sidebar from "../../Component/Sidebar";

const WorkingDaysAdmin = () => {
  const [workingDays, setWorkingDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(dayjs().year());
  const [editMode, setEditMode] = useState(null);
  const [tempDays, setTempDays] = useState("");

  const fetchWorkingDays = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/workingdays/year/${currentYear}`
      );
      // Ensure we always get an array, even if empty
      setWorkingDays(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching working days:", error);
      toast.error("Failed to load working days.");
      setWorkingDays([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (month) => {
    if (!tempDays || tempDays < 1 || tempDays > 31) {
      toast.error("Working days must be between 1 and 31");
      return;
    }

    try {
      await axios.post("https://attendance-app-server-blue.vercel.app/api/workingdays", {
        month,
        workingDays: tempDays,
      });
      toast.success(`${dayjs(month).format("MMMM YYYY")} updated successfully`);
      setEditMode(null);
      fetchWorkingDays();
    } catch (error) {
      console.error("Error saving working days:", error);
      toast.error(error.response?.data?.error || "Failed to save working days");
    }
  };

  const handleEdit = (month, days) => {
    setEditMode(month);
    setTempDays(days);
  };

  const handleCancel = () => {
    setEditMode(null);
  };

  useEffect(() => {
    fetchWorkingDays();
  }, [currentYear]);

  // Generate all months for the current year with their data
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthKey = `${currentYear}-${String(monthNum).padStart(2, '0')}`;
    const monthName = dayjs(monthKey).format("MMMM");
    const existing = workingDays.find(wd => wd?.month === monthKey);
    
    return {
      key: monthKey,
      name: monthName,
      days: existing ? existing.workingDays : 0,
    };
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Working Days Management</h1>
            <div className="flex items-center space-x-4">
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {months.map((month) => (
                  <div
                    key={month.key}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-700">{month.name}</h3>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {month.key}
                      </span>
                    </div>

                    {editMode === month.key ? (
                      <div className="mt-4 flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={tempDays}
                          onChange={(e) => setTempDays(e.target.value)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleSave(month.key)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-800">
                            {month.days || 0}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">days</span>
                        </div>
                        <button
                          onClick={() => handleEdit(month.key, month.days)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkingDaysAdmin;