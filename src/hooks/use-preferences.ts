"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** User preferences. `simpleMode` = recipe book + grocery list only, no macro tracking. */
export function usePreferences() {
  const { data, isLoading, mutate } = useSWR<{ simpleMode: boolean }>(
    "/api/user/preferences",
    fetcher
  );

  async function setSimpleMode(simpleMode: boolean) {
    mutate({ simpleMode }, false);
    await fetch("/api/user/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simpleMode }),
    });
    mutate();
  }

  return {
    simpleMode: data?.simpleMode ?? false,
    isLoading,
    setSimpleMode,
  };
}
