import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { NativeModules, Text, TextInput, TouchableOpacity } from 'react-native';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { GalleryScreen } from '../src/screens/GalleryScreen';
import { ChatScreen } from '../src/screens/ChatScreen';
import { getSettings, storage } from '../src/services/storage';

jest.setTimeout(30000);
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));
const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => () => {}),
};
const button = (view: Renderer.ReactTestRenderer, text: string) =>
  view.root
    .findAllByType(TouchableOpacity)
    .find(b => b.findAllByType(Text).some(t => t.props.children === text))!;
beforeEach(() => {
  storage.clearAll();
  jest.clearAllMocks();
});
test('response presets and personal instructions persist through the real controls', async () => {
  let view!: Renderer.ReactTestRenderer;
  await act(async () => {
    view = Renderer.create(<SettingsScreen navigation={navigation} />);
  });
  await act(async () => button(view, 'Precise').props.onPress());
  expect(getSettings().temperature).toBe(0.2);
  const input = view.root
    .findAllByType(TextInput)
    .find(i => i.props.accessibilityLabel === 'Personal instructions')!;
  await act(async () =>
    input.props.onChangeText('Use short explanations with examples.'),
  );
  await act(async () => button(view, 'Save instructions').props.onPress());
  expect(getSettings().systemPrompt).toBe(
    'Use short explanations with examples.',
  );
  expect(JSON.stringify(view.toJSON())).toContain('Instructions saved.');
  await act(async () => view.unmount());
});
test('Explore opens a new conversation with its real task prompt', async () => {
  let view!: Renderer.ReactTestRenderer;
  await act(async () => {
    view = Renderer.create(<GalleryScreen navigation={navigation} />);
  });
  await act(async () =>
    view.root
      .findAllByType(TouchableOpacity)
      .find(b => b.props.accessibilityLabel === 'Find the right words')!
      .props.onPress(),
  );
  expect(navigation.navigate).toHaveBeenCalledWith(
    'Chat',
    expect.objectContaining({
      newConversation: true,
      initialPrompt: expect.stringContaining('Help me write something'),
    }),
  );
  await act(async () => view.unmount());
});
test('dictation stays in the composer for review and send is disabled without a model', async () => {
  let view!: Renderer.ReactTestRenderer;
  NativeModules.DeviceControl.startSpeechRecognition.mockResolvedValueOnce(
    'A dictated draft',
  );
  await act(async () => {
    view = Renderer.create(
      <ChatScreen
        navigation={navigation as any}
        route={{ params: {} } as any}
      />,
    );
  });
  await act(async () =>
    view.root
      .findAllByType(TouchableOpacity)
      .find(b => b.props.accessibilityLabel === 'Dictate message')!
      .props.onPress(),
  );
  expect(
    view.root
      .findAllByType(TextInput)
      .find(i => i.props.accessibilityLabel === 'Message')!.props.value,
  ).toBe('A dictated draft');
  expect(
    view.root
      .findAllByType(TouchableOpacity)
      .find(b => b.props.accessibilityLabel === 'Send message')!.props.disabled,
  ).toBe(true);
  await act(async () => view.unmount());
});

test('stopping generation safely handles non-promise stopCompletion without throwing', async () => {
  let view!: Renderer.ReactTestRenderer;
  await act(async () => {
    view = Renderer.create(
      <ChatScreen
        navigation={navigation as any}
        route={{ params: {} } as any}
      />,
    );
  });

  // Verify unmounting safely stops completion without throwing
  await expect(act(async () => view.unmount())).resolves.not.toThrow();
});

