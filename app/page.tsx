"use client";

import { useState, FormEvent, useEffect } from "react";
import { SHEET_TYPES } from "@/lib/constants";

type SubmitState = "idle" | "loading" | "success" | "error";

export default function HomePage() {
  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [sheetType, setSheetType] = useState(SHEET_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  // إخفاء رسالة النجاح تلقائيًا بعد 5 ثوانٍ
  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!teacherId.trim()) {
      setMessage("الرجاء إدخال الرقم التعريفي للمعلم.");
      return;
    }
    if (!teacherName.trim()) {
      setMessage("الرجاء إدخال اسم المعلم.");
      return;
    }
    if (!file) {
      setMessage("الرجاء اختيار ملف لرفعه.");
      return;
    }

    const formData = new FormData();
    formData.append("teacherId", teacherId.trim());
    formData.append("teacherName", teacherName.trim());
    formData.append("sheetType", sheetType);
    formData.append("file", file);

    try {
      setStatus("loading");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "فشل الرفع");
      }

      setStatus("success");
      setMessage("");
      setShowToast(true);
      setTeacherId("");
      setTeacherName("");
      setSheetType(SHEET_TYPES[0]);
      setFile(null);
      // إعادة تعيين حقل اختيار الملف
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "حدث خطأ ما. الرجاء المحاولة مرة أخرى.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-2xl font-semibold text-slate-800">
          رفع ورقة
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          أدخل بياناتك، اختر نوع الورقة، وارفع الملف.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* الرقم التعريفي للمعلم */}
          <div>
            <label
              htmlFor="teacherId"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              الرقم التعريفي للمعلم
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

          {/* نوع الورقة */}
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
            >
              {SHEET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* الملف */}
          <div>
            <label
              htmlFor="file-input"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              الملف
            </label>
            <input
              id="file-input"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none file:ms-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "جاري الرفع..." : "إرسال"}
          </button>

          {message && status === "error" && (
            <p className="text-sm text-red-600">{message}</p>
          )}
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          تحتاج إلى استبدال ملف رفعته سابقًا؟{" "}
          <a href="/update" className="font-medium text-slate-800 underline">
            حدّثه من هنا
          </a>
        </p>
      </div>

      {/* رسالة نجاح مؤقتة (Toast) */}
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
          تم رفع الملف بنجاح!
        </div>
      </div>
    </main>
  );
}
