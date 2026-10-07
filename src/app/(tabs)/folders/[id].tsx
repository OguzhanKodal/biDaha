import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, LoadingState } from '@/components/StatusViews';
import { HeaderButton } from '@/components/HeaderButton';
import { getFolder } from '@/db/folders';
import { useDatabase } from '@/db/useDatabase';
import { FolderList, openFolderForm } from '@/features/folders/FolderList';
import { QuestionSection } from '@/features/questions/QuestionSection';
import { useFocusedData } from '@/lib/useFocusedData';
import { useTheme } from '@/theme';

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = Number(id);
  const db = useDatabase();
  const { spacing } = useTheme();
  const [editing, setEditing] = useState(false);
  const { data: folder, error, loaded, reload } = useFocusedData(() => getFolder(db, folderId));

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!loaded) return <LoadingState />;
  if (!folder) {
    return (
      <EmptyState
        icon="questionmark.folder"
        title="Klasör bulunamadı"
        message="Bu klasör silinmiş ya da başka bir klasöre taşınmış olabilir."
        action={<Button title="Klasörlere dön" variant="secondary" onPress={() => router.navigate('/folders')} />}
      />
    );
  }

  const isSubject = folder.parent_id === null;

  const questions = <QuestionSection folderId={folder.id} />;

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
          footer={questions}
        />
      ) : (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: spacing.lg }}>
          {questions}
        </ScrollView>
      )}
    </>
  );
}
