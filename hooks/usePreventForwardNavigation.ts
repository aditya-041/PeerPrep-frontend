import { useEffect } from "react";

const usePreventForwardNavigation = () => {
  useEffect(() => {
    // Push multiple dummy states to keep history stack intact
    for (let i = 0; i < 10; i++) {
      window.history.pushState(null, "", window.location.href);
    }

    const handlePopState = () => {
      // Whenever forward navigation occurs, push state again to prevent it
      window.history.pushState(null, "", window.location.href);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevent tab close or refresh (optional, you can remove if not needed)
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
};

export default usePreventForwardNavigation;
