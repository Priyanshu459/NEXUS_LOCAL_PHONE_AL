import React,{useState} from 'react';
import {Alert,Linking,Text,View} from 'react-native';
import {GlassAction} from './GlassPage';
import {ui} from './Design';

export function LMStudioGuide({mode}:{mode:'local'|'remote'}) {
  const [open,setOpen]=useState(false);
  const steps=mode==='local'?[
    '1. On your computer, open LM Studio and load a text/chat model.',
    '2. Open Developer → server settings, enable Serve on Local Network and start the server. Note its network address and port, usually 1234.',
    '3. Enable API authentication and create an LM Studio token. Keep your computer awake.',
    '4. Connect your phone to the same Wi-Fi. Allow LM Studio through the computer firewall on your private network. Guest Wi-Fi can block device-to-device access.',
    '5. Paste the computer address and token into Moonlight. For a private http:// address, enable private-network HTTP. Do not use localhost, 0.0.0.0, or an LM Link invitation.',
    '6. Tap Save & show models. Select a model from the list, then chat.',
  ]:[
    '1. Install Tailscale on your computer and Android phone. Sign into the same private network and connect both devices.',
    '2. In LM Studio, load a chat model, enable API authentication, and start the server on localhost, normally port 1234. Keep the computer awake.',
    '3. Run the command below on your computer. Replace 1234 if needed. Follow the HTTPS setup link if Tailscale asks you to enable HTTPS.',
    '4. Paste the HTTPS address printed by Tailscale Serve into Moonlight and enter your LM Studio token. Moonlight adds /v1 automatically.',
    '5. Tap Save & show models. To check access away from home, turn off phone Wi-Fi, keep Tailscale connected, and test on mobile data.',
    '6. Your computer must remain awake with LM Studio and Tailscale running. Access depends on internet connectivity and your Tailscale access rules.',
  ];
  const link=(url:string)=>void Linking.openURL(url).catch(()=>Alert.alert('Could not open guide','Check your browser.'));
  return <View style={ui.card}><Text style={[ui.section,{marginTop:0}]}>{mode==='local'?'Same Wi-Fi setup':'Private remote access'}</Text><Text style={ui.body}>{mode==='local'?'Connect directly to your computer’s running API server.':'Use your own Tailscale VPN and an HTTPS address. No router port forwarding is needed.'}</Text><GlassAction title={open?'Hide setup steps':'How to connect · step by step'} onPress={()=>setOpen(!open)}/>{open&&<>{steps.map(step=><Text key={step} style={ui.body}>{step}</Text>)}{mode==='remote'&&<><Text selectable style={[ui.input,{fontFamily:'monospace'}]}>tailscale serve --bg http://127.0.0.1:1234</Text><Text style={ui.small}>Tailscale Serve keeps the endpoint private to your network. Do not use Funnel or open an unauthenticated router port. Your own Tailscale network is separate from LM Studio’s LM Link network.</Text><GlassAction title="Tailscale remote setup guide" onPress={()=>link('https://tailscale.com/docs/features/tailscale-serve')}/></>}<GlassAction title="LM Studio server guide" onPress={()=>link('https://lmstudio.ai/docs/developer/core/server/serve-on-network')}/></>}</View>;
}
