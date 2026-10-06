import { DatePicker, Host } from '@expo/ui/swift-ui';
import { datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';

import { parseLocalDate, toLocalDate, type LocalDate } from '@/lib/date';
import { useTheme } from '@/theme';

/** Takvim görünümlü tarih seçici; bugünden önceki günler seçilemez. */
export function ExamDatePicker({
  value,
  minDate,
  onChange,
}: {
  value: LocalDate;
  minDate: LocalDate;
  onChange: (date: LocalDate) => void;
}) {
  const { colors, scheme } = useTheme();
  return (
    <Host matchContents={{ vertical: true }} colorScheme={scheme} style={{ alignSelf: 'stretch' }}>
      <DatePicker
        selection={parseLocalDate(value)}
        range={{ start: parseLocalDate(minDate) }}
        displayedComponents={['date']}
        onDateChange={(date) => onChange(toLocalDate(date))}
        modifiers={[datePickerStyle('graphical'), tint(colors.accent)]}
      />
    </Host>
  );
}
