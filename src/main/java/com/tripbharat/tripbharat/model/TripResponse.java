package com.tripbharat.tripbharat.model;

public class TripResponse {


    private String plan;
    private boolean success;
    private String error;

    public TripResponse(String plan) {
        this.plan = plan;
        this.success = true;
    }

    public TripResponse(String error, boolean success)
    {
        this.error=error;
        this.success=false;
    }

    public String getPlan() {
        return plan;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getError() {
        return error;
    }
}
