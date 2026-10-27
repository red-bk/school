"use client";

import { useState } from "react";

export default function MyFilesPage() {
  const [teacherId, setTeacherId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!teacherId.trim()) return;
    setLoading(true);
    setSubmitted(false);
    try {
      const res = await fetch(
        `/api/upload?teacherId=${encodeURIComponent(teacherId.trim())}`,
      );
      const data = await res.json();
      setFiles(data.uploads ?? []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">ملفاتي</h1>
            <p className="text-sm text-slate-500">
              أدخل رقم هويتك لعرض ملفاتك المرفوعة
            </p>
          </div>
          <a
            href="/"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            + رفع جديد
          </a>
        </div>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <input
            type="text"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            placeholder="أدخل رقم الهوية..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 text-right"
          />
          <button
            type="submit"
            disabled={loading || !teacherId.trim()}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "جاري البحث..." : "بحث"}
          </button>
        </form>

        {/* Results */}
        {submitted && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {files.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                لا توجد ملفات مرفوعة لهذا الرقم.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">نوع الورقة</th>
                      <th className="px-4 py-3 font-medium">اسم الملف</th>
                      <th className="px-4 py-3 font-medium">تاريخ الرفع</th>
                      <th className="px-4 py-3 font-medium text-center">
                        معاينة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 whitespace-normal break-words leading-relaxed max-w-[200px]">
                            {row.sheetType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 break-words max-w-[160px]">
                          {row.fileName}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleString("ar-EG", {
                            timeZone: "Asia/Riyadh",
                            numberingSystem: "latn",
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-800 hover:text-white hover:border-slate-800"
                            onClick={async () => {
                              const newTab = window.open(
                                "about:blank",
                                "_blank",
                              );
                              if (!newTab) {
                                alert("يرجى السماح بفتح النوافذ المنبثقة.");
                                return;
                              }
                              try {
                                const response = await fetch(
                                  `/api/upload/${row.id}/preview`,
                                );
                                if (!response.ok) {
                                  newTab.close();
                                  alert("تعذر فتح الملف.");
                                  return;
                                }
                                const { url } = await response.json();
                                newTab.location.href = url;
                              } catch {
                                newTab.close();
                                alert("تعذر فتح الملف.");
                              }
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.8}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            معاينة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
