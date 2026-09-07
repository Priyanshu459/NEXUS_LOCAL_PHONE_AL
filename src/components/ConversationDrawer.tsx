import React, {useEffect, useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, Share, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Theme, useAppearance} from '../constants/theme';
import {Conversation, deleteConversation, listConversations, renameConversation} from '../services/conversations';
import {IconButton, MoonMark, ui} from './Design';

export function ConversationDrawer({visible,onClose,onNew,onOpen,onNavigate,onDeleted}: {
  visible:boolean; onClose:()=>void; onNew:()=>void; onOpen:(c:Conversation)=>void;
  onNavigate:(screen:'Tools'|'Models'|'Settings'|'PrivacyPolicy')=>void;
  onDeleted:(id:string)=>void;
}) {
  useAppearance(); const c=Theme.color; const insets=useSafeAreaInsets();
  const [items,setItems]=useState<Conversation[]>([]); const [query,setQuery]=useState('');
  const [renaming,setRenaming]=useState<Conversation|null>(null); const [title,setTitle]=useState('');
  useEffect(()=>{if(visible) setItems(listConversations());},[visible]);
  const refresh=()=>setItems(listConversations());
  const actions=(item:Conversation)=>Alert.alert(item.title,'Manage conversation',[
    {text:'Rename',onPress:()=>{setRenaming(item);setTitle(item.title);}},
    {text:'Share / export',onPress:()=>{Share.share({message:item.messages.map(m=>`${m.role === 'user' ? 'You' : 'Moonlight'}: ${m.content}`).join('\n\n')}).catch(()=>Alert.alert('Sharing unavailable'));}},
    {text:'Delete',style:'destructive',onPress:()=>Alert.alert('Delete conversation?','This cannot be undone.',[
      {text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>{deleteConversation(item.id);refresh();onDeleted(item.id);}},
    ])}, {text:'Cancel',style:'cancel'},
  ]);
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
    <View style={{flex:1,flexDirection:'row',backgroundColor:'#0007'}}>
      <View style={{width:'87%',maxWidth:420,backgroundColor:c.background,padding:20,paddingTop:insets.top+12,paddingBottom:insets.bottom+12}}>
        <View style={ui.row}><MoonMark size={30}/><Text style={[ui.section,ui.flex,{marginTop:0,fontFamily:'serif'}]}>Moonlight</Text><IconButton glyph="×" label="Close menu" onPress={onClose}/></View>
        <TouchableOpacity style={[ui.primary,{marginVertical:16}]} onPress={onNew} accessibilityRole="button"><Text style={ui.primaryText}>＋ New chat</Text></TouchableOpacity>
        <TextInput accessibilityLabel="Search conversations" value={query} onChangeText={setQuery} placeholder="Search conversations" placeholderTextColor={c.textMuted} style={ui.input}/>
        <Text style={[ui.small,{marginTop:24,marginBottom:8}]}>RECENT</Text>
        <ScrollView keyboardShouldPersistTaps="handled" style={ui.flex}>
          {items.filter(item=>`${item.title} ${item.messages.map(m=>m.content).join(' ')}`.toLowerCase().includes(query.toLowerCase())).map(item=><View key={item.id} style={[ui.row,{borderBottomWidth:1,borderBottomColor:c.border}]}>
            <TouchableOpacity accessibilityRole="button" onPress={()=>onOpen(item)} style={{flex:1,paddingVertical:20}}><Text numberOfLines={2} style={ui.body}>{item.title}</Text></TouchableOpacity>
            <IconButton glyph="⋯" label={`Options for ${item.title}`} onPress={()=>actions(item)}/>
          </View>)}
          {!items.length&&<Text style={[ui.small,{paddingVertical:24}]}>Your conversations will appear here.</Text>}
        </ScrollView>
        {renaming&&<View style={ui.card}><TextInput accessibilityLabel="Conversation title" value={title} onChangeText={setTitle} maxLength={100} style={ui.input}/><TouchableOpacity style={ui.primary} onPress={()=>{renameConversation(renaming.id,title);refresh();setRenaming(null);}}><Text style={ui.primaryText}>Save name</Text></TouchableOpacity><TouchableOpacity onPress={()=>setRenaming(null)}><Text style={ui.body}>Cancel</Text></TouchableOpacity></View>}
        <View style={{borderTopWidth:1,borderTopColor:c.border,paddingTop:8}}>
          {([['Explore','Tools'],['Models','Models'],['Settings','Settings'],['Help & privacy','PrivacyPolicy']] as const).map(([label,screen])=><TouchableOpacity key={screen} accessibilityRole="button" onPress={()=>onNavigate(screen)} style={{paddingVertical:14}}><Text style={ui.body}>{label}</Text></TouchableOpacity>)}
        </View>
      </View>
      <Pressable accessibilityLabel="Close menu" onPress={onClose} style={{flex:1}}/>
    </View>
  </Modal>;
}
