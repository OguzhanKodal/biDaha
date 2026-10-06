import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';

import { formatTime, parseTime } from '@/domain/reminders';
import { useTheme } from '@/theme';

/** Saat seçici (HH:mm). iOS'un tekerlekli saat seçicisi. */
export function TimePicker({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const { colors, scheme } = useTheme();
  const { hour, minute } = parseTime(value);
  // Bugünün tarihi kullanılır: eski bir tarih (ör. 2000) o günkü saat dilimi farkıyla
  // yorumlanıp saati kaydırabiliyor (Türkiye 2016'dan beri UTC+3).
  const selection = new Date();
  selection.setHours(hour, minute, 0, 0);
  return (
    <Host matchContents={{ vertical: true }} colorScheme={scheme} style={{ alignSelf: 'stretch' }}>
      <DatePicker
        selection={selection}
        displayedComponents={['hourAndMinute']}
        onDateChange={(date) => onChange(formatTime(date.getHours(), date.getMinutes()))}
        modifiers={[datePickerStyle('wheel'), tint(colors.accent)]}
      />
    </Host>
  );
}
