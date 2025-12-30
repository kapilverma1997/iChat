"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";

export default function SessionProvider({ children }) {
  useEffect(() => {
    // Intercept fetch calls to handle NextAuth JSON parsing errors gracefully
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      
      // Only intercept NextAuth session endpoint calls
      if (url.includes('/api/auth/session') || url.includes('/api/auth/providers')) {
        try {
          const response = await originalFetch(...args);
          
          // If response is not OK, return empty JSON to prevent parsing errors
          if (!response.ok) {
            return new Response(
              JSON.stringify({}),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          
          // Clone response to check content without consuming the original
          const clonedResponse = response.clone();
          const contentType = response.headers.get('content-type');
          
          // Check if response body is empty or invalid
          let text = '';
          try {
            text = await clonedResponse.text();
          } catch (e) {
            // If we can't read the text, return empty JSON
            return new Response(
              JSON.stringify({}),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          
          // If response is empty or not valid JSON, return empty JSON object
          if (!text || text.trim() === '' || !contentType?.includes('application/json')) {
            return new Response(
              JSON.stringify({}),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          
          // Try to parse JSON to validate it
          let parsedData;
          try {
            parsedData = JSON.parse(text);
          } catch (parseError) {
            // If JSON is invalid, return empty JSON object
            return new Response(
              JSON.stringify({}),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
          
          // Return a new response with the validated and re-stringified JSON
          // This ensures we always return valid JSON
          return new Response(JSON.stringify(parsedData), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          });
        } catch (error) {
          // Silently handle errors - return empty session
          console.debug("NextAuth session fetch error (handled):", error.message);
          return new Response(
            JSON.stringify({}),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }
      
      // For all other requests, use original fetch
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <NextAuthSessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  );
}

