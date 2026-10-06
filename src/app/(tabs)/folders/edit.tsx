import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { AppText } from '@/components/AppText';
import { HeaderButton } from '@/components/HeaderButton';
import { TextField } from '@/components/TextField';
import { countFolders, createFolder, getFolder, listSiblingNames, updateFolder } from '@/db/folders';
import type { FolderRow } from '@/db/types';
import { useDatabase } from '@/db/useDatabase';
import { autoFolderColor, folderNameErrorMessages, maxFolderNameLength, validateFolderName } from '@/domain/folders';
import { ColorPicker } from '@/features/folders/ColorPicker';
import { defaultFolderColor, isFolderColor, useTheme, type FolderColor } from '@/theme';

type FormState = {
  /** Düzenlenen klasör (yeni ise null) */
  existing: FolderRow | null;
  parent: FolderRow | null;
  siblingNames: string[];
};

/** Ders/konu ekleme ve düzenleme formu. Parametreler: id (düzenleme) ya da parentId (yeni konu). */
export default function FolderFormScreen() {
  const params = useLocalSearchParams<{ id?: string; parentId?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const db = useDatabase();
  const { spacing } = useTheme();

  const [form, setForm] = useState<FormState | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<FolderColor>(defaultFolderColor);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const existing = editId !== null ? await getFolder(db, editId) : null;
      const parentId = existing ? existing.parent_id : params.parentId ? Number(params.parentId) : null;
      const parent = parentId !== null ? await getFolder(db, parentId) : null;
      const siblingNames = await listSiblingNames(db, parentId, existing?.id ?? null);
      if (existing) {
        setName(existing.name);
        setColor(isFolderColor(existing.color) ? existing.color : defaultFolderColor);
      } else {
        // Yeni konu dersinin rengini alır; yeni ders sıradaki rengi.
        setColor(parent ? parent.color : autoFolderColor(await countFolders(db, null)));
      }
      setForm({ existing, parent, siblingNames });
    })().catch((e: unknown) => Alert.alert('Açılamadı', e instanceof Error ? e.message : String(e)));
  }, [db, editId, params.parentId]);

  const isTopic = form ? (form.existing ? form.existing.parent_id !== null : form.parent !== null) : false;
  const kind = isTopic ? 'konu' : 'ders';
  const title = form?.existing ? (isTopic ? 'Konuyu düzenle' : 'Dersi düzenle') : isTopic ? 'Yeni konu' : 'Yeni ders';
  const error = form ? validateFolderName(name, form.siblingNames) : null;

  const save = async () => {
    setSubmitted(true);
    if (!form || error !== null || saving) return;
    setSaving(true);
    try {
      if (form.existing) {
        await updateFolder(db, form.existing.id, { name, color });
      } else {
        await createFolder(db, { name, color, parentId: form.parent?.id ?? null }, new Date().toISOString());
      }
      router.back();
    } catch (e) {
      setSaving(false);
      Alert.alert('Kaydedilemedi', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerLeft: () => <HeaderButton label="Vazgeç" onPress={() => router.back()} />,
          headerRight: () => <HeaderButton label="Kaydet" bold onPress={save} />,
        }}
      />
      {form ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
          {form.parent ? (
            <AppText color="textSecondary">Ders: {form.parent.name}</AppText>
          ) : null}
          <TextField
            label={isTopic ? 'Konu adı' : 'Ders adı'}
            placeholder={isTopic ? 'Ör. Türev' : 'Ör. TYT Matematik'}
            value={name}
            onChangeText={setName}
            maxLength={maxFolderNameLength}
            autoFocus={!form.existing}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={save}
            error={submitted && error ? folderNameErrorMessages[error] : null}
            accessibilityHint={`Bu ${kind} için bir ad yaz`}
          />
          <ColorPicker value={color} onChange={setColor} />
        </ScrollView>
      ) : null}
    </>
  );
}
