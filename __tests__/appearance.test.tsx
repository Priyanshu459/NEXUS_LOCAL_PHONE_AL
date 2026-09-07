import React, {useState} from 'react';
import {TextInput} from 'react-native';
import Renderer, {act} from 'react-test-renderer';
import {getAppearance, setAppearance, Theme, useAppearance} from '../src/constants/theme';
import {storage} from '../src/services/storage';

beforeEach(() => { storage.clearAll(); setAppearance('paper', false); });

test('saves each design and keeps reading preference', () => {
  for (const mode of ['paper', 'mono', 'midnight'] as const) {
    setAppearance(mode, true);
    expect(getAppearance()).toEqual({mode, largeText: true});
    expect(storage.getString('appearance_mode')).toBe(mode);
  }
  setAppearance('mono', true);
  expect(Theme.color.primary).toBe('#222222');
  expect(Theme.headingFont).toBe('sans-serif');
});

test.each([['light','paper'], ['dark','midnight'], ['invalid','paper']])('migrates legacy or unknown preference %s', (saved, expected) => {
  storage.set('appearance_mode', saved);
  expect(getAppearance().mode).toBe(expected);
});

test('live theme changes do not remount a subscriber or discard its draft', async () => {
  let mounts = 0;
  function Composer() {
    useAppearance();
    const [draft, setDraft] = useState(() => { mounts++; return ''; });
    return <TextInput value={draft} onChangeText={setDraft} style={{color:Theme.color.text}}/>;
  }
  let view!: Renderer.ReactTestRenderer;
  await act(async () => { view = Renderer.create(<Composer/>); });
  await act(async () => { view.root.findByType(TextInput).props.onChangeText('Keep my thought'); });
  await act(async () => { setAppearance('midnight', false); });
  expect(view.root.findByType(TextInput).props.value).toBe('Keep my thought');
  expect(view.root.findByType(TextInput).props.style.color).toBe('#F4F2E9');
  expect(mounts).toBe(1);
  await act(async () => { view.unmount(); });
});
