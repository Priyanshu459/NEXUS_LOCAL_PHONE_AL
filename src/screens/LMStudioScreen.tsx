import React,{useState} from 'react';
import {ActivityIndicator,Alert,Keyboard,Linking,Pressable,Switch,Text,TextInput,View} from 'react-native';
import {GlassPage,GlassAction} from '../components/GlassPage';
import {ui} from '../components/Design';
import {Theme} from '../constants/theme';
import {listProviders,Provider,saveProvider,refreshProviderModels,removeProvider,selectCloud} from '../services/providers';
import {normalizeStudioUrl} from '../services/lmStudio';
import {storage} from '../services/storage';
import {LMStudioGuide} from '../components/LMStudioGuide';

export function LMStudioScreen({navigation}:any) {
  const existing=listProviders().find(p=>p.id==='lmstudio');
  const [name,setName]=useState(existing?.name||'My computer');
  const [url,setUrl]=useState(existing?.baseUrl||'');
  const [key,setKey]=useState('');const [http,setHttp]=useState(existing?.allowLocalHttp||false);
  const [saved,setSaved]=useState(existing);const [busy,setBusy]=useState(false);const [status,setStatus]=useState('');
  const [dirty,setDirty]=useState(!existing);
  const [mode,setMode]=useState<'local'|'remote'>(storage.getString('lmstudio_access_mode')==='remote'?'remote':'local');
  const field=(label:string,value:string,set:(s:string)=>void)=> <View style={{gap:8}}><Text style={[ui.body,{color:Theme.color.text}]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={v=>{set(v);setDirty(true);}} editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="off" style={ui.input}/></View>;
  const connect=async()=>{
    if(busy)return;Keyboard.dismiss();setBusy(true);setStatus('Connecting to your server and requesting models…');
    try {
      let provider=saved;
      if(dirty||!provider){
        const endpoint=normalizeStudioUrl(url,mode==='local'&&http);
        if(mode==='remote'&&!endpoint.startsWith('https://'))throw new Error('Remote access requires the HTTPS address printed by Tailscale Serve.');
        const preserve=!!saved&&endpoint===saved.baseUrl&&!key.trim();
        if(saved&&endpoint!==saved.baseUrl&&!key.trim())throw new Error('The server address changed. Paste its token again. For a server without authentication, disconnect the old connection first.');
        if(mode==='remote'&&!key.trim()&&!preserve)throw new Error('Enable LM Studio authentication and paste its API token for remote access.');
        provider={id:'lmstudio',name,baseUrl:endpoint,format:'openai',connectionType:'lmstudio',allowLocalHttp:mode==='local'&&http,models:[],webTools:false};
        await saveProvider(provider,key.trim(),preserve,mode==='remote');setKey('');setDirty(false);setUrl(endpoint);storage.set('lmstudio_access_mode',mode);
        provider=listProviders().find(p=>p.id==='lmstudio')!;setSaved(provider);
      }
      const checked=await refreshProviderModels(provider);setSaved(checked);
      setStatus(checked.models.length?`Connected · ${checked.models.length} models. Select one below or open Chat → Computer.`:'Connected, but the API returned no models. Load a text/chat model in LM Studio and tap Show models again.');
    }catch(e:any){setSaved(previous=>previous?{...previous,verified:false}:previous);setStatus(e.message||'Connection failed. Check the setup steps and try again.');}finally{setBusy(false);}
  };
  return <GlassPage title="LM Studio" subtitle="Your computer’s intelligence. Wherever you are." back="Settings" onBack={()=>navigation.goBack()} notice={status?<View accessibilityLiveRegion="polite" style={[ui.card,{padding:12,borderRadius:18}]}>{busy&&<ActivityIndicator color={Theme.color.accent}/>}<Text style={ui.body}>{status}</Text></View>:undefined}>
    <View style={ui.row}>{(['local','remote'] as const).map(value=><Pressable key={value} accessibilityRole="tab" accessibilityState={{selected:mode===value}} disabled={busy} onPress={()=>{setMode(value);setDirty(true);setStatus('');}} style={[ui.primary,ui.flex,{backgroundColor:mode===value?Theme.color.primary:Theme.color.surface}]}><Text style={{color:mode===value?Theme.onPrimary:Theme.color.text}}>{value==='local'?'Same Wi-Fi':'From anywhere'}</Text></Pressable>)}</View>
    <LMStudioGuide mode={mode}/>
    {field('Computer name',name,setName)}{field('Server address',url,setUrl)}
    <Text style={ui.small}>{mode==='local'?'Example: http://192.168.1.20:1234. Use your computer’s address, not localhost.':'Paste the HTTPS address printed by Tailscale Serve. Both devices must be connected to your Tailscale network.'}</Text>
    {field(mode==='remote'?'LM Studio API token':'LM Studio API token · optional',key,setKey)}
    <Text style={ui.small}>{saved?'Leave blank to keep your saved token for the same server address. A new address needs its token entered again.':mode==='remote'?'Enable authentication in LM Studio and paste its token. Remote access requires authentication.':'Paste the LM Studio token. Leave empty only if your local server has authentication disabled.'}</Text>
    {mode==='local'&&<View style={ui.card}><View style={ui.row}><Text style={[ui.body,ui.flex]}>Allow private-network HTTP</Text><Switch accessibilityLabel="Allow private-network HTTP" value={http} disabled={busy} onValueChange={v=>{setHttp(v);setDirty(true);}}/></View><Text style={ui.small}>HTTP is not encrypted by Moonlight. Use it only on a trusted network or your own VPN. Public servers require HTTPS.</Text></View>}
    <GlassAction title={busy?'Connecting…':dirty?'Save & show models':'Show models'} disabled={busy} onPress={()=>void connect()}/>
    {!dirty&&saved?.verified&&saved.models.length>0&&<View style={ui.card}><Text style={[ui.section,{marginTop:0}]}>Available models</Text>{saved.models.map(model=><GlassAction key={model} title={model} disabled={busy} onPress={()=>{selectCloud({providerId:'lmstudio',model});navigation.navigate('Chat');}}/>)}</View>}
    <View style={ui.card}><Text style={[ui.section,{marginTop:0}]}>Already using LM Link?</Text><Text style={ui.body}>Connect to the API server of a computer on your LM Link. That server can route requests to its linked models. Moonlight does not pair directly with LM Link or join its private network.</Text><Text accessibilityRole="link" onPress={()=>void Linking.openURL('https://lmstudio.ai/docs/developer/core/lmlink')} style={[ui.body,{color:Theme.color.accent}]}>LM Studio connection guide ↗</Text></View>
    {saved&&<GlassAction title="Disconnect computer" disabled={busy} onPress={()=>Alert.alert('Disconnect computer?','Remove the saved address and encrypted token. Your conversations stay on this phone.',[{text:'Cancel',style:'cancel'},{text:'Disconnect',style:'destructive',onPress:async()=>{try{await removeProvider('lmstudio');setSaved(undefined);setDirty(true);setStatus('Computer disconnected.');}catch{setStatus('Could not disconnect. Try again.');}}}])}/>}
  </GlassPage>;
}

