import React, {useEffect, useState} from 'react';
import {Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Theme, useAppearance, setAppearance, appearanceChoices} from '../constants/theme';
import {IconButton, ui} from '../components/Design';
import {AppSettings, defaultSettings, getSettings, saveSettings} from '../services/storage';
import {deleteMemory, getMemories, memoryStorage} from '../services/MemoryManager';
import {validateGgufDownloadUrl} from '../services/modelManager';
import {clearConversations} from '../services/conversations';
import {getSearchConnection, restoreSearchConnection, saveSearchConnection, disconnectSearch} from '../services/webSearch';

const sections = [
  ['Appearance','Theme & reading size'], ['Responses','Style & personal instructions'],
  ['Memory','View, enable or delete'], ['Models & storage','Downloads & active model'],
  ['Conversations','Export & delete'], ['Web search','Alpha connection & privacy'],
  ['Privacy','Understand local processing'], ['Advanced','Model URL & generation controls'],
  ['About & help','Licenses & troubleshooting'],
];
export function SettingsScreen({navigation}: any) {
  const appearance=useAppearance(); const c=Theme.color; const insets=useSafeAreaInsets();
  const [panel,setPanel]=useState(''); const [settings,setSettings]=useState(getSettings);
  const [prompt,setPrompt]=useState(settings.systemPrompt); const [url,setUrl]=useState(settings.modelUrl);
  const [status,setStatus]=useState(''); const [memories,setMemories]=useState(getMemories);
  const [searchEndpoint,setSearchEndpoint]=useState(()=>getSearchConnection().endpoint);
  const [searchCode,setSearchCode]=useState('');
  const [searchConnected,setSearchConnected]=useState(()=>getSearchConnection().connected);
  const [savingSearch,setSavingSearch]=useState(false);
  useEffect(()=>{let active=true;restoreSearchConnection().then(connection=>{if(active){setSearchConnected(connection.connected);setSearchEndpoint(connection.endpoint);}}).catch(error=>{if(active)setStatus(error.message);});return()=>{active=false;};},[]);
  const update=(patch:Partial<AppSettings>)=>{saveSettings({...getSettings(),...patch});setSettings(getSettings());};
  const open=(name:string)=>{
    setStatus('');
    if(name==='Models & storage') { navigation.navigate('Models');return; }
    setPanel(name);
  };
  const button=(title:string,onPress:()=>void,danger=false)=><TouchableOpacity accessibilityRole="button" onPress={onPress} style={[ui.primary,danger&&{backgroundColor:c.destructive}]}><Text style={ui.primaryText}>{title}</Text></TouchableOpacity>;
  const row=(title:string,detail:string,onPress:()=>void)=><TouchableOpacity key={title} accessibilityRole="button" onPress={onPress} style={{minHeight:76,paddingVertical:17,borderBottomWidth:1,borderBottomColor:c.border,flexDirection:'row',alignItems:'center',gap:12}}><View style={ui.flex}><Text style={{color:c.text,fontSize:16,fontWeight:'500'}}>{title}</Text>{!!detail&&<Text style={ui.small}>{detail}</Text>}</View><Text style={ui.body}>›</Text></TouchableOpacity>;
  return <View style={[ui.screen,{paddingTop:insets.top}]}>
    <View style={[ui.row,{paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:c.border}]}>
      <IconButton glyph="‹" label={panel?'Back to settings':'Back to chat'} onPress={()=>panel?setPanel(''):navigation.goBack()}/>
      <Text style={[ui.section,{marginTop:0}]}>{panel||'Settings'}</Text>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[ui.content,{paddingBottom:insets.bottom+30}]}>
      {!panel&&sections.map(([name,detail])=>row(name,detail,()=>open(name)))}
      {panel==='Appearance'&&<>
        <Text style={[ui.title,{fontSize:29}]}>Make it comfortable.</Text>
        <Text style={ui.small}>Choose your look. Changes apply immediately and are saved on this phone.</Text>
        {appearanceChoices.map(choice=><TouchableOpacity key={choice.mode} accessibilityRole="radio" accessibilityLabel={choice.name} accessibilityState={{checked:appearance.mode===choice.mode}} onPress={()=>setAppearance(choice.mode,appearance.largeText)} style={{padding:18,gap:12,borderRadius:16,borderWidth:appearance.mode===choice.mode?2:1,borderColor:appearance.mode===choice.mode?c.accent:c.border,backgroundColor:choice.colors.background}}>
          <View style={ui.row}><Text style={{flex:1,fontSize:20,fontFamily:choice.mode==='mono'?'sans-serif':'serif',color:choice.colors.text}}>{choice.name}</Text><Text style={{fontSize:12,color:choice.colors.textSecondary}}>{appearance.mode===choice.mode?'✓ Selected':'Choose'}</Text></View>
          <Text style={{fontSize:12,lineHeight:19,color:choice.colors.textSecondary}}>{choice.detail}</Text>
          <View style={{flexDirection:'row',gap:8}}>{[choice.colors.surfaceRaised,choice.colors.accentSoft,choice.colors.accent,choice.colors.text].map((color,index)=><View key={index} style={{width:24,height:24,borderRadius:12,backgroundColor:color,borderWidth:1,borderColor:choice.colors.border}}/>)}</View>
        </TouchableOpacity>)}
        {row('Follow system',appearance.mode==='system'?'Selected · Paper by day, Midnight in dark mode':'Switch between Paper and Midnight with your phone’s appearance',()=>setAppearance('system',appearance.largeText))}
        <View style={ui.row}><View style={ui.flex}><Text style={ui.body}>Larger conversation text</Text><Text style={ui.small}>Your phone’s accessibility text scaling also applies.</Text></View><Switch accessibilityLabel="Larger conversation text" value={appearance.largeText} onValueChange={v=>setAppearance(appearance.mode,v)}/></View>
        <View style={ui.card}><Text style={{color:c.text,fontSize:appearance.largeText?20:16,lineHeight:appearance.largeText?30:25}}>A little clarity starts here.</Text><Text style={ui.small}>Reading preview · Saved automatically</Text></View>
      </>}
      {panel==='Responses'&&<>
        <Text style={ui.body}>How should Moonlight respond?</Text>
        <View style={ui.row}>{(['concise','balanced','detailed'] as const).map(style=><TouchableOpacity accessibilityRole="radio" accessibilityState={{checked:settings.responseStyle===style}} key={style} onPress={()=>update({responseStyle:style})} style={{flex:1,paddingVertical:16,borderRadius:12,backgroundColor:settings.responseStyle===style?c.primary:c.surfaceRaised,alignItems:'center'}}><Text style={{color:settings.responseStyle===style?c.background:c.text,fontSize:13}}>{style[0].toUpperCase()+style.slice(1)}</Text></TouchableOpacity>)}</View>
        <Text style={ui.section}>Personal instructions</Text><Text style={ui.small}>Tell Moonlight how you prefer it to help. These instructions stay on your phone.</Text>
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
      {panel==='Web search'&&<>
        <Text style={[ui.title,{fontSize:29}]}>The web, when you need it.</Text>
        <Text style={ui.small}>CLOSED ALPHA · Optional web access</Text>
        <View style={[ui.card,{backgroundColor:c.accentSoft}]}><Text style={[ui.section,{marginTop:0}]}>{searchConnected?'● Connection saved':'○ Set up your connection'}</Text><Text style={ui.body}>{searchConnected?'Ready to try from chat. Your next search will verify access with the server.':'Connect with the server address and private access key supplied by Moonlight’s alpha administrator.'}</Text></View>
        <Text style={ui.section}>Connection details</Text>
        <Text style={ui.small}>Search address</Text><TextInput accessibilityLabel="Search service address" autoCapitalize="none" autoCorrect={false} value={searchEndpoint} onChangeText={setSearchEndpoint} style={ui.input}/>
        <Text style={ui.small}>Your private access key</Text><TextInput accessibilityLabel="Alpha search access code" secureTextEntry autoCapitalize="none" autoCorrect={false} value={searchCode} onChangeText={setSearchCode} style={ui.input}/>
        {button(savingSearch?'Saving securely…':'Save search connection',async()=>{if(savingSearch)return;setSavingSearch(true);try{await saveSearchConnection(searchEndpoint,searchCode);setSearchCode('');setSearchConnected(true);setStatus('Saved securely on this phone. Enable Web in chat. Server access will be checked on your next search.');}catch(error:any){setStatus(error.message);}finally{setSavingSearch(false);}})}
        {searchConnected&&row('Disconnect search','Remove the saved access key from this phone',async()=>{try{await disconnectSearch();setSearchConnected(false);setSearchEndpoint('');setStatus('Search disconnected.');}catch(error:any){setStatus(error.message);}})}
        <View style={ui.card}><Text style={[ui.section,{marginTop:0}]}>Ask naturally</Text><Text style={ui.body}>1. Return to chat and turn Web on.</Text><Text style={ui.body}>2. Type or speak your question.</Text><Text style={ui.body}>3. Moonlight searches automatically and uses the results to answer with source links.</Text></View>
        <Text style={ui.section}>Your conversation stays local</Text>
        <Text style={ui.body}>While Web is on, the first 400 characters of each new message are sent to the configured server and its search engines. This includes spoken messages. Saved history, memories and attachments are not uploaded. Web stays on until you turn it off or restart the app.</Text>
        <Text style={ui.small}>Your key is encrypted on this phone using Android Keystore and restored after restarting. Disconnect removes it. Up to 20 search attempts per tester per UTC day. Busy or failed searches may require retrying.</Text>
      </>}
      {panel==='Privacy'&&<>
        <Text style={[ui.title,{fontSize:29}]}>Know where data goes.</Text>
        <Text style={ui.section}>Conversations & memory</Text><Text style={ui.body}>Text generation runs locally. Chats and memories are stored inside the app’s private storage. App-level database encryption is not enabled.</Text>
        <Text style={ui.section}>Files & voice</Text><Text style={ui.body}>Only text attachments are read by the model, up to 512 KB. Voice recognition uses your phone’s speech service and may process audio online.</Text>
        <Text style={ui.section}>Downloads & sharing</Text><Text style={ui.body}>Models download from Hugging Face. Sharing passes the selected text to an app you choose. Response reporting is unavailable unless configured for the build.</Text>
        <Text style={ui.section}>Optional web search</Text><Text style={ui.body}>When Web is on, search runs automatically using the first 400 characters of your new message. Source links are saved with the answer. Opening a source contacts that website through your browser.</Text>
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
        <Text style={[ui.title,{fontSize:29}]}>Moonlight AI</Text><Text style={ui.body}>Version 1.3.4 · Closed alpha</Text>
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
