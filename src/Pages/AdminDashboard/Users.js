import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import Sidebar from "../../Component/Sidebar";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    role: "WH",
    group: "WH",
    zone: "",
    outlet: "",
  });
  const [isAddUserVisible, setIsAddUserVisible] = useState(false);
  const [updateUser, setUpdateUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filter, setFilter] = useState("wh"); // 'all' or 'wh'
  const [bulkUploadFile, setBulkUploadFile] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://attendance-app-server-blue.vercel.app/getAllUser"
      );
      setUsers(response.data);
      applyFilter(response.data, filter);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (userList, filterType) => {
    if (filterType === "wh") {
      setFilteredUsers(userList.filter((user) => user.group === "WH"));
    } else {
      setFilteredUsers(userList);
    }
  };

  useEffect(() => {
    applyFilter(users, filter);
  }, [filter, users]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "https://attendance-app-server-blue.vercel.app/api/users",
        newUser
      );
      toast.success("User created successfully!");
      setNewUser({
        name: "",
        email: "",
        number: "",
        password: "",
        role: "WH",
        group: "WH",
        zone: "",
        outlet: "",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await axios.delete(
        `https://attendance-app-server-blue.vercel.app/api/users/${userId}`
      );
      if (response.status === 200) {
        toast.success("User deleted successfully!");
        fetchUsers();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user.");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(
        `https://attendance-app-server-blue.vercel.app/updateUser/${updateUser._id}`,
        updateUser
      );
      if (response.status === 200) {
        toast.success("User updated successfully!");
        setUpdateUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: "John Doe",
        email: "john@example.com",
        number: "1234567890",
        password: "password123",
        role: "WH",
        group: "WH",
        zone: "Zone 1",
        outlet: "Outlet A",
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        number: "0987654321",
        password: "password456",
        role: "WH",
        group: "WH",
        zone: "Zone 2",
        outlet: "Outlet B",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_template.xlsx");
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkUploadFile) {
      toast.error("Please select a file first");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process data (clean up, add defaults, etc.)
        const processedData = jsonData.map((user) => ({
          name: user.name?.toString().trim() || "",
          email: user.email?.toString().trim() || "",
          number: user.number?.toString().trim() || "",
          password: user.password?.toString().trim() || "",
          role: user.role?.toString().trim() || "WH", // Default to WH
          group: user.group?.toString().trim() || "WH", // Default to WH
          zone: user.zone?.toString().trim() || "",
          outlet: user.outlet?.toString().trim() || "",
        }));

        // Send to server
        const response = await axios.post(
          "https://attendance-app-server-blue.vercel.app/api/users/bulk",
          processedData
        );
        toast.success(`${processedData.length} users added successfully!`);
        setBulkUploadFile(null);
        fetchUsers();
      } catch (error) {
        console.error("Error processing bulk upload:", error);
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error(
            "Failed to process bulk upload. Please check the file format."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(bulkUploadFile);
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex w-[95vw] sm:w-[100vw] overflow-x-scroll">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 bg-gray-100 py-10">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="md:hidden mb-4 px-4 py-2 bg-gray-800 text-white rounded"
        >
          {isDrawerOpen ? "Close Menu" : "Open Menu"}
        </button>

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">User Management</h1>
          <div className="flex space-x-2">
            {/* <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="all">All Users</option>
              <option value="wh">WH Users Only</option>
            </select> */}
            <button
              onClick={() => setIsAddUserVisible(!isAddUserVisible)}
              className="px-4 py-2 bg-[#002B54] hover:bg-black text-white rounded"
            >
              {isAddUserVisible ? "Hide Form" : "Add User"}
            </button>
          </div>
        </div>

        {isAddUserVisible && (
          <div className="bg-white p-4 rounded shadow-md mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add User</h2>
              <button
                onClick={downloadTemplate}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Download Template
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Name*
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    value={newUser.number}
                    onChange={(e) =>
                      setNewUser({ ...newUser, number: e.target.value })
                    }
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Password*
                  </label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Role*
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="WH">WH</option>
                    <option value="super admin">Super Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Group*
                  </label>
                  <input
                    type="text"
                    value={newUser.group}
                    onChange={(e) =>
                      setNewUser({ ...newUser, group: e.target.value })
                    }
                    required
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Zone
                  </label>
                  <input
                    type="text"
                    value={newUser.zone}
                    onChange={(e) =>
                      setNewUser({ ...newUser, zone: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Outlet
                  </label>
                  <input
                    type="text"
                    value={newUser.outlet}
                    onChange={(e) =>
                      setNewUser({ ...newUser, outlet: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full p-3 bg-[#002B54] hover:bg-black text-white rounded ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Adding..." : "Add User"}
              </button>
            </form>

            <div className="border-t pt-4">
              <h3 className="text-md font-semibold mb-2">Bulk Upload Users</h3>
              <form
                onSubmit={handleBulkUpload}
                className="flex items-end gap-4"
              >
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2">
                    Upload Excel File
                  </label>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={(e) => setBulkUploadFile(e.target.files[0])}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !bulkUploadFile}
                  className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded ${
                    loading || !bulkUploadFile
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading ? "Uploading..." : "Upload"}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                *Download the template file and fill in user details. Required
                fields: Name, Phone, Password, Role, Group.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded shadow-md overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">User List</h2>
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} user(s)
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border p-2 text-left">Name</th>
                    <th className="border p-2 text-left">Email</th>
                    <th className="border p-2 text-left">Phone</th>
                    <th className="border p-2 text-left">Password</th>
                    <th className="border p-2 text-left">Role</th>
                    <th className="border p-2 text-left">Group</th>
                    <th className="border p-2 text-left">Zone</th>
                    <th className="border p-2 text-left">Outlet</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="border p-2">{user.name}</td>
                      <td className="border p-2">{user.email || "-"}</td>
                      <td className="border p-2">{user.number}</td>
                      <td className="border p-2">{user.password}</td>
                      <td className="border p-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.role === "Admin"
                              ? "bg-purple-100 text-purple-800"
                              : user.role === "WH"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="border p-2">{user.group || "-"}</td>
                      <td className="border p-2">{user.zone || "-"}</td>
                      <td className="border p-2">{user.outlet || "-"}</td>
                      <td className="border p-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setUpdateUser(user)}
                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {updateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Update User</h2>
                <button
                  onClick={() => setUpdateUser(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleUpdateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Name*
                    </label>
                    <input
                      type="text"
                      value={updateUser.name}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, name: e.target.value })
                      }
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={updateUser.email}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, email: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      value={updateUser.number}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, number: e.target.value })
                      }
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Password*
                    </label>
                    <input
                      type="text"
                      value={updateUser.password}
                      onChange={(e) =>
                        setUpdateUser({
                          ...updateUser,
                          password: e.target.value,
                        })
                      }
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Role*
                    </label>
                    <select
                      value={updateUser.role}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, role: e.target.value })
                      }
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="WH">WH</option>
                      <option value="super admin">Super Admin</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Group*
                    </label>
                    <input
                      type="text"
                      value={updateUser.group}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, group: e.target.value })
                      }
                      required
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Zone
                    </label>
                    <input
                      type="text"
                      value={updateUser.zone}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, zone: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2">
                      Outlet
                    </label>
                    <input
                      type="text"
                      value={updateUser.outlet}
                      onChange={(e) =>
                        setUpdateUser({ ...updateUser, outlet: e.target.value })
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setUpdateUser(null)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
