
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UserRound,
  GraduationCap,
  ShieldCheck,
  Phone,
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";

const initialForm = {
  name: "",
  email: "",
  password: "",
  employeeId: "",
  phone: "",
  alternatePhone: "",
  gender: "",
  dateOfBirth: "",
  joiningDate: "",
  designation: "Teacher",
  qualification: "",
  specialization: "",
  experienceYears: "0",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  employmentStatus: "active",
  notes: "",
};

function FormSection({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  maxLength,
  min,
  max,
  helpText,
  children,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-rose-500">*</span>
        )}
      </label>

      {children || (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          min={min}
          max={max}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        />
      )}

      {helpText && (
        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          {helpText}
        </p>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-rose-500">*</span>
        )}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
      >
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

export default function AddTeacherPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Please enter the teacher's full name.";
    }

    if (!form.email.trim()) {
      return "Please enter an email address.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (form.password.length < 12) {
      return "The initial password must contain at least 12 characters.";
    }

    if (form.password.length > 128) {
      return "The password cannot exceed 128 characters.";
    }

    if (!form.employeeId.trim()) {
      return "Please enter an employee ID.";
    }

    if (!form.phone.trim()) {
      return "Please enter a phone number.";
    }

    if (!form.joiningDate) {
      return "Please select the joining date.";
    }

    if (
      form.dateOfBirth &&
      form.dateOfBirth >= form.joiningDate
    ) {
      return "Date of birth must be earlier than the joining date.";
    }

    if (
      !Number.isInteger(Number(form.experienceYears)) ||
      Number(form.experienceYears) < 0 ||
      Number(form.experienceYears) > 60
    ) {
      return "Experience must be between 0 and 60 years.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        employeeId: form.employeeId.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim(),
        designation: form.designation.trim() || "Teacher",
        qualification: form.qualification.trim(),
        specialization: form.specialization.trim(),
        experienceYears: Number(form.experienceYears),
        address: form.address.trim(),
        emergencyContactName: form.emergencyContactName.trim(),
        emergencyContactPhone: form.emergencyContactPhone.trim(),
        notes: form.notes.trim(),
      };

      const response = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to create teacher."
        );
      }

      setSuccess(
        `Teacher ${result.data?.name || form.name} was created successfully.`
      );

      setForm(initialForm);

      window.scrollTo({ top: 0, behavior: "smooth" });

      setTimeout(() => {
        router.push("/admin/teachers");
      }, 1200);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full bg-slate-50/70">
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Breadcrumb and heading */}
        <div>
          <Link
            href="/admin/teachers"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to teacher directory
          </Link>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Administration</span>
              <span className="text-slate-300">/</span>
              <Link
                href="/admin/teachers"
                className="hover:text-blue-600"
              >
                Teachers & Staff
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                Add Teacher
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Add New Teacher
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Create a teacher login account and complete their employment profile.
            </p>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4"
          >
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-rose-600"
            />

            <div>
              <p className="text-sm font-semibold text-rose-800">
                Unable to save teacher
              </p>
              <p className="mt-1 text-sm text-rose-700">
                {error}
              </p>
            </div>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Teacher created successfully
              </p>
              <p className="mt-1 text-sm text-emerald-700">
                {success} Redirecting to the teacher directory...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Login account */}
          <FormSection
            icon={ShieldCheck}
            title="Login Account"
            description="These credentials allow the teacher to access their portal."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter teacher's full name"
                required
                maxLength={150}
              />

              <Field
                label="Email address"
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="teacher@example.com"
                required
                maxLength={255}
              />

              <div className="md:col-span-2">
                <Field
                  label="Initial password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a secure initial password"
                  required
                  maxLength={128}
                  helpText="Minimum 12 characters. Share this password securely with the teacher."
                >
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter a secure initial password"
                      required
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
              <Info
                size={17}
                className="mt-0.5 shrink-0 text-blue-600"
              />
              <p className="text-xs leading-5 text-blue-800">
                The account will automatically receive the Teacher role.
                You cannot assign administrative roles through this form.
              </p>
            </div>
          </FormSection>

          {/* Employment details */}
          <FormSection
            icon={BriefcaseBusiness}
            title="Employment Information"
            description="Official identification and employment details."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Employee ID"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="Example: EMP-2026-001"
                required
                maxLength={50}
              />

              <Field
                label="Designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Example: Senior Teacher"
                required
                maxLength={100}
              />

              <Field
                label="Joining date"
                name="joiningDate"
                value={form.joiningDate}
                onChange={handleChange}
                type="date"
                required
              />

              <SelectField
                label="Employment status"
                name="employmentStatus"
                value={form.employmentStatus}
                onChange={handleChange}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "on_leave", label: "On leave" },
                  { value: "resigned", label: "Resigned" },
                  { value: "terminated", label: "Terminated" },
                ]}
              />

              <Field
                label="Qualification"
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                placeholder="Example: M.A. in English"
                maxLength={180}
              />

              <Field
                label="Subject specialization"
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="Example: English Literature"
                maxLength={180}
              />

              <Field
                label="Teaching experience (years)"
                name="experienceYears"
                value={form.experienceYears}
                onChange={handleChange}
                type="number"
                min="0"
                max="60"
                placeholder="0"
              />
            </div>
          </FormSection>

          {/* Personal information */}
          <FormSection
            icon={UserRound}
            title="Personal Information"
            description="Basic personal and contact details."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select gender" },
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Field
                label="Date of birth"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                type="date"
              />

              <Field
                label="Primary phone number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="01XXXXXXXXX"
                required
                maxLength={30}
              />

              <Field
                label="Alternative phone number"
                name="alternatePhone"
                value={form.alternatePhone}
                onChange={handleChange}
                type="tel"
                placeholder="Optional alternative number"
                maxLength={30}
              />

              <div className="md:col-span-2">
                <TextAreaField
                  label="Residential address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter the teacher's full address"
                  rows={3}
                />
              </div>
            </div>
          </FormSection>

          {/* Emergency contact */}
          <FormSection
            icon={Phone}
            title="Emergency Contact"
            description="Contact information to use in case of an emergency."
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Contact person's name"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={handleChange}
                placeholder="Enter contact person's name"
                maxLength={150}
              />

              <Field
                label="Emergency phone number"
                name="emergencyContactPhone"
                value={form.emergencyContactPhone}
                onChange={handleChange}
                type="tel"
                placeholder="01XXXXXXXXX"
                maxLength={30}
              />
            </div>
          </FormSection>

          {/* Additional notes */}
          <FormSection
            icon={GraduationCap}
            title="Additional Notes"
            description="Optional internal notes about this teacher."
          >
            <TextAreaField
              label="Notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add any additional employment information..."
              rows={4}
            />
          </FormSection>

          {/* Form actions */}
          <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:rounded-2xl lg:border lg:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Fields marked with <span className="text-rose-500">*</span> are required.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Link
                  href="/admin/teachers"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                      Creating teacher...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Create Teacher
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
