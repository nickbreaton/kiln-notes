import { Button } from "@base-ui/react/button";
import type { ComponentProps } from "react";

type IconButtonProps = ComponentProps<typeof Button> & {
  size?: "sm" | "md";
};

const sizeClasses: Record<NonNullable<IconButtonProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
};

export const IconButton = ({
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) => {
  return (
    <Button
      type={type}
      className={`flex items-center justify-center rounded-full bg-cream-50 text-ink-500  active:bg-cream-200 active:text-ink-900 focus-visible:outline-2 focus-visible:outline-ink-900/60 data-disabled:bg-cream-100 data-disabled:text-ink-400 cursor-pointer ${
        sizeClasses[size]
      } ${className ?? ""}`}
      {...props}
    />
  );
};
