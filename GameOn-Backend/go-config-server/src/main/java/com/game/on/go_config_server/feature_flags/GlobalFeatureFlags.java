package com.game.on.go_config_server.feature_flags;

import com.game.on.common.feature_flags.AbstractFeatureFlags;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class GlobalFeatureFlags extends AbstractFeatureFlags<FFGlobal> {

    private static final Logger log = LoggerFactory.getLogger(GlobalFeatureFlags.class);

    public GlobalFeatureFlags() {
        super(FFGlobal.class);
    }
}
