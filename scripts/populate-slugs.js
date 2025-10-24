// فایل: scripts/populate-slugs.js

const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

// همان تابعی که در API استفاده کردیم
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '');
}

async function main() {
  try {
    // ۱. تمام دوره‌هایی که هنوز اسلاگ ندارند را پیدا کن
    const coursesToUpdate = await db.learningPath.findMany({
      where: {
        slug: null,
      },
    });

    if (coursesToUpdate.length === 0) {
      console.log("همه دوره‌ها از قبل اسلاگ دارند. نیازی به به‌روزرسانی نیست.");
      return;
    }

    console.log(`تعداد ${coursesToUpdate.length} دوره برای به‌روزرسانی اسلاگ یافت شد...`);

    // ۲. برای هر دوره، یک اسلاگ بساز و آن را آپدیت کن
    for (const course of coursesToUpdate) {
      let slug = generateSlug(course.title);

      // برای جلوگیری از خطای تکراری، یک عدد تصادفی اضافه می‌کنیم
      const existing = await db.learningPath.findUnique({ where: { slug } });
      if (existing) {
        slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
      }

      await db.learningPath.update({
        where: { id: course.id },
        data: { slug },
      });
      console.log(`اسلاگ دوره "${course.title}" به "${slug}" به‌روز شد.`);
    }

    console.log("عملیات پر کردن اسلاگ‌ها با موفقیت به پایان رسید.");

  } catch (error) {
    console.error("خطا در هنگام پر کردن اسلاگ‌ها:", error);
  } finally {
    await db.$disconnect();
  }
}

main();