package com.game.on.common.feature_flags;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
public @interface FeatureFlagDescriptor {
    String Name();
    boolean DefaultEnabled() default false;
}
