import React from 'react';
import {Pressable,ScrollView,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GlassBackdrop} from './GlassBackdrop';
import {Theme,useAppearance} from '../constants/theme';
import {ui,MoonMark} from './Design';

export function GlassPage({title,subtitle,back,onBack,children,notice}:{title:string;subtitle?:string;back:string;onBack:()=>void;children:React.ReactNode;notice?:React.ReactNode}) {
  useAppearance();const insets=useSafeAreaInsets();
  return <View style={[ui.screen,{paddingTop:insets.top}]}><GlassBackdrop/>
    <View style={{paddingHorizontal:20,paddingTop:8,alignItems:'flex-start'}}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${back}`} onPress={onBack} style={({pressed})=>({minHeight:48,paddingHorizontal:18,borderRadius:26,flexDirection:'row',gap:10,alignItems:'center',backgroundColor:Theme.color.surface,opacity:pressed?0.7:1,borderWidth:1,borderColor:Theme.color.border})}>
        <Text style={{fontSize:28,color:Theme.color.text}}>‹</Text><Text style={[ui.body,{color:Theme.color.text}]}>{back}</Text>
      </Pressable>
    </View>
    {notice&&<View style={{marginHorizontal:20,marginTop:12}}>{notice}</View>}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content,{paddingBottom:insets.bottom+32}]}>
      <View style={{gap:8,marginVertical:8,alignItems:'center'}}><MoonMark size={42}/><Text style={[ui.title,{fontWeight:'700',fontSize:30,textAlign:'center'}]}>{title}</Text>{subtitle&&<Text style={[ui.body,{textAlign:'center'}]}>{subtitle}</Text>}</View>
      {children}
    </ScrollView>
  </View>;
}
export function GlassAction({title,onPress,disabled=false}:{title:string;onPress:()=>void;disabled?:boolean}) {
  useAppearance();return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[ui.primary,{borderRadius:28,opacity:disabled?0.45:pressed?0.75:1}]}><Text style={ui.primaryText}>{title}</Text></Pressable>;
}
