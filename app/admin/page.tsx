import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import AdminFilters from "./AdminFilters"; // adjust path to match your project

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
    prisma.sheetUpload.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.sheetUpload.count(),
  ]);

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

        {/* Client filters (search + custom dropdown) */}
        <AdminFilters search={search} type={type} />

        {/* Table */}
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
                        {/* Badge wraps on long text */}
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
