import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { folderColors, minTouchSize, useTheme, type FolderColor } from '@/theme';

export const folderColorLabels: Record<FolderColor, string> = {
  blue: 'Mavi',
  teal: 'Turkuaz',
  green: 'Yeşil',
  yellow: 'Sarı',
  orange: 'Turuncu',
  red: 'Kırmızı',
  pink: 'Pembe',
  purple: 'Mor',
  gray: 'Gri',
};

type Props = {
  value: FolderColor;
  onChange: (color: FolderColor) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  const { colors, spacing, radius, folderColor } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="callout" color="textSecondary">
        Renk: {folderColorLabels[value]}
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} accessibilityRole="radiogroup">
        {folderColors.map((color) => {
          const selected = color === value;
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              accessibilityRole="radio"
              accessibilityLabel={folderColorLabels[color]}
              accessibilityState={{ selected }}
              style={({ pressed }) => ({
                width: minTouchSize,
                height: minTouchSize,
                borderRadius: radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: folderColor(color),
                borderWidth: 3,
                borderColor: selected ? colors.text : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}>
              {selected ? <Icon name="checkmark" size={18} color="onPrimary" /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
