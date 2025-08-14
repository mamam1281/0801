import React from "react";
import NotificationClient from "@/components/NotificationClient";

export default function NotificationsPage() {
  // Simple demo userId; in real app derive from auth context
  const userId = 1;
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl mb-4">Real-time Notifications Demo</h1>
      <p className="opacity-70 mb-8">This page opens a WebSocket to receive notifications for user {userId}.</p>
      <NotificationClient userId={userId} />
      <div className="mt-6 text-sm opacity-80">
        Use the backend endpoint to push a test message:
        <pre className="mt-2 bg-zinc-900 p-3 rounded border border-zinc-800">
          POST /ws/notify/{"{"}user_id{"}"}?message=hello
        </pre>
      </div>
    </main>
  );
}
