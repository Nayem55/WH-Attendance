import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Define navigation items
  const navItems = [
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
        className="md:hidden fixed z-30 top-4 left-4 p-3 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
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

      {/* Sidebar */}
      <div
        className={`fixed md:sticky md:top-0 z-20 bg-gray-900 text-white w-64 h-screen flex flex-col shadow-lg border-r border-gray-700 transform ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        {/* Branding Section */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-semibold tracking-tight">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">Attendance Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === item.path
                  ? "bg-gray-600 text-white shadow-sm"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              onClick={() => setIsDrawerOpen(false)}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer Section (Optional) */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">© 2025 Attendance App</p>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;