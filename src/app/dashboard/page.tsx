"use client"

import { useState } from "react"
import type { NextPage } from "next"
import {
  AiOutlineHome,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineSetting,
  AiOutlineMenu,
  AiOutlineBell,
  AiOutlineSearch,
} from "react-icons/ai"

const Home: NextPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* SIDEBAR */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white h-full shadow-lg duration-300 flex flex-col fixed left-0 top-0 z-30`}
      >
        {/* SIDEBAR HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h1
              className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent transition-all duration-300 ${
                !sidebarOpen && "opacity-0 w-0"
              }`}
            >
              Hospital
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <AiOutlineMenu className="text-xl text-gray-600" />
          </button>
        </div>

        {/* SIDEBAR LINKS */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group relative text-blue-600 bg-blue-50"
          >
            <AiOutlineHome className="text-xl" />
            <span className={`text-sm font-medium transition-all duration-300 ${!sidebarOpen && "opacity-0 w-0"}`}>
              Dashboard
            </span>
            {!sidebarOpen && (
              <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                Dashboard
              </div>
            )}
          </a>
          {[
            { icon: AiOutlineUser, text: "Patients" },
            { icon: AiOutlineFileText, text: "Reports" },
            { icon: AiOutlineSetting, text: "Settings" },
          ].map((item) => (
            <a
              key={item.text}
              href="#"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors group relative text-gray-600 hover:text-gray-800"
            >
              <item.icon className="text-xl" />
              <span className={`text-sm font-medium transition-all duration-300 ${!sidebarOpen && "opacity-0 w-0"}`}>
                {item.text}
              </span>
              {!sidebarOpen && (
                <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-gray-900 text-white text-sm invisible opacity-0 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0">
                  {item.text}
                </div>
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        {/* TOP BAR */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400 transition-colors"
                />
                <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <AiOutlineBell className="text-xl text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium">A</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-800">Admin User</p>
                  <p className="text-gray-500 text-xs">admin@hospital.com</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-6 overflow-auto flex-1 scroll-smooth">
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Total Patients", value: "450", trend: "+2.5%" },
              { title: "Appointments Today", value: "32", trend: "+12.3%" },
              { title: "Pending Tests", value: "12", trend: "-5.4%" },
            ].map((stat) => (
              <div
                key={stat.title}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      stat.trend.startsWith("+") ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                    }`}
                  >
                    {stat.trend}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* APPOINTMENTS TABLE */}
          <section className="mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Todays Appointments</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your appointments and patient schedules</p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="pb-4 px-6 text-sm font-medium text-gray-500">#</th>
                        <th className="pb-4 px-6 text-sm font-medium text-gray-500">Patient Name</th>
                        <th className="pb-4 px-6 text-sm font-medium text-gray-500">Age/Gender</th>
                        <th className="pb-4 px-6 text-sm font-medium text-gray-500">Consultant</th>
                        <th className="pb-4 px-6 text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[
                        {
                          id: 1,
                          name: "John Doe",
                          age: "M/45",
                          doctor: "Dr. Smith",
                          status: "Waiting",
                        },
                        {
                          id: 2,
                          name: "Jane Smith",
                          age: "F/52",
                          doctor: "Dr. Collins",
                          status: "Completed",
                        },
                        {
                          id: 3,
                          name: "Robert Brown",
                          age: "M/37",
                          doctor: "Dr. Lee",
                          status: "Canceled",
                        },
                      ].map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-6 text-sm">#{appointment.id}</td>
                          <td className="py-4 px-6">
                            <span className="font-medium text-gray-800">{appointment.name}</span>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">{appointment.age}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{appointment.doctor}</td>
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === "Completed"
                                  ? "bg-green-50 text-green-700"
                                  : appointment.status === "Waiting"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-red-50 text-red-700"
                              }`}
                            >
                              {appointment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default Home

