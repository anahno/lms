// فایل: app/(public)/my-account/_components/GamificationCard.tsx
"use client";

import Image from "next/image";
import { Prisma } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // اطمینان از import صحیح
import { getLevelFromXP, getXPForLevel } from "@/lib/gamification-rules";

type UserWithGamification = Prisma.UserGetPayload<{
  include: {
    badges: {
      include: {
        badge: true;
      };
    };
  };
}>;

interface GamificationCardProps {
  user: UserWithGamification;
}

export const GamificationCard = ({ user }: GamificationCardProps) => {
  const currentLevel = getLevelFromXP(user.experiencePoints);
  const xpForCurrentLevel = getXPForLevel(currentLevel);
  const xpForNextLevel = getXPForLevel(currentLevel + 1);

  const xpInCurrentLevel = user.experiencePoints - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage =
    xpNeededForNextLevel > 0
      ? (xpInCurrentLevel / xpNeededForNextLevel) * 100
      : 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>آمار و دستاوردها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* بخش سطح و امتیاز */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sky-600">سطح {currentLevel}</span>
            <span className="text-sm text-muted-foreground">
              {user.experiencePoints.toLocaleString("fa-IR")} امتیاز کل
            </span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress value={progressPercentage} />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {(xpForNextLevel - user.experiencePoints).toLocaleString(
                    "fa-IR"
                  )}{" "}
                  امتیاز تا سطح بعدی
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* بخش نشان‌ها */}
        <div>
          <h4 className="font-semibold mb-3">نشان‌های شما</h4>
          {user.badges.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {user.badges.map(({ badge }) => (
                <TooltipProvider key={badge.id}>
                  <Tooltip>
                    <TooltipTrigger>
                      {/* +++ شروع تغییر برای PNG +++ */}
                      {/* به جای div و fill، مستقیماً از width و height استفاده می‌کنیم */}
                      <Image
                        src={badge.imageUrl}
                        alt={badge.name}
                        width={64} // اندازه دلخواه (مثلاً 64 پیکسل)
                        height={64} // اندازه دلخواه
                        className="object-contain"
                      />
                      {/* +++ پایان تغییر برای PNG +++ */}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">{badge.name}</p>
                      <p className="text-xs">{badge.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              هنوز هیچ نشانی کسب نکرده‌اید. با تکمیل دوره‌ها، نشان‌های جدیدی
              دریافت خواهید کرد!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};