"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { SHEET_TYPES } from "@/lib/constants";

type FlatItem = { kind: "item"; label: string };
type GroupItem = { kind: "group"; label: string; children: string[] };
type Entry = FlatItem | GroupItem;

const ENTRIES: Entry[] = [
  { kind: "item", label: "توزيع المنهج الفصل الدراسي الاول ١٤٤٨" },
  { kind: "item", label: "توزيع المنهج الفصل الدراسي الثاني ١٤٤٨" },
  {
    kind: "group",
    label: "الخطة الاسبوعية — الفصل الأول",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("الخطة الاسبوعية للفصل الدراسي الاول"),
    ) as string[],
  },
  {
    kind: "group",
    label: "النمو المهني — الفصل الأول — المجتمعات المهنية",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("النمو المهني للفصل الدراسي الاول المجتمعات"),
    ) as string[],
  },
  {
    kind: "group",
    label: "النمو المهني — الفصل الأول — الزيارات الصفية",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("النمو المهني للفصل الدراسي الاول الزيارات"),
    ) as string[],
  },
  {
    kind: "group",
    label: "النمو المهني — الفصل الأول — الدورات",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("النمو المهني للفصل الدراسي الاول الدورات"),
    ) as string[],
  },
  {
    kind: "group",
    label: "النمو المهني — الفصل الثاني — المجتمعات المهنية",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("النمو المهني للفصل الدراسي الثاني المجتمعات"),
    ) as string[],
  },
  {
    kind: "group",
    label: "النمو المهني — الفصل الثاني — الزيارات الصفية",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("النمو المهني للفصل الدراسي الثاني الزيارات"),
    ) as string[],
  },
  {
    kind: "group",
    label: "النمو المهني — الفصل الثاني — الدورات",
    children: SHEET_TYPES.filter((t) =>
      t.startsWith("النمو المهني للفصل الدراسي الثاني الدورات"),
    ) as string[],
  },
  { kind: "item", label: "الطالبات الضعيفات" },
  { kind: "item", label: "الخطط معالجة الضعف الفترة الاولى" },
  { kind: "item", label: "الخطط معالجة الضعف الفترة الثانية" },
  { kind: "item", label: "خطط الاثرائية الفترة الاولى" },
  { kind: "item", label: "الخطط الاثرائية الفترة الثانية" },
  { kind: "item", label: "اختبار الفصل الدراسي الاول للفترة الاولى" },
  { kind: "item", label: "اجابة الفصل الدراسي الاول للفترة الاولى" },
  { kind: "item", label: "اختبار الفصل الدراسي الاول للفترة الثانية" },
  { kind: "item", label: "اجابة الفصل الدراسي الاول للفترة الثانية" },
  { kind: "item", label: "تحليل النتائج الكمي للفترة الاولى" },
  { kind: "item", label: "تحليل النتائج النوعي للفترة الاولى" },
  { kind: "item", label: "تحليل النتائج الكمي للفترة الثانية" },
  { kind: "item", label: "تحليل النتائج النوعي للفترة الثانية" },
  { kind: "item", label: "الانشطة الاثرائية" },
  { kind: "item", label: "المهام الادائية" },
  { kind: "item", label: "التقارير المتعلقة بالانشطة" },
  { kind: "item", label: "استمارة التأمل الذاتي" },
  { kind: "item", label: "استمارة الخطة العلاجية" },
  { kind: "item", label: "استمارة تبادل زيارات" },
  { kind: "item", label: "استمارة درس تطبيقي" },
  { kind: "item", label: "خطة الفريق  حسب المرحلة" },
  { kind: "item", label: "خطة الفريق  حسب التخصص" },
  { kind: "item", label: "تقرير تنفيذ مجتمع تعلم مهني حسب المرحلة" },
  { kind: "item", label: "تقرير تنفيذ مجتمع تعلم مهني حسب التخصص" },
  { kind: "item", label: "تقرير تنفيذ برنامج حسب المرحلة" },
  { kind: "item", label: "تقرير تنفيذ برنامج حسب التخصص" },
  { kind: "item", label: "بيانات معلمات الفريق  على مستوى المرحلة" },
  { kind: "item", label: "بيانات معلمات الفريق  على مستوى التخصص" },
];

// All leaf values in order for browse mode
const ALL_ITEMS: string[] = ENTRIES.flatMap((e) =>
  e.kind === "item" ? [e.label] : e.children,
);

export default function SheetTypePicker({
  value = "",
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [listOpen, setListOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only clear input when value is reset externally (e.g. after form submit)
  useEffect(() => {
    if (!value) setInputValue("");
  }, [value]);

  // Close list on outside click — restore selected label
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setListOpen(false);
        setInputValue(value); // restore if user typed but didn't pick
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value]);

  const isSearching = inputValue.trim().length > 0 && inputValue !== value;

  // Flat filtered results when searching
  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = inputValue.trim();
    return ALL_ITEMS.filter((t) => t.includes(q));
  }, [inputValue, isSearching]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setListOpen(true);
  }

  function handleFocus() {
    // Clear input so user can type freely; show full list
    if (inputValue === value && value) setInputValue("");
    setListOpen(true);
  }

  function select(t: string) {
    onChange(t);
    setInputValue(t);
    setListOpen(false);
  }

  function clearSelection() {
    onChange("");
    setInputValue("");
    inputRef.current?.focus();
    setListOpen(true);
  }

  function toggleGroup(label: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const checkIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5 shrink-0"
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

  const chevron = (rotated: boolean) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${rotated ? "rotate-180" : ""}`}
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
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Single search input */}
      <div className="relative">
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
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="ابحث أو اختر نوع الورقة..."
          className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-8 text-sm outline-none focus:border-slate-500"
        />
        {/* Clear button */}
        {value && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              clearSelection();
            }}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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

      {/* Selected value — full text shown below input */}
      {value && !listOpen && (
        <p className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 whitespace-normal break-words">
          {value}
        </p>
      )}

      {/* Dropdown list */}
      {listOpen && (
        <ul className="absolute left-0 right-0 z-40 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* ── Search mode: flat filtered results ── */}
          {isSearching ? (
            searchResults.length === 0 ? (
              <li className="px-4 py-4 text-center text-xs text-slate-400">
                لا توجد نتائج
              </li>
            ) : (
              searchResults.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => select(t)}
                    className={`flex w-full items-start gap-2 px-4 py-2.5 text-right text-sm transition hover:bg-slate-50 ${value === t ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                  >
                    <span
                      className={`mt-0.5 ${value === t ? "text-slate-800" : "text-transparent"}`}
                    >
                      {checkIcon}
                    </span>
                    <span className="whitespace-normal break-words leading-snug">
                      {t}
                    </span>
                  </button>
                </li>
              ))
            )
          ) : (
            /* ── Browse mode: groups + flat items ── */
            ENTRIES.map((entry) => {
              if (entry.kind === "item") {
                return (
                  <li key={entry.label}>
                    <button
                      type="button"
                      onClick={() => select(entry.label)}
                      className={`flex w-full items-start gap-2 px-4 py-2.5 text-right text-sm transition hover:bg-slate-50 ${value === entry.label ? "bg-slate-50 font-medium text-slate-900" : "text-slate-700"}`}
                    >
                      <span
                        className={`mt-0.5 ${value === entry.label ? "text-slate-800" : "text-transparent"}`}
                      >
                        {checkIcon}
                      </span>
                      <span className="whitespace-normal break-words leading-snug">
                        {entry.label}
                      </span>
                    </button>
                  </li>
                );
              }

              const isOpen = expanded.has(entry.label);
              const selectedInGroup = entry.children.includes(value);
              return (
                <li key={entry.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.label)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 transition hover:bg-slate-50 ${selectedInGroup ? "bg-slate-50" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold leading-snug ${selectedInGroup ? "text-slate-800" : "text-slate-500"}`}
                      >
                        {entry.label}
                      </span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {entry.children.length}
                      </span>
                      {selectedInGroup && (
                        <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                          محدد
                        </span>
                      )}
                    </span>
                    {chevron(isOpen)}
                  </button>

                  {isOpen && (
                    <ul className="border-t border-slate-50 bg-slate-50/50">
                      {entry.children.map((t) => (
                        <li key={t}>
                          <button
                            type="button"
                            onClick={() => select(t)}
                            className={`flex w-full items-start gap-2 px-6 py-2 text-right text-sm transition hover:bg-slate-100 ${value === t ? "font-medium text-slate-900" : "text-slate-600"}`}
                          >
                            <span
                              className={`mt-0.5 ${value === t ? "text-slate-800" : "text-transparent"}`}
                            >
                              {checkIcon}
                            </span>
                            <span className="whitespace-normal break-words leading-snug">
                              {t}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
