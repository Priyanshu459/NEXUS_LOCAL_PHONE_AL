import React from 'react';
import { View, Text, Image } from 'react-native';

// Nexus AI Studio Dark & Neon Theme Colors
export const GColor = {
  bg: '#131314',
  surface: '#1E1F22',
  surfaceHigh: '#282A2F',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F2F2F2',
  textSecondary: '#9AA0A6',
  textMuted: '#5F6368',
  red: '#FF007F',      // Radiant Magenta
  green: '#00F2FE',    // Deep Cyan
  blue: '#3B82F6',     // Bright Indigo
  yellow: '#7F00FF',   // Electric Violet
  purple: '#A142F4',
  coral: '#FF6D01',
  teal: '#00E5FF',
  userBubble: '#004A77',
  userBubbleText: '#E8F0FE',
  assistantBubble: '#1E1F22',
  cyan: '#00F2FE',
  violet: '#7F00FF',
  magenta: '#FF007F',
  indigo: '#3B82F6',
};

// Moon Studio Official Emblem
export function NexusAIEmblem({ size = 24 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', borderRadius: size / 2, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0, 242, 254, 0.4)', shadowColor: '#00F2FE', shadowOpacity: 0.6, shadowRadius: 6, elevation: 4 }}>
      <Image 
        source={require('../assets/moon_icon.png')} 
        style={{ width: size, height: size }} 
        resizeMode="cover" 
      />
    </View>
  );
}
export const GoogleAIEmblem = NexusAIEmblem;

// Hamburger Menu Icon
export function MenuIcon({ size = 24, color = GColor.textPrimary }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'space-evenly', paddingVertical: size * 0.2 }}>
      <View style={{ width: size, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: size, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: size, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

// Back Arrow Icon
export function ArrowLeftIcon({ size = 24, color = GColor.textPrimary }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 14, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 4, width: 8, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }, { translateY: -2.5 }] }} />
      <View style={{ position: 'absolute', left: 4, width: 8, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }, { translateY: 2.5 }] }} />
    </View>
  );
}

// Send Arrow Icon (Up arrow inside circle)
export function SendArrowIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 2, height: size * 0.7, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', top: size * 0.15, left: size * 0.22, width: size * 0.45, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '-45deg' }] }} />
      <View style={{ position: 'absolute', top: size * 0.15, right: size * 0.22, width: size * 0.45, height: 2, backgroundColor: color, borderRadius: 1, transform: [{ rotate: '45deg' }] }} />
    </View>
  );
}

// Nexus AI Studio Sparkles Icon
export function SparklesIcon({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <View style={{ width: size * 0.2, height: size * 0.9, backgroundColor: GColor.cyan, borderRadius: size * 0.1 }} />
      <View style={{ position: 'absolute', width: size * 0.9, height: size * 0.2, backgroundColor: GColor.magenta, borderRadius: size * 0.1 }} />
      <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.2, backgroundColor: GColor.violet, borderRadius: size * 0.1, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: size * 0.6, height: size * 0.2, backgroundColor: GColor.indigo, borderRadius: size * 0.1, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

// Gallery Card Icons (Badges matching Screenshot 1 & 2)
export function GalleryCardIcon({ type, color, size = 44 }: { type: string; color: string; size?: number }) {
  const isHexagon = type === 'ai_chat' || type === 'mobile_actions';
  const isSquircle = type === 'agent_skills' || type === 'settings' || type === 'models' || type === 'notifications';
  
  const borderRadius = isHexagon ? size * 0.28 : isSquircle ? size * 0.35 : size * 0.5;

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius,
      backgroundColor: color,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    }}>
      {type === 'ask_image' && (
        <View style={{ width: 22, height: 16, borderWidth: 2, borderColor: '#FFF', borderRadius: 3, overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF', position: 'absolute', top: 2, right: 3 }} />
          <View style={{ width: 12, height: 12, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], position: 'absolute', bottom: -6, left: 1 }} />
          <View style={{ width: 14, height: 14, backgroundColor: '#FFF', transform: [{ rotate: '45deg' }], position: 'absolute', bottom: -8, right: -2 }} />
        </View>
      )}

      {type === 'audio_scribe' && (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 10, height: 15, backgroundColor: '#FFF', borderRadius: 5 }} />
          <View style={{ width: 16, height: 10, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#FFF', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, position: 'absolute', bottom: -3 }} />
          <View style={{ width: 2, height: 4, backgroundColor: '#FFF', position: 'absolute', bottom: -7 }} />
        </View>
      )}

      {type === 'ai_chat' && (
        <View style={{ width: 22, height: 22, position: 'relative' }}>
          <View style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 13, backgroundColor: '#FFF', borderRadius: 4 }} />
          <View style={{ position: 'absolute', bottom: 1, right: 0, width: 16, height: 13, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 4, borderWidth: 1.5, borderColor: color }} />
        </View>
      )}

      {type === 'agent_skills' && (
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 16, height: 16, borderWidth: 2.5, borderColor: '#FFF', borderRadius: 8, borderTopRightRadius: 2, transform: [{ rotate: '-45deg' }] }} />
          <View style={{ width: 4, height: 4, backgroundColor: '#FFF', borderRadius: 2, position: 'absolute' }} />
        </View>
      )}

      {type === 'prompt_lab' && (
        <View style={{ width: 18, height: 18, flexWrap: 'wrap', flexDirection: 'row', gap: 3, justifyContent: 'center', alignContent: 'center' }}>
          <View style={{ width: 7, height: 7, backgroundColor: '#FFF', borderRadius: 1.5 }} />
          <View style={{ width: 7, height: 7, backgroundColor: '#FFF', borderRadius: 1.5 }} />
          <View style={{ width: 7, height: 7, backgroundColor: '#FFF', borderRadius: 1.5 }} />
          <View style={{ width: 7, height: 7, backgroundColor: '#FFF', borderRadius: 1.5 }} />
        </View>
      )}

      {type === 'tiny_garden' && (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', zIndex: 2 }} />
          <View style={{ position: 'absolute', width: 6, height: 18, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 3 }} />
          <View style={{ position: 'absolute', width: 18, height: 6, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 3 }} />
          <View style={{ position: 'absolute', width: 6, height: 18, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 3, transform: [{ rotate: '45deg' }] }} />
          <View style={{ position: 'absolute', width: 6, height: 18, backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 3, transform: [{ rotate: '-45deg' }] }} />
        </View>
      )}

      {type === 'mobile_actions' && (
        <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', lineHeight: 28 }}>Σ</Text>
      )}

      {type === 'settings' && (
        <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 18, height: 18, borderWidth: 3, borderColor: '#FFF', borderRadius: 9 }} />
          <View style={{ width: 8, height: 8, backgroundColor: color, borderRadius: 4, position: 'absolute' }} />
        </View>
      )}

      {type === 'models' && (
        <View style={{ width: 20, height: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />
            <View style={{ flex: 1, height: 2.5, backgroundColor: '#FFF', borderRadius: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ flex: 1, height: 2.5, backgroundColor: '#FFF', borderRadius: 1 }} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' }} />
            <View style={{ flex: 1, height: 2.5, backgroundColor: '#FFF', borderRadius: 1 }} />
          </View>
        </View>
      )}

      {type === 'notifications' && (
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 16, height: 14, backgroundColor: '#FFF', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
          <View style={{ width: 6, height: 4, backgroundColor: '#FFF', borderBottomLeftRadius: 3, borderBottomRightRadius: 3, marginTop: 1 }} />
        </View>
      )}
    </View>
  );
}

// ── New Material 3 & Google Developer Icons ──────────────────────────────────

export const AttachmentIcon = ({ color = GColor.textSecondary, size = 20 }: { color?: string; size?: number }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: size * 0.65, height: size * 0.85, borderWidth: 2, borderColor: color, borderRadius: size * 0.3, borderTopRightRadius: 2 }} />
    <View style={{ width: size * 0.4, height: size * 0.5, borderWidth: 1.5, borderColor: color, borderRadius: size * 0.15, position: 'absolute', top: 3 }} />
  </View>
);

export const FileTextIcon = ({ color = GColor.blue }: { color?: string }) => (
  <View style={{ width: 18, height: 22, backgroundColor: color + '25', borderWidth: 1.5, borderColor: color, borderRadius: 4, padding: 3, justifyContent: 'space-evenly' }}>
    <View style={{ width: 10, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 8, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
    <View style={{ width: 6, height: 1.5, backgroundColor: color, borderRadius: 1 }} />
  </View>
);

export const CopyIcon = ({ color = GColor.textSecondary }: { color?: string }) => (
  <View style={{ width: 16, height: 16, position: 'relative' }}>
    <View style={{ position: 'absolute', top: 0, left: 0, width: 11, height: 11, borderWidth: 1.5, borderColor: color, borderRadius: 3 }} />
    <View style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, backgroundColor: '#1E1F22', borderWidth: 1.5, borderColor: color, borderRadius: 3 }} />
  </View>
);

export const SparkleFourColorIcon = ({ size = 24 }: { size?: number }) => (
  <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
    <View style={{ width: size * 0.38, height: size * 0.38, backgroundColor: GColor.cyan, borderRadius: size * 0.19, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: size * 0.28, height: size * 0.28, backgroundColor: GColor.magenta, borderRadius: size * 0.14, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: size * 0.28, height: size * 0.28, backgroundColor: GColor.violet, borderRadius: size * 0.14, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: size * 0.38, height: size * 0.38, backgroundColor: GColor.indigo, borderRadius: size * 0.19, transform: [{ rotate: '45deg' }] }} />
  </View>
);

export const StudioIcon = ({ active }: { active: boolean }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 20, height: 16, backgroundColor: active ? GColor.blue : 'transparent', borderWidth: 2, borderColor: active ? GColor.blue : GColor.textSecondary, borderRadius: 6 }} />
    <View style={{ width: 4, height: 4, backgroundColor: active ? '#FFF' : GColor.textSecondary, borderRadius: 2, position: 'absolute' }} />
  </View>
);

export const VaultIcon = ({ active }: { active: boolean }) => (
  <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 18, height: 20, borderWidth: 2, borderColor: active ? GColor.green : GColor.textSecondary, borderRadius: 5, backgroundColor: active ? GColor.green + '30' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: active ? GColor.green : GColor.textSecondary }} />
    </View>
  </View>
);
