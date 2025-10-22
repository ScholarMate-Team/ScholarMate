import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function PrivateRoute({ isLoggedIn, children }) {
  const location = useLocation();

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ fromProtected: location.pathname }}
      />
    );
  }

  return children;
}
