"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  School,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

/* -------------------------------------------------------
   ROLE-BASED NAVIGATION
------------------------------------------------------- */

const navigationByRole = {
  superAdmin: [
    { title: "OVERVIEW", items: [{ label: "Dashboard", icon: LayoutDashboard, active: true }] },
    {
      title: "PEOPLE MANAGEMENT",
      items: [
        { label: "Students", icon: Users },
        { label: "Admissions", icon: UserPlus },
        { label: "Teachers & Staff", icon: GraduationCap },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "Classes & Sections", icon: School },
        { label: "Subjects", icon: BookOpen },
        { label: "Attendance", icon: ClipboardCheck },
        { label: "Examinations", icon: FileText },
        { label: "Results & Grades", icon: Receipt },
        { label: "Class Timetable", icon: CalendarDays },
      ],
    },
    {
      title: "FINANCE",
      items: [
        { label: "Fees & Payments", icon: Wallet },
        { label: "Accounting", icon: CreditCard },
        { label: "Financial Reports", icon: Activity },
      ],
    },
    {
      title: "SCHOOL SERVICES",
      items: [
        { label: "Library", icon: Library },
        { label: "Transport", icon: Bus },
        { label: "Communication", icon: MessageSquare },
      ],
    },
    {
      title: "WEBSITE MANAGEMENT",
      items: [{ label: "Website CMS", icon: Settings }],
    },
  ],

  principal: [
    { title: "OVERVIEW", items: [{ label: "Dashboard", icon: LayoutDashboard, active: true }] },
    {
      title: "PEOPLE MANAGEMENT",
      items: [
        { label: "Students", icon: Users },
        { label: "Admissions", icon: UserPlus },
        { label: "Teachers & Staff", icon: GraduationCap },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "Classes & Sections", icon: School },
        { label: "Subjects", icon: BookOpen },
        { label: "Attendance", icon: ClipboardCheck },
        { label: "Examinations", icon: FileText },
        { label: "Results & Grades", icon: Receipt },
        { label: "Class Timetable", icon: CalendarDays },
      ],
    },
    {
      title: "REPORTS & SERVICES",
      items: [
        { label: "Financial Reports", icon: Activity },
        { label: "Communication", icon: MessageSquare },
      ],
    },
    {
      title: "WEBSITE MANAGEMENT",
      items: [{ label: "Website CMS", icon: Settings }],
    },
  ],

  teacher: [
    { title: "OVERVIEW", items: [{ label: "Dashboard", icon: LayoutDashboard, active: true }] },
    {
      title: "MY TEACHING",
      items: [
        { label: "My Classes", icon: School },
        { label: "My Students", icon: Users },
        { label: "Attendance", icon: ClipboardCheck },
        { label: "Class Timetable", icon: CalendarDays },
      ],
    },
    {
      title: "ASSESSMENTS",
      items: [
        { label: "Examinations", icon: FileText },
        { label: "Results & Grades", icon: Receipt },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [{ label: "Communication", icon: MessageSquare }],
    },
  ],

  student: [
    { title: "MY SCHOOL", items: [{ label: "Dashboard", icon: LayoutDashboard, active: true }] },
    {
      title: "MY ACADEMICS",
      items: [
        { label: "My Profile", icon: Users },
        { label: "My Attendance", icon: ClipboardCheck },
        { label: "My Timetable", icon: CalendarDays },
        { label: "Examinations", icon: FileText },
        { label: "My Results", icon: Receipt },
      ],
    },
    {
      title: "SCHOOL UPDATES",
      items: [{ label: "Notices & Events", icon: MessageSquare }],
    },
  ],

  accountant: [
    { title: "OVERVIEW", items: [{ label: "Dashboard", icon: LayoutDashboard, active: true }] },
    {
      title: "STUDENT RECORDS",
      items: [{ label: "Students", icon: Users }],
    },
    {
      title: "ACCOUNTS & FINANCE",
      items: [
        { label: "Fees & Payments", icon: Wallet },
        { label: "Accounting", icon: CreditCard },
        { label: "Expenses", icon: Receipt },
        { label: "Financial Reports", icon: Activity },
      ],
    },
  ],
};

/* -------------------------------------------------------
   ROLE LABELS AND HELPERS
------------------------------------------------------- */

const roleLabels = {
  superAdmin: "Super Administrator",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  accountant: "Accounts Department",
};

function getUserInitials(name = "EduManage User") {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "EU"
  );
}

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Dhaka",
    }).format(new Date())
  );

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/* -------------------------------------------------------
   DEMO DATA
   These records will later come from PostgreSQL.
------------------------------------------------------- */

const statistics = [
  {
    label: "Total Students",
    value: "1,248",
    trend: "+8.2%",
    description: "Compared to last month",
    icon: Users,
    color: "blue",
    positive: true,
  },
  {
    label: "Teaching Staff",
    value: "64",
    trend: "+2",
    description: "New teachers this month",
    icon: GraduationCap,
    color: "violet",
    positive: true,
  },
  {
    label: "Attendance Today",
    value: "94.7%",
    trend: "+2.4%",
    description: "Compared to yesterday",
    icon: ClipboardCheck,
    color: "emerald",
    positive: true,
  },
  {
    label: "Fee Collection",
    value: "৳8.42L",
    trend: "82.4%",
    description: "Of monthly collection target",
    icon: Wallet,
    color: "amber",
    positive: true,
  },
];

const students = [
  {
    name: "Ayesha Rahman",
    id: "STU-2026-0041",
    className: "Grade 8",
    section: "A",
    date: "24 Nov 2026",
    status: "Active",
    initials: "AR",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Mohammad Hasan",
    id: "STU-2026-0042",
    className: "Grade 6",
    section: "B",
    date: "23 Nov 2026",
    status: "Active",
    initials: "MH",
    color: "bg-violet-100 text-violet-700",
  },
  {
    name: "Nusrat Jahan",
    id: "STU-2026-0043",
    className: "Grade 9",
    section: "A",
    date: "22 Nov 2026",
    status: "Pending",
    initials: "NJ",
    color: "bg-pink-100 text-pink-700",
  },
  {
    name: "Tanvir Ahmed",
    id: "STU-2026-0044",
    className: "Grade 7",
    section: "C",
    date: "21 Nov 2026",
    status: "Active",
    initials: "TA",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Fatima Akter",
    id: "STU-2026-0045",
    className: "Grade 5",
    section: "A",
    date: "20 Nov 2026",
    status: "Active",
    initials: "FA",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const attendanceData = {
  "7 days": [
    { day: "Mon", value: 91 },
    { day: "Tue", value: 95 },
    { day: "Wed", value: 88 },
    { day: "Thu", value: 97 },
    { day: "Fri", value: 94 },
    { day: "Sat", value: 89 },
    { day: "Sun", value: 95 },
  ],
  "30 days": [
    { day: "Week 1", value: 90 },
    { day: "Week 2", value: 93 },
    { day: "Week 3", value: 89 },
    { day: "Week 4", value: 96 },
    { day: "Week 5", value: 94 },
  ],
};

const schedules = [
  {
    time: "08:30 AM",
    subject: "Mathematics",
    teacher: "Mr. Rahman",
    room: "Room 201",
    className: "Grade 8 - A",
    color: "bg-blue-500",
  },
  {
    time: "10:00 AM",
    subject: "English",
    teacher: "Ms. Akter",
    room: "Room 105",
    className: "Grade 6 - B",
    color: "bg-violet-500",
  },
  {
    time: "11:30 AM",
    subject: "General Science",
    teacher: "Mr. Hasan",
    room: "Room 302",
    className: "Grade 9 - A",
    color: "bg-emerald-500",
  },
];

const transactions = [
  {
    name: "Ayesha Rahman",
    description: "Monthly tuition fee",
    amount: "৳2,500",
    method: "bKash",
    initials: "AR",
    color: "bg-blue-100 text-blue-700",
  },
  {
    name: "Tanvir Ahmed",
    description: "Examination fee",
    amount: "৳1,200",
    method: "Cash",
    initials: "TA",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "Fatima Akter",
    description: "Monthly tuition fee",
    amount: "৳2,500",
    method: "Bank",
    initials: "FA",
    color: "bg-emerald-100 text-emerald-700",
  },
];

const initialNotifications = [
  {
    id: 1,
    title: "New admission application",
    message: "A new student application requires review.",
    time: "15 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Fee collection update",
    message: "Daily payment summary is available.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Upcoming examination",
    message: "Monthly examination preparation reminder.",
    time: "Yesterday",
    read: true,
  },
];

/* -------------------------------------------------------
   SIDEBAR
------------------------------------------------------- */

function Sidebar({ mobileOpen, closeSidebar, user, navigation }) {
  const userName =
    user?.name?.trim() || user?.email || "EduManage User";

  const userRole = roleLabels[user?.role] || "School User";
  const userInitials = getUserInitials(userName);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/5 bg-[#111b31] text-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/[0.08] px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-950/40">
              <School size={22} className="text-white" />
            </div>

            <div>
              <h1 className="text-[17px] font-bold tracking-tight text-white">
                EduManage
              </h1>
              <p className="mt-0.5 text-[9px] font-semibold tracking-[2.5px] text-slate-400">
                SCHOOL ERP
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[9px] font-bold tracking-[1.8px] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {

                  const Icon = item.icon;

                  if (item.active) {

                    if (
  item.label === "Attendance" &&
  ["superAdmin", "principal", "teacher"].includes(user?.role)
) {
  return (
    <a
      key={item.label}
      href="/admin/attendance"
      onClick={closeSidebar}
      className="group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
    >
      <Icon size={18} className="shrink-0 text-slate-400" />
      <span>{item.label}</span>
      <ChevronRight
        size={15}
        className="ml-auto text-slate-500 transition group-hover:text-blue-300"
      />
    </a>
  );
}
                    return (
                      <a
                        key={item.label}
                        href="/admin/dashboard"
                        onClick={closeSidebar}
                        aria-current="page"
                        className="group flex items-center gap-3 rounded-xl border border-blue-400/15 bg-blue-500/15 px-3.5 py-3 text-[13px] font-semibold text-white shadow-sm"
                      >
                        <Icon size={18} className="text-blue-300" />
                        <span>{item.label}</span>
                        <ChevronRight
                          size={15}
                          className="ml-auto text-blue-300"
                        />
                      </a>
                    );
                  }

                  return (
                    <div
                      key={item.label}
                      title={`${item.label} module will be enabled in a future development phase.`}
                      aria-disabled="true"
                      className="flex cursor-default items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
                    >
                      <Icon size={18} className="shrink-0 text-slate-500" />
                      <span>{item.label}</span>
                      <span className="ml-auto text-[9px] font-medium text-slate-600">
                        Soon
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* School Information */}
        <div className="shrink-0 border-t border-white/[0.08] p-4">
          <div className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-300" />
              <span className="text-[11px] font-semibold text-slate-200">
                School Workspace
              </span>
            </div>

            <p className="mt-2 text-xs font-semibold text-white">
              EduManage School
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Academic workspace
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/20 bg-blue-500/20 text-xs font-bold text-blue-200">
              {userInitials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {userName}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                {userRole}
              </p>
            </div>

            <Settings size={17} className="text-slate-500" />
          </div>
        </div>
      </aside>
    </>
  );
}

/* -------------------------------------------------------
   STATISTICS CARD
------------------------------------------------------- */

function StatCard({ item }) {
  const Icon = item.icon;

  const themes = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      trend: "bg-blue-50 text-blue-700",
      accent: "bg-blue-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      trend: "bg-violet-50 text-violet-700",
      accent: "bg-violet-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      trend: "bg-emerald-50 text-emerald-700",
      accent: "bg-emerald-500",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      trend: "bg-amber-50 text-amber-700",
      accent: "bg-amber-500",
    },
  };

  const theme = themes[item.color];

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/40">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-slate-500">
          {item.label}
        </span>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.icon}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-[27px] font-bold tracking-tight text-slate-900">
          {item.value}
        </h3>

        <span
          className={`mb-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold ${theme.trend}`}
        >
          {item.positive ? (
            <ArrowUpRight size={12} />
          ) : (
            <ArrowDownRight size={12} />
          )}
          {item.trend}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        {item.description}
      </p>

      <div
        className={`absolute bottom-0 left-5 right-5 h-[2px] scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100 ${theme.accent}`}
      />
    </article>
  );
}

/* -------------------------------------------------------
   CARD HEADING
------------------------------------------------------- */

function CardHeading({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-[14px] font-bold tracking-tight text-slate-800">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1 text-[11px] text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

/* -------------------------------------------------------
   ATTENDANCE CARD
------------------------------------------------------- */

function AttendanceCard({ selectedRange, setSelectedRange }) {
  const chartData = attendanceData[selectedRange];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-6">
      <CardHeading
        title="Attendance Overview"
        subtitle="Student attendance performance"
        action={
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value)}
            aria-label="Attendance reporting period"
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 outline-none transition hover:border-blue-300 focus:border-blue-500"
          >
            <option value="7 days">Last 7 days</option>
            <option value="30 days">Last 30 days</option>
          </select>
        }
      />

      <div className="mt-6 flex flex-wrap items-end gap-x-9 gap-y-4">
        <div>
          <p className="text-[11px] font-medium text-slate-400">
            Average attendance
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[30px] font-bold tracking-tight text-slate-900">
              94.7%
            </span>

            <span className="text-[10px] font-bold text-emerald-600">
              +2.4%
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          <div>
            <p className="text-[10px] text-slate-400">Present</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              1,182
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400">Absent</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              42
            </p>
          </div>

          <div>
            <p className="text-[10px] text-slate-400">Late</p>
            <p className="mt-1 text-sm font-bold text-slate-800">
              24
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative mt-7 h-[215px] border-b border-l border-slate-100 pl-2">
        <div className="absolute inset-0 flex flex-col justify-between pb-7">
          {[100, 75, 50, 25].map((value) => (
            <div
              key={value}
              className="relative w-full border-t border-dashed border-slate-100"
            >
              <span className="absolute -left-8 -top-[7px] text-[9px] text-slate-400">
                {value}
              </span>
            </div>
          ))}
        </div>

        <div className="relative z-10 flex h-full items-end justify-around gap-2 px-2 sm:gap-5">
          {chartData.map((item) => (
            <div
              key={item.day}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              <div className="flex h-[175px] w-full items-end justify-center">
                <div
                  className="group relative w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 hover:from-blue-700 hover:to-indigo-400"
                  style={{ height: `${item.value}%` }}
                  title={`${item.value}% attendance`}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-slate-500 opacity-0 transition group-hover:opacity-100">
                    {item.value}%
                  </span>
                </div>
              </div>

              <span className="mt-2 whitespace-nowrap text-[9px] text-slate-400 sm:text-[10px]">
                {item.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
          <span className="text-[10px] text-slate-500">
            Student attendance
          </span>
        </div>

        <span className="text-[10px] font-semibold text-slate-500">
          Reporting: {selectedRange}
        </span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   FEE COLLECTION CARD
------------------------------------------------------- */

function FeeCollectionCard() {
  const feeBreakdown = [
    {
      label: "Tuition fees",
      value: "৳5,98,000",
      percent: 71,
      color: "bg-blue-500",
    },
    {
      label: "Admission fees",
      value: "৳1,36,500",
      percent: 16,
      color: "bg-violet-500",
    },
    {
      label: "Examination fees",
      value: "৳1,08,000",
      percent: 13,
      color: "bg-amber-500",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-6">
      <CardHeading
        title="Fee Collection"
        subtitle="Monthly financial performance"
        action={
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
            On track
          </span>
        }
      />

      <div className="mt-7">
        <p className="text-[11px] font-medium text-slate-400">
          Total amount collected
        </p>

        <div className="mt-1 flex items-baseline gap-2">
          <h3 className="text-[30px] font-bold tracking-tight text-slate-900">
            ৳8,42,500
          </h3>

          <span className="text-[10px] font-bold text-emerald-600">
            +12.6%
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px]">
          <span className="font-semibold text-slate-500">
            Monthly target progress
          </span>

          <span className="font-bold text-blue-700">82.4%</span>
        </div>

        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
            style={{ width: "82.4%" }}
          />
        </div>

        <div className="mt-2 flex justify-between text-[10px] text-slate-400">
          <span>Collected: ৳8.42L</span>
          <span>Target: ৳10.23L</span>
        </div>
      </div>

      <div className="mt-7 border-t border-slate-100 pt-5">
        <p className="mb-4 text-[11px] font-bold text-slate-700">
          Collection breakdown
        </p>

        <div className="space-y-4">
          {feeBreakdown.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {item.label}
                </span>

                <span className="text-[10px] font-semibold text-slate-700">
                  {item.value}
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   STATUS BADGE
------------------------------------------------------- */

function StatusBadge({ status }) {
  const classes = {
    Active: "bg-emerald-50 text-emerald-700",
    Pending: "bg-amber-50 text-amber-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        classes[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------------
   RECENT ADMISSIONS
------------------------------------------------------- */

function RecentAdmissions({ searchQuery }) {
  const filteredStudents = students.filter((student) =>
    [
      student.name,
      student.id,
      student.className,
      student.section,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-6">
      <CardHeading
        title="Recent Admissions"
        subtitle="Recently added student records"
        action={
          <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
            {filteredStudents.length} Records
          </span>
        }
      />

      {/* Desktop table */}
      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-[9px] font-bold tracking-wider text-slate-400">
                STUDENT
              </th>
              <th className="pb-3 text-[9px] font-bold tracking-wider text-slate-400">
                STUDENT ID
              </th>
              <th className="pb-3 text-[9px] font-bold tracking-wider text-slate-400">
                CLASS
              </th>
              <th className="pb-3 text-[9px] font-bold tracking-wider text-slate-400">
                DATE
              </th>
              <th className="pb-3 text-[9px] font-bold tracking-wider text-slate-400">
                STATUS
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-slate-50 last:border-0 transition hover:bg-slate-50/70"
              >
                <td className="py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${student.color}`}
                    >
                      {student.initials}
                    </div>

                    <span className="text-[11px] font-semibold text-slate-700">
                      {student.name}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 text-[10px] text-slate-500">
                  {student.id}
                </td>

                <td className="py-3.5">
                  <div className="text-[11px] font-medium text-slate-700">
                    {student.className}
                  </div>
                  <div className="mt-0.5 text-[9px] text-slate-400">
                    Section {student.section}
                  </div>
                </td>

                <td className="py-3.5 text-[10px] text-slate-500">
                  {student.date}
                </td>

                <td className="py-3.5">
                  <StatusBadge status={student.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            No matching student records found.
          </p>
        )}
      </div>

      {/* Mobile student cards */}
      <div className="mt-5 space-y-3 md:hidden">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${student.color}`}
            >
              {student.initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {student.name}
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                {student.id}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {student.className} · Section {student.section}
              </p>
            </div>

            <StatusBadge status={student.status} />
          </div>
        ))}

        {filteredStudents.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            No matching students found.
          </p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-[10px] text-slate-400">
          Showing {filteredStudents.length} of {students.length} sample records
        </p>

        <span className="text-[10px] font-semibold text-blue-600">
          Student module coming soon
        </span>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   SCHEDULE CARD
------------------------------------------------------- */

function ScheduleCard() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-6">
      <CardHeading
        title="Today's Timetable"
        subtitle="Classroom schedule"
        action={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <CalendarDays size={16} />
          </div>
        }
      />

      <div className="mt-6 space-y-5">
        {schedules.map((item, index) => (
          <div key={item.subject} className="relative flex gap-3.5">
            {index !== schedules.length - 1 && (
              <div className="absolute bottom-[-19px] left-[4px] top-3 w-px bg-slate-100" />
            )}

            <span
              className={`relative z-10 mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full ${item.color} ring-4 ring-white`}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-800">
                  {item.subject}
                </h4>

                <span className="text-[10px] font-medium text-slate-500">
                  {item.time}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                {item.className}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[9px] text-slate-400">
                  {item.teacher}
                </span>
                <span className="text-[9px] text-slate-400">
                  {item.room}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
          <Clock3 size={14} className="text-blue-600" />
          School hours: 08:00 AM – 03:00 PM
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   RECENT PAYMENTS
------------------------------------------------------- */

function RecentPayments() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-6">
      <CardHeading
        title="Recent Payments"
        subtitle="Latest payment activity"
        action={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Wallet size={16} />
          </div>
        }
      />

      <div className="mt-5 space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.name}
            className="flex items-center gap-3"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${transaction.color}`}
            >
              {transaction.initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-800">
                {transaction.name}
              </p>
              <p className="mt-1 text-[9px] text-slate-400">
                {transaction.description} · {transaction.method}
              </p>
            </div>

            <span className="whitespace-nowrap text-[11px] font-bold text-slate-800">
              {transaction.amount}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-[10px] text-slate-400">
          Illustrative payment records
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------------
   SCHOOL OVERVIEW
------------------------------------------------------- */

function SchoolOverviewCard() {
  const items = [
    { label: "Academic session", value: "2026" },
    { label: "Total classes", value: "10" },
    { label: "Active sections", value: "28" },
    { label: "Subjects", value: "42" },
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-6">
      <CardHeading
        title="School Overview"
        subtitle="Academic information"
        action={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <School size={16} />
          </div>
        }
      />

      <div className="mt-5 divide-y divide-slate-100">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="text-[11px] text-slate-500">
              {item.label}
            </span>

            <span className="text-xs font-bold text-slate-800">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3">
        <CheckCircle2
          size={15}
          className="mt-0.5 shrink-0 text-blue-600"
        />
        <p className="text-[10px] leading-relaxed text-blue-800">
          Academic setup overview. Detailed settings will be managed from the administration module.
        </p>
      </div>
    </section>
  );
}
/* -------------------------------------------------------
   MAIN DASHBOARD
------------------------------------------------------- */

export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  const currentUser = session?.user;
  const currentRole = currentUser?.role;

  const navigation =
    navigationByRole[currentRole] || navigationByRole.student;

  const userName =
    currentUser?.name?.trim() ||
    currentUser?.email ||
    "EduManage User";

  const firstName = userName.split(/\s+/)[0];

  const userRole = roleLabels[currentRole] || "School User";
  const userInitials = getUserInitials(userName);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("7 days");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const dateLabel = new Intl.DateTimeFormat("en-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date());

  const hasNotifications = notifications.length > 0;

  const markAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const closeSidebar = () => setMobileOpen(false);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] font-sans text-slate-800 antialiased">
      <Sidebar
        mobileOpen={mobileOpen}
        closeSidebar={closeSidebar}
        user={currentUser}
        navigation={navigation}
      />

      {/* Main Workspace */}
      <div className="min-h-screen lg:pl-[272px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div className="hidden sm:block">
              <p className="text-[10px] font-medium text-slate-400">
                SCHOOL WORKSPACE
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">
                EduManage School
              </p>
            </div>

            {/* Desktop search */}
            <div className="relative ml-3 hidden w-64 lg:block xl:ml-8 xl:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                aria-label="Search students"
                placeholder="Search student records..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-[11px] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden items-center gap-2 border-r border-slate-200 pr-4 xl:flex">
              <CalendarDays size={15} className="text-slate-400" />
              <span className="text-[10px] font-medium text-slate-500">
                {dateLabel}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() =>
                  setNotificationsOpen((current) => !current)
                }
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              >
                <Bell size={17} />

                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        Notifications
                      </h3>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {unreadCount} unread notifications
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border-b border-slate-50 px-4 py-3 ${
                          notification.read ? "" : "bg-blue-50/50"
                        }`}
                      >
                        <div className="flex gap-3">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />

                          <div>
                            <p className="text-[11px] font-semibold text-slate-800">
                              {notification.title}
                            </p>

                            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                              {notification.message}
                            </p>

                            <p className="mt-1.5 text-[9px] text-slate-400">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!hasNotifications && (
                      <p className="p-6 text-center text-xs text-slate-400">
                        No notifications.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            {/* Logged-in user profile */}
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-gradient-to-br from-blue-100 to-indigo-100 text-[11px] font-bold text-blue-700">
                {userInitials}
              </div>

              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[150px] truncate text-[11px] font-semibold text-slate-800">
                  {userName}
                </p>
                <p className="mt-0.5 max-w-[150px] truncate text-[9px] text-slate-400">
                  {userRole}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {/* Mobile Search */}
          <div className="relative mb-5 sm:hidden">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              aria-label="Search student records"
              placeholder="Search student records..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400"
            />
          </div>

          {/* Page Heading */}
          <section className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                School overview
                <ChevronRight size={12} />
                <span className="text-blue-600">Dashboard</span>
              </div>

              <h1 className="text-[25px] font-bold tracking-tight text-slate-900 sm:text-[30px]">
                {getGreeting()}, {firstName}
              </h1>

              <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-slate-500">
                Welcome to your EduManage workspace. Your dashboard provides
                the information and tools available to your{" "}
                {userRole.toLowerCase()} account.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
              <CalendarDays size={15} className="text-blue-600" />

              <div>
                <p className="text-[9px] text-slate-400">
                  Academic session
                </p>
                <p className="text-[11px] font-bold text-slate-700">
                  2026
                </p>
              </div>

              <ChevronDown size={14} className="ml-2 text-slate-400" />
            </div>
          </section>

          {/* Sample Data Notice */}
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <Sparkles size={15} className="shrink-0 text-blue-600" />
            <p className="text-[10px] leading-relaxed text-blue-800">
              <span className="font-bold">Dashboard preview:</span>{" "}
              Displayed figures are sample data. Database integration will be
              added in the next development phases.
            </p>
          </div>

          {/* Statistics */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statistics.map((item) => (
              <StatCard key={item.label} item={item} />
            ))}
          </section>

          {/* Analytics */}
          <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-7">
              <AttendanceCard
                selectedRange={selectedRange}
                setSelectedRange={setSelectedRange}
              />
            </div>

            <div className="min-w-0 xl:col-span-5">
              <FeeCollectionCard />
            </div>
          </section>

          {/* Admissions and Timetable */}
          <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="min-w-0 xl:col-span-8">
              <RecentAdmissions searchQuery={searchQuery} />
            </div>

            <div className="min-w-0 xl:col-span-4">
              <ScheduleCard />
            </div>
          </section>

          {/* Financial activity and school information */}
          <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
            <RecentPayments />
            <SchoolOverviewCard />
          </section>

          {/* Footer */}
          <footer className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 py-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-semibold text-slate-600">
                EduManage School ERP
              </p>
              <p className="mt-1 text-[9px] text-slate-400">
                © 2026 EduManage. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-600" />
                Secure school workspace
              </span>

              <span className="flex items-center gap-1.5">
                <CircleHelp size={13} />
                Help & Support
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}