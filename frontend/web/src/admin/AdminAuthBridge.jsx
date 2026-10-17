import { useEffect } from "react";

const userAppOrigin = import.meta.env.VITE_USER_APP_URL
  ? new URL(import.meta.env.VITE_USER_APP_URL).origin
  : import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:4173`
    : window.location.origin;

function AdminAuthBridge() {
  useEffect(() => {
    if (!window.opener) return undefined;

    const handleAuthMessage = (event) => {
      if (
        event.origin !== userAppOrigin ||
        event.source !== window.opener ||
        event.data?.type !== "MEDICALAPP_ADMIN_AUTH"
      ) {
        return;
      }

      const { token, user } = event.data;
      if (!token || String(user?.role || "").toLowerCase() !== "admin") return;

      const userData = JSON.stringify(user);
      const sessionChanged =
        localStorage.getItem("token") !== token ||
        localStorage.getItem("user") !== userData;

      localStorage.setItem("token", token);
      localStorage.setItem("user", userData);

      if (sessionChanged) {
        window.location.reload();
      }
    };

    window.addEventListener("message", handleAuthMessage);
    window.opener.postMessage(
      { type: "MEDICALAPP_ADMIN_AUTH_READY" },
      userAppOrigin
    );

    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  return null;
}

export default AdminAuthBridge;