import React, { createContext, useContext, useEffect } from "react";
const ThemeContext = createContext({ theme: "light", toggle: () => {} });
export function ThemeProvider({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.removeItem("myco-theme");
  }, []);
  return <ThemeContext.Provider value={{ theme: "light", toggle: () => {} }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
