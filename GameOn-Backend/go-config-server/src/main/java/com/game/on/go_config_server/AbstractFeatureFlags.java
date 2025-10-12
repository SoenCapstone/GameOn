package com.game.on.go_config_server;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.EnumMap;

public abstract class AbstractFeatureFlags<T extends Enum<T>> implements FeatureFlags<T> {

    private static final Logger log = LoggerFactory.getLogger(AbstractFeatureFlags.class);
    final Class<T> typeParameterClass;

    protected EnumMap<T, Boolean> values;

    public AbstractFeatureFlags(Class<T> typeClass) {
        this.typeParameterClass = typeClass;
        values = new EnumMap<>(typeClass);
        initialize();
    }

    public void initialize() {
        FeatureFlagFile fileAnnotation = typeParameterClass.getAnnotation(FeatureFlagFile.class);

        //TODO: Different error handling? This means the feature flag map is not populated, thus returning false for all challenges in the future...
        if(fileAnnotation == null) {
            log.error("Feature flag enum is missing FeatureFlagFile annotation");
            return;
        }
    }

    @Override
    public boolean isFlagEnabled(T flag) {
        return values.containsKey(flag) && values.get(flag);
    }

    @Override
    public boolean setFlag(T flag, boolean isEnabled) {
        if(values.containsKey(flag)) {
            values.put(flag, isEnabled);
            return true;
        }

        return false;
    }
}
