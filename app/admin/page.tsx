import { prisma } from "@/lib/prisma";
import { SHEET_TYPES } from "@/lib/constants";
import type { Prisma } from "@prisma/client";

// جلب بيانات جديدة دائمًا — بدون تخزين مؤقت
export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string };
}) {
  const search = searchParams.search?.trim() || "";
  const type = searchParams.type?.trim() || "";

  const where: Prisma.SheetUploadWhereInput = {
    AND: [
      search
        ? {
            OR: [
              { teacherName: { contains: search, mode: "insensitive" } },
              { teacherId: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      type ? { sheetType: type } : {},
    ],
  };

  const [uploads, totalCount] = await Promise.all([
    prisma.sheetUpload.findMany({
      where,
      orderBy: { createdAt: "desc" }, // من الأحدث إلى الأقدم
    }),
    prisma.sheetUpload.count(),
  ]);

  const hasActiveFilters = Boolean(search || type);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
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

        {/* شريط البحث والتصفية */}
        <form
          method="GET"
          className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
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
              name="search"
              defaultValue={search}
              placeholder="ابحث بالاسم أو الرقم التعريفي..."
              className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <select
            name="type"
            defaultValue={type}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:w-56"
          >
            <option value="">جميع أنواع الأوراق</option>
            {SHEET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            تطبيق
          </button>

          {hasActiveFilters && (
            <a
              href="/admin"
              className="text-center text-sm font-medium text-slate-500 underline hover:text-slate-700"
            >
              مسح
            </a>
          )}
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {uploads.length === 0 ? (
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
                    <th className="px-4 py-3 font-medium">
                      الرقم التعريفي للمعلم
                    </th>
                    <th className="px-4 py-3 font-medium">اسم المعلم</th>
                    <th className="px-4 py-3 font-medium">نوع الملف</th>
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
                      <td className="px-4 py-3 text-slate-500">
                        {row.teacherId}
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {row.teacherName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {row.sheetType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(row.createdAt).toLocaleString("ar-EG")}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(row.updatedAt).toLocaleString("ar-EG")}
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
