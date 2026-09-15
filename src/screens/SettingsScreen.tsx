import React, {useEffect, useState} from 'react';
import {Alert, Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Theme, useAppearance, setAppearance, appearanceChoices,reducedTransparency,setReducedTransparency,reducedMotion,setReducedMotion} from '../constants/theme';
import {GlassBackdrop} from '../components/GlassBackdrop';
import {IconButton, ui} from '../components/Design';
import {AppSettings, defaultSettings, getSettings, saveSettings} from '../services/storage';
import {deleteMemory, getMemories, memoryStorage} from '../services/MemoryManager';
import {validateGgufDownloadUrl} from '../services/modelManager';
import {clearConversations} from '../services/conversations';
import {MoonMark} from '../components/Design';
import {SettingsIcon} from '../components/SettingsIcon';

const sections = [
  ['AI providers','Your API keys & cloud models'],
  ['Appearance','Theme & reading size'], ['Responses','Style & personal instructions'],
  ['Memory','View, enable or delete'], ['Models & storage','Downloads & active model'],
  ['LM Studio','Connect your computer & linked models'],
  ['Conversations','Export & delete'],
  ['Privacy','Understand local processing'], ['Advanced','Model URL & generation controls'],
  ['About & help','Licenses & troubleshooting'],
];
export function SettingsScreen({navigation}: any) {
  const appearance=useAppearance(); const c=Theme.color; const insets=useSafeAreaInsets();
  const [panel,setPanel]=useState(''); const [settings,setSettings]=useState(getSettings);
  const [prompt,setPrompt]=useState(settings.systemPrompt); const [url,setUrl]=useState(settings.modelUrl);
  const [status,setStatus]=useState(''); const [memories,setMemories]=useState(getMemories);
  const update=(patch:Partial<AppSettings>)=>{saveSettings({...getSettings(),...patch});setSettings(getSettings());};
  const open=(name:string)=>{
    if(name==='AI providers'){navigation.navigate('Providers');return;}
    if(name==='LM Studio'){navigation.navigate('LMStudio');return;}
    setStatus('');
    if(name==='Models & storage') { navigation.navigate('Models');return; }
    setPanel(name);
  };
  const button=(title:string,onPress:()=>void,danger=false)=><TouchableOpacity accessibilityRole="button" onPress={onPress} style={[ui.primary,danger&&{backgroundColor:c.destructive}]}><Text style={ui.primaryText}>{title}</Text></TouchableOpacity>;
  const row=(title:string,detail:string,onPress:()=>void)=><TouchableOpacity key={title} accessibilityRole="button" onPress={onPress} style={{minHeight:64,paddingVertical:14,borderBottomWidth:1,borderBottomColor:c.border,flexDirection:'row',alignItems:'center',gap:14}}><SettingsIcon name={title}/><View style={ui.flex}><Text style={{color:c.text,fontSize:16,fontWeight:'500'}}>{title}</Text>{!!detail&&<Text style={ui.small}>{detail}</Text>}</View><Text style={ui.body}>›</Text></TouchableOpacity>;
  return <View style={[ui.screen,{paddingTop:insets.top}]}>
    <GlassBackdrop/>
    <View style={[ui.row,{marginHorizontal:20,marginTop:8,alignSelf:'flex-start',paddingRight:18,borderRadius:28,backgroundColor:c.surface,borderWidth:1,borderColor:c.border}]}>
      <IconButton glyph="‹" label={panel?'Back to settings':'Back to chat'} onPress={()=>panel?setPanel(''):navigation.goBack()}/>
      <Text style={ui.body}>{panel?'Settings':'Chat'}</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content,{paddingBottom:insets.bottom+30}]}>
      {!panel&&<>
        <View style={{alignItems:'center',gap:8,marginBottom:8}}><MoonMark size={44}/><Text style={[ui.title,{fontSize:30,fontWeight:'700'}]}>Settings</Text><Text style={ui.body}>Your Moonlight, your way.</Text></View>
        {[sections.slice(1,4),[sections[0],sections[4],sections[5]],sections.slice(6)].map((group,index)=><View key={index} style={{gap:8}}><Text style={[ui.small,{letterSpacing:1.5,marginLeft:14}]}>{['MAKE IT YOURS','YOUR INTELLIGENCE','DATA & SUPPORT'][index]}</Text><View style={[ui.card,{paddingHorizontal:20,paddingVertical:0,borderRadius:28,overflow:'hidden'}]}>{group.map(([name,detail])=>row(name,detail,()=>open(name)))}</View></View>)}
      </>}
      {!!panel&&<View style={{alignItems:'center',gap:8}}><MoonMark size={40}/><Text style={[ui.title,{fontWeight:'700',fontSize:30,textAlign:'center'}]}>{panel}</Text></View>}
      {panel==='Appearance'&&<>
        <View style={[ui.row,{justifyContent:'center',gap:18}]}>{(['glass','glass-night'] as const).map(mode=><TouchableOpacity key={mode} accessibilityRole="radio" accessibilityLabel={mode==='glass'?'Preview Glass':'Preview Glass at night'} accessibilityState={{checked:appearance.mode===mode}} onPress={()=>setAppearance(mode,appearance.largeText)} style={{width:'44%',maxWidth:180,height:230,borderRadius:26,overflow:'hidden',borderWidth:appearance.mode===mode?3:1,borderColor:appearance.mode===mode?c.accent:c.border}}><Image source={mode==='glass'?require('../assets/glass/satin.png'):require('../assets/glass/night.png')} style={{position:'absolute',width:'100%',height:'100%'}}/><View style={{margin:12,marginTop:30,borderRadius:18,padding:12,backgroundColor:mode==='glass'?'#ffffffcc':'#193857dd'}}><Text style={{color:mode==='glass'?'#0B2044':'#F6FAFF',fontSize:15,fontWeight:'700'}}>Moonlight</Text></View><View style={{flex:1}}/><View style={{margin:12,padding:10,borderRadius:18,backgroundColor:mode==='glass'?'#ffffffdd':'#193857dd'}}><Text style={{color:mode==='glass'?'#0B2044':'#F6FAFF',fontSize:12}}>Ask Moonlight…</Text></View></TouchableOpacity>)}</View>
        <View style={ui.row}><View style={ui.flex}><Text style={ui.body}>Reduce transparency</Text><Text style={ui.small}>Solid surfaces for easier reading.</Text></View><Switch accessibilityLabel="Reduce transparency" value={reducedTransparency()} onValueChange={setReducedTransparency}/></View>
        <View style={ui.row}><View style={ui.flex}><Text style={ui.body}>Reduce motion</Text><Text style={ui.small}>Keep the activity indicator still. Phone accessibility settings also apply.</Text></View><Switch accessibilityLabel="Reduce motion" value={reducedMotion()} onValueChange={setReducedMotion}/></View>
        <Text style={ui.small}>Choose your look. Changes apply immediately and are saved on this phone.</Text>
        {appearanceChoices.map(choice=><TouchableOpacity key={choice.mode} accessibilityRole="radio" accessibilityLabel={choice.name} accessibilityState={{checked:appearance.mode===choice.mode}} onPress={()=>setAppearance(choice.mode,appearance.largeText)} style={{padding:18,gap:12,borderRadius:16,borderWidth:appearance.mode===choice.mode?2:1,borderColor:appearance.mode===choice.mode?c.accent:c.border,backgroundColor:choice.colors.background}}>
          <View style={ui.row}><Text style={{flex:1,fontSize:20,fontFamily:choice.mode==='mono'?'sans-serif':'serif',color:choice.colors.text}}>{choice.name}</Text><Text style={{fontSize:12,color:choice.colors.textSecondary}}>{appearance.mode===choice.mode?'✓ Selected':'Choose'}</Text></View>
          <Text style={{fontSize:12,lineHeight:19,color:choice.colors.textSecondary}}>{choice.detail}</Text>
          <View style={{flexDirection:'row',gap:8}}>{[choice.colors.surfaceRaised,choice.colors.accentSoft,choice.colors.accent,choice.colors.text].map((color,index)=><View key={index} style={{width:24,height:24,borderRadius:12,backgroundColor:color,borderWidth:1,borderColor:choice.colors.border}}/>)}</View>
        </TouchableOpacity>)}
        {row('Follow system',appearance.mode==='system'?'Selected · Glass by day, Glass at night in dark mode':'Switch the Glass theme with your phone’s appearance',()=>setAppearance('system',appearance.largeText))}
        <View style={ui.row}><View style={ui.flex}><Text style={ui.body}>Larger conversation text</Text><Text style={ui.small}>Your phone’s accessibility text scaling also applies.</Text></View><Switch accessibilityLabel="Larger conversation text" value={appearance.largeText} onValueChange={v=>setAppearance(appearance.mode,v)}/></View>
        <View style={ui.card}><Text style={{color:c.text,fontSize:appearance.largeText?20:16,lineHeight:appearance.largeText?30:25}}>A little clarity starts here.</Text><Text style={ui.small}>Reading preview · Saved automatically</Text></View>
      </>}
      {panel==='Responses'&&<>
        <Text style={ui.body}>How should Moonlight respond?</Text>
        <View style={ui.row}>{(['concise','balanced','detailed'] as const).map(style=><TouchableOpacity accessibilityRole="radio" accessibilityState={{checked:settings.responseStyle===style}} key={style} onPress={()=>update({responseStyle:style})} style={{flex:1,paddingVertical:16,borderRadius:12,backgroundColor:settings.responseStyle===style?c.primary:c.surfaceRaised,alignItems:'center'}}><Text style={{color:settings.responseStyle===style?c.background:c.text,fontSize:13}}>{style[0].toUpperCase()+style.slice(1)}</Text></TouchableOpacity>)}</View>
        <Text style={ui.section}>Personal instructions</Text><Text style={ui.small}>Tell Moonlight how you prefer it to help. Cloud chats include these instructions with your request.</Text>
        <TextInput accessibilityLabel="Personal instructions" multiline maxLength={4000} value={prompt} onChangeText={setPrompt} style={[ui.input,{minHeight:180,textAlignVertical:'top'}]}/>
        {button('Save instructions',()=>{if(!prompt.trim()){setStatus('Write an instruction before saving.');return;}update({systemPrompt:prompt.trim()});setStatus('Instructions saved.');})}
      </>}
      {panel==='Memory'&&<>
        <View style={ui.row}><View style={ui.flex}><Text style={ui.section}>Use saved memory</Text><Text style={ui.small}>Turning this off does not delete saved items.</Text></View><Switch accessibilityLabel="Enable memory" value={settings.memoryEnabled} onValueChange={v=>update({memoryEnabled:v})}/></View>
        <Text style={ui.small}>The model can propose useful details to remember. Review and remove them here.</Text>
        {!memories.length&&<Text style={ui.body}>No saved memories yet.</Text>}
        {memories.map(m=><View key={m.id} style={[ui.row,{borderBottomWidth:1,borderBottomColor:c.border,paddingVertical:14}]}><Text style={[ui.body,ui.flex]}>{m.content}</Text><IconButton glyph="×" label={`Delete memory: ${m.content}`} onPress={()=>{deleteMemory(m.id);setMemories(getMemories());}}/></View>)}
        {!!memories.length&&button('Delete all memories',()=>Alert.alert('Delete all memories?','This cannot be undone. Chats and models are kept.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>{memoryStorage.remove('memories');setMemories([]);}}]),true)}
      </>}
      {panel==='Conversations'&&<>
        <Text style={ui.body}>Share a conversation as text through your phone’s share sheet.</Text>
        {button('Open conversation history',()=>navigation.navigate('Chat',{openHistory:true}))}
        <View style={{marginTop:40,gap:16}}><Text style={ui.small}>Clearing history removes all saved conversations. Your downloaded models and saved memories are kept.</Text>
        {button('Delete all conversations',()=>Alert.alert('Delete all conversations?','This cannot be undone. Models and saved memories are kept.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>{clearConversations();setStatus('Conversation history deleted.');}}]),true)}</View>
      </>}
      {panel==='Privacy'&&<>
        <Text style={[ui.title,{fontSize:29}]}>Know where data goes.</Text>
        <Text style={ui.section}>Conversations & memory</Text><Text style={ui.body}>On-device models generate locally. Cloud models send recent conversation text to your chosen provider after confirmation. Chats and memories remain saved in private app storage; the chat database is not encrypted. API keys are stored separately with Android Keystore encryption.</Text>
        <Text style={ui.section}>Files & voice</Text><Text style={ui.body}>Only text attachments are read by the model, up to 512 KB. Voice recognition uses your phone’s speech service and may process audio online.</Text>
        <Text style={ui.section}>Downloads & sharing</Text><Text style={ui.body}>Models download from Hugging Face. Sharing passes the selected text to an app you choose. Response reporting is unavailable unless configured for the build.</Text>
        <Text style={ui.section}>Optional web search</Text><Text style={ui.body}>Supported cloud models can decide to use provider web search. The provider receives your conversation and may send queries to search services. Search can incur provider charges. Source links are saved with the answer. On-device models do not browse.</Text>
        {row('Read privacy policy','',()=>navigation.navigate('PrivacyPolicy'))}
      </>}
      {panel==='Advanced'&&<>
        <Text style={ui.body}>These settings affect generation. Larger response limits still have to fit the model’s available context.</Text>
        <Text style={ui.section}>Custom Hugging Face model</Text><TextInput accessibilityLabel="Model download URL" multiline autoCapitalize="none" autoCorrect={false} value={url} onChangeText={setUrl} style={[ui.input,{minHeight:100,textAlignVertical:'top'}]}/>
        {button('Save model URL',()=>{const error=validateGgufDownloadUrl(url);if(error){setStatus(error);return;}update({modelUrl:url.trim()});setStatus('Model URL saved. Return to chat to download it.');})}
        {([{key:'temperature',label:'Temperature',help:'Higher values add variety.',step:0.1,min:0,max:2},
          {key:'top_p',label:'Top P',help:'Limits the probability pool.',step:0.05,min:0,max:1},
          {key:'top_k',label:'Top K',help:'Limits candidate tokens.',step:1,min:1,max:100},
          {key:'maxTokens',label:'Response token limit',help:'Maximum new tokens per answer.',step:128,min:64,max:2048}] as const).map(item=><View key={item.key} style={ui.row}><View style={ui.flex}><Text style={ui.body}>{item.label}</Text><Text style={ui.small}>{item.help}</Text></View><IconButton glyph="−" label={`Decrease ${item.label}`} onPress={()=>update({[item.key]:Math.max(item.min,Number((settings[item.key]-item.step).toFixed(2)))})}/><Text style={ui.body}>{settings[item.key]}</Text><IconButton glyph="＋" label={`Increase ${item.label}`} onPress={()=>update({[item.key]:Math.min(item.max,Number((settings[item.key]+item.step).toFixed(2)))})}/></View>)}
      </>}
      {panel==='About & help'&&<>
        <Text style={[ui.title,{fontSize:29}]}>Moonlight AI</Text><Text style={ui.body}>Version 1.6.1 · Glass alpha</Text>
        {row('Model licenses & attribution','',()=>navigation.navigate('ModelAttribution'))}
        {row('Privacy policy','',()=>navigation.navigate('PrivacyPolicy'))}
        <Text style={ui.section}>Download failed?</Text><Text style={ui.body}>Check your connection and available storage, then retry. Keep the app open during large downloads.</Text>
        <Text style={ui.section}>Slow or failed responses?</Text><Text style={ui.body}>Try a smaller model, close other apps, or shorten the conversation. Device recommendations are estimates, not speed guarantees.</Text>
        <Text style={ui.section}>Voice unavailable?</Text><Text style={ui.body}>Install or enable a speech-recognition service on your phone. You can always type instead.</Text>
        {button('Reset response preferences',()=>Alert.alert('Reset preferences?','Chats, memories, models and appearance are kept.',[{text:'Cancel',style:'cancel'},{text:'Reset',onPress:()=>{update({...defaultSettings,modelUrl:getSettings().modelUrl});setPrompt(defaultSettings.systemPrompt);setStatus('Response preferences reset.');}}]))}
      </>}
      {!!status&&<Text accessibilityLiveRegion="polite" style={ui.body}>{status}</Text>}
    </ScrollView>
  </View>;
}







