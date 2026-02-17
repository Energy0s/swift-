/**
 * SwiftThemeProvider — Aplica tema SWIFT 2026 nas rotas do módulo SWIFT
 * Define data-theme="swift" no document.documentElement
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { checkSwiftPath } from '../utils/swiftThemePaths';

export const SwiftThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (checkSwiftPath(location.pathname)) {
      root.dataset.theme = 'swift';
    } else {
      delete root.dataset.theme;
    }
  }, [location.pathname]);

  return <>{children}</>;
};
