// فایل: components/ui/rating.tsx
"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number;
  totalStars?: number;
  size?: number;
  fill?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const Rating = ({
  rating,
  totalStars = 5,
  size = 20,
  fill = true,
  onRatingChange,
  ...props
}: RatingProps) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    if (!onRatingChange) return;
    setHoverRating(index + 1);
  };

  const handleMouseLeave = () => {
    if (!onRatingChange) return;
    setHoverRating(null);
  };

  const handleClick = (index: number) => {
    if (!onRatingChange) return;
    onRatingChange(index + 1);
  };

  const fullStars = Math.floor(hoverRating ?? rating);
  const partialStar = (hoverRating ?? rating) - fullStars;

  return (
    <div
      className={cn("flex items-center gap-1", onRatingChange && "cursor-pointer")}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        const isFull = starValue <= fullStars;
        
        return (
          <div
            key={index}
            className="relative"
            onMouseEnter={() => handleMouseEnter(index)}
            onClick={() => handleClick(index)}
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                isFull ? "text-amber-400" : "text-gray-300"
              )}
              fill={isFull && fill ? "currentColor" : "none"}
            />
          </div>
        );
      })}
    </div>
  );
};