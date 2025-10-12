package com.game.on.common.feature_flags;

public class FeatureFlagEntry {
    private String key;
    private boolean enabled;

    public String getKey() {
        return key;
    }

    public void setKey(String value) {
        key = value;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean value) {
        enabled = value;
    }
}
