import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HeaderButton } from '@/components/HeaderButton';
import { getFolder } from '@/db/folders';
import { useDatabase } from '@/db/useDatabase';
import { FolderList, openFolderForm } from '@/features/folders/FolderList';
import { useFocusedData } from '@/lib/useFocusedData';
import { useTheme } from '@/theme';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = Number(id);
  const db = useDatabase();
  const { spacing } = useTheme();
  const [editing, setEditing] = useState(false);
  const { data: folder, error } = useFocusedData(() => getFolder(db, folderId));

  if (error) {
    return <EmptyState icon="exclamationmark.triangle" title="Klasör açılamadı" message={error?.message} />;
  }
  if (!folder) {
    return <Stack.Screen options={{ title: '' }} />;
  }

  const isSubject = folder.parent_id === null;

  const questionsPlaceholder = (
    <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
      <AppText variant="heading" accessibilityRole="header">
        Sorular
      </AppText>
      <EmptyState
        icon="photo.on.rectangle"
        title="Henüz soru yok"
        message={
          isSubject
            ? 'Bu derse ya da konularına eklediğin sorular burada görünecek.'
            : 'Bu konuya eklediğin sorular burada görünecek.'
        }
      />
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: folder.name,
          headerRight: isSubject
            ? () => (
                <View style={{ flexDirection: 'row' }}>
                  <HeaderButton
                    label={editing ? 'Bitti' : 'Düzenle'}
                    bold={editing}
                    onPress={() => setEditing((e) => !e)}
                  />
                  {editing ? null : (
                    <HeaderButton icon="plus" label="Konu ekle" onPress={() => openFolderForm({ parentId: folder.id })} />
                  )}
                </View>
              )
            : () => <HeaderButton label="Düzenle" onPress={() => openFolderForm({ id: folder.id })} />,
        }}
      />
      {isSubject ? (
        <FolderList
          parentId={folder.id}
          editing={editing}
          header={
            <AppText variant="heading" accessibilityRole="header">
              Konular
            </AppText>
          }
          footer={questionsPlaceholder}
        />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg }}>
          {questionsPlaceholder}
        </ScrollView>
      )}
    </>
  );
}
