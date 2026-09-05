"use client";

import { useState, useEffect } from "react";
import AdminFilters from "./AdminFilters";

interface Upload {
  id: string;
  teacherId: string;
  teacherName: string;
  sheetType: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (type) params.set("type", type); // "" means all — not sent

    fetch(`/api/upload?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        setUploads(data.uploads ?? []);
        setTotalCount(data.totalCount ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [search, type]);

  const hasActiveFilters = Boolean(search || type);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">
              الأوراق المرفوعة
            </h1>
            <p className="text-sm text-slate-500">
              {hasActiveFilters
                ? `${uploads.length} نتيجة مطابقة من أصل ${totalCount}`
                : `${totalCount} إجمالي عملية رفع`}
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            + رفع جديد
          </a>
        </div>

        {/* Filters — no URL params, pure state */}
        <AdminFilters onSearchChange={setSearch} onTypeChange={setType} />

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm text-slate-400">
              جاري التحميل...
            </p>
          ) : uploads.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">
              {hasActiveFilters
                ? "لا توجد أوراق مطابقة لبحثك أو التصفية المحددة."
                : "لم يتم رفع أي أوراق بعد."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-right text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">اسم المعلم</th>
                    <th className="px-4 py-3 font-medium w-52">نوع الملف</th>
                    <th className="px-4 py-3 font-medium">تاريخ الإنشاء</th>
                    <th className="px-4 py-3 font-medium">تاريخ التحديث</th>
                    <th className="px-4 py-3 font-medium text-center">تحميل</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {row.teacherName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 whitespace-normal break-words leading-relaxed max-w-[200px]">
                          {row.sheetType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(row.createdAt).toLocaleString("ar-EG", {
                          timeZone: "Asia/Riyadh",
                          numberingSystem: "latn",
                        })}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(row.updatedAt).toLocaleString("ar-EG", {
                          timeZone: "Asia/Riyadh",
                          numberingSystem: "latn",
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <a
                          href={`/api/download/${row.id}`}
                          title={`تحميل ${row.fileName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-800 hover:text-white"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                          >
                            <path d="M12 3v12" />
                            <path d="M7 10l5 5 5-5" />
                            <path d="M5 21h14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
