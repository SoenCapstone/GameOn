package com.game.on.go_messaging_service.auth;

public final class CallerContextHolder {

    private static final ThreadLocal<CallerContext> CONTEXT = new ThreadLocal<>();

    private CallerContextHolder() {
    }

    public static void set(CallerContext context) {
        CONTEXT.set(context);
    }

    public static CallerContext get() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
