import * as React from "react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const VerificationBadge = React.forwardRef<HTMLDivElement, VerificationBadgeProps>(
  ({ className, size = 20, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width={size}
        height={size}
        className="flex-shrink-0"
      >
        {/* Blue badge with 12 uniform spikes */}
        <path
          d="M60 0 L72 12 L90 10 L98 28 L116 32 L112 50 L120 60 L112 70 L116 88 L98 92 
             L90 110 L72 108 L60 120 L48 108 L30 110 L22 92 L4 88 L8 70 L0 60 L8 50 L4 32 
             L22 28 L30 10 L48 12 Z"
          fill="#1DA1F2"
        />
        
        {/* Black checkmark centered */}
        <path
          d="M48 65 L38 55 L32 61 L48 77 L88 37 L82 31 Z"
          fill="black"
        />
      </svg>
    </div>
  )
);

VerificationBadge.displayName = "VerificationBadge";

export { VerificationBadge };