package com.tripbharat.tripbharat.dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedTripDTO {

    private Long id;
    private String fromCity;
    private String toCity;
    private int days;
    private String style;
    private String budget;
    private String plan;
    private LocalDateTime savedAt;
}