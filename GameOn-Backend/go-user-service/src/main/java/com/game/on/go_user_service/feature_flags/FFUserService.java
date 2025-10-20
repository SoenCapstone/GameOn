package com.game.on.go_user_service.feature_flags;

import com.game.on.common.feature_flags.FeatureFlagDescriptor;
import com.game.on.common.feature_flags.FeatureFlagFile;
import com.game.on.common.feature_flags.FeatureFlagList;

@FeatureFlagFile(FileName = "UserService.json")
public enum FFUserService implements FeatureFlagList<FFUserService> {

    @FeatureFlagDescriptor(Name = "User service base flag", DefaultEnabled = true)
    USER_SERVICE_BASE;

    @Override
    public Class<FFUserService> getEnumClass() {
        return FFUserService.class;
    }
}
