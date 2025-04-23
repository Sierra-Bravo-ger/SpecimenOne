import { useAuth0 } from '@auth0/auth0-react';
import React from 'react';
import './LoginButton.css';
import * as MaterialDesign from "react-icons/md";

/**
 * LoginButton Komponente
 * Stellt einen Button für Login/Logout bereit und zeigt Benutzerinfo an, wenn angemeldet
 */
function LoginButton() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="login-loading">
        <MaterialDesign.MdOutlineHourglassEmpty className="loading-icon" />
        <span>Lade...</span>
      </div>
    );
  }

  return (
    <div className="login-container">
      {isAuthenticated ? (
        <div className="user-info">
          <div className="user-avatar">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="user-picture" />
            ) : (
              <MaterialDesign.MdPersonOutline className="user-icon" />
            )}
          </div>          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <button 
              onClick={() => logout({ returnTo: window.location.origin })}
              className="logout-button"
            >
              <MaterialDesign.MdLogout className="button-icon" />
              <span className="logout-text">Abmelden</span>
              <span className="logout-text-mobile">Logout</span>
            </button>
          </div>
        </div>
      ) : (        <button 
          onClick={() => loginWithRedirect()} 
          className="login-button"
        >
          <MaterialDesign.MdLogin className="button-icon" />
          <span className="login-text">Anmelden</span>
          <span className="login-text-mobile">Login</span>
        </button>
      )}
    </div>
  );
}

export default LoginButton;
