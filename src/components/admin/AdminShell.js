
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  Activity,
  BookOpen,
  Bus,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Library,
  Menu,
  MessageSquare,
  Receipt,
  School,
  Settings,
  ShieldCheck,
  Users,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";

const roleLabels = {
  superAdmin: "Super Administrator",
  principal: "Principal",
  teacher: "Teacher",
  student: "Student",
  accountant: "Accounts Department",
};

const navigationByRole = {
  superAdmin: [
    {
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "PEOPLE MANAGEMENT",
      items: [
        { label: "Students", href: "/admin/students", icon: Users },
        { label: "Admissions", icon: UserPlus },
        {
          label: "Teachers & Staff",
          href: "/admin/teachers",
          icon: GraduationCap,
        },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "Classes & Sections", icon: School },
        { label: "Subjects", icon: BookOpen },
        {
          label: "Attendance",
          href: "/admin/attendance",
          icon: ClipboardCheck,
        },
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
    {
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "PEOPLE MANAGEMENT",
      items: [
        { label: "Students", href: "/admin/students", icon: Users },
        { label: "Admissions", icon: UserPlus },
        {
          label: "Teachers & Staff",
          href: "/admin/teachers",
          icon: GraduationCap,
        },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { label: "Classes & Sections", icon: School },
        { label: "Subjects", icon: BookOpen },
        {
          label: "Attendance",
          href: "/admin/attendance",
          icon: ClipboardCheck,
        },
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
    {
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "MY TEACHING",
      items: [
        { label: "My Classes", icon: School },
        { label: "My Students", href: "/admin/students", icon: Users },
        {
          label: "Attendance",
          href: "/admin/attendance",
          icon: ClipboardCheck,
        },
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
    {
      title: "MY SCHOOL",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
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
    {
      title: "OVERVIEW",
      items: [
        {
          label: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "STUDENT RECORDS",
      items: [{ label: "Students", href: "/admin/students", icon: Users }],
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

function getInitials(name = "EduManage User") {
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

function Sidebar({ navigation, user, pathname, closeSidebar }) {
  const userName =
    user?.name?.trim() || user?.email || "EduManage User";

  const userRole = roleLabels[user?.role] || "School User";

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation overlay"
        onClick={closeSidebar}
        className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
      />

      <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(280px,85vw)] flex-col border-r border-white/10 bg-[#111b31] text-white shadow-2xl lg:w-[272px] lg:shadow-none">
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-5 sm:px-6">
          <Link
            href="/admin/dashboard"
            onClick={closeSidebar}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600">
              <School size={22} />
            </div>

            <div className="min-w-0">
              <h1 className="text-base font-bold">EduManage</h1>
              <p className="mt-0.5 text-[9px] tracking-[2px] text-slate-400">
                SCHOOL ERP
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeSidebar}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-5 sm:px-4">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-[9px] font-bold tracking-[1.8px] text-slate-500">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === pathname;

                  const className = `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] transition ${
                    active
                      ? "border border-blue-400/20 bg-blue-500/15 font-semibold text-white"
                      : item.href
                        ? "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                        : "cursor-default text-slate-500"
                  }`;

                  if (item.href) {
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeSidebar}
                        aria-current={active ? "page" : undefined}
                        className={className}
                      >
                        <Icon
                          size={18}
                          className={`shrink-0 ${
                            active
                              ? "text-blue-300"
                              : "text-slate-400"
                          }`}
                        />

                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>

                        {active && (
                          <ChevronRight
                            size={15}
                            className="shrink-0 text-blue-300"
                          />
                        )}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={item.label}
                      aria-disabled="true"
                      title="This module has not been implemented yet."
                      className={className}
                    >
                      <Icon
                        size={18}
                        className="shrink-0 text-slate-500"
                      />

                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      <span className="shrink-0 text-[9px] text-slate-600">
                        Soon
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3 sm:p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-300" />
              <span className="text-[11px] font-semibold text-slate-200">
                School Workspace
              </span>
            </div>

            <p className="mt-2 text-xs font-semibold">
              EduManage School
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Academic workspace
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-xl p-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-200">
              {getInitials(userName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                {userName}
              </p>

              <p className="mt-1 truncate text-[10px] text-slate-400">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Loading your workspace...
        </div>
      </div>
    );
  }

  const user = session?.user;

  const navigation =
    navigationByRole[user?.role] || navigationByRole.student;

  const pageTitle =
    pathname === "/admin/dashboard"
      ? "Dashboard"
      : pathname === "/admin/students"
        ? "Students"
        : pathname === "/admin/attendance"
          ? "Attendance"
          : pathname === "/admin/teachers"
            ? "Teacher Management"
            : "School Workspace";

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800">
      {mobileOpen && (
        <Sidebar
          navigation={navigation}
          user={user}
          pathname={pathname}
          closeSidebar={() => setMobileOpen(false)}
        />
      )}

      <div className="hidden lg:block">
        <Sidebar
          navigation={navigation}
          user={user}
          pathname={pathname}
          closeSidebar={() => setMobileOpen(false)}
        />
      </div>

      <div className="min-h-screen min-w-0 lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex min-h-[68px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 backdrop-blur-xl sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div className="min-w-0">
              <p className="hidden text-[10px] font-medium text-slate-400 sm:block">
                EDUMANAGE SCHOOL ERP
              </p>

              <h1 className="truncate text-sm font-bold text-slate-800 sm:mt-1 sm:text-base">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden text-right sm:block">
              <p className="max-w-[180px] truncate text-xs font-semibold text-slate-700">
                {user?.name || user?.email || "School User"}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                {roleLabels[user?.role] || "School User"}
              </p>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {getInitials(user?.name || user?.email)}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1800px] p-3 sm:p-5 md:p-6 lg:p-7 xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
