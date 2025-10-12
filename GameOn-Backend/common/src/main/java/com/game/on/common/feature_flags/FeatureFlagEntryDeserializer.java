package com.game.on.common.feature_flags;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.BeanProperty;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.deser.ContextualDeserializer;

import java.io.IOException;

public class FeatureFlagEntryDeserializer extends JsonDeserializer<FeatureFlagEntry<?>> implements ContextualDeserializer {
    private JavaType type;

    public FeatureFlagEntryDeserializer() {

    }

    private FeatureFlagEntryDeserializer(JavaType type) {
        this.type = type;
    }

    @Override
    public JsonDeserializer<?> createContextual(DeserializationContext ctxt, BeanProperty property) {
        JavaType wrapperType = property.getType().containedType(0);
        return new FeatureFlagEntryDeserializer(wrapperType);
    }

    @Override
    public FeatureFlagEntry<?> deserialize(JsonParser jsonParser, DeserializationContext deserializationContext) throws IOException {
        FeatureFlagEntry<?> entry = new FeatureFlagEntry<>();
        entry.setKey(deserializationContext.readValue(jsonParser, type));
        entry.setEnabled(deserializationContext.readValue(jsonParser, Boolean.class));
        return entry;
    }
}
