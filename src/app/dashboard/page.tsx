// pages/index.tsx
"use client"
import type { NextPage } from "next";
import { useState } from "react";
import {
  AiOutlineHome,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineSetting,
  AiOutlineMenu,
} from "react-icons/ai";

const Home: NextPage = () => {
  // Controls whether the sidebar is expanded or collapsed
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-700">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white h-full shadow-md duration-300 flex flex-col`}
      >
        {/* SIDEBAR HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          {/* Logo / Title */}
          <h1
            className={`text-xl font-bold text-blue-600 transition-all ${
              !sidebarOpen && "opacity-0"
            }`}
          >
            Hospital
          </h1>
          {/* Toggle Button */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            <AiOutlineMenu className="text-xl text-blue-600" />
          </button>
        </div>

        {/* SIDEBAR LINKS */}
        <nav className="flex-1 px-2 py-4">
          <a
            href="#"
            className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 mb-1 text-sm font-medium"
          >
            <AiOutlineHome className="text-xl" />
            <span className={`${!sidebarOpen && "hidden"}`}>Dashboard</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 mb-1 text-sm font-medium"
          >
            <AiOutlineUser className="text-xl" />
            <span className={`${!sidebarOpen && "hidden"}`}>Patients</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 mb-1 text-sm font-medium"
          >
            <AiOutlineFileText className="text-xl" />
            <span className={`${!sidebarOpen && "hidden"}`}>Reports</span>
          </a>
          <a
            href="#"
            className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 text-sm font-medium"
          >
            <AiOutlineSetting className="text-xl" />
            <span className={`${!sidebarOpen && "hidden"}`}>Settings</span>
          </a>
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <header className="flex items-center justify-between bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Hospital Dashboard</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm">Welcome, Admin</span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 overflow-auto flex-1">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm text-gray-500 mb-2">Total Patients</h3>
              <span className="text-2xl font-semibold text-blue-600">450</span>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm text-gray-500 mb-2">Appointments Today</h3>
              <span className="text-2xl font-semibold text-blue-600">32</span>
            </div>
            <div className="bg-white rounded-lg shadow p-4 flex flex-col">
              <h3 className="text-sm text-gray-500 mb-2">Pending Tests</h3>
              <span className="text-2xl font-semibold text-blue-600">12</span>
            </div>
          </div>

          {/* APPOINTMENTS TABLE */}
          <section className="mt-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Todays Appointments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Patient Name</th>
                    <th className="p-2 border">Age/Gender</th>
                    <th className="p-2 border">Consultant</th>
                    <th className="p-2 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border">1</td>
                    <td className="p-2 border">John Doe</td>
                    <td className="p-2 border">M/45</td>
                    <td className="p-2 border">Dr. Smith</td>
                    <td className="p-2 border text-yellow-600 font-medium">
                      Waiting
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border">2</td>
                    <td className="p-2 border">Jane Smith</td>
                    <td className="p-2 border">F/52</td>
                    <td className="p-2 border">Dr. Collins</td>
                    <td className="p-2 border text-green-600 font-medium">
                      Completed
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border">3</td>
                    <td className="p-2 border">Robert Brown</td>
                    <td className="p-2 border">M/37</td>
                    <td className="p-2 border">Dr. Lee</td>
                    <td className="p-2 border text-red-600 font-medium">
                      Canceled
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;
