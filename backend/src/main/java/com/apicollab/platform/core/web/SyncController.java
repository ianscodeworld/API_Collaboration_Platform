package com.apicollab.platform.core.web;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class SyncController {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SyncMessage {
        private String type;
        private Long id;
        private String action;
    }

    @MessageMapping("/sync")
    @SendTo("/topic/updates")
    public SyncMessage broadcastUpdate(SyncMessage message) {
        return message;
    }
}
