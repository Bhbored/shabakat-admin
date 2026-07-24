import { useState, useMemo, type FormEvent } from "react";
import { Building2, Globe, Plus, Search, ShieldBan, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../../shared/api/client";
import { useCompaniesQuery } from "../queries";
import { useBanCompanyMutation, useRegisterCompanyMutation } from "../mutations";
import { registerCompanySchema, type RegisterCompanyFormInput, type RegisterCompanyFormOutput } from "../schema";
import type { AdminCompany } from "../types";

export default function CompaniesPage() {
  const companiesQuery = useCompaniesQuery();
  const banMutation = useBanCompanyMutation();
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: companies = [] } = companiesQuery;

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const term = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.plan.toLowerCase().includes(term),
    );
  }, [companies, search]);

  async function handleBanToggle(company: AdminCompany) {
    try {
      const result = await banMutation.mutateAsync({
        id: company.id,
        isBanned: !company.isBanned,
      });
      toast.success(
        result.isBanned
          ? `"${company.name}" has been banned.`
          : `"${company.name}" has been unbanned.`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update ban status.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or plan..."
            className="w-full rounded-xl border border-white/8 bg-card py-2.5 pe-4 ps-9 text-sm text-foreground outline-none transition focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          style={{ boxShadow: "0 0 16px rgba(245,192,0,0.25)" }}
        >
          <Plus className="h-4 w-4" />
          Create Company
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "company" : "companies"}
        {companiesQuery.isFetching ? " · Refreshing..." : ""}
      </p>

      {companiesQuery.isLoading ? (
        <CompaniesSkeleton />
      ) : companiesQuery.error instanceof Error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-6 text-sm text-red-200">
          {companiesQuery.error.message}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-card p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No companies found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Company</th>
                <th className="hidden px-5 py-3 text-start text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground md:table-cell">Plan</th>
                <th className="hidden px-5 py-3 text-start text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground lg:table-cell">Created</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Employees</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Customers</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-end text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <CompanyRow
                  key={company.id}
                  company={company}
                  isExpanded={expandedId === company.id}
                  isBanLoading={banMutation.isPending}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === company.id ? null : company.id)
                  }
                  onBanToggle={() => handleBanToggle(company)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateDialog ? (
        <CreateCompanyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      ) : null}
    </div>
  );
}

function CompanyRow({
  company,
  isExpanded,
  isBanLoading,
  onToggleExpand,
  onBanToggle,
}: Readonly<{
  company: AdminCompany;
  isExpanded: boolean;
  isBanLoading: boolean;
  onToggleExpand: () => void;
  onBanToggle: () => void;
}>) {
  const createdDate = new Date(company.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <tr
        className="cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.02]"
        onClick={onToggleExpand}
      >
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-foreground">{company.name}</p>
              {company.logoUrl ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Logo configured</p>
              ) : null}
            </div>
          </div>
        </td>
        <td className="hidden px-5 py-3 md:table-cell">
          <span className="inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-foreground">
            <Globe className="h-3 w-3 text-muted-foreground" />
            {company.plan}
          </span>
        </td>
        <td className="hidden px-5 py-3 text-muted-foreground lg:table-cell">
          {createdDate}
        </td>
        <td className="px-5 py-3 text-center">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {company.employeeCount}
          </span>
        </td>
        <td className="px-5 py-3 text-center text-muted-foreground">
          {company.customerCount}
        </td>
        <td className="px-5 py-3 text-center">
          {company.isBanned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
              Banned
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              Active
            </span>
          )}
        </td>
        <td className="px-5 py-3 text-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBanToggle();
            }}
            disabled={isBanLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              company.isBanned
                ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                : "bg-red-400/10 text-red-400 hover:bg-red-400/20"
            }`}
          >
            {company.isBanned ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Unban
              </>
            ) : (
              <>
                <ShieldBan className="h-3.5 w-3.5" />
                Ban
              </>
            )}
          </button>
        </td>
      </tr>

      {isExpanded ? (
        <tr className="border-b border-white/5 bg-white/[0.01]">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="font-medium text-foreground">ID</span>
                <p className="mt-0.5 font-mono">{company.id}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Plan</span>
                <p className="mt-0.5">{company.plan}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Created</span>
                <p className="mt-0.5">{createdDate}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Logo</span>
                <p className="mt-0.5">{company.logoUrl ?? "Not uploaded"}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Employees</span>
                <p className="mt-0.5">{company.employeeCount}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Customers</span>
                <p className="mt-0.5">{company.customerCount}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Status</span>
                <p className="mt-0.5">{company.isBanned ? "Banned" : "Active"}</p>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function CompaniesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-card">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-white/5 px-5 py-4 last:border-b-0"
        >
          <div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.04]" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/[0.04]" />
          <div className="ms-auto h-4 w-16 animate-pulse rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

const BACKEND_TO_FORM_FIELD: Record<string, keyof RegisterCompanyFormInput> = {
  CompanyName: "companyName",
  Email: "email",
  Password: "password",
  PasswordRequiresNonAlphanumeric: "password",
  PasswordRequiresUpper: "password",
  PasswordRequiresLower: "password",
  PasswordRequiresDigit: "password",
  PasswordTooShort: "password",
  ConfirmPassword: "confirmPassword",
  Phone: "phone",
  Plan: "plan",
};

function mapBackendErrors(backendErrors: Record<string, string[]>): Partial<Record<keyof RegisterCompanyFormInput, string>> {
  const result: Partial<Record<keyof RegisterCompanyFormInput, string>> = {};
  for (const [backendKey, messages] of Object.entries(backendErrors)) {
    const formField = (BACKEND_TO_FORM_FIELD[backendKey] as keyof RegisterCompanyFormInput | undefined) ?? backendKey as keyof RegisterCompanyFormInput;
    if (!result[formField]) {
      result[formField] = messages.join(" ");
    }
  }
  return result;
}

function CreateCompanyDialog({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const registerMutation = useRegisterCompanyMutation();
  const [form, setForm] = useState<RegisterCompanyFormInput>({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    plan: "Basic",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterCompanyFormInput, string>>>({});

  function updateField<K extends keyof RegisterCompanyFormInput>(field: K, value: RegisterCompanyFormInput[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = registerCompanySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterCompanyFormInput, string>> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof RegisterCompanyFormInput;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const values = result.data as RegisterCompanyFormOutput;
    try {
      await registerMutation.mutateAsync({
        companyName: values.companyName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        phone: values.phone || undefined,
        plan: values.plan,
      });
      toast.success(`Company "${values.companyName}" registered successfully.`);
      onOpenChange(false);
      setForm({
        companyName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        plan: "Basic",
      });
      setErrors({});
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const fieldErrors = mapBackendErrors(err.errors);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
          toast.error("Please fix the highlighted fields.");
          return;
        }
      }
      toast.error(err instanceof Error ? err.message : "Failed to register company.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/8 bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-foreground">Create Company</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new tenant company with an owner account.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Company Name</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              placeholder="Acme Power Co."
            />
            {errors.companyName ? (
              <p className="mt-1 text-xs text-red-400">{errors.companyName}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Admin Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              placeholder="admin@company.com"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-400">{errors.email}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
                placeholder="Min 8 chars"
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-400">{errors.password}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className="w-full rounded-xl border border-white/8 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              />
              {errors.confirmPassword ? (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone (optional)</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
              placeholder="+961..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Plan</label>
            <select
              value={form.plan}
              onChange={(e) => updateField("plan", e.target.value as RegisterCompanyFormInput["plan"])}
              className="w-full rounded-xl border border-white/8 bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary"
            >
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          {registerMutation.error instanceof Error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {registerMutation.error instanceof ApiError && registerMutation.error.errors
                ? Object.values(registerMutation.error.errors).flat().map((msg, i) => (
                    <p key={i}>{msg}</p>
                  ))
                : registerMutation.error.message}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-white/8 px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {registerMutation.isPending ? "Creating..." : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
