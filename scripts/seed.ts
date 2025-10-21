// فایل: scripts/seed.ts

// از Prisma Client برای تعامل با دیتابیس استفاده می‌کنیم
const { PrismaClient } = require("@prisma/client");

// یک نمونه از کلاینت پریزما می‌سازیم
const db = new PrismaClient();

// تابع اصلی که عملیات seed را انجام می‌دهد
async function main() {
  try {
    // --- ۱. دسته‌بندی‌های اصلی (والد) ---
    const programming = await db.category.create({
      data: { name: "برنامه‌نویسی و توسعه وب" },
    });
    const graphics = await db.category.create({
      data: { name: "گرافیک و طراحی" },
    });
    const software = await db.category.create({
      data: { name: "نرم‌افزارهای کاربردی" },
    });
    
    console.log("دسته‌بندی‌های اصلی با موفقیت ایجاد شدند.");

    // --- ۲. زیرمجموعه‌های برنامه‌نویسی ---
    await db.category.createMany({
      data: [
        { name: "توسعه فرانت‌اند (Front-end)", parentId: programming.id },
        { name: "توسعه بک‌اند (Back-end)", parentId: programming.id },
        { name: "پایتون (Python)", parentId: programming.id },
        { name: "جاوا اسکریپت (JavaScript)", parentId: programming.id },
        { name: "هوش مصنوعی و یادگیری ماشین", parentId: programming.id },
      ],
    });
    console.log("زیرمجموعه‌های برنامه‌نویسی ایجاد شدند.");

    // --- ۳. زیرمجموعه‌های گرافیک و طراحی ---
    await db.category.createMany({
      data: [
        { name: "فتوشاپ (Photoshop)", parentId: graphics.id },
        { name: "ایلاستریتور (Illustrator)", parentId: graphics.id },
        { name: "طراحی رابط کاربری (UI Design)", parentId: graphics.id },
        { name: "طراحی تجربه کاربری (UX Design)", parentId: graphics.id },
        { name: "فیگما (Figma)", parentId: graphics.id },
      ],
    });
    console.log("زیرمجموعه‌های گرافیک ایجاد شدند.");
    
    // --- ۴. زیرمجموعه‌های نرم‌افزار ---
    await db.category.createMany({
      data: [
        { name: "مجموعه آفیس (Microsoft Office)", parentId: software.id },
        { name: "اکسل (Excel)", parentId: software.id },
        { name: "مهارت‌های ICDL", parentId: software.id },
      ],
    });
    console.log("زیرمجموعه‌های نرم‌افزار ایجاد شدند.");
 // +++ شروع کد جدید برای ایجاد نشان‌ها +++
    await db.badge.createMany({
      data: [
        {
          name: "دانشجوی تازه‌وارد",
          description: "برای ثبت‌نام در اولین دوره خود",
          imageUrl: "/badges/first-enrollment.png", // <--- تغییر به .png
        },
        {
          name: "شروع قدرتمند",
          description: "برای تکمیل اولین درس خود",
          imageUrl: "/badges/first-section.png", // <--- تغییر به .png
        },
        {
          name: "کنجکاو",
          description: "برای پرسیدن اولین سوال خود",
          imageUrl: "/badges/first-question.png", // <--- تغییر به .png
        },
        {
          name: "کوشا",
          description: "برای تکمیل ۱۰ درس",
          imageUrl: "/badges/ten-sections.png", // <--- تغییر به .png
        },
        {
          name: "فارغ‌التحصیل",
          description: "برای تکمیل اولین دوره خود به طور کامل",
          imageUrl: "/badges/first-course.png", // <--- تغییر به .png
        },
      ],
      skipDuplicates: true,
    });
    console.log("نشان‌های اولیه با موفقیت ایجاد شدند.");
    // +++ پایان کد جدید +++
    console.log("عملیات Seed با موفقیت به پایان رسید.");

  } catch (error) {
    console.error("خطا در هنگام اجرای Seed:", error);
  } finally {
    // در نهایت، اتصال به دیتابیس را قطع می‌کنیم
    await db.$disconnect();
  }
}

// تابع اصلی را فراخوانی می‌کنیم
main();