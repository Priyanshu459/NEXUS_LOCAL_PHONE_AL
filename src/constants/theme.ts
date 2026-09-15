import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import { storage } from '../services/storage';
const light = {
  background: '#F7F5F0', surface: '#FCFAF6', surfaceRaised: '#EEEAE2',
  border: '#DAD5CA', text: '#202923', textSecondary: '#535D55', textMuted: '#6E746D',
  accent: '#234737', primary: '#234737', accentSoft: '#E6ECE4',
  success: '#306344', warning: '#8C5C18', destructive: '#A43C31',
};
const dark: typeof light = {
  background: '#181D19', surface: '#202720', surfaceRaised: '#2C352D',
  border: '#414A41', text: '#F4F2E9', textSecondary: '#C5CBBF', textMuted: '#A6B0A2',
  accent: '#B6D6BE', primary: '#B6D6BE', accentSoft: '#303F33',
  success: '#AFD6B6', warning: '#E5C28B', destructive: '#EEA59B',
};
const mono: typeof light = {
  ...light, background: '#FFFFFF', surface: '#FFFFFF', surfaceRaised: '#F2F2F2',
  border: '#DEDEDE', text: '#202020', textSecondary: '#525252', textMuted: '#686868',
  accent: '#222222', primary: '#222222', accentSoft: '#EEEEEE',
};
const glass:typeof light={...light,background:'#DCECFB',surface:'rgba(248,252,255,0.78)',surfaceRaised:'rgba(255,255,255,0.66)',border:'rgba(255,255,255,0.88)',text:'#0B2044',textSecondary:'#365575',textMuted:'#466281',accent:'#075DE1',primary:'#075DE1',accentSoft:'rgba(214,233,255,0.85)'};
const glassNight:typeof light={...dark,background:'#07182F',surface:'rgba(22,46,76,0.88)',surfaceRaised:'rgba(35,66,101,0.90)',border:'#587291',text:'#F6FAFF',textSecondary:'#D0E2F8',textMuted:'#AEC7E2',accent:'#88BCFF',primary:'#286FE3',accentSoft:'#193E6B'};
export type ColorMode = 'glass' | 'glass-night' | 'paper' | 'mono' | 'midnight' | 'system';
export const appearanceChoices = [
  {mode:'glass',name:'Glass',detail:'Blue satin, translucent panels and clear typography.',colors:glass},
  {mode:'glass-night',name:'Glass at night',detail:'Midnight blue with soft, luminous surfaces.',colors:glassNight},
  {mode: 'paper', name: 'Paper', detail: 'Warm ivory, forest accents and soft serif headings.', colors: light},
  {mode: 'mono', name: 'Mono', detail: 'Clean white, charcoal accents and simple headings.', colors: mono},
  {mode: 'midnight', name: 'Midnight', detail: 'Deep charcoal, soft green accents and gentle contrast.', colors: dark},
] as const;
export function getAppearance() {
  const saved = storage.getString('appearance_mode');
  const migrated = saved === 'light' ? 'paper' : saved === 'dark' ? 'midnight' : saved;
  return { mode: (['glass','glass-night','paper','mono','midnight','system'].includes(migrated || '') ? migrated : 'glass') as ColorMode,
    largeText: storage.getString('large_text') === 'true' };
}
let version = 0;
const listeners = new Set<() => void>();
const publish = () => { version++; listeners.forEach(fn => fn()); };
Appearance.addChangeListener(publish);
export const isDark = () => {
  const {mode} = getAppearance();
  return mode === 'midnight' || mode === 'glass-night' || (mode === 'system' && Appearance.getColorScheme() === 'dark');
};
export function setAppearance(mode: ColorMode, largeText: boolean) {
  storage.set('appearance_mode', mode); storage.set('large_text', String(largeText)); publish();
}
export function useAppearance() {
  useSyncExternalStore(fn => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => version);
  return getAppearance();
}
export const isGlass=()=>['glass','glass-night','system'].includes(getAppearance().mode);
export const reducedTransparency=()=>storage.getString('reduce_transparency')==='true';
export function setReducedTransparency(value:boolean){storage.set('reduce_transparency',String(value));publish();}
export const reducedMotion=()=>storage.getString('reduce_motion')==='true';
export function setReducedMotion(value:boolean){storage.set('reduce_motion',String(value));publish();}
const color = new Proxy(light, {get: (_, key: keyof typeof light) => {
  const palette=isGlass()?(isDark()?glassNight:glass):isDark()?dark:getAppearance().mode==='mono'?mono:light;
  if(isGlass()&&reducedTransparency()&&(key==='surface'||key==='surfaceRaised'))return isDark()?'#142C49':'#F4F9FF';
  return palette[key];
}});
export const Theme = { color, get onPrimary(){return isGlass()?'#FFFFFF':color.background;}, get headingFont() { return isGlass() || getAppearance().mode === 'mono' ? 'sans-serif' : 'serif'; }, radius: {sm:10,md:14,lg:18,pill:999},
  space:{xs:4,sm:8,md:12,lg:20,xl:28},touchTarget:48 };
/** Recompute colors without remounting chat or losing its draft. */
export function themedStyles<const T extends Record<string, any>>(factory: () => T): T {
  let stamp = -1; let styles: T;
  return new Proxy({} as T, { get: (_, key: string) => {
    if (stamp !== version) { styles = factory(); stamp = version; }
    return styles[key];
  }});
}
