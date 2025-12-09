package com.game.on.common.feature_flags;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
public @interface FeatureFlagFile {
    String FileName();
}
