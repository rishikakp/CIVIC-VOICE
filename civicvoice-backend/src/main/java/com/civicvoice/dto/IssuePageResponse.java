package com.civicvoice.dto;

import java.util.List;

public record IssuePageResponse(
        List<IssueResponse> issues,
        int page,
        int pageSize,
        long totalCount,
        int totalPages,
        List<String> commonAreas
) {}
