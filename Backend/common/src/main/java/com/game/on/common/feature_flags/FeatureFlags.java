package com.game.on.common.feature_flags;

public interface FeatureFlags<T> {

    /**
     * Initializes the set of feature flags. If you inherit this method, then you should call the base implementation for persistence
     */
    void initialize();

    /**
     * Check if a feature flag is enabled
     * @param flag The flag to check
     * @return True if the flag is enabled, false otherwise
     */
    boolean isFlagEnabled(T flag);

    /**
     * Sets a feature flag to enabled or disabled
     * @param flag The flag to change
     * @param isEnabled Whether to enabled or disable the flag
     * @return true if enabled, false otherwise
     */
    boolean setFlag(T flag, boolean isEnabled);
}
