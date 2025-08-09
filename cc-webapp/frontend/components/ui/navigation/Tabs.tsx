"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../utils";

function Tabs(props: any) {
  const { className, ...rest } = props || {};
  return <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} {...rest} />;
}

function TabsList(props: any) {
  const { className, ...rest } = props || {};
  return <TabsPrimitive.List className={cn("inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px]", className)} {...rest} />;
}

function TabsTrigger(props: any) {
  const { className, ...rest } = props || {};
  return <TabsPrimitive.Trigger className={cn("inline-flex flex-1 items-center justify-center rounded-xl px-2 py-1 text-sm font-medium", className)} {...rest} />;
}

function TabsContent(props: any) {
  const { className, ...rest } = props || {};
  return <TabsPrimitive.Content className={cn("flex-1 outline-none", className)} {...rest} />;
}

export default Tabs;
export { TabsList, TabsTrigger, TabsContent };
