import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null; // or a loading spinner
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
