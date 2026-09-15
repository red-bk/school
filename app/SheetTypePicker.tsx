"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { SHEET_TYPES } from "@/lib/constants";

type FlatItem = { kind: "item"; label: string };
type GroupItem = { kind: "group"; label: string; children: string[] };
type Entry = FlatItem | GroupItem;

const ENTRIES: Entry[] = [
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
  {
    kind: "group",
    label: "التحصيل الدراسي",
    children: [
      "الاختبارات التشخيصية الفصل الاول",
      "تحليل نتائج الاختبارات التشخيصية الفصل الاول",
      "الاختبارات النهائية الفصل الاول",
      "تحليل نتائج الاختبارات النهائية الفصل الاول",
      "الخطط الاثرائية الفترة الاولى",
      "الخطط العلاجية الفترة الاولى",
      "تحليل النتائج الكمي للفترة الاولى",
      "تحليل النتائج النوعي للفترة الاولى",
      "اختبار الفصل الدراسي الاول للفترة الاولى",
      "خطة التكريم والتحضير الفصل الدراسي الاول",
      "توزيع المنهج الفصل الدراسي الاول ١٤٤٨",
      "الاختبارات التشخيصية الفصل الثاني",
      "تحليل نتائج الاختبارات التشخيصية الفصل الثاني",
      "الاختبارات النهائية الفصل الثاني",
      "تحليل نتائج الاختبارات النهائية الفصل الثاني",
      "الخطط الاثرائية الفترة الثانية",
      "الخطط العلاجية الفترة الثانية",
      "تحليل النتائج الكمي للفترة الثانية",
      "تحليل النتائج النوعي للفترة الثانية",
      "اختبار الفصل الدراسي الاول للفترة الثانية",
      "توزيع المنهج الفصل الدراسي الثاني ١٤٤٨",
      "خطة التكريم والتحضير الفصل الدراسي الثاني ",
      "تصنيف الطالبات ( دون المستوى )",
      "تصنيف الطالبات ( فوق المستوى )",
      "التحويل ( للجنة الطلابي )",
      "التحويل للموجهة الطلابية",
      "برامج ومبادرات دعم التحصيل الدراسي ( نموذج خطط التحسين )",
    ],
  },
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
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [parentInputValue, setParentInputValue] = useState("");
  const [childInputValue, setChildInputValue] = useState("");
  const [parentListOpen, setParentListOpen] = useState(false);
  const [childListOpen, setChildListOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const parentInputRef = useRef<HTMLInputElement>(null);
  const childInputRef = useRef<HTMLInputElement>(null);

  // Get parent groups only
  const parentGroups = ENTRIES.filter((e) => e.kind === "group");

  // Filter parent groups by search
  const filteredParents = useMemo(() => {
    if (!parentInputValue.trim()) return parentGroups;
    const q = parentInputValue.trim().toLowerCase();
    return parentGroups.filter((g) => g.label.toLowerCase().includes(q));
  }, [parentInputValue, parentGroups]);

  // Get children of selected parent
  const currentParent = parentGroups.find((g) => g.label === selectedParent);
  const childrenOptions =
    currentParent && currentParent.kind === "group"
      ? currentParent.children
      : [];

  // Filter children by search
  const filteredChildren = useMemo(() => {
    if (!childInputValue.trim()) return childrenOptions;
    const q = childInputValue.trim().toLowerCase();
    return childrenOptions.filter((c) => c.toLowerCase().includes(q));
  }, [childInputValue, childrenOptions]);

  // Close parent list on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setParentListOpen(false);
        setChildListOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectParent(parentLabel: string) {
    setSelectedParent(parentLabel);
    setParentInputValue(parentLabel);
    setParentListOpen(false);
    onChange(""); // Reset child selection
    setChildInputValue(""); // Clear child input
    setChildListOpen(true); // Open child list
  }

  function selectChild(childValue: string) {
    onChange(childValue);
    setChildInputValue(childValue);
    setChildListOpen(false);
  }

  function clearParentSelection() {
    setSelectedParent("");
    setParentInputValue("");
    onChange("");
    setChildInputValue("");
    setParentListOpen(true);
    setTimeout(() => {
      parentInputRef.current?.focus();
    }, 0);
  }

  function clearChildSelection() {
    onChange("");
    setChildInputValue("");
    setChildListOpen(true);
    setTimeout(() => {
      childInputRef.current?.focus();
    }, 0);
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

  return (
    <div ref={containerRef} className="relative space-y-3">
      {/* ── Parent Search Input ── */}
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
          ref={parentInputRef}
          type="text"
          value={parentInputValue}
          onChange={(e) => setParentInputValue(e.target.value)}
          onFocus={() => {
            setParentListOpen(true);
            setChildListOpen(false);
          }}
          placeholder="ابحث عن فئة الورقة..."
          className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-8 text-sm outline-none focus:border-slate-500 text-right"
        />
        {selectedParent && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              clearParentSelection();
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

      {/* Parent Dropdown List */}
      {parentListOpen && (
        <ul className="absolute left-0 right-0 z-50 mt-12 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filteredParents.length === 0 ? (
            <li className="px-4 py-4 text-center text-xs text-slate-400">
              لا توجد نتائج
            </li>
          ) : (
            filteredParents.map((parent) => (
              <li key={parent.label}>
                <button
                  type="button"
                  onClick={() => selectParent(parent.label)}
                  className={`flex w-full items-start gap-2 px-4 py-2.5 text-right text-sm transition hover:bg-slate-50 ${
                    selectedParent === parent.label
                      ? "bg-slate-50 font-medium text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  <span
                    className={`mt-0.5 ${
                      selectedParent === parent.label
                        ? "text-slate-800"
                        : "text-transparent"
                    }`}
                  >
                    {checkIcon}
                  </span>
                  <span className="whitespace-normal break-words leading-snug">
                    {parent.label}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* ── Child Search Input (shown only if parent is selected) ── */}
      {selectedParent && childrenOptions.length > 0 && (
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
            ref={childInputRef}
            type="text"
            value={childInputValue}
            onChange={(e) => setChildInputValue(e.target.value)}
            onFocus={() => {
              setChildListOpen(true);
              setParentListOpen(false);
            }}
            placeholder="ابحث عن نوع الورقة..."
            className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-8 text-sm outline-none focus:border-slate-500 text-right"
            required
          />
          {value && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                clearChildSelection();
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
      )}

      {/* Children Dropdown List */}
      {childListOpen && selectedParent && childrenOptions.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 mt-12 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {filteredChildren.length === 0 ? (
            <li className="px-4 py-4 text-center text-xs text-slate-400">
              لا توجد نتائج
            </li>
          ) : (
            filteredChildren.map((child) => (
              <li key={child}>
                <button
                  type="button"
                  onClick={() => selectChild(child)}
                  className={`flex w-full items-start gap-2 px-4 py-2.5 text-right text-sm transition hover:bg-slate-50 ${
                    value === child
                      ? "bg-slate-50 font-medium text-slate-900"
                      : "text-slate-700"
                  }`}
                >
                  <span
                    className={`mt-0.5 ${
                      value === child ? "text-slate-800" : "text-transparent"
                    }`}
                  >
                    {checkIcon}
                  </span>
                  <span className="whitespace-normal break-words leading-snug">
                    {child}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      {/* Display selected value */}
      {value && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 whitespace-normal break-words">
          ✓ {value}
        </p>
      )}
    </div>
  );
}
