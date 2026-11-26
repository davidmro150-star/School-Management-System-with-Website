
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Users,
  MapPin,
  Phone,
  Mail,
  CalendarDays,
  Hash,
  Loader2,
  AlertCircle,
  UserRound,
  BookOpen,
  Heart,
} from "lucide-react";

import { useSession } from "@/lib/auth-client";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(date);
}

function InfoItem({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function ProfileSection({ icon: Icon, title, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={18} />
        </div>
        <h2 className="text-sm font-bold text-slate-900">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function statusStyle(status) {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "graduated") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-amber-50 text-amber-700";
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const studentId = params.id;

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionPending || !session?.user || !studentId) {
      return;
    }

    const controller = new AbortController();

    async function loadStudent() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/students/${studentId}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load student profile."
          );
        }

        setRecord(result.data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load student profile.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadStudent();

    return () => controller.abort();
  }, [sessionPending, session, studentId]);

  if (sessionPending || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-sm text-slate-500">
        <Loader2 size={24} className="animate-spin text-blue-600" />
        Loading student profile...
      </div>
    );
  }

  if (!session?.user) return null;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => router.push("/admin/students")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Back to Students
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={18} />
            Unable to open student profile
          </div>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!record?.student) return null;

  const {
    student,
    guardian,
    address,
    enrollments = [],
    emergencyContacts = [],
  } = record;

  const fullName = [
    student.firstName,
    student.lastName,
  ].filter(Boolean).join(" ");

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={() => router.push("/admin/students")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        Back to Student Directory
      </button>

      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2 bg-blue-600" />

        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-2xl font-bold text-blue-700">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                {student.firstName?.charAt(0)}
                {student.lastName?.charAt(0)}
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                {fullName}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${statusStyle(student.status)}`}
              >
                {student.status}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Admission No:{" "}
              <span className="font-semibold text-slate-700">
                {student.admissionNumber}
              </span>
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} />
                {student.phone || "No phone"}
              </span>

              <span className="inline-flex items-center gap-1.5 break-all">
                <Mail size={14} />
                {student.email || "No email"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Personal information */}
      <ProfileSection icon={User} title="Personal Information">
        <InfoItem label="First Name" value={student.firstName} />
        <InfoItem label="Last Name" value={student.lastName} />
        <InfoItem label="Admission Number" value={student.admissionNumber} />
        <InfoItem label="Date of Birth" value={formatDate(student.dateOfBirth)} />
        <InfoItem label="Gender" value={student.gender} />
        <InfoItem label="Blood Group" value={student.bloodGroup} />
        <InfoItem label="Religion" value={student.religion} />
        <InfoItem label="Email Address" value={student.email} />
        <InfoItem label="Phone Number" value={student.phone} />
        <InfoItem label="Previous School" value={student.previousSchool} />
        <InfoItem label="Previous Class" value={student.previousClass} />
      </ProfileSection>

      {/* Admission information */}
      <ProfileSection icon={GraduationCap} title="Admission Information">
        <InfoItem label="Admission Date" value={formatDate(student.admissionDate)} />
        <InfoItem label="Registration Date" value={formatDate(student.createdAt)} />
        <InfoItem label="Current Status" value={student.status} />
      </ProfileSection>

      {/* Academic enrollment */}
      <ProfileSection icon={BookOpen} title="Academic Enrollment">
        {enrollments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No enrollment records found.
          </p>
        ) : (
          enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="col-span-full rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Academic Year {enrollment.academicYear}
                </h3>

                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${enrollment.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {enrollment.isActive ? "Active Enrollment" : "Inactive Enrollment"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoItem label="Class" value={enrollment.className} />
                <InfoItem label="Section / Group" value={enrollment.sectionName} />
                <InfoItem label="Roll Number" value={enrollment.rollNumber} />
                <InfoItem label="Enrollment Date" value={formatDate(enrollment.enrolledAt)} />
              </div>
            </div>
          ))
        )}
      </ProfileSection>

      {/* Guardian information */}
      <ProfileSection icon={Users} title="Family and Guardian Information">
        <InfoItem label="Father's Name" value={guardian?.fatherName} />
        <InfoItem label="Father's Phone" value={guardian?.fatherPhone} />
        <InfoItem label="Father's Occupation" value={guardian?.fatherOccupation} />
        <InfoItem label="Mother's Name" value={guardian?.motherName} />
        <InfoItem label="Mother's Phone" value={guardian?.motherPhone} />
        <InfoItem label="Mother's Occupation" value={guardian?.motherOccupation} />
        <InfoItem label="Additional Guardian" value={guardian?.guardianName} />
        <InfoItem label="Relationship" value={guardian?.guardianRelationship} />
        <InfoItem label="Guardian's Phone" value={guardian?.guardianPhone} />
      </ProfileSection>

      {/* Address */}
      <ProfileSection icon={MapPin} title="Address Information">
        <InfoItem label="Village" value={address?.village} />
        <InfoItem label="Post Office" value={address?.postOffice} />
        <InfoItem label="Postal Code" value={address?.postalCode} />
        <InfoItem label="Union" value={address?.unionName} />
        <InfoItem label="Upazila" value={address?.upazila} />
        <InfoItem label="District" value={address?.district} />
        <div className="sm:col-span-2 lg:col-span-3">
          <InfoItem label="Present Address" value={address?.presentAddress} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <InfoItem label="Permanent Address" value={address?.permanentAddress} />
        </div>
      </ProfileSection>

      {/* Emergency contacts */}
      <ProfileSection icon={Heart} title="Emergency Contacts">
        {emergencyContacts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No emergency contacts have been added.
          </p>
        ) : (
          emergencyContacts.map((contact, index) => (
            <div
              key={contact.id}
              className="col-span-full rounded-xl border border-slate-200 p-4"
            >
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-700">
                <UserRound size={15} />
                Emergency Contact {index + 1}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InfoItem label="Name" value={contact.contactName} />
                <InfoItem label="Relationship" value={contact.relationship} />
                <InfoItem label="Phone Number" value={contact.phone} />
              </div>
            </div>
          ))
        )}
      </ProfileSection>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/students")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to Student Directory
        </button>
      </div>
    </div>
  );
}
