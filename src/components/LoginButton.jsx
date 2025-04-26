import { useAuth0 } from '@auth0/auth0-react';
import React from 'react';
import * as MaterialDesign from "react-icons/md";
import tailwindBtn from './tailwindBtn';

/**
 * LoginButton Komponente
 * Stellt einen Button für Login/Logout bereit und zeigt Benutzerinfo an, wenn angemeldet
 */
function LoginButton() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 text-[var(--md-sys-color-on-surface-variant)]">
        <MaterialDesign.MdOutlineHourglassEmpty className="text-xl animate-spin" />
        <span className="text-sm">Lade...</span>
      </div>
    );
  }

  return (    <div className="flex items-center">
      {isAuthenticated ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-[var(--md-sys-color-surface-variant)]">
            {user?.picture ? (
              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <MaterialDesign.MdPersonOutline className="text-2xl text-[var(--md-sys-color-on-surface-variant)]" />
            )}
          </div>          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{user?.name}</span><button 
              onClick={() => logout({ returnTo: window.location.origin })}
              className={`${tailwindBtn.secondary} text-sm py-1.5`}
            >
              <MaterialDesign.MdLogout className="text-lg" />
              <span className="hidden sm:inline">Abmelden</span>
              <span className="inline sm:hidden">Logout</span>
            </button>
          </div>
        </div>      ) : (        <button 
          onClick={() => loginWithRedirect()} 
          className={tailwindBtn.primary}
        >
          <MaterialDesign.MdLogin className="text-xl" />
          <span className="hidden sm:inline">Anmelden</span>
          <span className="inline sm:hidden">Login</span>
        </button>
      )}
    </div>
  );
}

export default LoginButton;
