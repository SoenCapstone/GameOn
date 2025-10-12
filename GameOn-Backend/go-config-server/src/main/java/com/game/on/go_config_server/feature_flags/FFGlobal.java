package com.game.on.go_config_server.feature_flags;

import com.game.on.common.feature_flags.FeatureFlagDescriptor;
import com.game.on.common.feature_flags.FeatureFlagFile;
import com.game.on.common.feature_flags.FeatureFlagList;

@FeatureFlagFile(FileName = "Global.json")
public enum FFGlobal implements FeatureFlagList {

    @FeatureFlagDescriptor(Name = "Test flag")
    TEST_FLAG,

    @FeatureFlagDescriptor(Name = "Another test flag")
    SECOND_FLAG;

    @Override
    public String serialize() {
        return "";
    }
}