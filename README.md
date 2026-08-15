# Sheet Upload App (Next.js + Prisma + AWS S3)

A minimal Next.js (App Router) app where a teacher:
1. Enters their name
2. Picks a sheet type from a dropdown
3. Uploads a file
4. Clicks Submit → the file is uploaded to **AWS S3**, and the metadata
   (teacher name, sheet type, file name, S3 URL) is saved to the database
   via **Prisma**.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

- `DATABASE_URL` – connection string for your database (Postgres, MySQL, etc.)
  The schema defaults to `postgresql`; change the `provider` in
  `prisma/schema.prisma` if you use MySQL/SQLite/SQL Server.
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME` –
  credentials + bucket for an IAM user that has `s3:PutObject` permission on
  the target bucket.

## 3. Set up the database

```bash
npx prisma migrate dev --name init
```

This creates the `SheetUpload` table and generates the Prisma Client.

## 4. Run the app

```bash
npm run dev
```

Visit http://localhost:3000 — you'll see the upload form.

## How it works

- `app/page.tsx` — the index page/form (client component). On submit, it
  builds a `FormData` object (teacherName, sheetType, file) and POSTs it to
  `/api/upload`.
- `app/api/upload/route.ts` — the API route. It:
  1. Parses the incoming `multipart/form-data`.
  2. Validates the fields.
  3. Converts the uploaded file to a `Buffer`.
  4. Uploads the buffer to S3 (`lib/s3.ts`) using `@aws-sdk/client-s3`.
  5. Saves a `SheetUpload` record (teacher name, sheet type, file name, S3
     URL/key) to the database using Prisma (`lib/prisma.ts`).
  6. Returns the created record as JSON.
- `prisma/schema.prisma` — defines the `SheetUpload` model.

## Notes / things to double-check before production

- **Bucket permissions**: if you want uploaded files to be publicly
  readable via the returned URL, configure the bucket policy accordingly
  (avoid relying on object ACLs if your bucket has "Bucket owner enforced"
  ownership — that's why the `ACL: "public-read"` line in `lib/s3.ts` is
  commented out). Otherwise, generate signed URLs when you need to display
  files privately.
- **File size limits**: Next.js Route Handlers on the Node.js runtime don't
  impose a low default body-size limit like Server Actions do, but your
  hosting platform (e.g. Vercel) may cap request body size — check your
  host's docs if you expect large files.
- **Validation**: add file-type/size checks in `app/api/upload/route.ts` if
  you want to restrict which files teachers can upload (e.g. only
  `.xlsx`/`.csv`).
- **Auth**: this example has no authentication — add it if only logged-in
  teachers should be able to submit.
