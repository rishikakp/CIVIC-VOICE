package com.civicvoice.dto;

import java.util.List;

public record AdminOverviewResponse(
        long openCount,
        long resolvedCount,
        long totalCount,
        long criticalCount,
        long unassignedCount,
        List<QuickList> quickLists,
        List<String> commonAreas
) {
    public record QuickList(String key, String title, List<IssueResponse> issues) {}
}
