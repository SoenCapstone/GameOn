package com.game.on.go_messaging_service.message.dto;

import java.util.List;

public record MessageHistoryResponse(List<MessageResponse> messages, boolean hasMore) {
}
