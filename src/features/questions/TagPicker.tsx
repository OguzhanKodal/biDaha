import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import type { ErrorTagRow } from '@/db/types';
import { maxTagNameLength, validateTagName, type TagNameError } from '@/domain/errorTags';
import { useTheme } from '@/theme';

const tagErrorMessages: Record<TagNameError, string> = {
  empty: 'Etiket adı boş olamaz.',
  tooLong: `En fazla ${maxTagNameLength} karakter.`,
  duplicate: 'Bu etiket zaten var.',
};

type Props = {
  tags: ErrorTagRow[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** Yeni etiketi kaydeder ve seçili hale getirir. */
  onCreate: (name: string) => Promise<void>;
};

export function TagPicker({ tags, selectedIds, onToggle, onCreate }: Props) {
  const { spacing } = useTheme();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const error = validateTagName(
    name,
    tags.map((t) => t.name),
  );

  const save = async () => {
    setSubmitted(true);
    if (error) return;
    await onCreate(name);
    setName('');
    setSubmitted(false);
    setAdding(false);
  };

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="callout" color="textSecondary">
        Neden yapamadın? (birden fazla seçebilirsin)
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {tags.map((tag) => (
          <Chip key={tag.id} label={tag.name} selected={selectedIds.includes(tag.id)} onPress={() => onToggle(tag.id)} />
        ))}
        {adding ? null : <Chip label="Etiket ekle" icon="plus" role="button" onPress={() => setAdding(true)} />}
      </View>
      {adding ? (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label="Yeni etiket"
            placeholder="Ör. Formülü unuttum"
            value={name}
            onChangeText={setName}
            maxLength={maxTagNameLength}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
            error={submitted && error ? tagErrorMessages[error] : null}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button title="Vazgeç" variant="secondary" onPress={() => setAdding(false)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Ekle" onPress={save} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
