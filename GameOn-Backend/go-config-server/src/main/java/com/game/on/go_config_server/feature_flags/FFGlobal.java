package com.game.on.go_config_server.feature_flags;

import com.game.on.common.feature_flags.FeatureFlagDescriptor;
import com.game.on.common.feature_flags.FeatureFlagFile;
import com.game.on.common.feature_flags.FeatureFlagList;

@FeatureFlagFile(FileName = "Global.json")
public enum FFGlobal implements FeatureFlagList<FFGlobal> {

    @FeatureFlagDescriptor(Name = "Test flag")
    TEST_FLAG,

    @FeatureFlagDescriptor(Name = "Another test flag")
    SECOND_FLAG,

    @FeatureFlagDescriptor(Name = "Another feature flag", DefaultEnabled = true)
    FLAG_THREE;

    @Override
    public Class<FFGlobal> getEnumClass() {
        return FFGlobal.class;
    }
}