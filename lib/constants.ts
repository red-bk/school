export const SHEET_TYPES = [
  "كشف الحضور",
  "كشف الدرجات",
  "كشف الامتحان",
  "كشف الواجبات",
  "خطة الدرس",
  "أخرى",
] as const;

// الحد الأقصى لحجم الملف: 5 جيجابايت
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;

// بادئات أنواع الملفات الممنوعة (يمنع رفع أي ملف فيديو)
export const BLOCKED_MIME_PREFIXES = ["video/"];

/**
 * يتحقق من صحة الملف قبل الرفع (الحجم والنوع).
 * يُستخدم في الواجهة الأمامية وفي مسارات الـ API على حد سواء.
 * يعيد رسالة خطأ بالعربية إن وُجدت مشكلة، أو null إذا كان الملف صالحًا.
 */
export function validateFile(file: {
  size: number;
  type: string;
}): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "حجم الملف يتجاوز الحد الأقصى المسموح به (5 جيجابايت).";
  }

  if (BLOCKED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
    return "لا يُسمح برفع ملفات الفيديو.";
  }

  return null;
}
