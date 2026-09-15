import React, {useEffect, useState} from 'react';
import {AppState, Text, Pressable, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Theme, useAppearance} from '../constants/theme';
import {AvailableUpdate, checkAppUpdate, openUpdateStore} from '../services/appUpdates';

export function AppUpdateNotice() {
  useAppearance();
  const insets = useSafeAreaInsets();
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);
  const [dismissed, setDismissed] = useState<number>();
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    const check = () => { void checkAppUpdate().then(value => { if (mounted) setUpdate(value); }); };
    check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') check(); });
    return () => { mounted = false; subscription.remove(); };
  }, []);
  if (!update || update.versionCode === dismissed) return null;
  return <View accessibilityLiveRegion="polite" style={{paddingTop:insets.top + 8,paddingHorizontal:16,paddingBottom:12,backgroundColor:Theme.color.background}}>
    <View style={{borderRadius:22,padding:16,borderWidth:1,borderColor:Theme.color.border,backgroundColor:Theme.color.surface}}>
      <Text style={{fontSize:17,fontWeight:'700',color:Theme.color.text}}>A new Moonlight is available</Text>
      <Text style={{fontSize:14,lineHeight:21,color:Theme.color.textSecondary,marginTop:4}}>Update on Google Play for the latest improvements.</Text>
      {error && <Text accessibilityRole="alert" style={{color:Theme.color.destructive,marginTop:8}}>Couldn’t open Google Play. Please try again.</Text>}
      <View style={{flexDirection:'row',gap:12,marginTop:10,flexWrap:'wrap'}}>
        <Pressable accessibilityRole="button" accessibilityLabel="Update Moonlight on Google Play" disabled={opening} accessibilityState={{disabled:opening}} onPress={async () => {
          setOpening(true); setError(false);
          try { await openUpdateStore(); } catch { setError(true); } finally { setOpening(false); }
        }} style={{minHeight:48,paddingHorizontal:20,justifyContent:'center',borderRadius:24,backgroundColor:Theme.color.primary}}>
          <Text style={{color:Theme.onPrimary,fontWeight:'700'}}>{opening ? 'Opening…' : 'Update'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Not now" onPress={() => setDismissed(update.versionCode)} style={{minHeight:48,paddingHorizontal:16,justifyContent:'center'}}>
          <Text style={{color:Theme.color.textSecondary}}>Not now</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}
