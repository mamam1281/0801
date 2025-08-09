"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../utils";

const Tabs = React.forwardRef<any, any>((props, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    data-slot="tabs"
    className={cn("flex flex-col gap-2", (props as any)?.className)}
    {...props}
  />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<any, any>((props, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-slot="tabs-list"
    className={cn(
      "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px]",
      (props as any)?.className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<any, any>(({ value, ...rest }: any, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      (rest as any)?.className,
    )}
    value={value ?? "__implicit__"}
    {...rest}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<any, any>(({ value, ...rest }: any, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    data-slot="tabs-content"
  className={cn("flex-1 outline-none", (rest as any)?.className)}
  value={value ?? "__implicit__"}
  {...rest}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
