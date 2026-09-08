"use client";

import { useState, FormEvent, useEffect, useMemo } from "react";
import SheetTypePicker from "./SheetTypePicker";
import { SHEET_TYPES, validateFile } from "@/lib/constants";

type SubmitState = "idle" | "loading" | "success" | "error";
type ToastType = "success" | "error";

interface FileWithType {
  file: File;
}

interface TemplateFile {
  name: string;
  file: string;
  icon: string;
  restricted?: boolean; // requires the access code to download
}

interface TemplateGroup extends TemplateFile {
  children?: TemplateFile[];
}
// ────────────────────────────────────────────────
// Templates — add/remove entries here as needed.
// Unrestricted files must be placed in /public/templates/
// Restricted files (restricted: true) must be placed in
// /restricted-templates/ (outside /public) and served only
// through /api/restricted-download after a code check.
// ────────────────────────────────────────────────
const MAIN_TEMPLATE: TemplateGroup = {
  name: "دليل التطوير المهني",
  file: "دليل_التطوير_المهني.pptx",
  icon: "pptx",
  children: [
    {
      name: "بيانات معلمات الفريق  على مستوى التخصص",
      file: "بيانات معلمات الفريق  على مستوى التخصص.docx",
      icon: "docx",
    },
    {
      name: "بيانات معلمات الفريق  على مستوى المرحلة",
      file: "بيانات معلمات الفريق  على مستوى المرحلة.docx",
      icon: "docx",
    },
    {
      name: "تقرير تنفيذ برنامج حسب التخصص",
      file: "تقرير تنفيذ برنامج حسب التخصص.docx",
      icon: "docx",
    },
    {
      name: "تقرير تنفيذ برنامج حسب المرحلة",
      file: "تقرير تنفيذ برنامج حسب المرحلة.docx",
      icon: "docx",
    },
    {
      name: "تقرير تنفيذ مجتمع تعلم مهني حسب التخصص",
      file: "تقرير تنفيذ مجتمع تعلم مهني حسب التخصص.docx",
      icon: "docx",
    },
    {
      name: "تقرير تنفيذ مجتمع تعلم مهني حسب المرحلة",
      file: "تقرير تنفيذ مجتمع تعلم مهني حسب المرحلة.docx",
      icon: "docx",
    },
    {
      name: "خطة الفريق  حسب التخصص",
      file: "خطة الفريق  حسب التخصص.docx",
      icon: "docx",
    },
    {
      name: "خطة الفريق  حسب المرحلة",
      file: "خطة الفريق  حسب المرحلة.docx",
      icon: "docx",
    },
  ],
};

const TEMPLATES: TemplateFile[] = [
  {
    name: "استمارة التأمل الذاتي",
    file: "استمارة_التا_مل_الذاتي_.docx",
    icon: "docx",
  },
  {
    name: "استمارة الخطة العلاجية",
    file: "استمارة_الخطة_العلاجية_جيهان.docx",
    icon: "docx",
  },
  {
    name: "استمارة تبادل الزيارات",
    file: "استمارة_تبادل_زيارات_جيهان_.docx",
    icon: "docx",
  },
  {
    name: "استمارة الدرس التطبيقي",
    file: "استمارة_درس_تطبيقي_جيهان.docx",
    icon: "docx",
  },
  {
    name: " حصر الكفاءات من المعلمين",
    file: "حصر الكفاءات من المعلمين.docx",
    icon: "docx",
    restricted: true,
  },
];

function FileIcon({ type }: { type: string }) {
  if (type === "pptx") {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-orange-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="M9 13h2a2 2 0 010 4H9v-4zm0 0V9" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-blue-600"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 20h16"
      />
    </svg>
  );
}

function DownloadLink({
  file,
  restricted,
  onError,
}: {
  file: string;
  restricted?: boolean;
  onError: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!restricted) {
    return (
      <a
        href={`/templates/${file}`}
        download={file}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 sm:w-auto"
      >
        <DownloadIcon />
        تحميل
      </a>
    );
  }

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const code = window.prompt("هذا الملف محمي، أدخل كلمة السر:");
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/restricted-download?file=${encodeURIComponent(file)}&code=${encodeURIComponent(code)}`,
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "تعذر تحميل الملف");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      onError(err.message || "كلمة السر غير صحيحة");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 sm:w-auto"
    >
      <DownloadIcon />
      {loading ? "..." : "تحميل"}
    </button>
  );
}

function MainTemplateCard({
  template,
  onError,
}: {
  template: TemplateGroup;
  onError: (message: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filteredChildren = useMemo(() => {
    const children = template.children || [];
    const q = query.trim().toLowerCase();
    if (!q) return children;
    return children.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, template.children]);

  return (
    <li className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3 sm:py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 text-right"
        >
          <FileIcon type={template.icon} />
          <span className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-slate-700">
            {template.name}
          </span>
          <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {template.children?.length ?? 0} ملف
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <DownloadLink
            file={template.file}
            restricted={template.restricted}
            onError={onError}
          />
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-slate-200 bg-white p-3">
          <div className="relative mb-2">
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم الملف..."
              className="w-full rounded-lg border border-slate-300 py-2 ps-9 pe-3 text-sm outline-none focus:border-slate-500"
            />
          </div>
          {filteredChildren.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              لا توجد ملفات مطابقة لبحثك.
            </p>
          ) : (
            <ul className="space-y-2">
              {filteredChildren.map((child) => (
                <li
                  key={child.file}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <FileIcon type={child.icon} />
                    <span className="min-w-0 flex-1 break-words text-right text-sm font-medium leading-snug text-slate-700">
                      {child.name}
                    </span>
                  </div>
                  <DownloadLink
                    file={child.file}
                    restricted={child.restricted}
                    onError={onError}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

export default function HomePage() {
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [sheetType, setSheetType] = useState<string>();
  const [files, setFiles] = useState<FileWithType[]>([]);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  function showToastWith(text: string, type: ToastType = "success") {
    setToastMessage(text);
    setToastType(type);
    setShowToast(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const errors: string[] = [];
    const valid: FileWithType[] = [];
    for (const f of selected) {
      const error = validateFile(f);
      if (error) {
        errors.push(`${f.name}: ${error}`);
      } else {
        const alreadyAdded = files.some(
          (fw) => fw.file.name === f.name && fw.file.size === f.size,
        );
        if (!alreadyAdded) valid.push({ file: f });
      }
    }
    setMessage(errors.length > 0 ? errors.join("\n") : "");
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid]);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    if (!teacherId.trim()) {
      setMessage("الرجاء إدخال رقم الهوية .");
      return;
    }
    if (!teacherName.trim()) {
      setMessage("الرجاء إدخال اسم المعلم.");
      return;
    }
    if (files.length === 0) {
      setMessage("الرجاء اختيار ملف واحد على الأقل.");
      return;
    }

    try {
      setStatus("loading");
      const results = await Promise.all(
        files.map(async ({ file }) => {
          const formData = new FormData();
          formData.append("teacherId", teacherId.trim());
          formData.append("teacherName", teacherName.trim());
          formData.append("sheetType", sheetType);
          formData.append("file", file);
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || `فشل رفع ${file.name}`);
          return data;
        }),
      );
      const anyReplaced = results.some((r) => r.replaced);
      setStatus("success");
      setMessage("");
      showToastWith(
        anyReplaced
          ? `تم رفع ${files.length} ملف/ملفات — بعضها استبدل ملفات سابقة!`
          : `تم رفع ${files.length} ملف/ملفات بنجاح!`,
        "success",
      );
      setTeacherId("");
      setTeacherName("");
      setSheetType(SHEET_TYPES[0]);
      setFiles([]);
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "حدث خطأ ما. الرجاء المحاولة مرة أخرى.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-10">
      <div className="w-full max-w-lg space-y-6">
        {/* ── Templates section ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h2 className="text-base font-semibold text-slate-800">
              النماذج المتاحة
            </h2>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            اضغط على تحميل للحصول على نسخة من النموذج، أو اضغط على دليل التطوير
            المهني لعرض الملفات المرتبطة به والبحث بينها. الملفات المحمية تتطلب
            كلمة سر عند التحميل.
          </p>
          <ul className="space-y-2">
            <MainTemplateCard
              template={MAIN_TEMPLATE}
              onError={(msg) => showToastWith(msg, "error")}
            />
            {TEMPLATES.map((tpl) => (
              <li
                key={tpl.file}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-100 sm:flex-row sm:items-center sm:gap-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileIcon type={tpl.icon} />
                  <span className="min-w-0 flex-1 break-words text-right text-sm font-medium leading-snug text-slate-700">
                    {tpl.name}
                  </span>
                </div>
                <DownloadLink
                  file={tpl.file}
                  restricted={tpl.restricted}
                  onError={(msg) => showToastWith(msg, "error")}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* ── Upload form ── */}
        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <h1 className="mb-1 text-2xl font-semibold text-slate-800">
            رفع ورقة
          </h1>
          <p className="mb-6 text-sm text-slate-500">
            أدخل بياناتك، اختر نوع الورقة، وارفع الملفات.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="teacherId"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                الرقم الهوية
              </label>
              <input
                id="teacherId"
                type="text"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="مثال: T-1024"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label
                htmlFor="teacherName"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                اسم المعلم
              </label>
              <input
                id="teacherName"
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                required
              />
            </div>

            {/* ── Grouped searchable sheet type picker ── */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                نوع الورقة
              </label>
              <SheetTypePicker value={sheetType} onChange={setSheetType} />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                الملفات
              </label>
              <label
                htmlFor="file-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition hover:border-slate-500 hover:bg-slate-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-600">
                  اضغط لاختيار الملفات
                </span>
                <span className="text-xs text-slate-400">
                  يمكنك اختيار عدة ملفات دفعة واحدة
                </span>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-slate-400">
                الحد الأقصى لحجم كل ملف 5 جيجابايت. ملفات الفيديو غير مسموحة.
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  الملفات المختارة ({files.length})
                </p>
                {files.map((fw, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 shrink-0 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-700">
                        {fw.file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(fw.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading"
                ? `جاري رفع ${files.length} ملف/ملفات...`
                : `إرسال${files.length > 0 ? ` (${files.length} ملف)` : ""}`}
            </button>

            {message && status === "error" && (
              <p className="whitespace-pre-line text-sm text-red-600">
                {message}
              </p>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            سيتم استبدال أي ملف سابق من نفس النوع تلقائيًا عند رفع ملف جديد.
          </p>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${showToast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
      >
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toastType === "error" ? "bg-red-600" : "bg-slate-800"}`}
        >
          {toastType === "error" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-11a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zm0 8a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5 shrink-0 text-green-400"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {toastMessage}
        </div>
      </div>
    </main>
  );
}
