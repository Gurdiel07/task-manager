export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeRealtimeServer } = await import(
      "@/lib/realtime/init"
    );
    await initializeRealtimeServer();

    try {
      const { startScheduler } = await import("@/lib/jobs/scheduler");
      startScheduler();
    } catch (err) {
      console.warn("[Instrumentation] Failed to start background scheduler:", err);
    }
  }
}
