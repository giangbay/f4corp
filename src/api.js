import React from "react";

export async function fetchApi(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(payload?.error ?? "Không thể tải dữ liệu.");
  }

  return payload;
}

export function useApiResource(path) {
  const [state, setState] = React.useState({
    data: [],
    loading: true,
    error: "",
  });

  const setData = React.useCallback((dataOrUpdater) => {
    setState((current) => ({
      ...current,
      data:
        typeof dataOrUpdater === "function"
          ? dataOrUpdater(current.data)
          : dataOrUpdater,
    }));
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();

    fetchApi(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: "" }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: [], loading: false, error: error.message });
        }
      });

    return () => controller.abort();
  }, [path]);

  return { ...state, setData };
}
