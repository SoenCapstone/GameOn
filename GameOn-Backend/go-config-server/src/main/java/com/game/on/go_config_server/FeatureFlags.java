package com.game.on.go_config_server;

public interface FeatureFlags<T> {

    void initialize();

    boolean isFlagEnabled(T flag);

    boolean setFlag(T flag, boolean isEnabled);
}
