package com.game.on.common.feature_flags;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class AbstractFeatureFlagsTests {

    private TestFeatureFlags flags;

    @BeforeEach
    public void setup() {
        flags = new TestFeatureFlags();
    }

    @Test
    public void FlagIsDisabledByDefault() {
        Assertions.assertFalse(flags.isFlagEnabled(TestFlags.FLAG_ONE));
    }

    @Test
    public void FlagEnabledByDefault() {
        Assertions.assertTrue(flags.isFlagEnabled(TestFlags.ENABLED_BY_DEFAULT));
    }

    @FeatureFlagFile(FileName = "TestFlags.json")
    private enum TestFlags implements FeatureFlagList<TestFlags> {

        @FeatureFlagDescriptor(Name = "Flag one")
        FLAG_ONE,

        @FeatureFlagDescriptor(Name = "Enabled by default", DefaultEnabled = true)
        ENABLED_BY_DEFAULT;

        @Override
        public Class<TestFlags> getEnumClass() {
            return TestFlags.class;
        }
    }

    private class TestFeatureFlags extends AbstractFeatureFlags<TestFlags> {

        public TestFeatureFlags() {
            super(TestFlags.class);
        }
    }
}


