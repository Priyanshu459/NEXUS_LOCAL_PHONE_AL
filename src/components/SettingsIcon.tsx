import React from 'react';
import {Text,View} from 'react-native';
import {Theme} from '../constants/theme';

/** Small line drawings avoid platform-dependent emoji in settings. */
export function SettingsIcon({name}:{name:string}) {
  const color=Theme.color.text;
  const frame={borderWidth:1.6,borderColor:color};
  return <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{width:28,height:28,alignItems:'center',justifyContent:'center'}}>
    {name==='LM Studio'?<><View style={[frame,{width:22,height:16,borderRadius:3}]}/><View style={{width:27,height:1.6,backgroundColor:color,marginTop:3}}/></>:
    name==='Models & storage'||name==='Memory'?<><View style={[frame,{width:19,height:22,borderRadius:5}]}/><View style={{position:'absolute',width:18,height:1.6,backgroundColor:color,top:11}}/><View style={{position:'absolute',width:18,height:1.6,backgroundColor:color,top:18}}/></>:
    name==='Privacy'?<><View style={[frame,{position:'absolute',top:1,width:11,height:13,borderRadius:7}]}/><View style={[frame,{width:20,height:16,borderRadius:4,marginTop:9,backgroundColor:Theme.color.surface}]}/></>:
    name==='Responses'||name==='Conversations'?<><View style={[frame,{width:23,height:18,borderRadius:5}]}/><View style={{position:'absolute',width:6,height:6,borderLeftWidth:1.6,borderColor:color,bottom:1,left:6,transform:[{skewY:'-35deg'}]}}/></>:
    name==='Appearance'?<><View style={[frame,{width:13,height:13,borderRadius:8}]}/>{[0,45,90,135].map(angle=><View key={angle} style={{position:'absolute',width:27,height:1.5,transform:[{rotate:`${angle}deg`}],flexDirection:'row',justifyContent:'space-between'}}><View style={{width:4,height:1.5,backgroundColor:color}}/><View style={{width:4,height:1.5,backgroundColor:color}}/></View>)}</>:
    name==='AI providers'?<>{[0,6,12].map(top=><View key={top} style={[frame,{position:'absolute',top:top+3,width:18,height:9,borderRadius:3,transform:[{rotate:'-12deg'}],backgroundColor:Theme.color.surface}]}/>)}</>:
    <View style={[frame,{width:22,height:22,borderRadius:12,alignItems:'center',justifyContent:'center'}]}><Text style={{color,fontSize:14,fontWeight:'600'}}>{name==='Advanced'?'⋯':'?'}</Text></View>}
  </View>;
}
