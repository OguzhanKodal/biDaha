import { Stack } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { HeaderButton } from '@/components/HeaderButton';
import { FolderList, openFolderForm } from '@/features/folders/FolderList';

export default function FoldersScreen() {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <HeaderButton label={editing ? 'Bitti' : 'Düzenle'} bold={editing} onPress={() => setEditing((e) => !e)} />
              {editing ? null : (
                <HeaderButton icon="plus" label="Ders ekle" onPress={() => openFolderForm({ parentId: null })} />
              )}
            </View>
          ),
        }}
      />
      <FolderList parentId={null} editing={editing} />
    </>
  );
}
