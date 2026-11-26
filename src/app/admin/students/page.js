
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Loader2,
  GraduationCap,
  Mail,
  Phone,
  CalendarDays,
  Hash,
  AlertCircle,
  CheckCircle2,
  User,
  MapPin,
  BookOpen,
  UsersRound,
  Plus,
  Trash2,
  Camera,
  Eye,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";

const PAGE_SIZE = 20;

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-slate-700";

function getDhakaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const initialForm = {
  // Student information
  admissionNumber: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  religion: "",
  photoUrl: "",
  previousSchool: "",
  previousClass: "",

  // Father information
  fatherName: "",
  fatherPhone: "",
  fatherOccupation: "",

  // Mother information
  motherName: "",
  motherPhone: "",
  motherOccupation: "",

  // Guardian information
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",

  // Address information
  village: "",
  postOffice: "",
  postalCode: "",
  unionName: "",
  upazila: "",
  district: "",
  presentAddress: "",
  permanentAddress: "",

  // Admission and enrollment
  admissionDate: getDhakaDate(),
  academicYear: String(new Date().getFullYear()),
  classId: "",
  classSectionId: "",
  rollNumber: "",

  // Emergency contacts
  emergencyContacts: [
    {
      contactName: "",
      relationship: "",
      phone: "",
    },
  ],
};

function getStatusStyle(status) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    inactive: "bg-amber-50 text-amber-700 ring-amber-600/20",
    graduated: "bg-blue-50 text-blue-700 ring-blue-600/20",
  };

  return (
    styles[status] ||
    "bg-slate-100 text-slate-600 ring-slate-500/20"
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return "";

  const today = new Date();
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate > today
  ) {
    return "";
  }

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference =
    today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 &&
      today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  maxLength,
  min,
  max,
  disabled = false,
  children,
}) {
  return (
    <div className="min-w-0">
      <label className={LABEL_CLASS}>
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children || (
        <input
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
          disabled={disabled}
          className={`${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50`}
        />
      )}
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
}) {
  return (
    <div className="min-w-0">
      <label className={LABEL_CLASS}>
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50`}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function StudentsPage() {
  const { data: session, isPending: sessionPending } = useSession();

  const role = session?.user?.role;

  const canCreate = [
    "superAdmin",
    "principal",
    "teacher",
    "accountant",
  ].includes(role);

  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const [students, setStudents] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [academicYear, setAcademicYear] = useState(
    String(new Date().getFullYear())
  );

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Class and section data
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState("");

  const selectedClass = useMemo(
    () =>
      classes.find((item) => item.id === form.classId) || null,
    [classes, form.classId]
  );

  const availableSections = selectedClass?.sections || [];

  const age = calculateAge(form.dateOfBirth);

  // Load students from the database.
  useEffect(() => {
    if (sessionPending || !session?.user || isStudent) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (status) {
          params.set("status", status);
        }

        if (isTeacher) {
          params.set("academicYear", academicYear);
        }

        const response = await fetch(
          `/api/students?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load students."
          );
        }

        setStudents(result.data || []);

        setPagination(
          result.pagination || {
            page: 1,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong.");
          setStudents([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    sessionPending,
    session,
    isStudent,
    isTeacher,
    search,
    status,
    academicYear,
    page,
    refreshKey,
  ]);

  // Load active classes and their active sections.
  useEffect(() => {
    if (!session?.user || sessionPending || isStudent) {
      return;
    }

    const controller = new AbortController();

    async function loadClasses() {
      try {
        setClassesLoading(true);
        setClassesError("");

        const response = await fetch(
          "/api/academics/classes",
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load classes."
          );
        }

        const activeClasses = (result.data || [])
          .filter((item) => item.isActive)
          .map((item) => ({
            ...item,
            sections: (item.sections || []).filter(
              (section) => section.isActive
            ),
          }));

        setClasses(activeClasses);
      } catch (err) {
        if (err.name !== "AbortError") {
          setClassesError(
            err.message || "Unable to load classes."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setClassesLoading(false);
        }
      }
    }

    loadClasses();

    return () => controller.abort();
  }, [session, sessionPending, isStudent]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        name === "admissionNumber"
          ? value.toUpperCase()
          : value,
    }));
  }

  function handleClassChange(event) {
    const classId = event.target.value;

    setForm((previous) => ({
      ...previous,
      classId,
      classSectionId: "",
    }));
  }

  function handleEmergencyChange(index, event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      emergencyContacts: previous.emergencyContacts.map(
        (contact, contactIndex) =>
          contactIndex === index
            ? {
                ...contact,
                [name]: value,
              }
            : contact
      ),
    }));
  }

  function addEmergencyContact() {
    setForm((previous) => ({
      ...previous,
      emergencyContacts: [
        ...previous.emergencyContacts,
        {
          contactName: "",
          relationship: "",
          phone: "",
        },
      ],
    }));
  }

  function removeEmergencyContact(index) {
    setForm((previous) => ({
      ...previous,
      emergencyContacts: previous.emergencyContacts.filter(
        (_, contactIndex) => contactIndex !== index
      ),
    }));
  }

  function resetRegistrationForm() {
    setForm({
      ...initialForm,
      admissionDate: getDhakaDate(),
      academicYear: String(new Date().getFullYear()),
    });

    setFormError("");
  }

  async function handleRegister(event) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    if (
      !form.admissionNumber.trim() ||
      !form.firstName.trim()
    ) {
      setFormError(
        "Admission number and first name are required."
      );
      return;
    }

    if (!form.admissionDate || !form.academicYear.trim()) {
      setFormError(
        "Admission date and academic year are required."
      );
      return;
    }

    if (!form.classId || !form.classSectionId) {
      setFormError(
        "Please select a class and section."
      );
      return;
    }

    if (!form.rollNumber.trim()) {
      setFormError("Please enter the student's roll number.");
      return;
    }

    if (
      form.dateOfBirth &&
      new Date(`${form.dateOfBirth}T00:00:00`) > new Date()
    ) {
      setFormError("Date of birth cannot be in the future.");
      return;
    }

    const validEmergencyContacts = form.emergencyContacts
      .filter(
        (contact) =>
          contact.contactName.trim() ||
          contact.phone.trim() ||
          contact.relationship.trim()
      );

    const incompleteEmergencyContact =
      validEmergencyContacts.some(
        (contact) =>
          !contact.contactName.trim() ||
          !contact.phone.trim()
      );

    if (incompleteEmergencyContact) {
      setFormError(
        "Please complete the name and phone number for each emergency contact, or remove the empty contact."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        admissionNumber: form.admissionNumber.trim().toUpperCase(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        academicYear: form.academicYear.trim(),
        rollNumber: form.rollNumber.trim(),
        emergencyContacts: validEmergencyContacts,
      };

      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Student registration failed."
        );
      }

      const registeredName = [
        result.data.firstName,
        result.data.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      resetRegistrationForm();
      setShowForm(false);
      setSearch("");
      setStatus("");
      setPage(1);

      setSuccessMessage(
        `Student ${registeredName} registered successfully.`
      );

      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      setFormError(
        err.message || "Unable to register student."
      );
    } finally {
      setSaving(false);
    }
  }

  function changePage(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages
    ) {
      return;
    }

    setPage(nextPage);
  }

  if (sessionPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="animate-spin text-blue-600"
          size={30}
        />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (isStudent) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap
            size={42}
            className="mx-auto text-blue-600"
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Student Profile
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Student directory access is not available for student
            accounts. Your personal profile will be available in
            the My Profile section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">

      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users size={21} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Student Management
            </h1>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Manage student records and registration
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value);
                setFormError("");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {showForm ? <X size={17} /> : <UserPlus size={17} />}
              {showForm ? "Close Form" : "Register Student"}
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={19} className="shrink-0" />

          <p className="flex-1">{successMessage}</p>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Registration form */}
      {showForm && canCreate && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-bold text-slate-900">
              Register New Student
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Complete the student's personal, family, address and
              academic information.
            </p>
          </div>

          <form
            onSubmit={handleRegister}
            className="space-y-8 p-5 sm:p-6"
          >
            {formError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Student information */}
            <section>
              <SectionHeading
                icon={User}
                title="Student Information"
                description="Basic identity and personal details of the student."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <FormField
                  label="Admission Number"
                  name="admissionNumber"
                  value={form.admissionNumber}
                  onChange={handleFormChange}
                  placeholder="e.g. ADM-2026-001"
                  required
                  maxLength={50}
                />

                <FormField
                  label="First Name"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  placeholder="Student first name"
                  required
                  maxLength={100}
                />

                <FormField
                  label="Last Name"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  placeholder="Student last name"
                  maxLength={100}
                />

                <FormField
                  label="Email Address"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  type="email"
                  placeholder="student@example.com"
                  maxLength={255}
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  maxLength={30}
                />

                <div>
                  <FormField
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleFormChange}
                    type="date"
                    max={getDhakaDate()}
                  />

                  {age !== "" && (
                    <p className="mt-1.5 text-xs font-medium text-blue-600">
                      Calculated age: {age} years
                    </p>
                  )}
                </div>

                <FormSelect
                  label="Gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleFormChange}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Other" },
                  ]}
                />

                <FormSelect
                  label="Blood Group"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleFormChange}
                  options={[
                    { value: "A+", label: "A+" },
                    { value: "A-", label: "A-" },
                    { value: "B+", label: "B+" },
                    { value: "B-", label: "B-" },
                    { value: "AB+", label: "AB+" },
                    { value: "AB-", label: "AB-" },
                    { value: "O+", label: "O+" },
                    { value: "O-", label: "O-" },
                  ]}
                />

                <FormSelect
                  label="Religion"
                  name="religion"
                  value={form.religion}
                  onChange={handleFormChange}
                  options={[
                    { value: "Islam", label: "Islam" },
                    { value: "Hinduism", label: "Hinduism" },
                    { value: "Buddhism", label: "Buddhism" },
                    { value: "Christianity", label: "Christianity" },
                    { value: "Other", label: "Other" },
                  ]}
                />

                <FormField
                  label="Student Photo URL"
                  name="photoUrl"
                  value={form.photoUrl}
                  onChange={handleFormChange}
                  placeholder="Photo URL (optional)"
                />

                <FormField
                  label="Previous School"
                  name="previousSchool"
                  value={form.previousSchool}
                  onChange={handleFormChange}
                  placeholder="Previous school name"
                  maxLength={200}
                />

                <FormField
                  label="Previous Class"
                  name="previousClass"
                  value={form.previousClass}
                  onChange={handleFormChange}
                  placeholder="e.g. Class 5"
                  maxLength={50}
                />
              </div>
            </section>

            {/* Academic admission */}
            <section>
              <SectionHeading
                icon={BookOpen}
                title="Academic Admission"
                description="Select the student's class, section and admission details."
              />

              {classesError && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={17} className="shrink-0" />
                  <span>{classesError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <FormField
                  label="Admission Date"
                  name="admissionDate"
                  value={form.admissionDate}
                  onChange={handleFormChange}
                  type="date"
                  required
                />

                <FormField
                  label="Academic Year"
                  name="academicYear"
                  value={form.academicYear}
                  onChange={handleFormChange}
                  placeholder="e.g. 2026"
                  required
                  maxLength={20}
                />

                <FormField
                  label="Roll Number"
                  name="rollNumber"
                  value={form.rollNumber}
                  onChange={handleFormChange}
                  placeholder="e.g. 01"
                  required
                  maxLength={30}
                />

                <div>
                  <label className={LABEL_CLASS}>
                    Class <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="classId"
                    value={form.classId}
                    onChange={handleClassChange}
                    required
                    disabled={classesLoading || classes.length === 0}
                    className={`${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50`}
                  >
                    <option value="">
                      {classesLoading
                        ? "Loading classes..."
                        : "Select class"}
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Section / Group{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="classSectionId"
                    value={form.classSectionId}
                    onChange={handleFormChange}
                    required
                    disabled={
                      !form.classId ||
                      availableSections.length === 0
                    }
                    className={`${INPUT_CLASS} disabled:cursor-not-allowed disabled:bg-slate-50`}
                  >
                    <option value="">
                      {!form.classId
                        ? "Select class first"
                        : "Select section"}
                    </option>

                    {availableSections.map((section) => (
                      <option
                        key={section.id}
                        value={section.id}
                      >
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {classes.length === 0 && !classesLoading && !classesError && (
                <p className="mt-3 text-xs text-amber-700">
                  No active classes are available. Please check
                  Academic Management.
                </p>
              )}
            </section>

            {/* Father information */}
            <section>
              <SectionHeading
                icon={UsersRound}
                title="Father's Information"
                description="Father's name and contact information."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Father's Name"
                  name="fatherName"
                  value={form.fatherName}
                  onChange={handleFormChange}
                  placeholder="Father's full name"
                  maxLength={150}
                />

                <FormField
                  label="Father's Phone"
                  name="fatherPhone"
                  value={form.fatherPhone}
                  onChange={handleFormChange}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                  maxLength={30}
                />

                <FormField
                  label="Father's Occupation"
                  name="fatherOccupation"
                  value={form.fatherOccupation}
                  onChange={handleFormChange}
                  placeholder="Occupation"
                  maxLength={150}
                />
              </div>
            </section>

            {/* Mother information */}
            <section>
              <SectionHeading
                icon={UsersRound}
                title="Mother's Information"
                description="Mother's name and contact information."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Mother's Name"
                  name="motherName"
                  value={form.motherName}
                  onChange={handleFormChange}
                  placeholder="Mother's full name"
                  maxLength={150}
                />

                <FormField
                  label="Mother's Phone"
                  name="motherPhone"
                  value={form.motherPhone}
                  onChange={handleFormChange}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                  maxLength={30}
                />

                <FormField
                  label="Mother's Occupation"
                  name="motherOccupation"
                  value={form.motherOccupation}
                  onChange={handleFormChange}
                  placeholder="Occupation"
                  maxLength={150}
                />
              </div>
            </section>

            {/* Guardian information */}
            <section>
              <SectionHeading
                icon={Users}
                title="Additional Guardian"
                description="Optional alternative guardian details."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Guardian's Name"
                  name="guardianName"
                  value={form.guardianName}
                  onChange={handleFormChange}
                  placeholder="Guardian's full name"
                  maxLength={150}
                />

                <FormField
                  label="Relationship"
                  name="guardianRelationship"
                  value={form.guardianRelationship}
                  onChange={handleFormChange}
                  placeholder="e.g. Uncle, Aunt"
                  maxLength={100}
                />

                <FormField
                  label="Guardian's Phone"
                  name="guardianPhone"
                  value={form.guardianPhone}
                  onChange={handleFormChange}
                  placeholder="01XXXXXXXXX"
                  type="tel"
                  maxLength={30}
                />
              </div>
            </section>

            {/* Address information */}
            <section>
              <SectionHeading
                icon={MapPin}
                title="Address Information"
                description="Bangladesh address and present/permanent address details."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <FormField
                  label="Village"
                  name="village"
                  value={form.village}
                  onChange={handleFormChange}
                  placeholder="Village name"
                  maxLength={150}
                />

                <FormField
                  label="Post Office"
                  name="postOffice"
                  value={form.postOffice}
                  onChange={handleFormChange}
                  placeholder="Post office"
                  maxLength={150}
                />

                <FormField
                  label="Postal Code"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleFormChange}
                  placeholder="Postal code"
                  maxLength={20}
                />

                <FormField
                  label="Union"
                  name="unionName"
                  value={form.unionName}
                  onChange={handleFormChange}
                  placeholder="Union name"
                  maxLength={150}
                />

                <FormField
                  label="Upazila"
                  name="upazila"
                  value={form.upazila}
                  onChange={handleFormChange}
                  placeholder="Upazila name"
                  maxLength={150}
                />

                <FormField
                  label="District"
                  name="district"
                  value={form.district}
                  onChange={handleFormChange}
                  placeholder="District name"
                  maxLength={150}
                />

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={LABEL_CLASS}>
                    Present Address
                  </label>

                  <textarea
                    name="presentAddress"
                    value={form.presentAddress}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Enter present address"
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className={LABEL_CLASS}>
                    Permanent Address
                  </label>

                  <textarea
                    name="permanentAddress"
                    value={form.permanentAddress}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Enter permanent address"
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </div>
              </div>
            </section>

            {/* Emergency contacts */}
            <section>
              <div className="mb-5 flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Phone size={18} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Emergency Contacts
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add people the school can contact in an emergency.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addEmergencyContact}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Plus size={15} />
                  Add Contact
                </button>
              </div>

              <div className="space-y-4">
                {form.emergencyContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">
                        Emergency Contact {index + 1}
                      </p>

                      {form.emergencyContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeEmergencyContact(index)
                          }
                          aria-label={`Remove emergency contact ${index + 1}`}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        label="Contact Name"
                        name="contactName"
                        value={contact.contactName}
                        onChange={(event) =>
                          handleEmergencyChange(index, event)
                        }
                        placeholder="Full name"
                      />

                      <FormField
                        label="Relationship"
                        name="relationship"
                        value={contact.relationship}
                        onChange={(event) =>
                          handleEmergencyChange(index, event)
                        }
                        placeholder="e.g. Uncle"
                      />

                      <FormField
                        label="Phone Number"
                        name="phone"
                        value={contact.phone}
                        onChange={(event) =>
                          handleEmergencyChange(index, event)
                        }
                        placeholder="01XXXXXXXXX"
                        type="tel"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Form actions */}
            <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-100 pt-5 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetRegistrationForm();
                }}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving || classesLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <UserPlus size={16} />
                )}

                {saving ? "Registering..." : "Register Student"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total Students
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pagination.total}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Matching current filters
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Current Page
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {pagination.totalPages ? page : 0}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Of {pagination.totalPages} pages
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Records Per Page
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {PAGE_SIZE}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Maximum displayed per page
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className={LABEL_CLASS}>
              Search Students
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, admission number, email or phone..."
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>
          </div>

          <div className="w-full lg:w-52">
            <label className={LABEL_CLASS}>
              Student Status
            </label>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className={INPUT_CLASS}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
          </div>

          {isTeacher && (
            <div className="w-full lg:w-44">
              <label className={LABEL_CLASS}>
                Academic Year
              </label>

              <input
                value={academicYear}
                onChange={(event) => {
                  setAcademicYear(event.target.value);
                  setPage(1);
                }}
                placeholder="2026"
                maxLength={9}
                className={INPUT_CLASS}
              />
            </div>
          )}
        </div>
      </section>

      {/* Student directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">
              Student Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {pagination.total} student record(s) found
            </p>
          </div>

          <span className="text-xs font-medium text-slate-400">
            Showing {students.length} of {pagination.total}
          </span>
        </div>

        {error && (
          <div className="m-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2
              size={22}
              className="animate-spin text-blue-600"
            />
            Loading student records...
          </div>
        ) : error ? null : students.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-800">
              No students found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              No student records match your search. Register a new
              student or adjust your filters.
            </p>

            {canCreate && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Register your first student
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50">
                  <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Admission No.</th>
                    <th className="px-5 py-3.5">Contact</th>
                    <th className="px-5 py-3.5">Date of Birth</th>
                    <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Registered</th>
                        <th className="px-5 py-3.5">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                            {student.firstName?.charAt(0)}
                            {student.lastName?.charAt(0) || ""}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {student.firstName} {student.lastName}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Student
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {student.admissionNumber}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-700">
                          {student.phone || "No phone"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {student.email || "No email"}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        {formatDate(student.dateOfBirth)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${getStatusStyle(student.status)}`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(student.createdAt)}
                      </td>

                      <td className="px-5 py-4">
  <a
    href={`/admin/students/${student.id}`}
    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
  >
    <Eye size={15} />
    View Details
  </a>
</td> 
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            
  {/* Mobile cards */}
   <div className="divide-y divide-slate-100 md:hidden">
  {students.map((student) => (
    <article
      key={student.id}
      className="p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
          {student.firstName?.charAt(0)}
          {student.lastName?.charAt(0) || ""}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {student.firstName} {student.lastName}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${getStatusStyle(student.status)}`}
            >
              {student.status}
            </span>
          </div>

          <p className="mt-1 text-xs font-medium text-slate-500">
            {student.admissionNumber}
          </p>

          <div className="mt-3 space-y-2 text-xs text-slate-500">
            <p className="flex items-center gap-2 break-all">
              <Phone size={14} className="shrink-0" />
              {student.phone || "No phone number"}
            </p>

            <p className="flex items-center gap-2 break-all">
              <Mail size={14} className="shrink-0" />
              {student.email || "No email address"}
            </p>

            <p className="flex items-center gap-2">
              <CalendarDays size={14} className="shrink-0" />
              Date of birth: {formatDate(student.dateOfBirth)}
            </p>
          </div>
        </div>
      </div>

      {/* View Student Details button */}
      <a
        href={`/admin/students/${student.id}`}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <Eye size={16} />
        View Student Details
      </a>
    </article>
  ))}
</div>

                
          </>
        )}

        {/* Pagination */}
        {!loading &&
          !error &&
          pagination.totalPages > 0 && (
            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <p className="text-xs text-slate-500">
                Page {page} of {pagination.totalPages}
                {" · "}
                {pagination.total} total records
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
      </section>
    </div>
  );
}
