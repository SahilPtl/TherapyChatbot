import { createContext, useContext, useEffect, useState } from "react";
import { Theme, themeSchema } from "@/lib/sentiment-theme";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const defaultTheme: Theme = {
      variant: "professional" as const,
      primary: "hsl(206, 36%, 45%)",
      appearance: "system" as const,
      radius: 0.5,
    };

    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        const parsed = JSON.parse(saved);
        const validated = themeSchema.safeParse(parsed);
        if (validated.success) return validated.data;
      }
    } catch (error) {
      console.error("Error loading theme:", error);
    }

    return defaultTheme;
  });

  useEffect(() => {
    try {
      localStorage.setItem("theme", JSON.stringify(theme));
      console.log("Theme updated:", theme); // Add logging

      // Apply theme changes to the document
      document.documentElement.style.setProperty('--radius', `${theme.radius}rem`);
      document.documentElement.setAttribute('data-theme-variant', theme.variant);

      // Update appearance
      if (theme.appearance !== 'system') {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme.appearance);
      }

      // Update primary color with transition
      const primaryHsl = theme.primary.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
      if (primaryHsl) {
        const [_, h, s, l] = primaryHsl;
        document.documentElement.style.setProperty('--primary', `${h} ${s}% ${l}%`);
        console.log("Applied primary color:", `${h} ${s}% ${l}%`); // Add logging
      }
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}