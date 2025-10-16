// فایل: app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const s3Client = new S3Client({
  region: process.env.ARVAN_S3_REGION!,
  endpoint: process.env.ARVAN_S3_ENDPOINT_URL!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.ARVAN_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.ARVAN_S3_SECRET_ACCESS_KEY!,
  },
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new NextResponse("File not found", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    const command = new PutObjectCommand({
      Bucket: process.env.ARVAN_S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    });

    // --- بلوک try...catch جدید برای تشخیص دقیق خطا ---
    try {
      await s3Client.send(command);
    } catch (s3Error) {
      console.error("S3 Upload Error:", s3Error);
      // یک پیام خطای مشخص برمی‌گردانیم
      return new NextResponse("Failed to upload to ArvanCloud", { status: 500 });
    }
    // --- پایان بلوک ---

    const fileUrl = `${process.env.ARVAN_S3_ENDPOINT_URL}/${process.env.ARVAN_S3_BUCKET_NAME}/${fileName}`;

    return NextResponse.json({ url: fileUrl });

  } catch (error) {
    console.error("[GENERAL_FILE_UPLOAD_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}