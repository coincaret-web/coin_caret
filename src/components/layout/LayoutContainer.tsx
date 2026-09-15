import React from "react";
import { cn } from "@/lib/utils";

interface LayoutContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: React.ElementType;
  clean?: boolean;
}

export const LayoutContainer: React.FC<LayoutContainerProps> = ({
  children,
  className,
  as: Component = "div",
  clean = false,
  ...props
}) => {
  return (
    <Component
      className={cn(
        "w-full mx-auto",
        clean ? "" : "px-4 sm:px-6 md:px-8 lg:px-[15%]",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
