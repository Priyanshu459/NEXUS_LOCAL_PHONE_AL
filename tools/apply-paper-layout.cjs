const fs = require('fs');
const read = p => fs.readFileSync(p,'utf8');
const write = (p,s) => fs.writeFileSync(p,s);
// Keep source and asset history intact; restyle existing components through live palette styles.
const files = ['src/components/Design.tsx','src/components/AppHeader.tsx','src/screens/ChatScreen.tsx',
  'src/screens/ModelsScreen.tsx','src/screens/GalleryScreen.tsx','src/screens/WorkspaceScreen.tsx',
  'src/screens/PrivacyPolicyScreen.tsx','src/screens/ModelAttributionScreen.tsx'];
for (const p of files) {
 let s=read(p);
 s=s.replace("import { Theme }", "import { Theme, themedStyles, useAppearance }");
 if(!s.includes('import { Theme')) s="import { Theme, themedStyles, useAppearance } from '../constants/theme';\n"+s;
 s=s.replaceAll('StyleSheet.create({','themedStyles(() => ({');
 // These modules end in the stylesheet declaration.
 s=s.replace(/\}\);\s*$/, '}));\n');
 if(p.includes('screens/')) s=s.replace(/(export function \w+\([^\n]*\) \{)/, '$1\n  useAppearance();');
 if(p.endsWith('Design.tsx')) {
   s=s.replace('  return (','  useAppearance();\n  return (');
   s=s.replace("fontSize: 36,", "fontFamily: 'serif',\n    fontSize: 34,").replace("borderRadius: 22,","borderRadius: 16,");
 }
 if(p.endsWith('AppHeader.tsx')) s=s.replace('  return (','  useAppearance();\n  return (');
 if(p.endsWith('ChatScreen.tsx')) {
   s=s.replace(/(\w+): Theme.color.(\w+),/g, 'get $1() { return Theme.color.$2; },');
   s=s.replace('  const reportingConfigured', '  useAppearance();\n  const reportingConfigured');
 }
 s=s.replaceAll("'#202730'",'Theme.color.accentSoft');
 write(p,s);
}
// Chat is the root, with supporting screens in a stack rather than tabs.
let a=read('App.tsx');
a=a.replace("import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';", "import { Theme, useAppearance, isDark } from './src/constants/theme';");
a=a.replace("import { MoonDock } from './src/components/MoonDock';",'');
a=a.replace('  MainTabs: undefined;', '  Home: undefined;\n  Tools: undefined;\n  Models: undefined;');
a=a.replace('newConversation?: boolean','newConversation?: boolean; openHistory?: boolean');
const start=a.indexOf('const Tab ='); const end=a.indexOf('function App()',start);
a=a.slice(0,start)+a.slice(end);
a=a.replace('  const [splashDone', '  useAppearance();\n  const [splashDone');
a=a.replace('barStyle="light-content"',"barStyle={isDark() ? 'light-content' : 'dark-content'}");
a=a.replace('initialRouteName="MainTabs"','initialRouteName="Chat"').replace("backgroundColor: '#141517'",'backgroundColor: Theme.color.background');
a=a.replace('<Stack.Screen name="MainTabs" component={MainTabs} />','<Stack.Screen name="Home" component={WorkspaceScreen} />\n          <Stack.Screen name="Tools" component={GalleryScreen} />\n          <Stack.Screen name="Models" component={ModelsScreen} />');
write('App.tsx',a);
let chat=read('src/screens/ChatScreen.tsx');
chat=chat.replace("import { useSafeAreaInsets }", "import { useIsFocused } from '@react-navigation/native';\nimport { ConversationDrawer } from '../components/ConversationDrawer';\nimport { getDeviceRecommendation } from '../services/deviceRecommendation';\nimport { storage, defaultSettings } from '../services/storage';\nimport { getModelFilenameFromUrl } from '../services/modelManager';\nimport { useSafeAreaInsets }");
chat=chat.replace('  const conversationId =', "  const focused = useIsFocused();\n  const [drawer, setDrawer] = useState(false);\n  const [recommendation, setRecommendation] = useState('');\n  const [recommendedId, setRecommendedId] = useState('');\n  const conversationId =");
chat=chat.replace("  const modelFilename =\n    settings.modelUrl.split('/').pop()?.split('?')[0] || 'model.gguf';", '  const modelFilename = getModelFilenameFromUrl(settings.modelUrl);');
const anchor='  useEffect(() => {\n    if (route?.params?.initialPrompt)';
chat=chat.replace(anchor, `  useEffect(() => {
    let active = true;
    getDeviceRecommendation().then(async result => {
      if (!active) return;
      setRecommendation(result.reason); setRecommendedId(result.model.id);
      const saved = getSettings();
      if (!storage.getString('model_recommendation_done') && saved.modelUrl === defaultSettings.modelUrl) {
        const exists = await checkModelExists(getModelFilenameFromUrl(saved.modelUrl));
        if (!active) return;
        if (!exists) { const next = {...saved, modelUrl: result.model.url}; saveSettings(next); setSettings(next); }
      }
      storage.set('model_recommendation_done', 'true');
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (route.params?.openHistory) { setDrawer(true); navigation.setParams({openHistory: false}); }
    if (route.params?.conversationId) {
      const found = listConversations().find(c => c.id === route.params?.conversationId);
      if (found) { conversationId.current = found.id; setMessages(found.messages); }
    } else if (route.params?.newConversation) {
      conversationId.current = generateUniqueId(); setMessages([]);
      navigation.setParams({newConversation: false});
    }
  }, [route.params?.conversationId, route.params?.newConversation, route.params?.openHistory, navigation]);
`+anchor);
chat=chat.replace('    setIsAppBooting(true);\n    setModelReady(false);', '    if (!focused) return;\n    setIsAppBooting(true);\n    setModelReady(false);');
chat=chat.replace('  }, [settings.modelUrl]);','  }, [settings.modelUrl, focused]);');
chat=chat.replace('  const clearChat = () => {','  const clearChat = () => {');
chat=chat.replace("    setContextNotice('');\n  };", "    setContextNotice('');\n    setInputText(''); setAttachedFile(null);\n  };");
chat=chat.replace('systemPrompt: settings.systemPrompt,', "systemPrompt: settings.systemPrompt + (settings.responseStyle === 'concise' ? '\\nKeep answers brief and practical.' : settings.responseStyle === 'detailed' ? '\\nGive thorough explanations with useful examples.' : ''),");
const h1=chat.indexOf('      <View style={S.header}>',chat.indexOf('export function ChatScreen'));
const h2=chat.indexOf('      <KeyboardAvoidingView',h1);
chat=chat.slice(0,h1)+`      <View style={S.header}>
        <IconButton glyph="☰" label="Open menu" disabled={isGenerating || isDownloading} onPress={() => setDrawer(true)} />
        <View style={[ui.row, ui.flex, {justifyContent: 'center'}]}><MoonMark size={28} /><Text style={S.headerTitle}>Moonlight</Text></View>
        <IconButton glyph="＋" label="Start a new conversation" disabled={isGenerating || isDownloading} onPress={clearChat} />
      </View>
      {modelReady && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose a model" disabled={isGenerating || isDownloading} onPress={() => setShowModelModal(true)} style={{alignSelf:'center', padding:12}}>
        <Text style={ui.small}>{selected?.name || 'Custom model'} · On device  ⌄</Text>
      </TouchableOpacity>}
`+chat.slice(h2);
chat=chat.replace('              <MoonMark size={52} />\n','');
chat=chat.replace('A question, a rough idea, a fresh start. Let’s work through it\n                together.','A little clarity starts here.');
chat=chat.replace("'Bringing your AI on device'", "'Downloading your model'").replace("'Make this space yours'", "'Set up local chat'");
chat=chat.replace('Keep the app open while your model downloads.', 'Keep writing while it downloads. Keep the app open.');
chat=chat.replace("                        : 'Download model'}", "                        : selected?.id === 'moonlight-v7' ? 'Download Moonlight' : 'Download model'}");
chat=chat.replace('                  {isDownloading && (','                  {!!recommendation && <Text style={ui.small}>{recommendation}</Text>}\n                  {isDownloading && (');
chat=chat.replace('placeholder="Ask anything, make something…"','placeholder="Ask Moonlight"');
const memstart=chat.indexOf('            <TouchableOpacity',chat.indexOf('label="Attach a text file"'));
const memend=chat.indexOf('            <View style={ui.flex}',memstart);
chat=chat.slice(0,memstart)+`            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Web search unavailable" style={S.memoryButton} onPress={() => Alert.alert('Web search is not connected', 'This build answers locally. A search provider must be configured before web search can be enabled. No query has been sent.', [{text:'OK'}, {text:'Settings',onPress:()=> navigation.navigate('Settings')}])}>
              <Text style={ui.small}>◎ Web off</Text>
            </TouchableOpacity>
`+chat.slice(memend);
chat=chat.replace('              {AVAILABLE_MODELS.map(model => (', "              {[...AVAILABLE_MODELS].sort((a,b) => Number(b.id === recommendedId) - Number(a.id === recommendedId)).map(model => (");
chat=chat.replace('{model.provider} · {model.size}', "{model.provider} · {model.size}{model.id === recommendedId ? ' · Suggested' : ''}");
chat=chat.replace('      <ReportResponseModal', `      <ConversationDrawer visible={drawer} onClose={() => setDrawer(false)} onNew={() => {clearChat(); setDrawer(false);}} onOpen={conversation => {
        conversationId.current = conversation.id; setMessages(conversation.messages); setInputText(''); setAttachedFile(null); setDrawer(false);
      }} onNavigate={name => {setDrawer(false); navigation.navigate(name);}} />
      <ReportResponseModal`);
chat=chat.replace('  welcomeTitle: {','  welcomeTitle: {\n    fontFamily: \'serif\',');
chat=chat.replace("backgroundColor: '#202730'",'backgroundColor: C.accentSoft');
write('src/screens/ChatScreen.tsx',chat);
