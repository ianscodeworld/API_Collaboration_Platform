package com.apicollab.platform.auth.web.dto;

import com.apicollab.platform.auth.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserCreationResponse {
    private User user;
    private String rawPassword;
}
