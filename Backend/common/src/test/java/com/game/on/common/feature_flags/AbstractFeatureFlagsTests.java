package com.game.on.common.feature_flags;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class AbstractFeatureFlagsTests {

    private static final String FILE_NAME = "TestFlags.json";
    private static final Path FEATURE_FLAG_FILE_PATH = Paths.get("feature-flags").resolve(FILE_NAME);

    private TestFeatureFlags flags;

    @BeforeEach
    public void setup() {
        flags = new TestFeatureFlags();

        removeTestFile();
    }

    @Test
    public void FlagIsDisabledByDefault() {
        Assertions.assertFalse(flags.isFlagEnabled(TestFlags.FLAG_ONE));
    }

    @Test
    public void FlagEnabledByDefault() {
        Assertions.assertTrue(flags.isFlagEnabled(TestFlags.ENABLED_BY_DEFAULT));
    }

    @Test
    public void CreatesDefaultFeatureFlagFile() {
        Assertions.assertFalse(Files.exists(FEATURE_FLAG_FILE_PATH));

        flags.initialize();

        Assertions.assertTrue(Files.exists(FEATURE_FLAG_FILE_PATH));

        String content = readCurrentFeatureFlagFile();

        Assertions.assertTrue(content.contains("ENABLED_BY_DEFAULT"));
        Assertions.assertTrue(content.contains("FLAG_ONE"));
    }

    @Test
    public void AddsMissingFeatureFlagsUponInitialization() {
        String testFileStr = "[ {\n" +
                "  \"key\" : \"FLAG_ONE\",\n" +
                "  \"enabled\" : false\n" +
                "} ]";

        writeTestFile(testFileStr);

        // Force re-initialization
        flags.initialize();

        String testFileContents = readCurrentFeatureFlagFile();

        Assertions.assertTrue(testFileContents.contains("ENABLED_BY_DEFAULT"));
    }

    @Test
    public void SkipsFeatureFlagsWithoutADescriptor() {
        String testFileStr = "[ {\n" +
                "  \"key\" : \"FLAG_ONE\",\n" +
                "  \"enabled\" : false\n" +
                "} ]";

        writeTestFile(testFileStr);

        // Force re-initialization
        flags.initialize();

        String testFileContents = readCurrentFeatureFlagFile();

        Assertions.assertTrue(testFileContents.contains("ENABLED_BY_DEFAULT"));
        Assertions.assertFalse(testFileContents.contains("MISSING_DESCRIPTOR"));
    }

    @Test
    public void PersistsFeatureFlags() {
        //Re-create the default file
        flags.initialize();

        Assertions.assertTrue(Files.exists(FEATURE_FLAG_FILE_PATH));

        boolean result = flags.setFlag(TestFlags.ENABLED_BY_DEFAULT, false);

        Assertions.assertTrue(result);

        flags.initialize();

        boolean resultAfterRefresh = flags.isFlagEnabled(TestFlags.ENABLED_BY_DEFAULT);

        Assertions.assertFalse(resultAfterRefresh);
    }

    @Test
    public void UpdateNonExistentFlagReturnsFalse() {

        //Without a descriptor, this value will never appear in the flags
        boolean result = flags.setFlag(TestFlags.MISSING_DESCRIPTOR, true);

        Assertions.assertFalse(result);
    }

    @Test
    public void GetNonExistentFlagReturnsFalse() {
        boolean res = flags.isFlagEnabled(TestFlags.MISSING_DESCRIPTOR);

        Assertions.assertFalse(res);
    }

    @FeatureFlagFile(FileName = FILE_NAME)
    private enum TestFlags implements FeatureFlagList<TestFlags> {

        @FeatureFlagDescriptor(Name = "Flag one")
        FLAG_ONE,

        @FeatureFlagDescriptor(Name = "Enabled by default", DefaultEnabled = true)
        ENABLED_BY_DEFAULT,

        MISSING_DESCRIPTOR;

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

    public void removeTestFile() {
        try {

            Files.deleteIfExists(FEATURE_FLAG_FILE_PATH);

        } catch (IOException e) {
            Assertions.fail("Unable to remove test file before test begins");
        }
    }

    public void writeTestFile(String content) {

        try {
            Files.write(FEATURE_FLAG_FILE_PATH, content.getBytes());
        } catch (IOException e) {
            Assertions.fail("Unable to write to test file as desired");
        }
    }

    public String readCurrentFeatureFlagFile() {
        try {
            return Files.readString(FEATURE_FLAG_FILE_PATH);
        } catch (IOException e) {
            Assertions.fail("Unable to read contents of test file");
            return "";
        }
    }
}


