package com.game.on.common.feature_flags;

import java.lang.reflect.Field;

public interface FeatureFlagList<T extends Enum<T>> {

    /**
     * Gets the class for this enum, used to deserialize enum values in feature flags
     * @return The feature flag enum Class
     */
    Class<T> getEnumClass();

    /**
     * Serializes an enum value
     * @param value The current enum value to serialize
     * @return The enum value name as a string (This is tied to the name of the constant itself)
     */
    default String serialize(T value) {
        return value.name();
    }

    /**
     * Deserializes a generic enum value
     * @param enumString The serialized string
     * @return Value T from the enum or null if there was a failure
     * @throws NoSuchFieldException Invoked when the provided string does not match any of the fields of the enum
     * @throws IllegalAccessException Potentially invoked when the field in the enum is inaccessible
     */
    default T deserialize(String enumString) throws NoSuchFieldException, IllegalAccessException {
        Field declaredField = getEnumClass().getDeclaredField(enumString);
        declaredField.setAccessible(true);

        //This is for intellij so it doesn't complain about the unchecked conversion below...
        //noinspection unchecked
        return (T)declaredField.get(getEnumClass());
    }
}
