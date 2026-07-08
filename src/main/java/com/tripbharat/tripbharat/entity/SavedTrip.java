package com.tripbharat.tripbharat.entity;


import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name="saved-trips")
@Builder
@NoArgsConstructor
@RequiredArgsConstructor
@Data
public class SavedTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;


    // ── Relationship to User ───────────────────
    // Many trips can belong to one user

    @ManyToOne(fetch = FetchType.LAZY)
    //many trips to one user
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ── Trip Details ───────────────────────────
    @Column(name = "from_city", nullable = false, length = 100)
    private String fromCity;

    @Column(name = "to_city", nullable = false, length = 100)
    private String toCity;

    @Column(nullable = false)
    private int days;

    @Column(length = 50)
    private String style;

    @Column(length = 50)
    private String budget;

    // Full AI plan — stored as TEXT (unlimited length)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String plan;

    @Column(name = "saved_at")
    private LocalDateTime savedAt;


    @PrePersist
    protected void onSave() {
        savedAt = LocalDateTime.now();
    }

}
