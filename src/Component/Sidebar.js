import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Define all navigation items
  const navItems = [
    // { path: "/admin", label: "Attendance Report" },
    { path: "/admin/today-report", label: "Today's Report" },
    { path: "/admin/monthly-summary", label: "Monthly Summary" },
    { path: "/admin/monthly-details", label: "Monthly Details" },
    { path: "/admin/applications", label: "Leave Requests" },
    { path: "/admin/user", label: "User Management" },
    { path: "/admin/working-days", label: "Working Days" },
  ];

  return (
    <>
      {/* Mobile menu button (only visible on small screens) */}
      <button
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="md:hidden fixed z-10 top-4 left-4 p-2 bg-gray-800 text-white rounded"
      >
        {isDrawerOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-20 bg-gray-800 text-white w-64 h-screen transform ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300`}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-white md:hidden focus:outline-none"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-3 rounded hover:bg-gray-700 focus:bg-gray-700 transition-colors ${
                location.pathname === item.path ? "bg-gray-700" : ""
              }`}
              onClick={() => setIsDrawerOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;