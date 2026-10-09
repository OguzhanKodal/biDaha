import { DateTimePicker, Host } from '@expo/ui/jetpack-compose';

import type { LocalDate } from '@/lib/date';
import { useTheme } from '@/theme';

/**
 * Android: Material takvim seçici. Material DatePicker günü UTC gece yarısı olarak verir/alır;
 * bu yüzden yerel gün (YYYY-MM-DD) UTC bileşenleriyle çevrilir — saat dilimi günü kaydırmaz.
 */
function utcMidnight(value: LocalDate): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function fromUtcMidnight(date: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

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
      <DateTimePicker
        initialDate={utcMidnight(value).toISOString()}
        displayedComponents="date"
        variant="picker"
        showVariantToggle={false}
        selectableDates={{ start: utcMidnight(minDate) }}
        color={colors.accent}
        elementColors={{
          containerColor: colors.surface,
          titleContentColor: colors.textSecondary,
          headlineContentColor: colors.text,
          weekdayContentColor: colors.textSecondary,
          subheadContentColor: colors.text,
          navigationContentColor: colors.text,
          yearContentColor: colors.text,
          currentYearContentColor: colors.accent,
          selectedYearContentColor: colors.background,
          selectedYearContainerColor: colors.accent,
          dayContentColor: colors.text,
          disabledDayContentColor: colors.border,
          selectedDayContentColor: colors.background,
          selectedDayContainerColor: colors.accent,
          todayContentColor: colors.accent,
          todayDateBorderColor: colors.accent,
          dividerColor: colors.border,
        }}
        onDateSelected={(date) => onChange(fromUtcMidnight(date))}
      />
    </Host>
  );
}
