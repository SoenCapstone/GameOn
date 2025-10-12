package com.game.on.common.feature_flags;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.EnumMap;
import java.util.List;

public abstract class AbstractFeatureFlags<T extends Enum<T>> implements FeatureFlags<T> {

    private static final Logger log = LoggerFactory.getLogger(AbstractFeatureFlags.class);
    private final Class<T> enumClass;
    private Path filePath;

    protected EnumMap<T, FeatureFlagEntry<T>> values;

    public AbstractFeatureFlags(Class<T> typeClass) {
        this.enumClass = typeClass;
        values = new EnumMap<>(typeClass);
        initialize();
    }

    public void initialize() {
        FeatureFlagFile fileAnnotation = enumClass.getAnnotation(FeatureFlagFile.class);

        //TODO: Different error handling? This means the feature flag map is not populated, thus returning false for all challenges in the future...
        if(fileAnnotation == null) {
            log.error("Feature flag enum is missing com.game.on.common.feature_flags.FeatureFlagFile annotation");
            return;
        }

        Path dirPath = Paths.get("feature-flags");
        log.info("Searching for feature flags in: {}", dirPath);
        if(!Files.exists(dirPath) || !Files.isDirectory(dirPath)) {
            try {
                Files.createDirectory(dirPath);
            } catch (IOException e) {
                log.error("Unable to create feature flag directory", e);
                return;
            }
        }

        String fileName = fileAnnotation.FileName();

        if(!fileName.endsWith(".json")) {
            log.warn("Missing or invalid file format. Appending .json to {}", fileName);
            fileName += ".json";
        }
        filePath = Paths.get("feature-flags\\" + fileName);
        if(Files.exists(filePath)) {
            readExistingFile();
        }
        else {
            createDefaultFile();
        }
    }

    private void readExistingFile() {
        log.info("Reading feature flag configuration from path: {}", filePath);

        try {
            FileReader fr = new FileReader(filePath.toString());
            BufferedReader br = new BufferedReader(fr);
            ObjectMapper mapper = new ObjectMapper();
            SimpleModule module = new SimpleModule();

            module.addDeserializer(FeatureFlagEntry.class, new FeatureFlagEntryDeserializer());
            mapper.registerModule(module);

            // When we serialize, we just serialize the entries, which means we have to construct the list ourselves...
            var test = mapper.readValue(br, FeatureFlagEntry.class);

            log.info("TEST: {}:{}", test.getKey(), test.isEnabled());

            //TODO: Reminder to check when deserializing that there are no missing flags...
        }
        catch (FileNotFoundException e) {
            log.error("Feature flag file not found", e);
        } catch (Exception e) {
            //TODO: This is handling several different types of exceptions associated with readValue, rewrite needed for clarity
            log.error("Exception while reading data from file", e);
        }
    }

    private void createDefaultFile() {
        log.info("Creating default feature flag file in: {}", filePath);

        try {
            for(T enumVal : enumClass.getEnumConstants()) {
                FeatureFlagDescriptor descriptor = enumClass.getField(enumVal.name()).getAnnotation(FeatureFlagDescriptor.class);
                FeatureFlagEntry<T> entry = new FeatureFlagEntry<T>();
                entry.setKey(enumVal);
                entry.setEnabled(descriptor.DefaultEnabled());
                values.put(enumVal, entry);
            }

            //Create the new file so that save() does not have to
            Files.createFile(filePath);
        }
        catch(NoSuchFieldException e) {
            log.error("Failure during feature flag enum parsing", e);
            return;
        }
        catch(IOException e) {
            log.error("Unable to create the file for feature flags", e);
        }

        if(!save()) {
            log.warn("The feature flags were parsed, but the configuration file could not be saved");
        }
        else {
            log.info("Default feature flag file has been created and saved.");
        }
    }

    @Override
    public boolean isFlagEnabled(T flag) {
        return values.containsKey(flag) && values.get(flag).isEnabled();
    }

    @Override
    public boolean setFlag(T flag, boolean isEnabled) {
        if(!values.containsKey(flag)) {
            log.warn("Key not found for flag {}", flag);
            return false;
        }

        FeatureFlagEntry<T> cur = values.get(flag);
        cur.setEnabled(isEnabled);

        if(save()) {
            log.info("Feature flags successfully updated");
        }
        else {
            log.info("The feature flag was updated but not saved. This means that it is active in your current session, but will not persist...");
        }

        // Even if the flag was not persisted, it was still set in memory, so I think it makes sense to return true
        return true;
    }

    protected boolean save() {
        // NOTE: isWritable checks for exists(), so it's possible it's not a permissions problem
        // The file should be created in createDefaultFile, otherwise there's some other issue...
        if(!Files.isWritable(filePath)) {
            log.warn("Path '{}' is not writable", filePath);
            return false;
        }

        ObjectWriter ow = new ObjectMapper().writer().withDefaultPrettyPrinter();
        try {
            String json = ow.writeValueAsString(values.values());
            FileWriter fw = new FileWriter(filePath.toString());
            BufferedWriter bw = new BufferedWriter(fw);

            bw.write(json);

            bw.close();
            fw.close();

            return true;
        }
        catch (JsonProcessingException e) {
            log.error("Error while saving feature flags", e);
        }
        catch (IOException e) {
            log.error("Error while opening writer for feature flags", e);
        }

        return false;
    }
}
