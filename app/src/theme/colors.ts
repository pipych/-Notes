// Material 3 Google Official Dark Palette (1:1 from Color.kt in bars-android)
export const Colors = {
  // Google Dark Background & Surface (#131314)
  m3Background: '#131314',
  m3OnBackground: '#E3E3E3',
  m3Surface: '#131314',
  m3OnSurface: '#E3E3E3',
  m3SurfaceDim: '#131314',
  m3SurfaceBright: '#37393B',

  // Tonal Surface Containers
  m3SurfaceContainerLowest: '#0E0E0F',
  m3SurfaceContainerLow: '#171819',
  m3SurfaceContainer: '#1E1F20',         // Note cards
  m3SurfaceContainerHigh: '#282A2C',     // Search bar, nav bar, elevated panels
  m3SurfaceContainerHighest: '#333537',  // Interactive chips, input fields, badges

  m3SurfaceVariant: '#444746',
  m3OnSurfaceVariant: '#C4C7C5',         // Subtitles, dates, inactive icons, hints

  m3Outline: '#8E918F',                  // Pill button outlines, borders
  m3OutlineVariant: '#444746',          // Subtle card dividers

  // Google Blue 80 Accents
  m3Primary: '#A8C7FA',
  m3OnPrimary: '#003258',
  m3PrimaryDarkText: '#041E49',          // High-contrast button text on Primary
  m3PrimaryContainer: '#004A77',        // Active tab pill
  m3OnPrimaryContainer: '#C2E7FF',      // Active tab icon and text

  // Secondary Sky Cyan
  m3Secondary: '#7FCFFF',
  m3OnSecondary: '#003355',
  m3SecondaryContainer: '#004A77',
  m3OnSecondaryContainer: '#C2E7FF',

  // Tertiary Soft Coral
  m3Tertiary: '#FFB5A0',
  m3OnTertiary: '#561F10',
  m3TertiaryContainer: '#703322',
  m3OnTertiaryContainer: '#FFDBD1',

  // Success Green (#6DD58C)
  m3Success: '#6DD58C',
  m3OnSuccess: '#003919',
  m3SuccessContainer: '#005327',
  m3OnSuccessContainer: '#8CF8A6',

  // Error Red (#F2B8B5)
  m3Error: '#F2B8B5',
  m3OnError: '#601410',
  m3ErrorContainer: '#8C1D18',
  m3OnErrorContainer: '#F9DEDC',
} as const;
