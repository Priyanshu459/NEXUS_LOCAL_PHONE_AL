import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import {isDark,isGlass,reducedTransparency,useAppearance} from '../constants/theme';
export function GlassBackdrop(){
  useAppearance();if(!isGlass()||reducedTransparency())return null;
  return <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
    <Image source={isDark()?require('../assets/glass/night.png'):require('../assets/glass/satin.png')} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%'}]}/>
  </View>;
}
