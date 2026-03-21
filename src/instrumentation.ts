export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeRealtimeServer } = await import(
      "@/lib/realtime/init"
    );
    await initializeRealtimeServer();

    try {
      const { startWorkers } = await import("@/lib/queue/worker-manager");
      const { scheduleRecurringJobs } = await import("@/lib/queue/scheduler");
      startWorkers();
      await scheduleRecurringJobs();
    } catch (err) {
      console.warn("[Instrumentation] Failed to start background workers:", err);
    }
  }
}
