export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startModerationScheduler } = await import(
      "@/lib/moderation-scheduler"
    );

    startModerationScheduler();
  }
}
