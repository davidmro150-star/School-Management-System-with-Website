"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  ClipboardCheck,
} from "lucide-react";

const roleLabels = {
  superAdmin: "Super Administrator",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  accountant: "Accounts Department",
};

const statistics = [
  {
    label: "Total Students",
    value: "1,248",
    trend: "+8.2%",
    description: "Compared to last month",
    icon: Users,
    color: "blue",
  },
  {
    label: "Teaching Staff",
    value: "64",
    trend: "+2",
    description: "New teachers this month",
    icon: GraduationCap,
    color: "violet",
  },
  {
    label: "Attendance Today",
    value: "94.7%",
    trend: "+2.4%",
    description: "Compared to yesterday",
    icon: ClipboardCheck,
    color: "emerald",
  },
  {
    label: "Fee Collection",
    value: "৳8.42L",
    trend: "82.4%",
    description: "Of monthly collection target",
    icon: Wallet,
    color: "amber",
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

function getGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Dhaka",
    }).format(new Date())
  );

  return hour < 12
    ? "Good morning"
    : hour < 17
      ? "Good afternoon"
      : "Good evening";
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.025)] sm:p-5 lg:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

function CardHeading({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-bold tracking-tight text-slate-800">
          {title}
        </h2>

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

function StatCard({ item }) {
  const Icon = item.icon;

  const theme = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  }[item.color];

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">
          {item.label}
        </span>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[27px]">
          {item.value}
        </h3>

        <span className="mb-1 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
          <ArrowUpRight size={12} />
          {item.trend}
        </span>
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        {item.description}
      </p>
    </article>
  );
}

function AttendanceCard({ selectedRange, setSelectedRange }) {
  const chartData = attendanceData[selectedRange];

  return (
    <Card>
      <CardHeading
        title="Attendance Overview"
        subtitle="Student attendance performance"
        action={
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value)}
            aria-label="Attendance reporting period"
            className="max-w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600 outline-none focus:border-blue-500"
          >
            <option value="7 days">Last 7 days</option>
            <option value="30 days">Last 30 days</option>
          </select>
        }
      />

      <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-4">
        <div>
          <p className="text-[11px] text-slate-400">
            Average attendance
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">
              94.7%
            </span>

            <span className="text-[10px] font-bold text-emerald-600">
              +2.4%
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {[
            ["Present", "1,182"],
            ["Absent", "42"],
            ["Late", "24"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[10px] text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-bold text-slate-800">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-7 h-[205px] border-b border-l border-slate-100 pl-2">
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

        <div className="relative z-10 flex h-full items-end justify-around gap-1 px-1 sm:gap-4 sm:px-2">
          {chartData.map((item) => (
            <div
              key={item.day}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
            >
              <div className="flex h-[165px] w-full items-end justify-center">
                <div
                  className="group relative w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400"
                  style={{ height: `${item.value}%` }}
                  title={`${item.value}% attendance`}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100">
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
          Student attendance
        </span>

        <span className="text-[10px] font-semibold text-slate-500">
          Reporting: {selectedRange}
        </span>
      </div>
    </Card>
  );
}

function FeeCollectionCard() {
  const breakdown = [
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
    <Card>
      <CardHeading
        title="Fee Collection"
        subtitle="Monthly financial performance"
        action={
          <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700">
            On track
          </span>
        }
      />

      <div className="mt-6">
        <p className="text-[11px] text-slate-400">
          Total amount collected
        </p>

        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <h3 className="text-3xl font-bold text-slate-900">
            ৳8,42,500
          </h3>

          <span className="text-[10px] font-bold text-emerald-600">
            +12.6%
          </span>
        </div>

        <div className="mt-5 flex justify-between gap-2 text-[10px]">
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

        <div className="mt-2 flex justify-between gap-2 text-[10px] text-slate-400">
          <span>Collected: ৳8.42L</span>
          <span>Target: ৳10.23L</span>
        </div>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-4 text-[11px] font-bold text-slate-700">
          Collection breakdown
        </p>

        <div className="space-y-4">
          {breakdown.map((item) => (
            <div key={item.label}>
              <div className="flex flex-wrap justify-between gap-2">
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
    </Card>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

function RecentAdmissions({ searchQuery }) {
  const filtered = useMemo(
    () =>
      students.filter((student) =>
        [
          student.name,
          student.id,
          student.className,
          student.section,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [searchQuery]
  );

  return (
    <Card>
      <CardHeading
        title="Recent Admissions"
        subtitle="Recently added student records"
        action={
          <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700">
            {filtered.length} Records
          </span>
        }
      />

      {/* Desktop table */}
      <div className="mt-5 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {[
                "STUDENT",
                "STUDENT ID",
                "CLASS",
                "DATE",
                "STATUS",
              ].map((heading) => (
                <th
                  key={heading}
                  className="pb-3 pr-3 text-[9px] font-bold tracking-wider text-slate-400"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((student) => (
              <tr
                key={student.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
              >
                <td className="py-3.5 pr-3">
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

                <td className="py-3.5 pr-3 text-[10px] text-slate-500">
                  {student.id}
                </td>

                <td className="py-3.5 pr-3">
                  <div className="text-[11px] font-medium text-slate-700">
                    {student.className}
                  </div>

                  <div className="mt-0.5 text-[9px] text-slate-400">
                    Section {student.section}
                  </div>
                </td>

                <td className="py-3.5 pr-3 text-[10px] text-slate-500">
                  {student.date}
                </td>

                <td className="py-3.5">
                  <StatusBadge status={student.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            No matching student records found.
          </p>
        )}
      </div>

      {/* Mobile cards */}
      <div className="mt-5 space-y-3 md:hidden">
        {filtered.map((student) => (
          <div
            key={student.id}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3"
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

              <p className="mt-1 truncate text-[10px] text-slate-400">
                {student.id}
              </p>

              <p className="mt-1 text-[10px] text-slate-500">
                {student.className} · Section {student.section}
              </p>
            </div>

            <StatusBadge status={student.status} />
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-400">
            No matching students found.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <p className="text-[10px] text-slate-400">
          Showing {filtered.length} of {students.length} sample records
        </p>

        <span className="text-[10px] font-semibold text-blue-600">
          Student module coming soon
        </span>
      </div>
    </Card>
  );
}

function ScheduleCard() {
  return (
    <Card>
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
                <h3 className="text-xs font-bold text-slate-800">
                  {item.subject}
                </h3>

                <span className="text-[10px] text-slate-500">
                  {item.time}
                </span>
              </div>

              <p className="mt-1 text-[10px] text-slate-500">
                {item.className}
              </p>

              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
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
    </Card>
  );
}

function RecentPayments() {
  return (
    <Card>
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
            className="flex min-w-0 items-center gap-3"
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

              <p className="mt-1 truncate text-[9px] text-slate-400">
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
    </Card>
  );
}

function SchoolOverviewCard() {
  const items = [
    ["Academic session", "2026"],
    ["Total classes", "10"],
    ["Active sections", "28"],
    ["Subjects", "42"],
  ];

  return (
    <Card>
      <CardHeading
        title="School Overview"
        subtitle="Academic information"
        action={
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Activity size={16} />
          </div>
        }
      />

      <div className="mt-5 divide-y divide-slate-100">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="text-[11px] text-slate-500">
              {label}
            </span>

            <span className="text-xs font-bold text-slate-800">
              {value}
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
          Academic setup overview. Detailed settings will be managed
          from the administration module.
        </p>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();

  const currentUser = session?.user;

  const userName =
    currentUser?.name?.trim() ||
    currentUser?.email ||
    "EduManage User";

  const firstName = userName.split(/\s+/)[0];

  const userRole =
    roleLabels[currentUser?.role] || "School User";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRange, setSelectedRange] = useState("7 days");

  const dateLabel = new Intl.DateTimeFormat("en-BD", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date());

  if (isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1800px]">
      {/* Dashboard top section */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-wide text-slate-400">
            EDUMANAGE SCHOOL ERP
          </p>

          <p className="mt-1 text-[11px] text-slate-500">
            {dateLabel}
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="search"
            aria-label="Search student records"
            placeholder="Search student records..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
        </div>
      </div>

      {/* Welcome section */}
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="min-w-0">
          <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            School overview
            <ChevronRight size={12} />
            <span className="text-blue-600">Dashboard</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
            {getGreeting()}, {firstName}
          </h1>

          <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-500">
            Welcome to your EduManage workspace. Your dashboard
            provides the information and tools available to your{" "}
            {userRole.toLowerCase()} account.
          </p>
        </div>

        <div className="flex w-fit max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm">
          <CalendarDays
            size={15}
            className="shrink-0 text-blue-600"
          />

          <div>
            <p className="text-[9px] text-slate-400">
              Academic session
            </p>

            <p className="text-[11px] font-bold text-slate-700">
              2026
            </p>
          </div>
        </div>
      </section>

      {/* Sample data notice */}
      <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-3 sm:px-4">
        <Sparkles
          size={15}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <p className="text-[10px] leading-relaxed text-blue-800">
          <span className="font-bold">Dashboard preview:</span>{" "}
          Displayed figures are sample data. Database integration
          will be added in the next development phases.
        </p>
      </div>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {statistics.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      {/* Attendance and fees */}
      <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-12 sm:mt-6 sm:gap-5">
        <div className="min-w-0 2xl:col-span-7">
          <AttendanceCard
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
          />
        </div>

        <div className="min-w-0 2xl:col-span-5">
          <FeeCollectionCard />
        </div>
      </section>

      {/* Admissions and timetable */}
      <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-12 sm:mt-6 sm:gap-5">
        <div className="min-w-0 2xl:col-span-8">
          <RecentAdmissions searchQuery={searchQuery} />
        </div>

        <div className="min-w-0 2xl:col-span-4">
          <ScheduleCard />
        </div>
      </section>

      {/* Payments and school overview */}
      <section className="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 sm:mt-6 sm:gap-5">
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

        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck
              size={13}
              className="text-emerald-600"
            />
            Secure school workspace
          </span>

          <span className="flex items-center gap-1.5">
            <CircleHelp size={13} />
            Help & Support
          </span>
        </div>
      </footer>
    </div>
  );
}