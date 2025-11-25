package com.game.on.common.feature_flags;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.EnumMap;
import java.util.List;

public abstract class AbstractFeatureFlags<T extends Enum<T> & FeatureFlagList<T>> implements FeatureFlags<T> {

    private static final Logger log = LoggerFactory.getLogger(AbstractFeatureFlags.class);
    private final Class<T> enumClass;
    private Path filePath;

    protected EnumMap<T, FeatureFlagEntry> values;

    public AbstractFeatureFlags(Class<T> typeClass) {
        this.enumClass = typeClass;
        values = new EnumMap<>(typeClass);
        initialize();
    }

    /**
     * Initialize the feature flags using the annotations for the class
     */
    public void initialize() {
        values.clear();

        FeatureFlagFile fileAnnotation = enumClass.getAnnotation(FeatureFlagFile.class);

        // Without this annotation, we don't know what file to check
        if(fileAnnotation == null) {
            log.error("Feature flag enum is missing FeatureFlagFile annotation");
            return;
        }

        Path dirPath = Paths.get("feature-flags");
        log.debug("Searching for feature flags in: {}", dirPath);
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

        filePath = dirPath.resolve(fileName);
        if(Files.exists(filePath)) {
            readExistingFile();
        }
        else {
            createDefaultFile();
        }
    }

    /**
     * Read an existing feature flag file and populate the underlying map
     */
    private void readExistingFile() {
        log.debug("Reading feature flag configuration from path: {}", filePath);

        try {
            FileReader fr = new FileReader(filePath.toString());
            BufferedReader br = new BufferedReader(fr);
            ObjectMapper mapper = new ObjectMapper();

            var test = mapper.readValue(br, new TypeReference<List<FeatureFlagEntry>>() {});

            //This is a hack, to allow for our generic enums to deserialize themselves through reflection
            // The deserialize() method is tied to an actual instance, but it doesn't matter which one...
            T pseudoDeserializer = enumClass.getEnumConstants()[0];
            for(var t : test) {
                T deserializedEnumValue = pseudoDeserializer.deserialize(t.getKey());

                values.put(deserializedEnumValue, t);
            }

            // This is nice if people add a new flag, so they don't have to remake the file entirely...
            if(values.size() != enumClass.getEnumConstants().length) {
                log.warn("Missing feature flag in configuration file: {}", filePath);

                for(T enumVal : enumClass.getEnumConstants()) {
                    if(values.containsKey(enumVal)) {
                        continue;
                    }

                    log.debug("Adding missing feature flag: {}", enumVal);

                    addDefaultEntry(enumVal);
                }

                save();
            }
        }
        catch (FileNotFoundException e) {
            log.error("Feature flag file not found", e);
        }catch (DatabindException e) {
            log.error("Error while parsing feature flag entries", e);
        } catch (StreamReadException e) {
            log.error("Error reading data stream for file", e);
        } catch (IOException e) {
            log.error("IO exception", e);
        } catch (NoSuchFieldException e) {
            log.error("Enum field could not be found...", e);
        }  catch (IllegalAccessException e) {
            log.error("Missing access to read existing file");
        }
    }

    /**
     * Create a default feature flag file
     */
    private void createDefaultFile() {
        log.debug("Creating default feature flag file in: {}", filePath);

        try {
            for(T enumVal : enumClass.getEnumConstants()) {
                addDefaultEntry(enumVal);
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

    /**
     * Adds an entry to the map using the default information for the feature flag
     * @param newFlag The enum value to be added
     * @throws NoSuchFieldException Field is not found in the enum
     */
    private void addDefaultEntry(T newFlag) throws NoSuchFieldException{
        FeatureFlagDescriptor descriptor = enumClass.getField(newFlag.name()).getAnnotation(FeatureFlagDescriptor.class);

        if(descriptor == null) {
            log.warn("Feature flag: {} in {} is missing a descriptor, skipping...", newFlag.name(), filePath);
            return;
        }

        FeatureFlagEntry entry = new FeatureFlagEntry();
        entry.setKey(newFlag.serialize(newFlag));
        entry.setEnabled(descriptor.DefaultEnabled());
        values.put(newFlag, entry);
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

        FeatureFlagEntry cur = values.get(flag);
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
            log.error("Path '{}' is not writable", filePath);
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
