package com.game.on.go_user_service.feature_flags;

import com.game.on.common.feature_flags.AbstractFeatureFlags;
import org.springframework.stereotype.Component;

@Component
public class UserServiceFeatureFlags extends AbstractFeatureFlags<FFUserService> {

    public UserServiceFeatureFlags() {
        super(FFUserService.class);
    }
}
