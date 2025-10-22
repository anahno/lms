// فایل: app/courses/_components/CoursePlayerPage.tsx
"use client";

import { useState } from "react";
import type { LearningPath, Section, UserProgress } from "@prisma/client";
import { CheckCircle } from "lucide-react";
import { CourseProgressButton } from "../_components/CourseProgressButton";
import { DiscussionSection } from "./DiscussionSection";
import { InlineRating } from "./InlineRating";

type EnrichedLearningPath = Pick<
  LearningPath,
  'id' | 'title' | 'subtitle' | 'description' | 'whatYouWillLearn' | 'requirements'
>;

type EnrichedSection = Section & {
  progress: UserProgress[] | null;
};

interface CoursePlayerPageProps {
  learningPath: EnrichedLearningPath;
  section: EnrichedSection;
  nextSectionId?: string;
  isCompleted: boolean;
}

export function CoursePlayerPage({
  learningPath,
  section,
  nextSectionId,
  isCompleted,
}: CoursePlayerPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const initialRating = section.progress?.[0]?.rating ?? null;

  return (
    <div className="bg-white flex flex-col h-full">
      <div className="bg-black">
        <div className="relative aspect-video">
          {section.videoUrl ? (
            <video
              key={section.id}
              src={section.videoUrl}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full bg-slate-900"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white bg-slate-800">
              ویدیویی برای این بخش وجود ندارد.
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center px-6">
            {/* بخش تب‌ها */}
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 font-medium text-sm relative transition-colors ${
                  activeTab === "overview"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Overview
                {activeTab === "overview" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("qna")}
                className={`py-4 font-medium text-sm relative transition-colors ${
                  activeTab === "qna"
                    ? "text-gray-900"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                پرسش و پاسخ
                {activeTab === "qna" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                )}
              </button>
            </div>
            
            {/* بخش امتیازدهی (فقط در تب Overview نمایش داده می‌شود) */}
            {activeTab === "overview" && (
              <InlineRating 
                sectionId={section.id}
                learningPathId={learningPath.id}
                initialRating={initialRating}
                isCompleted={isCompleted}
              />
            )}
          </div>
        </div>

        <div className="p-6 max-w-4xl mx-auto">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <h1 className="text-3xl font-bold">{learningPath.title}</h1>
              {learningPath.subtitle && (
                <p className="text-lg text-gray-600">{learningPath.subtitle}</p>
              )}

              <section>
                <h2 className="text-2xl font-bold mb-4">آنچه خواهید آموخت</h2>
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
                  {(learningPath.whatYouWillLearn || []).map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">توضیحات این بخش</h2>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.description || "" }}
                />
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">پیش‌نیازها</h2>
                <ul className="space-y-2 list-disc pr-5">
                  {(learningPath.requirements || []).map((item, i) => (
                    <li key={i} className="text-gray-700 text-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
          {activeTab === "qna" && (
            <DiscussionSection sectionId={section.id} />
          )}
        </div>
      </div>

      <div className="mt-auto border-t p-4 bg-white sticky bottom-0">
        <CourseProgressButton
          sectionId={section.id}
          learningPathId={learningPath.id}
          nextSectionId={nextSectionId}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
}