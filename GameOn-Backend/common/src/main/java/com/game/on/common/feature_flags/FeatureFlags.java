package com.game.on.common.feature_flags;

public interface FeatureFlags<T> {

    void initialize();

    boolean isFlagEnabled(T flag);

    boolean setFlag(T flag, boolean isEnabled);
}
