// فایل: app/courses/_components/DiscussionSection.tsx
"use client";

import { useState, useEffect, useTransition } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { getDiscussionsForSection, postQuestionOrReply, DiscussionWithReplies } from "@/actions/discussion-actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Role } from "@prisma/client";

interface DiscussionSectionProps {
  sectionId: string;
}

// کامپوننت برای نمایش یک نظر/سوال
const CommentCard = ({ comment, onReply }: { comment: DiscussionWithReplies; onReply: (parentId: string) => void; }) => {
  const isInstructor = comment.user.role === Role.INSTRUCTOR || comment.user.role === Role.ADMIN;
  
  return (
    <div className="flex items-start gap-x-3">
      <Image
        src={comment.user.image || "/images/default-avatar.png"}
        alt={comment.user.name || ""}
        width={40}
        height={40}
        className="rounded-full mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-x-2">
          <p className={`font-bold text-sm ${isInstructor ? "text-sky-700" : "text-slate-800"}`}>
            {comment.user.name}
            {isInstructor && <span className="text-xs font-normal text-white bg-sky-600 px-2 py-0.5 rounded-md ml-2">استاد</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString("fa-IR")}
          </p>
        </div>
        <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
        <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onReply(comment.id)}>
          پاسخ
        </Button>
      </div>
    </div>
  );
};

export const DiscussionSection = ({ sectionId }: DiscussionSectionProps) => {
  const { data: session } = useSession();
  const [discussions, setDiscussions] = useState<DiscussionWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchDiscussions = async () => {
      setIsLoading(true);
      const data = await getDiscussionsForSection(sectionId);
      setDiscussions(data);
      setIsLoading(false);
    };
    fetchDiscussions();
  }, [sectionId]);

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await postQuestionOrReply(newComment, sectionId, replyingTo);
      if (result.success) {
        toast.success(result.success);
        setNewComment("");
        setReplyingTo(null);
        // Refresh data
        const data = await getDiscussionsForSection(sectionId);
        setDiscussions(data);
      } else {
        toast.error(result.error || "خطا");
      }
    });
  };

  const startReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Focus the textarea (optional but good UX)
    document.getElementById("comment-textarea")?.focus();
  };

  if (isLoading) {
    return <div>در حال بارگذاری گفتگوها...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">پرسش و پاسخ</h2>
      
      {/* فرم ارسال نظر/سوال */}
      {session?.user && (
        <div className="border rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold mb-2">
            {replyingTo ? "ارسال پاسخ" : "سوال جدیدی دارید؟"}
          </h3>
          <Textarea
            id="comment-textarea"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="سوال یا نظر خود را اینجا بنویسید..."
            disabled={isPending}
          />
          <div className="flex items-center justify-end gap-2 mt-2">
              {replyingTo && (
                <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setNewComment(""); }}>
                    لغو پاسخ
                </Button>
              )}
            <Button onClick={handleSubmit} disabled={isPending || !newComment.trim()}>
              {isPending ? "در حال ارسال..." : "ارسال"}
            </Button>
          </div>
        </div>
      )}

      {/* لیست گفتگوها */}
      <div className="space-y-4">
        {discussions.length > 0 ? (
          discussions.map(comment => (
            <div key={comment.id} className="p-4 border-b">
              <CommentCard comment={comment} onReply={startReply} />
              
              {/* نمایش پاسخ‌ها */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 pr-8 border-r-2 border-slate-200 space-y-4">
                  {comment.replies.map(reply => (
                                       <CommentCard key={reply.id} comment={reply as unknown as DiscussionWithReplies} onReply={startReply} />

                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">هنوز هیچ سوالی برای این بخش ثبت نشده است. اولین نفر باشید!</p>
        )}
      </div>
    </div>
  );
};