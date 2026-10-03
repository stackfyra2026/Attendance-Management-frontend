import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/useRedux";
import { bootstrapSession, logoutUser } from "@/store/slices/authSlice";
import { SESSION_EXPIRED_EVENT } from "@/services/http/session";

export default function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(bootstrapSession());

    const handleExpired = () => {
      void dispatch(logoutUser());
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [dispatch]);

  return <>{children}</>;
}