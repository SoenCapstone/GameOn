package com.game.on.go_config_server.feature_flags;

import com.game.on.common.feature_flags.AbstractFeatureFlags;
import org.springframework.stereotype.Component;

@Component
public class GlobalFeatureFlags extends AbstractFeatureFlags<FFGlobal> {

    public GlobalFeatureFlags() {
        super(FFGlobal.class);
    }
}
