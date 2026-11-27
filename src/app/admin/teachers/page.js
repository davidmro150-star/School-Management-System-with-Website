
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  GraduationCap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  SlidersHorizontal,
  X,
  AlertCircle,
  UserRound,
} from "lucide-react";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
  { value: "resigned", label: "Resigned" },
  { value: "terminated", label: "Terminated" },
];

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
  on_leave: "bg-amber-50 text-amber-700 ring-amber-600/20",
  resigned: "bg-orange-50 text-orange-700 ring-orange-600/20",
  terminated: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

function formatStatus(status) {
  const labels = {
    active: "Active",
    inactive: "Inactive",
    on_leave: "On leave",
    resigned: "Resigned",
    terminated: "Terminated",
  };

  return labels[status] || status || "Unknown";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name) {
  if (!name) return "T";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] ||
        "bg-slate-100 text-slate-600 ring-slate-500/20"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "active"
            ? "bg-emerald-500"
            : status === "on_leave"
              ? "bg-amber-500"
              : status === "terminated"
                ? "bg-rose-500"
                : "bg-slate-400"
        }`}
      />
      {formatStatus(status)}
    </span>
  );
}

function TeacherAvatar({ name }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 ring-1 ring-blue-100">
      {getInitials(name)}
    </div>
  );
}

function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <GraduationCap size={30} />
      </div>

      <h3 className="mt-5 text-base font-semibold text-slate-800">
        {hasFilters
          ? "No teachers found"
          : "No teachers added yet"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Try changing your search or filters to find teachers."
          : "Start building your teacher directory by adding your first teacher."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <X size={15} />
          Clear filters
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3, 4, 5].map((item) => (
        <div
          key={item}
          className="flex animate-pulse items-center gap-4 py-3"
        >
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-36 rounded bg-slate-100" />
            <div className="h-3 w-52 max-w-full rounded bg-slate-100" />
          </div>
          <div className="hidden h-6 w-20 rounded-full bg-slate-100 sm:block" />
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchTeachers = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          search,
          status,
        });

        const response = await fetch(
          `/api/teachers?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load teachers."
          );
        }

        setTeachers(
          Array.isArray(result.data) ? result.data : []
        );

        setPagination(
          result.pagination || {
            page,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        if (err.name === "AbortError") return;

        setError(
          err.message || "Something went wrong while loading teachers."
        );
        setTeachers([]);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [page, search, status, refreshKey]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchTeachers(controller.signal);

    return () => controller.abort();
  }, [fetchTeachers]);

  const activeOnPage = useMemo(
    () =>
      teachers.filter(
        (teacher) => teacher.employmentStatus === "active"
      ).length,
    [teachers]
  );

  const hasFilters = Boolean(search || status !== "all");

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("all");
    setPage(1);
  }

  function changeStatus(value) {
    setStatus(value);
    setPage(1);
  }

  function refreshTeachers() {
    setRefreshKey((current) => current + 1);
  }

  const totalPages = pagination.totalPages || 0;

  return (
    <div className="min-h-full bg-slate-50/70">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Administration</span>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                Teachers & Staff
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Teacher Management
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Manage teacher profiles, employment information and staff records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshTeachers}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              <span>Refresh</span>
            </button>

            <Link
              href="/admin/teachers/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <Plus size={17} />
              Add Teacher
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            icon={Users}
            label="Total teachers"
            value={pagination.total.toLocaleString()}
            description="Matching directory records"
          />

          <StatCard
            icon={UserCheck}
            label="Active on this page"
            value={activeOnPage.toLocaleString()}
            description={`Of ${teachers.length} currently displayed`}
          />

          <StatCard
            icon={GraduationCap}
            label="Records per page"
            value={PAGE_SIZE}
            description="Teacher directory page size"
          />
        </div>

        {/* Directory */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Directory header */}
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Teacher directory
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Search and manage registered teaching staff.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Search */}
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) =>
                      setSearchInput(event.target.value)
                    }
                    placeholder="Search name, ID, email..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />

                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <div className="relative sm:w-44">
                  <SlidersHorizontal
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={status}
                    onChange={(event) =>
                      changeStatus(event.target.value)
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Active filters:
                </span>

                {search && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Search: {search}
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      aria-label="Remove search filter"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                {status !== "all" && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {formatStatus(status)}
                    <button
                      type="button"
                      onClick={() => changeStatus("all")}
                      aria-label="Remove status filter"
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="m-5 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-rose-600"
                />
                <div>
                  <p className="text-sm font-semibold text-rose-800">
                    Unable to load teacher directory
                  </p>
                  <p className="mt-1 text-sm text-rose-700">
                    {error}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={refreshTeachers}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              >
                <RefreshCw size={14} />
                Try again
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && <LoadingState />}

          {/* Empty state */}
          {!loading && !error && teachers.length === 0 && (
            <EmptyState
              hasFilters={hasFilters}
              onReset={clearFilters}
            />
          )}

          {/* Desktop table */}
          {!loading && !error && teachers.length > 0 && (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Teacher
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Employee ID
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Designation
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Joining date
                      </th>
                      <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <TeacherAvatar name={teacher.name} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {teacher.name}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {teacher.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                            {teacher.employeeId}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone
                              size={14}
                              className="shrink-0 text-slate-400"
                            />
                            {teacher.phone || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-700">
                            {teacher.designation || "Teacher"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">
                            {formatDate(teacher.joiningDate)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge
                            status={teacher.employmentStatus}
                          />
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/teachers/${teacher.id}`}
                            title="View teacher profile"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 p-4 md:hidden">
                {teachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start gap-3">
                      <TeacherAvatar name={teacher.name} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-bold text-slate-900">
                            {teacher.name}
                          </h3>
                        </div>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {teacher.email}
                        </p>

                        <div className="mt-2">
                          <StatusBadge
                            status={teacher.employmentStatus}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <BriefcaseBusiness
                          size={14}
                          className="shrink-0 text-slate-400"
                        />
                        <span className="truncate">
                          {teacher.designation || "Teacher"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <UserRound
                          size={14}
                          className="shrink-0 text-slate-400"
                        />
                        <span className="truncate">
                          ID: {teacher.employeeId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone
                          size={14}
                          className="shrink-0 text-slate-400"
                        />
                        <span>{teacher.phone || "—"}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CalendarDays
                          size={14}
                          className="shrink-0 text-slate-400"
                        />
                        <span>
                          Joined {formatDate(teacher.joiningDate)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <Link
                        href={`/admin/teachers/${teacher.id}`}
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={15} />
                        View teacher profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {!loading && !error && teachers.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500 sm:text-sm">
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {(page - 1) * PAGE_SIZE + 1}
                </span>
                {" "}to{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(page * PAGE_SIZE, pagination.total)}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-slate-800">
                  {pagination.total}
                </span>
                {" "}teachers
              </p>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.max(1, current - 1))
                  }
                  disabled={page <= 1}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1)
                    )
                  }
                  disabled={page >= totalPages}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
          <GraduationCap
            size={17}
            className="mt-0.5 shrink-0 text-blue-600"
          />
          <p className="text-xs leading-5 text-blue-800">
            Teacher records are managed by authorized school administrators.
            Teacher login accounts and employment profiles are linked securely.
          </p>
        </div>
      </div>
    </div>
  );
}
