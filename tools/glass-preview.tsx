import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {View,Text,TouchableOpacity} from 'react-native';
import {LunarPulse} from '../src/components/LunarPulse';
import {GlassBackdrop} from '../src/components/GlassBackdrop';
import {Theme,useAppearance} from '../src/constants/theme';
function AnimationPreview(){
 useAppearance();const [phase,setPhase]=useState<'listening'|'replying'|'action'|'review'|null>('listening');
 return <View style={{flex:1,backgroundColor:Theme.color.background,padding:24,justifyContent:'center',gap:24}}><GlassBackdrop/>
 <Text style={{fontSize:34,fontWeight:'700',color:Theme.color.text}}>Lunar Pulse</Text>
 <Text style={{fontSize:16,lineHeight:24,color:Theme.color.text}}>Moonlight’s activity animation. Choose a state to see how it moves.</Text>
 <View style={{minHeight:180,justifyContent:'center',borderRadius:32,backgroundColor:Theme.color.surface,borderWidth:1,borderColor:Theme.color.border}}><LunarPulse phase={phase}/></View>
 {(['listening','replying','action','review'] as const).map(p=><TouchableOpacity key={p} accessibilityRole="button" onPress={()=>setPhase(p)} style={{padding:16,borderRadius:20,backgroundColor:phase===p?Theme.color.primary:Theme.color.surface}}><Text style={{color:phase===p?'white':Theme.color.text,fontSize:16}}>{{listening:'Listening',replying:'Replying',action:'Preparing an action',review:'Waiting for your approval'}[p]}</Text></TouchableOpacity>)}
 <Text style={{color:Theme.color.text,fontSize:13}}>Design preview · No microphone or app access. Reduce Motion shows a still indicator.</Text>
 </View>;
}
import {ChatScreen} from '../src/screens/ChatScreen';
import {SettingsScreen} from '../src/screens/SettingsScreen';
import {ProvidersScreen} from '../src/screens/ProvidersScreen';
import {ModelsScreen} from '../src/screens/ModelsScreen';
import {PrivacyPolicyScreen} from '../src/screens/PrivacyPolicyScreen';
import {LMStudioScreen} from '../src/screens/LMStudioScreen';
const screens:any={Animation:AnimationPreview,Chat:ChatScreen,Settings:SettingsScreen,Providers:ProvidersScreen,Models:ModelsScreen,PrivacyPolicy:PrivacyPolicyScreen,LMStudio:LMStudioScreen};
function Preview(){
 const [screen,setScreen]=useState(location.hash.slice(1)||'Chat');const [params,setParams]=useState({});
 const navigation:any={navigate:(name:string,p:any)=>{setParams(p||{});setScreen(name);},goBack:()=>setScreen('Chat'),setParams:(p:any)=>setParams(old=>({...old,...p})),addListener:()=>()=>{}};
 const Component=screens[screen]||ChatScreen;
 return <View style={{flex:1}}><Component navigation={navigation} route={{params}}/></View>;
}
createRoot(document.getElementById('root')!).render(<Preview/>);
