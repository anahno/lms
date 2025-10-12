// فایل: components/sidebar.tsx

export default function Sidebar() {
  return (
    <div className="hidden border-l md:flex md:flex-col md:w-64 bg-gray-50">
      <div className="flex items-center h-16 px-6 border-b">
        <h1 className="text-lg font-bold">LMS پلتفرم</h1>
      </div>
      <div className="flex-1 p-4">
        {/* لینک‌های ناوبری اینجا قرار می‌گیرند */}
        <p>لینک‌های منو</p>
      </div>
    </div>
  );
}