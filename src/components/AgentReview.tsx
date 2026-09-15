import React,{useState} from 'react';
import {Alert,Linking,NativeModules,Share,Text,TouchableOpacity,View} from 'react-native';
import {AgentAction} from '../services/agentActions';
import {ui} from './Design';
export function AgentReview({action,onDismiss}:{action:AgentAction;onDismiss:()=>void}){
  const [busy,setBusy]=useState(false);
  const execute=async()=>{
    if(busy)return;setBusy(true);
    try{
      if(action.type==='maps')await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(action.query)}`);
      else if(action.type==='share')await Share.share({message:action.text});
      else if(NativeModules.DeviceControl?.reviewCalendarEvent)await NativeModules.DeviceControl.reviewCalendarEvent(action.title,Date.parse(action.start),Date.parse(action.end));
      else throw new Error('Install the updated Android build to open Calendar.');
      onDismiss();
    }catch(error:any){Alert.alert('Could not open app',error.message);}finally{setBusy(false);}
  };
  return <View style={[ui.card,{marginTop:16}]}><Text style={ui.small}>READY FOR YOUR REVIEW</Text><Text style={[ui.section,{marginTop:0}]}>{action.type==='calendar'?action.title:action.type==='maps'?'Open Maps':'Share text'}</Text>
    <Text style={ui.body}>{action.type==='calendar'?`${new Date(action.start).toLocaleString()} — ${new Date(action.end).toLocaleString()}`:action.type==='maps'?action.query:action.text}</Text>
    <Text style={ui.small}>Nothing has been sent or saved. Review the details before continuing.</Text>
    <TouchableOpacity accessibilityRole="button" disabled={busy} style={ui.primary} onPress={()=>void execute()}><Text style={ui.primaryText}>{action.type==='calendar'?'Review in Calendar':action.type==='maps'?'Open Maps':'Choose sharing app'}</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={onDismiss} style={{padding:12}}><Text style={ui.body}>Cancel</Text></TouchableOpacity>
  </View>;
}
