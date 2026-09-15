import React,{useState} from 'react';
import {Alert,KeyboardAvoidingView,Platform,ScrollView,Switch,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GlassBackdrop} from '../components/GlassBackdrop';
import {IconButton,ui} from '../components/Design';
import {Theme,useAppearance} from '../constants/theme';
import {ApiFormat,Provider,PROVIDER_PRESETS,listProviders,saveProvider,removeProvider,refreshProviderModels,providerFormat,setProviderWebTools} from '../services/providers';

export function ProvidersScreen({navigation}:any){
  useAppearance();const c=Theme.color;const insets=useSafeAreaInsets();
  const [providers,setProviders]=useState(listProviders);const [editing,setEditing]=useState<Provider|null>(null);
  const [key,setKey]=useState('');const [manual,setManual]=useState('');const [status,setStatus]=useState('');const [busy,setBusy]=useState(false);
  const [visible,setVisible]=useState(true);
  const open=(preset:Omit<Provider,'models'>)=>{const existing=providers.find(p=>p.id===preset.id);const value=existing||{...preset,models:[]};setEditing({...value,format:providerFormat(value)});setManual(existing?.models.join('\n')||'');setKey('');setStatus('');};
  const button=(label:string,action:()=>void)=><TouchableOpacity accessibilityRole="button" disabled={busy} style={[ui.primary,busy&&{opacity:0.5}]} onPress={action}><Text style={ui.primaryText}>{label}</Text></TouchableOpacity>;
  const field=(label:string,value:string,change:(text:string)=>void)=><View style={{gap:8}}><Text style={ui.body}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={change} autoCapitalize="none" autoCorrect={false} style={ui.input}/></View>;
  const save=async()=>{
    if(!editing)return;setBusy(true);setStatus('');
    try{
      const models=manual.split(/[\n,]/).map(s=>s.trim()).filter(Boolean);
      if(models.some(m=>m.length>200)||models.length>200)throw new Error('Use model IDs under 200 characters; up to 200 models.');
      await saveProvider({...editing,models},key);
      setKey('');setEditing({...editing,models,verified:false});setProviders(listProviders());
      setStatus('Saved securely. Load models to check the connection, or select your model ID in chat.');
    }catch(error:any){setStatus(error.message);}finally{setBusy(false);}
  };
  const load=async()=>{
    const saved=providers.find(p=>p.id===editing?.id);if(!saved){setStatus('Save the connection first.');return;}
    setBusy(true);try{const result=await refreshProviderModels(saved);setProviders(listProviders());setEditing(result);setManual(result.models.join('\n'));setStatus(result.models.length?`Connection checked · ${result.models.length} models listed. Some may not support text chat or tools.`:'Connection checked. Enter a text model ID if none are listed.');}catch(error:any){setStatus(error.message);}finally{setBusy(false);}
  };
  return <View style={[ui.screen,{paddingTop:insets.top}]}><GlassBackdrop/>
    <View style={[ui.row,{paddingHorizontal:12}]}><IconButton glyph="‹" label={editing?'Back to providers':'Back to settings'} disabled={busy} onPress={()=>editing?setEditing(null):navigation.goBack()}/><Text style={ui.body}>{editing?'AI providers':'Settings'}</Text></View>
    <KeyboardAvoidingView style={ui.flex} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content,{paddingBottom:insets.bottom+24}]}>
      <Text style={[ui.title,{fontSize:32}]}>{editing?editing.name:'AI providers'}</Text>
      {!editing?<>
        <Text style={ui.body}>Connect your own API keys. Choose your model right from chat.</Text>
        <View style={[ui.card,{paddingVertical:4}]}>{[...PROVIDER_PRESETS,...providers.filter(p=>p.connectionType!=='lmstudio'&&!PROVIDER_PRESETS.some(s=>s.id===p.id))].map(p=>{
          const saved=providers.find(s=>s.id===p.id);return <TouchableOpacity key={p.id} accessibilityRole="button" onPress={()=>open(p)} style={[ui.row,{minHeight:72,borderBottomWidth:1,borderBottomColor:c.border}]}>
            <View style={{width:36,height:36,borderRadius:18,backgroundColor:c.accentSoft,alignItems:'center',justifyContent:'center'}}><Text style={{color:c.text,fontWeight:'700'}}>{p.name[0]}</Text></View>
            <Text style={[ui.body,ui.flex,{color:c.text}]}>{p.name}</Text><Text style={ui.small}>{saved?saved.verified?'Checked':'Key saved':'Add key'} ›</Text>
          </TouchableOpacity>;
        })}</View>
        {button('＋ Custom provider',()=>open({id:`custom-${Date.now().toString(36)}`,name:'Custom provider',baseUrl:'',format:'openai'}))}
        <TouchableOpacity accessibilityRole="button" onPress={()=>navigation.navigate('LMStudio')} style={[ui.card,ui.row]}><View style={ui.flex}><Text style={[ui.section,{marginTop:0}]}>LM Studio</Text><Text style={ui.small}>Connect models running on your computer</Text></View><Text style={ui.body}>›</Text></TouchableOpacity>
        <View style={ui.card}><Text style={[ui.section,{marginTop:0}]}>Your key stays yours</Text><Text style={ui.body}>Keys are encrypted on this phone. Cloud chat sends conversation text to your selected provider. API charges and provider privacy policies apply.</Text></View>
        <Text style={ui.small}>OpenAI-compatible, Gemini and Anthropic text APIs are supported. Custom endpoints may differ; model discovery is limited to the first 200 returned models.</Text>
      </>:<>
        {field('Connection name',editing.name,name=>setEditing({...editing,name}))}
        <Text style={ui.body}>API format</Text>{editing.baseUrl.includes('://integrate.api.nvidia.com')&&<Text style={ui.small}>NVIDIA uses OpenAI compatible for every hosted model, including Gemma, DeepSeek and Nemotron models. This is selected automatically.</Text>}<View style={[ui.row,{flexWrap:'wrap'}]}>{(['openai','anthropic','gemini'] as ApiFormat[]).map(format=><TouchableOpacity key={format} accessibilityRole="radio" accessibilityState={{checked:editing.format===format}} disabled={busy||(providerFormat({...editing,format:'gemini'})==='openai'&&format!=='openai')} onPress={()=>setEditing({...editing,format})} style={{padding:14,borderRadius:16,backgroundColor:editing.format===format?c.accentSoft:c.surface}}><Text style={ui.body}>{format==='openai'?'OpenAI compatible':format}</Text></TouchableOpacity>)}</View>
        {field('HTTPS base URL',editing.baseUrl,baseUrl=>setEditing({...editing,baseUrl,format:providerFormat({...editing,baseUrl})}))}
        <Text style={ui.small}>For Alibaba, use the endpoint matching your API key’s region.</Text>
        <Text style={ui.body}>API key</Text><View style={ui.row}><TextInput accessibilityLabel="Provider API key" value={key} onChangeText={setKey} secureTextEntry={!visible} autoComplete="off" textContentType="none" contextMenuHidden={false} autoCapitalize="none" autoCorrect={false} style={[ui.input,ui.flex]}/><IconButton glyph={visible?'◉':'○'} label={visible?'Hide key':'Show key'} onPress={()=>setVisible(!visible)}/></View>
        <Text style={ui.small}>Paste a key to save or replace the connection. Saved keys are never displayed.</Text>
        <View style={ui.card}><Text style={ui.body}>Automatic provider search</Text><Text style={ui.small}>Supported OpenAI and Anthropic models decide when to search. Search fees and account restrictions may apply. Other providers currently use text chat only.</Text>{providers.some(p=>p.id===editing.id) && /^https:\/\/api\.(openai|anthropic)\.com\//.test(editing.baseUrl) && <Switch accessibilityLabel="Allow provider web search" value={editing.webTools!==false} onValueChange={enabled=>{setProviderWebTools(editing.id,enabled);setEditing({...editing,webTools:enabled});setProviders(listProviders());}}/>}</View><Text style={ui.body}>Model IDs · optional</Text><TextInput accessibilityLabel="Model IDs" value={manual} onChangeText={setManual} multiline autoCapitalize="none" autoCorrect={false} style={[ui.input,{minHeight:90,maxHeight:180,textAlignVertical:'top'}]}/>
        <Text style={ui.small}>One ID per line. Use this if your endpoint cannot list models.</Text>
        {button(busy?'Working…':'Save provider',()=>void save())}
        {providers.some(p=>p.id===editing.id)&&button('Load models / check connection',()=>void load())}
        {providers.some(p=>p.id===editing.id)&&<TouchableOpacity accessibilityRole="button" disabled={busy} style={{padding:16}} onPress={()=>Alert.alert('Remove provider?','The encrypted key and model list will be deleted. Chats stay on your phone.',[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:async()=>{try{setBusy(true);await removeProvider(editing.id);setProviders(listProviders());setEditing(null);}catch(error:any){setStatus(error.message);}finally{setBusy(false);}}}])}><Text style={{color:c.destructive}}>Remove provider</Text></TouchableOpacity>}
      </>}
      {!!status&&<Text accessibilityLiveRegion="polite" style={[ui.body,ui.card]}>{status}</Text>}
    </ScrollView></KeyboardAvoidingView>
  </View>;
}





