// Define tokens de design (padrão) e função para aplicá-los como CSS variables.

window.THEME = {
  name: "EmpresaX-TopHeader",
  colors: {
    brandPrimary: "#1E3A8A",
    brandSecondary: "#22C55E",
    bgPage: "#0B1220",
    bgSurface: "#111827",
    textPrimary: "#E5E7EB",
    textSecondary: "#9CA3AF",
    border: "#293041"
  },
  radius: { sm: "4px", md: "8px", lg: "12px" },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
  shadow: { sm: "0 1px 2px rgba(0,0,0,.2)", md: "0 4px 12px rgba(0,0,0,.25)" },
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    scale: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28 }
  }
};

window.applyTheme = function applyTheme(theme = window.THEME) {
  const root = document.documentElement;
  root.style.setProperty("--color-brand-primary", theme.colors.brandPrimary);
  root.style.setProperty("--color-brand-secondary", theme.colors.brandSecondary);
  root.style.setProperty("--color-bg-page", theme.colors.bgPage);
  root.style.setProperty("--color-bg-surface", theme.colors.bgSurface);
  root.style.setProperty("--color-text-primary", theme.colors.textPrimary);
  root.style.setProperty("--color-text-secondary", theme.colors.textSecondary);
  root.style.setProperty("--color-border", theme.colors.border);

  root.style.setProperty("--radius-sm", theme.radius.sm);
  root.style.setProperty("--radius-md", theme.radius.md);
  root.style.setProperty("--radius-lg", theme.radius.lg);

  root.style.setProperty("--space-xs", theme.spacing.xs + "px");
  root.style.setProperty("--space-sm", theme.spacing.sm + "px");
  root.style.setProperty("--space-md", theme.spacing.md + "px");
  root.style.setProperty("--space-lg", theme.spacing.lg + "px");
  root.style.setProperty("--space-xl", theme.spacing.xl + "px");

  root.style.setProperty("--shadow-sm", theme.shadow.sm);
  root.style.setProperty("--shadow-md", theme.shadow.md);

  root.style.setProperty("--font", theme.typography.fontFamily);
  root.style.setProperty("--fs-xs", theme.typography.scale.xs + "px");
  root.style.setProperty("--fs-sm", theme.typography.scale.sm + "px");
  root.style.setProperty("--fs-md", theme.typography.scale.md + "px");
  root.style.setProperty("--fs-lg", theme.typography.scale.lg + "px");
  root.style.setProperty("--fs-xl", theme.typography.scale.xl + "px");
  root.style.setProperty("--fs-2xl", theme.typography.scale.xxl + "px");
};
