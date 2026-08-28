package com.civicvoice.dto;

import com.civicvoice.model.IssueStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull IssueStatus status) {}
