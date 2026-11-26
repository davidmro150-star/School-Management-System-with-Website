
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Loader2,
  Save,
  Users,
} from "lucide-react";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

function getDhakaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentAcademicYear() {
  return String(new Date().getFullYear());
}

const statusOptions = [
  {
    value: "present",
    label: "Present",
    short: "P",
    color: "emerald",
  },
  {
    value: "absent",
    label: "Absent",
    short: "A",
    color: "rose",
  },
  {
    value: "late",
    label: "Late",
    short: "L",
    color: "amber",
  },
  {
    value: "excused",
    label: "Excused",
    short: "E",
    color: "blue",
  },
];

const statusStyles = {
  present: "border-emerald-200 bg-emerald-50 text-emerald-700",
  absent: "border-rose-200 bg-rose-50 text-rose-700",
  late: "border-amber-200 bg-amber-50 text-amber-700",
  excused: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function AttendancePage() {
  const { data: sessionData, isPending: sessionPending } = useSession();

  const user = sessionData?.user;
  const role = user?.role;

  const [academicYear, setAcademicYear] = useState(
    getCurrentAcademicYear
  );
  const [sessionDate, setSessionDate] = useState(getDhakaDate);

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [students, setStudents] = useState([]);
  const [attendanceSession, setAttendanceSession] = useState(null);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId) || null,
    [classes, classId]
  );

  const activeSections = useMemo(
    () => selectedClass?.sections?.filter((item) => item.isActive) || [],
    [selectedClass]
  );

  const selectedSection = useMemo(
    () => activeSections.find((item) => item.id === sectionId) || null,
    [activeSections, sectionId]
  );

  const isAdministrator = ["superAdmin", "principal"].includes(role);

  const canEdit =
    !attendanceSession ||
    attendanceSession.status !== "submitted" ||
    isAdministrator;

  const summary = useMemo(() => {
    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      unmarked: 0,
    };

    students.forEach((student) => {
      if (student.attendanceStatus in counts) {
        counts[student.attendanceStatus] += 1;
      } else {
        counts.unmarked += 1;
      }
    });

    return counts;
  }, [students]);

  const markedCount = students.length - summary.unmarked;

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError("");

    try {
      const response = await fetch(
        `/api/attendance/classes?academicYear=${encodeURIComponent(academicYear)}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load classes.");
      }

      const activeClasses = (result.data || [])
        .filter((item) => item.isActive)
        .map((item) => ({
          ...item,
          sections: (item.sections || []).filter(
            (section) => section.isActive
          ),
        }))
        .filter((item) => item.sections.length > 0);

      setClasses(activeClasses);

      setClassId((current) => {
        const stillExists = activeClasses.some(
          (item) => item.id === current
        );

        return stillExists
          ? current
          : activeClasses[0]?.id || "";
      });

      const firstClass = activeClasses[0];

      setSectionId((current) => {
        const sectionStillExists = activeClasses.some((item) =>
          item.sections.some((section) => section.id === current)
        );

        return sectionStillExists
          ? current
          : firstClass?.sections[0]?.id || "";
      });
    } catch (err) {
      setClasses([]);
      setClassId("");
      setSectionId("");
      setError(err.message || "Unable to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  }, [academicYear]);

  useEffect(() => {
    if (!user || !["superAdmin", "principal", "teacher"].includes(role)) {
      return;
    }

    loadClasses();
  }, [user, role, loadClasses]);

  const loadRegister = useCallback(async () => {
    if (!sectionId || !academicYear || !sessionDate) {
      setStudents([]);
      setAttendanceSession(null);
      return;
    }

    setLoadingRegister(true);
    setError("");
    setSuccess("");

    try {
      const params = new URLSearchParams({
        classSectionId: sectionId,
        academicYear,
        sessionDate,
      });

      const response = await fetch(
        `/api/attendance/register?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load attendance register.");
      }

      setAttendanceSession(result.data.session);

      setStudents(
        (result.data.students || []).map((student) => ({
          ...student,
          attendanceStatus: student.attendanceStatus || "",
          remarks: student.remarks || "",
        }))
      );
    } catch (err) {
      setStudents([]);
      setAttendanceSession(null);
      setError(err.message || "Unable to load attendance register.");
    } finally {
      setLoadingRegister(false);
    }
  }, [sectionId, academicYear, sessionDate]);

  useEffect(() => {
    if (!sectionId) {
      setStudents([]);
      setAttendanceSession(null);
      return;
    }

    loadRegister();
  }, [sectionId, academicYear, sessionDate, loadRegister]);

  function updateStudent(studentId, changes) {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId
          ? { ...student, ...changes }
          : student
      )
    );

    setSuccess("");
  }

  function markAll(status) {
    if (!canEdit) return;

    setStudents((current) =>
      current.map((student) => ({
        ...student,
        attendanceStatus: status,
      }))
    );

    setSuccess("");
  }

  async function getOrCreateSession() {
    if (attendanceSession?.id) {
      return attendanceSession;
    }

    const response = await fetch("/api/attendance/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        classSectionId: sectionId,
        sessionDate,
        academicYear,
        notes: "",
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setAttendanceSession(result.data);
      return result.data;
    }

    // Another administrator may have created the session already.
    if (response.status === 409) {
      await loadRegister();

      throw new Error(
        "An attendance session already exists. The register has been refreshed. Please try again."
      );
    }

    throw new Error(result.message || "Unable to create attendance session.");
  }

  async function handleSave(action) {
    setError("");
    setSuccess("");

    if (!sectionId) {
      setError("Please select a class section.");
      return;
    }

    if (students.length === 0) {
      setError("There are no enrolled students in this section.");
      return;
    }

    if (!canEdit) {
      setError("You do not have permission to edit this submitted attendance.");
      return;
    }

    if (action === "submit" && summary.unmarked > 0) {
      setError(
        `Please mark all students before submitting. ${summary.unmarked} student(s) are still unmarked.`
      );
      return;
    }

    const records = students
      .filter((student) => student.attendanceStatus)
      .map((student) => ({
        studentId: student.id,
        status: student.attendanceStatus,
        remarks: student.remarks || "",
      }));

    if (records.length === 0) {
      setError("Please mark at least one student before saving.");
      return;
    }

    setSaving(true);

    try {
      const currentSession = await getOrCreateSession();

      const response = await fetch("/api/attendance/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentSession.id,
          action,
          records,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save attendance.");
      }

      setAttendanceSession(result.data.session);

      setSuccess(
        action === "submit"
          ? "Attendance submitted successfully."
          : "Attendance saved as draft successfully."
      );

      await loadRegister();
    } catch (err) {
      setError(err.message || "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (sessionPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (!user || !["superAdmin", "principal", "teacher"].includes(role)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-8 text-center">
        <AlertCircle className="mx-auto mb-3 text-rose-500" size={32} />
        <h1 className="text-lg font-bold text-slate-900">
          Access restricted
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to access attendance management.
        </p>
        <Link
          href="/admin/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={15} />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <ClipboardCheck size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Attendance Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage daily student attendance and class registers.
                </p>
              </div>
            </div>
          </div>

          {attendanceSession && (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                attendanceSession.status === "submitted"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {attendanceSession.status === "submitted"
                ? "Submitted"
                : "Draft"}
            </span>
          )}
        </div>

        {/* Selection panel */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays size={18} className="text-blue-600" />
            <h2 className="font-bold text-slate-900">
              Attendance details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Academic year
              </label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={academicYear}
                onChange={(event) => {
                  setAcademicYear(event.target.value);
                  setClassId("");
                  setSectionId("");
                  setAttendanceSession(null);
                  setStudents([]);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Attendance date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(event) => setSessionDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Class
              </label>
              <select
                value={classId}
                disabled={loadingClasses || classes.length === 0}
                onChange={(event) => {
                  const nextClass = classes.find(
                    (item) => item.id === event.target.value
                  );

                  setClassId(event.target.value);
                  setSectionId(nextClass?.sections[0]?.id || "");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">
                  {loadingClasses ? "Loading classes..." : "Select class"}
                </option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Section / Group
              </label>
              <select
                value={sectionId}
                disabled={!activeSections.length}
                onChange={(event) => setSectionId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100"
              >
                <option value="">Select section</option>
                {activeSections.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedClass && selectedSection && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                {selectedClass.name}
              </span>
              <span>/</span>
              <span className="font-semibold text-slate-700">
                {selectedSection.name}
              </span>
              <span className="ml-auto">
                Capacity: {selectedSection.capacity}
              </span>
            </div>
          )}
        </section>

        {/* Error and success messages */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Attendance summary */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <SummaryCard
            label="Total students"
            value={students.length}
            icon={<Users size={18} />}
            color="slate"
          />
          <SummaryCard
            label="Present"
            value={summary.present}
            icon={<CheckCircle2 size={18} />}
            color="emerald"
          />
          <SummaryCard
            label="Absent"
            value={summary.absent}
            icon={<AlertCircle size={18} />}
            color="rose"
          />
          <SummaryCard
            label="Late"
            value={summary.late}
            icon={<Clock3 size={18} />}
            color="amber"
          />
          <SummaryCard
            label="Unmarked"
            value={summary.unmarked}
            icon={<ClipboardCheck size={18} />}
            color="blue"
          />
        </section>

        {/* Register */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
            <div>
              <h2 className="font-bold text-slate-900">
                Student attendance register
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {selectedClass && selectedSection
                  ? `${selectedClass.name} · ${selectedSection.name} · ${academicYear}`
                  : "Select a class and section to view students."}
              </p>
            </div>

            {students.length > 0 && canEdit && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => markAll("present")}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Mark all present
                </button>
                <button
                  type="button"
                  onClick={() => markAll("absent")}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Mark all absent
                </button>
              </div>
            )}
          </div>

          {loadingClasses || loadingRegister ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin text-blue-600" />
              Loading attendance register...
            </div>
          ) : !sectionId ? (
            <div className="px-5 py-16 text-center">
              <Users className="mx-auto mb-3 text-slate-300" size={38} />
              <h3 className="font-semibold text-slate-800">
                No class section available
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {role === "teacher"
                  ? "No sections are assigned to your account for this academic year."
                  : "Create an active class section before taking attendance."}
              </p>
            </div>
          ) : students.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Users className="mx-auto mb-3 text-slate-300" size={38} />
              <h3 className="font-semibold text-slate-800">
                No students enrolled
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no active students enrolled in this
                section for {academicYear}. Add students and enroll them
                before marking attendance.
              </p>
            </div>
          ) : (
            <>
              {!canEdit && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                  This attendance session has been submitted. Only
                  administrators can correct submitted attendance.
                </div>
              )}

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Roll</th>
                      <th className="px-5 py-4">Student</th>
                      <th className="px-5 py-4">Admission no.</th>
                      <th className="px-5 py-4">Attendance</th>
                      <th className="px-5 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {student.rollNumber ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-slate-800">
                            {student.firstName} {student.lastName}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">
                          {student.admissionNumber}
                        </td>
                        <td className="px-5 py-4">
                          <StatusButtons
                            value={student.attendanceStatus}
                            disabled={!canEdit || saving}
                            onChange={(value) =>
                              updateStudent(student.id, {
                                attendanceStatus: value,
                              })
                            }
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="text"
                            maxLength={500}
                            value={student.remarks}
                            disabled={!canEdit || saving}
                            onChange={(event) =>
                              updateStudent(student.id, {
                                remarks: event.target.value,
                              })
                            }
                            placeholder="Optional"
                            className="w-36 rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile student cards */}
              <div className="space-y-3 p-3 md:hidden">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-xl border border-slate-200 p-3.5"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Roll: {student.rollNumber ?? "—"} ·{" "}
                          {student.admissionNumber}
                        </p>
                      </div>

                      {student.attendanceStatus ? (
                        <span
                          className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${
                            statusStyles[student.attendanceStatus]
                          }`}
                        >
                          {student.attendanceStatus.toUpperCase()}
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          UNMARKED
                        </span>
                      )}
                    </div>

                    <StatusButtons
                      value={student.attendanceStatus}
                      disabled={!canEdit || saving}
                      onChange={(value) =>
                        updateStudent(student.id, {
                          attendanceStatus: value,
                        })
                      }
                    />

                    <input
                      type="text"
                      maxLength={500}
                      value={student.remarks}
                      disabled={!canEdit || saving}
                      onChange={(event) =>
                        updateStudent(student.id, {
                          remarks: event.target.value,
                        })
                      }
                      placeholder="Remarks (optional)"
                      className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer actions */}
          {students.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="text-xs text-slate-500">
                {markedCount} of {students.length} students marked
                {attendanceSession?.status === "submitted" &&
                  " · Submitted session"}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => handleSave("save")}
                  disabled={saving || !canEdit || markedCount === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save draft
                </button>

                <button
                  type="button"
                  onClick={() => handleSave("submit")}
                  disabled={
                    saving ||
                    !canEdit ||
                    summary.unmarked > 0 ||
                    students.length === 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  Submit attendance
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({ label, value, icon, color }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}
      >
        {icon}
      </div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusButtons({ value, disabled, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {statusOptions.map((option) => {
        const selected = value === option.value;

        const selectedStyles = {
          present: "border-emerald-600 bg-emerald-600 text-white",
          absent: "border-rose-600 bg-rose-600 text-white",
          late: "border-amber-500 bg-amber-500 text-white",
          excused: "border-blue-600 bg-blue-600 text-white",
        };

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={option.label}
            aria-pressed={selected}
            className={`rounded-lg border px-2.5 py-2 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 ${
              selected
                ? selectedStyles[option.value]
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            {option.short}
            <span className="ml-1 hidden lg:inline">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
