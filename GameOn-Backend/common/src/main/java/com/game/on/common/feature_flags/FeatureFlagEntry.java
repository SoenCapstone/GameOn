package com.game.on.common.feature_flags;

public class FeatureFlagEntry<T extends Enum<T>> {
    private T key;
    private boolean enabled;

    public T getKey() {
        return key;
    }

    public void setKey(T value) {
        key = value;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean value) {
        enabled = value;
    }
}
