import { useEffect } from "react";

export default function usePreventBackNavigation(shouldPrevent = true) {
  useEffect(() => {
    if (!shouldPrevent) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handlePopState = () => {
      if (window.confirm("Are you sure you want to leave? Your changes may not be saved.")) {
        return;
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [shouldPrevent]);
}
