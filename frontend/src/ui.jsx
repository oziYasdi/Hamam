import React from "react";

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export const fieldClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-amber-400/50 dark:[color-scheme:dark]";

export const labelClass =
  "mb-1.5 block text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800";

export const btnSuccess =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50";

export const btnEdit =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700";

export const btnDelete =
  "inline-flex items-center gap-1.5 rounded-lg border border-rose-200/80 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70";

export const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-md backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/50";

export const tableWrap =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40";

export const thClass =
  "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400";

export const tdClass = "px-4 py-3 text-sm text-slate-700 dark:text-slate-200";

export function StatusBadge({ active, activeLabel = "Aktif", inactiveLabel = "Pasif" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25"
          : "bg-slate-100 text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
      )}
    >
      <span
        className={cn(
          "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-slate-400",
        )}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function SoftBadge({ children, tone = "slate" }) {
  const tones = {
    slate:
      "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    sky: "bg-sky-50 text-sky-700 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/25",
    amber:
      "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25",
    rose: "bg-rose-50 text-rose-700 ring-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25",
    emerald:
      "bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
        tones[tone] || tones.slate,
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="flex items-center gap-2.5 text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {Icon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <Icon size={18} />
            </span>
          )}
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export function Alert({ type = "success", children }) {
  if (!children) return null;
  const isError = type === "error";
  return (
    <div
      className={cn(
        "mb-4 rounded-xl px-4 py-3 text-sm font-medium",
        isError
          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
      )}
    >
      {children}
    </div>
  );
}

export const bookingTones = [
  "border-rose-200/80 bg-rose-100/80 text-rose-800 shadow-sm backdrop-blur-md dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-100",
  "border-emerald-200/80 bg-emerald-100/80 text-emerald-800 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-100",
  "border-amber-200/80 bg-amber-100/80 text-amber-900 shadow-sm backdrop-blur-md dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-100",
  "border-sky-200/80 bg-sky-100/80 text-sky-800 shadow-sm backdrop-blur-md dark:border-sky-500/20 dark:bg-sky-500/15 dark:text-sky-100",
  "border-violet-200/80 bg-violet-100/80 text-violet-800 shadow-sm backdrop-blur-md dark:border-violet-500/20 dark:bg-violet-500/15 dark:text-violet-100",
];
