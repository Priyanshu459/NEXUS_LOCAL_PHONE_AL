import React,{useState} from 'react';
import {Text,TextInput,View,Pressable} from 'react-native';
import {ui} from './Design';

/** Loaded only when this panel is opened; render one license text at a time. */
export function SoftwareNotices(){
  const [selected,setSelected]=useState<number|null>(null);
  const [query,setQuery]=useState('');const [page,setPage]=useState(0);
  const entries=require('../assets/legal/software-notices.json') as {name:string;version:string;license:string;text:string}[];
  const matches=entries.filter(entry=>entry.name.toLowerCase().includes(query.toLowerCase()));
  return <View style={{gap:12}}><Text style={ui.body}>Notices from installed production npm dependencies, including associated build tools. Model terms are listed separately. Native Android and bundled C/C++ components may have additional terms.</Text><TextInput style={ui.input} accessibilityLabel="Search software licenses" value={query} onChangeText={value=>{setQuery(value);setPage(0);setSelected(null);}}/><Text style={ui.small}>{matches.length} packages · Page {page+1} of {Math.max(1,Math.ceil(matches.length/20))}</Text>{matches.slice(page*20,(page+1)*20).map((entry,index)=><View key={`${entry.name}-${index}`} style={ui.card}><Pressable accessibilityRole="button" accessibilityState={{expanded:selected===index}} onPress={()=>setSelected(selected===index?null:index)} style={{minHeight:48,justifyContent:'center'}}><Text style={ui.body}>{entry.name} · {entry.version}</Text><Text style={ui.small}>{entry.license}</Text></Pressable>{selected===index&&<Text selectable style={ui.small}>{entry.text||'No standalone notice was found in this installed package. Its declared license is shown above; see the publisher’s distribution for complete terms.'}</Text>}</View>)}<View style={ui.row}>{page>0&&<Pressable accessibilityRole="button" style={ui.primary} onPress={()=>{setPage(page-1);setSelected(null);}}><Text style={ui.primaryText}>Previous</Text></Pressable>}{(page+1)*20<matches.length&&<Pressable accessibilityRole="button" style={ui.primary} onPress={()=>{setPage(page+1);setSelected(null);}}><Text style={ui.primaryText}>Next</Text></Pressable>}</View></View>;
}
