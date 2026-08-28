package com.civicvoice.repository;

import com.civicvoice.model.Issue;
import com.civicvoice.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, String> {

    @Query("select v.issue.id, count(v) from Vote v where v.issue.id in :ids group by v.issue.id")
    List<Object[]> countByIssueIds(@Param("ids") List<String> ids);

    long countByIssueId(String issueId);
}
