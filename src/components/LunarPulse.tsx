import React,{useEffect,useRef,useState} from 'react';
import {AccessibilityInfo,Animated,Easing,Text,View} from 'react-native';
import {Theme,useAppearance,reducedMotion} from '../constants/theme';

/** Decorative activity, never a claim that an action has completed. */
export function LunarPulse({phase}:{phase:'listening'|'replying'|'action'|'review'|null}){
  useAppearance();
  const preferStill=reducedMotion();
  const progress=useRef(new Animated.Value(0)).current;
  const [reduce,setReduce]=useState(true);
  useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(alive)setReduce(v);}).catch(()=>{});const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduce);return()=>{alive=false;sub.remove();};},[]);
  useEffect(()=>{
    progress.setValue(0);
    if(!phase||reduce||preferStill||phase==='review')return;
    const duration=phase==='listening'?850:phase==='action'?1200:1600;
    const loop=Animated.loop(Animated.sequence([
      Animated.timing(progress,{toValue:1,duration,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false}),
      Animated.timing(progress,{toValue:0,duration,easing:Easing.inOut(Easing.sin),useNativeDriver:true,isInteraction:false}),
    ]));loop.start();return()=>loop.stop();
  },[phase,reduce,preferStill,progress]);
  if(!phase)return null;
  const label={listening:'Listening…',replying:'Moonlight is responding…',action:'Preparing an action…',review:'Ready for your review'}[phase];
  return <View accessibilityLiveRegion="polite" style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,paddingVertical:8}}>
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{width:34,height:34,alignItems:'center',justifyContent:'center'}}>
      <Animated.View style={{position:'absolute',width:32,height:32,borderRadius:16,borderWidth:2,borderColor:Theme.color.accent,opacity:progress.interpolate({inputRange:[0,1],outputRange:[0.4,0.85]}),transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[0.8,1.12]})}]}}/>
      <Animated.View style={{width:19,height:19,borderRadius:12,backgroundColor:Theme.color.primary,borderTopWidth:4,borderRightWidth:4,borderColor:Theme.color.textSecondary,transform:[{rotate:progress.interpolate({inputRange:[0,1],outputRange:['-35deg','35deg']})}]}}/>
    </View><Text style={{color:Theme.color.text,fontSize:13,flexShrink:1}}>{label}</Text>
  </View>;
}

