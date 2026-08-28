package com.civicvoice.repository;

import com.civicvoice.model.Issue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, String>, JpaSpecificationExecutor<Issue> {

    @EntityGraph(attributePaths = {"user"})
    Page<Issue> findAll(org.springframework.data.jpa.domain.Specification<Issue> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"user"})
    List<Issue> findTop5ByOrderByCreatedAtDesc();

    @Query("select distinct i.locationName from Issue i where i.locationName is not null")
    List<String> findDistinctLocationNames();
}
