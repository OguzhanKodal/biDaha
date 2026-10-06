import { useColorScheme } from 'react-native';

import { colors, folderPalette, type ColorScheme, type FolderColor } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export * from './colors';
export * from './spacing';
export * from './typography';

export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return {
    scheme,
    colors: colors[scheme],
    folderColor: (key: FolderColor) => folderPalette[key][scheme],
    spacing,
    radius,
    typography,
  };
}
