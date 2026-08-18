"use client";

import { useState, FormEvent, useEffect } from "react";
import { SHEET_TYPES, validateFile } from "@/lib/constants";

type SubmitState = "idle" | "loading" | "success" | "error";

interface FileWithType {
  file: File;
}

export default function HomePage() {
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [sheetType, setSheetType] = useState<string>(SHEET_TYPES[0]);
  const [files, setFiles] = useState<FileWithType[]>([]);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

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
        if (!alreadyAdded) {
          valid.push({ file: f });
        }
      }
    }

    if (errors.length > 0) {
      setMessage(errors.join("\n"));
    } else {
      setMessage("");
    }

    if (valid.length > 0) {
      setFiles((prev) => [...prev, ...valid]);
    }

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
      setToastMessage(
        anyReplaced
          ? `تم رفع ${files.length} ملف/ملفات — بعضها استبدل ملفات سابقة!`
          : `تم رفع ${files.length} ملف/ملفات بنجاح!`,
      );
      setShowToast(true);
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
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-2xl font-semibold text-slate-800">رفع ورقة</h1>
        <p className="mb-6 text-sm text-slate-500">
          أدخل بياناتك، اختر نوع الورقة، وارفع الملفات.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* الرقم   */}
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

          {/* اسم المعلم */}
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

          {/* نوع الورقة — fixed: size="1" removed, height auto, text wraps */}
          <div>
            <label
              htmlFor="sheetType"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              نوع الورقة
            </label>
            <select
              id="sheetType"
              value={sheetType}
              onChange={(e) => setSheetType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              style={{ height: "auto", whiteSpace: "normal" }}
            >
              {SHEET_TYPES.map((type) => (
                <option
                  key={type}
                  value={type}
                  style={{ whiteSpace: "normal" }}
                >
                  {type}
                </option>
              ))}
            </select>
            {/* Show the full selected value below the dropdown */}
            {sheetType && (
              <p className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 leading-relaxed">
                {sheetType}
              </p>
            )}
          </div>

          {/* منطقة رفع الملفات */}
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

          {/* قائمة الملفات المختارة */}
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

      {/* Toast */}
      <div
        className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
          showToast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5 text-green-400"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
          {toastMessage}
        </div>
      </div>
    </main>
  );
}
