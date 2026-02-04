import { Button } from "@base-ui/react/button";
import type { ComponentProps } from "react";

type PrimaryButtonProps = ComponentProps<typeof Button> & {
  variant?: "primary" | "secondary" | "outline";
};

export const PrimaryButton = ({
  variant = "primary",
  type,
  render,
  children,
  ...props
}: PrimaryButtonProps) => {
  const mobileTouchArea =
    "before:content-[''] before:absolute before:-inset-3 before:-left-10 pointer-fine:before:hidden";

  const variantClasses = {
    primary: "bg-kiln-600 text-white active:bg-kiln-500",
    secondary: "bg-white text-ink-900 border border-cream-200 active:bg-cream-200",
    outline: "bg-white text-ink-900 border border-cream-200 active:bg-cream-200",
  };

  return (
    <Button
      className={`
        w-full h-14 rounded-xl flex items-center justify-center gap-3 
        text-base font-semibold cursor-pointer relative
        ${variantClasses[variant]}
        ${mobileTouchArea}
      `}
      render={render}
      {...props}
    >
      {children}
    </Button>
  );
};
