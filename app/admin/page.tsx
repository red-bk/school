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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: string;
    fileName: string;
  } | null>(null);

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

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/upload/${id}/delete`, { method: "DELETE" });
      if (res.ok) {
        setUploads((prev) => prev.filter((u) => u.id !== id));
        setTotalCount((prev) => prev - 1);
        setConfirmDelete(null);
      } else {
        alert("حدث خطأ أثناء الحذف، يرجى المحاولة مرة أخرى.");
      }
    } catch {
      alert("حدث خطأ أثناء الحذف، يرجى المحاولة مرة أخرى.");
    } finally {
      setDeletingId(null);
    }
  }

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
                      <td className="px-4 py-3 text-center flex  gap-3">
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
                        {/* Preview */}
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-800 hover:text-white hover:border-slate-800"
                          type="button"
                          onClick={async () => {
                            const newTab = window.open("about:blank", "_blank");

                            if (!newTab) {
                              alert("Please allow pop-ups to preview files.");
                              return;
                            }

                            try {
                              const response = await fetch(
                                `/api/upload/${row.id}/preview`,
                              );

                              if (!response.ok) {
                                newTab.close();
                                alert("Unable to open file.");
                                return;
                              }

                              const { url } = await response.json();
                              newTab.location.href = url;
                            } catch {
                              newTab.close();
                              alert("Unable to open file.");
                            }
                          }}
                        >
                          معاينة
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          disabled={deletingId === row.id}
                          onClick={() =>
                            setConfirmDelete({
                              id: row.id,
                              fileName: row.fileName,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === row.id ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          )}
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-red-600"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h2 className="mb-1 text-center text-base font-semibold text-slate-800">
              تأكيد الحذف
            </h2>
            <p className="mb-1 text-center text-sm text-slate-500">
              هل أنت متأكد من حذف هذا الملف؟
            </p>
            <p className="mb-6 text-center text-xs text-slate-400 break-words">
              {confirmDelete.fileName}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
