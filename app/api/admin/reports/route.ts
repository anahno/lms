// فایل: app/api/admin/reports/route.ts
"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { generateCsvReport, ReportType } from "@/actions/generate-report";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as { role: Role }).role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { reportType } = body as { reportType: ReportType };

    if (!reportType) {
      return new NextResponse("Report type is required", { status: 400 });
    }

    const csvData = await generateCsvReport(reportType);

    // ارسال پاسخ با هدرهای مناسب برای دانلود فایل
    // هدر charset=utf-8 به همراه BOM یک راه‌حل بسیار قوی است
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${reportType}_report.csv"`,
      },
    });

  } catch (error) {
    console.error("[REPORTS_API_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}