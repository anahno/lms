// فایل: components/Footer.tsx
import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-slate-100 border-t mt-20">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-2">LMS پلتفرم</h3>
                        <p className="text-sm text-slate-600">
                            جامع‌ترین پلتفرم آموزشی آنلاین برای یادگیری مهارت‌های روز دنیا.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3">دسترسی سریع</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/courses" className="text-slate-600 hover:text-sky-600">کاتالوگ دوره‌ها</Link></li>
                            <li><Link href="/my-courses" className="text-slate-600 hover:text-sky-600">دوره‌های من</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3">پشتیبانی</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="text-slate-600 hover:text-sky-600">تماس با ما</Link></li>
                            <li><Link href="#" className="text-slate-600 hover:text-sky-600">سوالات متداول</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-3">همراه ما باشید</h4>
                        {/* Social media icons would go here */}
                    </div>
                </div>
                <div className="text-center text-sm text-slate-500 border-t pt-6 mt-8">
                    <p>© تمامی حقوق برای LMS پلتفرم محفوظ است.</p>
                </div>
            </div>
        </footer>
    );
};