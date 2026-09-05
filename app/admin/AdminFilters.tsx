"use client";

import { useState, useEffect, useRef } from "react";
import { SHEET_TYPES } from "@/lib/constants";

interface Props {
  onSearchChange: (search: string) => void;
  onTypeChange: (type: string) => void;
}

export default function AdminFilters({ onSearchChange, onTypeChange }: Props) {
  const [search, setSearch] = useState("");
  const [typeLabel, setTypeLabel] = useState(""); // what shows in the textarea
  const [typeValue, setTypeValue] = useState(""); // what gets sent to API ("" = all)
  const [filterText, setFilterText] = useState(""); // what user types to filter list
  const [listOpen, setListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent whenever search changes
  useEffect(() => {
    onSearchChange(search);
  }, [search]);

  // Notify parent whenever type value changes
  useEffect(() => {
    onTypeChange(typeValue);
  }, [typeValue]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [typeLabel]);

  // Close list on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setListOpen(false);
        setFilterText("");
        setTypeLabel(typeValue); // restore full label on close
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [typeValue]);

  const filteredTypes = filterText.trim()
    ? SHEET_TYPES.filter((t) => t.includes(filterText.trim()))
    : SHEET_TYPES;

  function selectType(t: string) {
    setTypeLabel(t); // show full name in textarea immediately
    setTypeValue(t); // send to API
    setFilterText("");
    setListOpen(false);
  }

  const checkIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start">
      {/* Name / ID / type text search */}
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
          placeholder="ابحث باسم المعلم ..."
          className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-500"
        />
      </div>

      {/* Sheet type — textarea shows selected label, typing filters the list */}
      <div ref={containerRef} className="relative sm:w-64">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-slate-400"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <textarea
            ref={textareaRef}
            rows={1}
            value={listOpen ? filterText : typeLabel}
            onChange={(e) => {
              setFilterText(e.target.value);
              setListOpen(true);
            }}
            onFocus={() => {
              setFilterText("");
              if (typeValue) setTypeLabel("");
              setListOpen(true);
            }}
            onBlur={() => {}}
            placeholder="ابحث نوع الورقة من القائمة..."
            className="w-full resize-none overflow-hidden rounded-lg border border-slate-300 py-2 ps-9 pe-8 text-sm outline-none focus:border-slate-500 leading-snug"
          />
          {/* X clear button */}
          {typeValue && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent textarea blur before click fires
                setTypeLabel("");
                setTypeValue("");
                setFilterText("");
                setListOpen(false);
              }}
              className="absolute end-2.5 top-2.5 text-slate-400 hover:text-slate-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {listOpen && (
          <ul className="absolute left-0 right-0 z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            {filteredTypes.length === 0 ? (
              <li className="px-4 py-4 text-center text-xs text-slate-400">
                لا توجد نتائج
              </li>
            ) : (
              filteredTypes.map((t) => {
                const isSelected = typeValue === t;
                return (
                  <li key={t}>
                    <button
                      type="button"
                      onClick={() => selectType(t)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-right text-sm transition hover:bg-slate-50 ${isSelected ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                    >
                      <span
                        className={
                          isSelected ? "text-slate-800" : "text-transparent"
                        }
                      >
                        {checkIcon}
                      </span>
                      <span className="leading-snug whitespace-normal break-words text-right">
                        {t}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
