"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { SHEET_TYPES } from "@/lib/constants";

export default function AdminFilters({
  search: initialSearch,
  type: initialType,
}: {
  search: string;
  type: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch);
  const [type, setType] = useState(initialType);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function apply() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type) params.set("type", type);
    router.push(`/admin?${params.toString()}`);
  }

  function clear() {
    setSearch("");
    setType("");
    router.push("/admin");
  }

  const hasActiveFilters = Boolean(initialSearch || initialType);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="ابحث بالاسم أو الرقم التعريفي..."
            className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-500"
          />
        </div>

        {/* Custom type dropdown */}
        <div ref={dropdownRef} className="relative sm:w-64">
          {/* Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              dropdownOpen
                ? "border-slate-500 ring-1 ring-slate-500"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <span className="text-right leading-snug text-slate-700">
              {type || "جميع أنواع الأوراق"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* List */}
          {dropdownOpen && (
            <ul className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
              {/* All option */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setType("");
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-right text-sm transition hover:bg-slate-50 ${
                    !type
                      ? "bg-slate-50 font-medium text-slate-900"
                      : "text-slate-500"
                  }`}
                >
                  <span
                    className={!type ? "text-slate-800" : "text-transparent"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="leading-snug">جميع أنواع الأوراق</span>
                </button>
              </li>

              <li className="mx-3 border-t border-slate-100" />

              {SHEET_TYPES.map((t) => {
                const isSelected = type === t;
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => {
                        setType(t);
                        setDropdownOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-right text-sm transition hover:bg-slate-50 ${
                        isSelected
                          ? "bg-slate-50 font-medium text-slate-900"
                          : "text-slate-700"
                      }`}
                    >
                      <span
                        className={
                          isSelected ? "text-slate-800" : "text-transparent"
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="leading-snug">{t}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={apply}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            تطبيق
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-slate-500 underline hover:text-slate-700"
            >
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Active filter confirmation chip */}
      {initialType && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 shrink-0 text-green-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 leading-none mb-0.5">
              التصفية الحالية
            </p>
            <p className="text-xs font-medium text-white leading-snug">
              {initialType}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
