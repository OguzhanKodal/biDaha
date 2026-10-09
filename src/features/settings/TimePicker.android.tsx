import { DateTimePicker, Host } from '@expo/ui/jetpack-compose';

import { formatTime, parseTime } from '@/domain/reminders';
import { useTheme } from '@/theme';

/** Android: Material saat seçici (24 saat). Değer HH:mm; tarih kısmı önemsiz, bugünün tarihi kullanılır. */
export function TimePicker({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const { colors, scheme } = useTheme();
  const { hour, minute } = parseTime(value);
  const initial = new Date();
  initial.setHours(hour, minute, 0, 0);
  return (
    <Host matchContents={{ vertical: true }} colorScheme={scheme} style={{ alignSelf: 'stretch' }}>
      <DateTimePicker
        initialDate={initial.toISOString()}
        displayedComponents="hourAndMinute"
        is24Hour
        color={colors.accent}
        elementColors={{
          containerColor: colors.surface,
          clockDialColor: colors.surfaceSelected,
          clockDialSelectedContentColor: colors.background,
          clockDialUnselectedContentColor: colors.text,
          selectorColor: colors.accent,
          timeSelectorSelectedContainerColor: colors.primary,
          timeSelectorUnselectedContainerColor: colors.surfaceSelected,
          timeSelectorSelectedContentColor: colors.onPrimary,
          timeSelectorUnselectedContentColor: colors.text,
        }}
        onDateSelected={(date) => onChange(formatTime(date.getHours(), date.getMinutes()))}
      />
    </Host>
  );
}
