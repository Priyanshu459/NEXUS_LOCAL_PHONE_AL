import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { WorkspaceScreen } from '../src/screens/WorkspaceScreen';
import { storage } from '../src/services/storage';
import { saveConversation } from '../src/services/conversations';

jest.setTimeout(30000);
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => void) => require('react').useEffect(effect, [effect]),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));

test('home opens saved chats, creates new chats, and searches message contents', async () => {
  storage.clearAll();
  saveConversation('saved', [{ id: 'u', role: 'user', content: 'Plan a garden' }]);
  const navigation = { navigate: jest.fn() };
  let view!: TestRenderer.ReactTestRenderer;
  await act(async () => { view = TestRenderer.create(<WorkspaceScreen navigation={navigation} />); });
  const buttons = view.root.findAllByType(TouchableOpacity);
  const saved = buttons.find(b => b.findAllByType(Text).some(node => node.props.children === 'Plan a garden'));
  expect(saved).toBeDefined();
  await act(async () => saved!.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('Chat', { conversationId: 'saved' });
  const create = buttons.find(b => b.findAllByType(Text).some(node => node.props.children === '＋ New conversation'));
  await act(async () => create!.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith('Chat', { newConversation: true, initialPrompt: undefined });
  await act(async () => view.root.findAllByType(TextInput)[0].props.onChangeText('no match'));
  expect(JSON.stringify(view.toJSON())).toContain('No matching conversations');
  await act(async () => view.unmount());
});


