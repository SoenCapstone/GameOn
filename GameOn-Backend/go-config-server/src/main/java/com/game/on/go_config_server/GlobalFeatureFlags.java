package com.game.on.go_config_server;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class GlobalFeatureFlags extends AbstractFeatureFlags<FFGlobal> {

    private static final Logger log = LoggerFactory.getLogger(GlobalFeatureFlags.class);

    public GlobalFeatureFlags() {
        super(FFGlobal.class);
    }

    public void Test() {
        log.warn("Global Feature Flags called");
    }

    @Override
    public boolean setFlag(FFGlobal flag, boolean isEnabled) {
        return false;
    }

    @Override
    public void save() {

    }
}
