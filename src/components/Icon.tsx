import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Platform } from 'react-native';

import { useTheme, type ThemeColors } from '@/theme';

/**
 * Uygulamada kullanılan SF Symbols ikonlarının Android (Material Symbols) karşılıkları.
 * Yeni bir SF Symbol kullanırsan buraya da ekle; yoksa Android'de "help" görünür ve geliştirmede uyarı çıkar.
 */
const androidSymbols: Partial<Record<SFSymbol, AndroidSymbol>> = {
  'arrow.down': 'arrow_downward',
  'arrow.up': 'arrow_upward',
  'arrow.triangle.2.circlepath': 'autorenew',
  'arrow.turn.down.right': 'subdirectory_arrow_right',
  'arrow.up.arrow.down': 'swap_vert',
  'arrow.uturn.backward': 'undo',
  bell: 'notifications',
  calendar: 'calendar_month',
  camera: 'photo_camera',
  'chart.bar': 'bar_chart',
  'chart.bar.fill': 'bar_chart',
  checkmark: 'check',
  'checkmark.circle': 'check_circle',
  'checkmark.circle.fill': 'check_circle',
  'checkmark.seal': 'verified',
  'chevron.right': 'chevron_right',
  circle: 'radio_button_unchecked',
  clock: 'schedule',
  'clock.arrow.circlepath': 'history',
  'exclamationmark.triangle': 'warning',
  'externaldrive.badge.icloud': 'backup',
  'flag.checkered': 'sports_score',
  flame: 'local_fire_department',
  folder: 'folder',
  'folder.fill': 'folder',
  'folder.badge.plus': 'create_new_folder',
  'folder.badge.questionmark': 'folder_off',
  'questionmark.folder': 'folder_off',
  gearshape: 'settings',
  'gearshape.fill': 'settings',
  graduationcap: 'school',
  hammer: 'construction',
  'info.circle': 'info',
  minus: 'remove',
  'minus.circle': 'remove_circle_outline',
  pencil: 'edit',
  person: 'person',
  'photo.on.rectangle': 'photo_library',
  plus: 'add',
  'plus.circle': 'add_circle_outline',
  'rotate.right': 'rotate_right',
  'square.and.arrow.down': 'download',
  'square.and.arrow.up': 'upload',
  'square.stack': 'layers',
  'star.circle': 'stars',
  'sun.max': 'light_mode',
  'sun.max.fill': 'light_mode',
  trash: 'delete',
  xmark: 'close',
  'xmark.circle': 'cancel',
};

export function androidSymbolFor(name: SFSymbol): AndroidSymbol {
  const symbol = androidSymbols[name];
  if (!symbol && __DEV__ && Platform.OS === 'android') {
    console.warn(`Icon: "${name}" için Android karşılığı yok (Icon.tsx → androidSymbols).`);
  }
  return symbol ?? 'help';
}

type Props = {
  name: SFSymbol;
  size?: number;
  color?: keyof ThemeColors;
  /** Tema dışı özel ton (ör. klasör rengi). */
  tint?: string;
};

/** İkon (iOS: SF Symbols, Android: Material Symbols). Dekoratiftir; anlamı yanındaki metin taşır. */
export function Icon({ name, size = 20, color = 'text', tint }: Props) {
  const { colors } = useTheme();
  return (
    <SymbolView
      name={{ ios: name, android: androidSymbolFor(name) }}
      size={size}
      tintColor={tint ?? colors[color]}
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
