package com.tripbharat.tripbharat.service;


import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    //How many requests are allowed per window
    private static final int MAX_REQUESTS=5;

    //Window size in milliseconds
    private static final long WINDOW_MS=60_000;

    //Tracks requests per IP
    private final ConcurrentHashMap<String, Integer> requestCounts=
            new ConcurrentHashMap<>();

    //Tracks when the window started per IP
    private final ConcurrentHashMap<String, Long> windowStarts=
            new ConcurrentHashMap<>();

    /**
     * Returns true if the request is allowed.
     * Returns false if the rate limit has been exceeded.
     */

    public boolean isAllowed(String clientIp)
    {
        long now=System.currentTimeMillis();


        // Get when this IP's window started
        long windowStart= windowStarts.getOrDefault(clientIp,0L);

        // If window has expired — reset everything for this IP
        if(now-windowStart>WINDOW_MS)
        {
            windowStarts.put(clientIp,now);
            requestCounts.put(clientIp,1);
            System.out.println("✅ Rate limit reset for IP: " + clientIp);
            return true;
        }

        // Window is still active check the count
        int count= requestCounts.getOrDefault(clientIp,0);

        if(count>=MAX_REQUESTS)
        {
            //Calculate how many secounds until reset
            long secondsLeft = (WINDOW_MS - (now - windowStart)) / 1000;
            System.out.println("❌ Rate limit exceeded for IP: " + clientIp +
                    " | Resets in " + secondsLeft + "s");
            return false;
        }

        //Increment and allow
        requestCounts.put(clientIp,count+1);
        System.out.println("✅ Request " + (count + 1) + "/" + MAX_REQUESTS +
                " for IP: " + clientIp);
        return true;

    }

    public int getRequestCount(String clientIp) {
        return requestCounts.getOrDefault(clientIp, 0);
    }

}
