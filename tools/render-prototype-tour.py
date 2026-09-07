"""Render the proposed Paper x Mono navigation as a narrated MP4, not an app recording."""
from pathlib import Path
import json, math, sys, wave, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/paper-mono-walkthrough'
WORK = ROOT / '.local-release/video-work'
OUT.mkdir(parents=True, exist_ok=True)
WORK.mkdir(parents=True, exist_ok=True)
W, H, FPS = 1600, 1000, 12
FONT = Path('C:/Windows/Fonts')
fonts = {}
def ft(size=24, kind='regular'):
    key = size, kind
    if key not in fonts:
        name = {'regular':'segoeui.ttf','bold':'segoeuib.ttf','serif':'georgia.ttf'}[kind]
        fonts[key] = ImageFont.truetype(str(FONT / name), size)
    return fonts[key]

SCENES = []
def scene(title, route, summary, notes, screen, speech, focus=None, new=False):
    SCENES.append(dict(title=title, route=route, summary=summary, notes=notes,
                       screen=screen, speech=speech, focus=focus, new=new))

scene('Meet your new Moonlight', 'HOME', 'Paper warmth.\nMono clarity.',
      ['Ivory surfaces and calm typography', 'One composer for messages, files and voice', 'Your moon logo stays consistent'], 'home',
      'This is a narrated design prototype, not a recording of the finished app. Moonlight combines warm Paper styling with Mono simplicity. Let us walk through the proposed layout and controls.')
scene('First, choose a model', 'HOME  /  MODEL SELECTOR', 'The model selector sits\njust above the composer.',
      ['Tap the model name to open the picker', 'Review the description before downloading', 'Smaller models suit phones with less memory'], 'models',
      'On first use, tap the model selector above the composer. Choose a model suitable for your phone. This example uses Qwen. A download requires an internet connection.', (1260,340))
scene('Download, then start', 'MODELS  /  DOWNLOAD', 'A visible download state\nkeeps setup understandable.',
      ['Progress and cancellation stay together', 'Errors would offer a clear retry action', 'All progress shown here is simulated'], 'download',
      'The download screen would show progress and a cancel button. If a download fails, a clear retry action would appear. This progress is simulated for the prototype.', (1260,555))
scene('Start with a useful task', 'HOME  /  STARTER SHORTCUTS', 'Choose a starting point\nor type your own question.',
      ['Write, understand or plan from Home', 'Explore opens the full starter collection', 'A starter fills a draft for you to review'], 'home',
      'Back on Home, write something better, understand an idea, or plan your next step. A starter would fill the composer for review. You can always type your own question.', (1235,381))
scene('Find more starting points', 'MENU  /  EXPLORE', 'Explore groups prompts\nby the work you want to do.',
      ['Writing, learning, coding and planning', 'Choose a starter to open a new chat', 'No extra model download for each category'], 'explore',
      'Explore lives in the menu. It groups starters for writing, learning, coding and planning. Choose one to open a new chat with a useful draft prompt.', (1220,433))
scene('Write and send', 'CHAT  /  COMPOSER', 'Your message stays editable\nuntil you press Send.',
      ['Attachment control on the left', 'Microphone and Send on the right', 'Model selector stays above the input'], 'compose',
      'The composer stays at the bottom. Attach a text file on the left, use voice on the right, or type directly. Review your message, then press the green send button.', (1386,824))
scene('Read, stop and refine', 'CHAT  /  RESPONSE', 'Answers get room to breathe.',
      ['Stop replaces Send while generating', 'Copy and Retry sit below each answer', 'Follow-up suggestions are a proposed shortcut'], 'answer',
      'The response appears in the conversation. During generation, Stop replaces Send. Copy and Retry sit under the answer. A proposed follow-up shortcut would make it easy to refine the response.', (1164,592))
scene('Attach readable text', 'CHAT  /  PLUS BUTTON', 'Pick a file, then review\nwhat you are sending.',
      ['The plus button opens the phone file picker', 'The attachment appears above your draft', 'Text-only input; a 512 KB file limit'], 'attach',
      'The plus button opens your phone file picker. A selected text file appears above the draft. The local model reads text, not image or PDF content. Text attachments have a 512 kilobyte limit.', (1007,824))
scene('Speak, review, send', 'CHAT  /  MICROPHONE', 'Voice input becomes a draft.',
      ['Use the phone speech-recognition service', 'Review and edit the returned words', 'Recognition may use a network connection'], 'voice',
      'The microphone opens the phone speech service. Its result returns as an editable draft, rather than sending automatically. The speech service may use a network connection depending on the device.', (1320,824))
scene('Everything has a home', 'HEADER  /  MENU', 'One menu keeps navigation\nshort and predictable.',
      ['New chat and conversation history at the top', 'Explore, Models and Preferences below', 'Open the menu from the top-right icon'], 'menu',
      'The top-right menu is the main navigation point. It contains New chat, Conversations, Explore, Models and Preferences. Chat remains the centre of the app.', (1200,385))
scene('Return to past work', 'MENU  /  CONVERSATIONS', 'Find the conversation\nwithout starting over.',
      ['Search at the top of history', 'Recent chats grouped by day', 'Open a row to continue the conversation'], 'history',
      'Conversations has search at the top and recent chats grouped by day. Open a row to continue. The menu beside each conversation holds its management actions.', (1260,237))
scene('Manage a conversation', 'CONVERSATIONS  /  MORE', 'Actions stay beside\nthe conversation they affect.',
      ['Rename for easier retrieval', 'Share or export with the phone share sheet', 'Delete opens a confirmation'], 'historyactions',
      'Use the conversation menu to rename, share or export, or delete a chat. Export would open the phone share sheet. Deletion asks for confirmation before removing the conversation.', (1210,492))
scene('Preferences, clearly grouped', 'MENU  /  PREFERENCES', 'Every setting has\na predictable place.',
      ['Everyday choices appear first', 'Privacy and data controls stay easy to find', 'Technical controls live in Advanced'], 'settings',
      'Preferences groups appearance, responses, memory, models and storage, conversations, privacy, advanced controls, and help. Everyday choices appear first. Let us open each section.', (1200,230))
scene('Choose a comfortable look', 'PREFERENCES  /  APPEARANCE', 'Light, dark or your\nphone’s system setting.',
      ['Paper light and a coordinated dark theme', 'System follows your device appearance', 'Text size includes a reading preview'], 'appearance',
      'Appearance is a proposed new section. Choose Paper light, a matching dark theme, or follow your phone. A text-size control would show a reading preview before you leave this screen.', (1170,345), True)
scene('Make answers your own', 'PREFERENCES  /  RESPONSES', 'Choose a style, then add\nyour own instructions.',
      ['Concise, Balanced or Detailed', 'Custom instructions in one clear field', 'Save applies your preferences to later replies'], 'responses',
      'Responses lets you choose Concise, Balanced or Detailed. Add custom instructions, such as use plain language and practical examples. Save your preferences to guide later replies.', (1070,315))
scene('Keep memory understandable', 'PREFERENCES  /  MEMORY', 'See what is remembered.\nRemove what you do not need.',
      ['Switch memory use on or off', 'Inspect and delete individual saved items', 'Turning it off does not erase saved items'], 'memory',
      'Memory has a clear on or off switch and a list of saved items. Delete individual preferences here. Turning memory off stops its use; it does not itself erase previously saved items.', (1370,268))
scene('Manage space on your phone', 'PREFERENCES  /  MODELS & STORAGE', 'Installed models and\nstorage actions stay together.',
      ['See the active model and installed files', 'Remove unused downloads with confirmation', 'Size displays are proposed for this redesign'], 'storage',
      'Models and storage shows the active model and installed downloads. Storage-size displays are proposed. Removing an unused model would ask for confirmation, since you would need to download it again.', (1380,446))
scene('Control conversation data', 'PREFERENCES  /  CONVERSATIONS', 'Keep export and deletion\nseparate from ordinary settings.',
      ['Open history to share a chosen conversation', 'Clear all history is visually separated', 'A confirmation names exactly what is removed'], 'clear',
      'Conversation settings links back to history for individual exports. Clear all history is a separate proposed control. Its confirmation would state that chats are removed while models and saved memories remain.', (1230,620), True)
scene('Know where data goes', 'PREFERENCES  /  PRIVACY', 'Explain privacy\nin straightforward language.',
      ['Generation runs on your device', 'Downloads need internet; voice may use it', 'Sharing sends only what you choose to share'], 'privacy',
      'Privacy explains local generation, text-file handling, model downloads and the phone speech service. Sharing sends content through an app you choose. The privacy policy and reporting availability would also be explained here.')
scene('Advanced, when you need it', 'PREFERENCES  /  ADVANCED', 'Technical controls are\nkept out of the daily flow.',
      ['Custom Hugging Face model URL', 'Temperature, top-p and top-k controls', 'Response-token limit and clear explanations'], 'advanced',
      'Advanced stays collapsed until needed. It contains a custom Hugging Face model URL, temperature, top p, top k, and the response token limit. Each control would have a short explanation.', (1260,653))
scene('Help is easy to reach', 'PREFERENCES  /  ABOUT & HELP', 'Version details, licenses\nand practical help.',
      ['App version and model attribution', 'Privacy policy and troubleshooting', 'Help content is a proposed addition'], 'about',
      'About and help contains the app version, model licenses and privacy policy. Proposed troubleshooting guides would explain download failures, slow responses and unavailable voice input. Use Back to return to Preferences.')
scene('Back to what matters', 'HOME  /  CHAT', 'Open. Ask. Refine.',
      ['Chat remains the main experience', 'All other sections are one menu away', 'This walkthrough proposes the next app design'], 'home',
      'Return Home to start or continue a conversation. Chat stays central, with all other sections one menu away. This video demonstrates the proposed experience; it does not mean these new features have been implemented.')

class Canvas:
    def __init__(self, image): self.im=image; self.d=ImageDraw.Draw(image)
    def text(self, xy, text, size=24, color='#202923', kind='regular'):
        self.d.text(xy,text,font=ft(size,kind),fill=color)
    def wrap(self, xy, text, width, size=24, color='#202923', kind='regular', gap=8):
        x,y=xy
        for paragraph in text.split('\n'):
            line=''
            for word in paragraph.split():
                test=(line+' '+word).strip()
                if self.d.textlength(test,font=ft(size,kind))>width and line:
                    self.text((x,y),line,size,color,kind); y+=size+gap; line=word
                else: line=test
            self.text((x,y),line,size,color,kind); y+=size+gap
        return y
    def box(self,xy,fill='#F0EDE7',radius=14,outline=None):
        self.d.rounded_rectangle(xy,radius=radius,fill=fill,outline=outline,width=1)
    def line(self,x,y,x2,color='#DAD6CD'): self.d.line((x,y,x2,y),fill=color,width=1)
    def button(self,y,label,fill='#234737',x=994,w=407):
        self.box((x,y,x+w,y+55),fill,12)
        tw=self.d.textlength(label,font=ft(22,'bold'))
        self.text((x+(w-tw)/2,y+12),label,22,'white','bold')

logo=Image.open(ROOT/'src/assets/branding/moon-brand-dark.png').convert('RGBA')
def mark(c,x,y,size=38):
    c.im.paste(logo.resize((size,size),Image.Resampling.LANCZOS),(x,y),logo.resize((size,size),Image.Resampling.LANCZOS))

def draw(idx,p=0.7):
    s=SCENES[idx]
    im=Image.new('RGB',(W,H),'#F7F5F0'); c=Canvas(im)
    green='#234737'; muted='#6D746D'; ink='#202923'
    c.text((82,54),'MOONLIGHT  /  DESIGN WALKTHROUGH',18,green,'bold')
    c.text((82,126),f'{idx+1:02d}',62,green,'serif')
    c.wrap((82,216),s['title'],735,46,ink,'serif',12)
    c.wrap((82,368),s['summary'],720,32,ink,'regular',12)
    for j,n in enumerate(s['notes']):
        c.d.ellipse((85,542+j*68,93,550+j*68),fill=green)
        c.wrap((112,531+j*68),n,685,24,muted,gap=5)
    c.text((82,796),'WHERE TO FIND IT',16,muted,'bold')
    c.wrap((82,828),s['route'],745,23,green,'bold')
    c.box((80,912,790,951),'#EAE7DF',10)
    c.text((96,922),'PROTOTYPE  •  SIMULATED INTERACTIONS & SAMPLE DATA',16,muted,'bold')
    c.d.rectangle((0,992,int(W*(idx+p)/len(SCENES)),999),fill=green)
    # Flat device frame, strong legibility rather than a perspective render.
    c.box((951,35,1459,961),'#E5E1D8',49)
    c.box((943,27,1451,953),'#141A17',49)
    c.box((952,36,1442,944),'#F7F5F0',42)
    c.text((985,52),'9:30',18,ink,'bold'); c.text((1320,52),'5G  100%',16,ink)
    c.d.ellipse((1190,49,1204,63),fill=ink)
    c.box((1124,925,1270,930),ink,3)
    c.text((986,896),'PROPOSED NEW OPTION' if s['new'] else 'PAPER × MONO  /  CONCEPT',13,muted,'bold')
    screen=s['screen']
    def header(title='Moonlight'):
        if title=='Moonlight': mark(c,982,99,35); c.text((1028,98),title,29,ink,'serif'); c.text((1370,99),'≡',29)
        else: c.text((984,101),'‹',31); c.text((1018,106),title,24,ink,'bold')
        c.line(982,153,1410)
    def section(title,sub=None):
        c.wrap((990,183),title,407,33,ink,'serif',6)
        if sub: c.wrap((992,235),sub,400,20,muted,gap=4)
    def row(y,title,sub=None,action='›'):
        c.text((992,y),title,23,ink,'bold')
        if sub: c.wrap((992,y+34),sub,340,18,muted,gap=4)
        if action: c.text((1370,y),action,24,green)
        c.line(992,y+(86 if sub else 52),1404)
    def composer(value='Ask Moonlight',stop=False,attachment=False):
        c.box((990,737,1280,775),None,9,'#DAD6CD'); c.text((1004,743),'Qwen 2.5  ·  On device',18,ink)
        c.d.line((1251,750,1257,756,1263,750),fill=ink,width=2)
        c.box((978,786,1416,883),None,14,'#CAC6BB')
        c.text((995,798),value,20,muted)
        c.text((995,838),'+',30,ink)
        # Microphone made from strokes to avoid missing font glyphs.
        c.box((1312,838,1323,859),None,5,ink)
        c.d.arc((1307,840,1328,864),0,180,fill=ink,width=2)
        c.d.line((1318,864,1318,871),fill=ink,width=2)
        c.box((1360,832,1404,876),green,11)
        if stop: c.box((1375,848,1388,861),'white',2)
        else: c.text((1370,835),'↑',29,'white')
    def toggle(y,on=True):
        c.box((1342,y,1402,y+31),green if on else '#AAAFA8',16)
        x=1377 if on else 1347
        c.d.ellipse((x,y+5,x+21,y+26),fill='white')
    if screen in ['home','explore']:
        header()
        if screen=='home':
            c.wrap((990,190),'A little clarity\nstarts here.',410,43,ink,'serif',8)
            c.text((992,307),'What would you like to work on?',21,muted)
            for j,t in enumerate(['Write something better','Understand an idea','Plan your next step']): row(365+j*76,t)
            c.text((992,616),'RECENT',15,muted,'bold'); row(650,'A clearer project update',action='›')
            composer()
        else:
            section('Explore','Choose a useful starting point.')
            for j,(a,b) in enumerate([('Write','Draft an email'),('Learn','Explain a difficult idea'),('Code','Review a code snippet'),('Plan','Create a practical checklist')]): row(303+j*112,a,b)
            c.button(795,'Start a new chat')
    elif screen in ['models','download']:
        header('Models'); section('Choose your model','Download once. Chat on your device.')
        row(312,'Qwen 2.5 1.5B','Everyday writing and questions', '○' if screen=='models' else '')
        if screen=='models':
            c.button(417,'Download Qwen'); row(515,'Llama 3.2 1B','A compact option for quick chats','')
            c.text((996,614),'Download',20,green,'bold')
            c.text((992,749),'Start small',22,ink,'bold'); c.wrap((992,785),'Choose a smaller model if your phone has limited memory.',405,20,muted)
        else:
            percent=min(100,int(p*120))
            c.text((992,441),'Downloading model',23,ink,'bold'); c.text((1330,442),f'{percent}%',22,green)
            c.box((992,488,1403,498),'#DDD9D0',5); c.box((992,488,992+max(10,int(411*percent/100)),498),green,5)
            c.button(530,'Cancel download' if percent<100 else 'Use selected model')
            c.wrap((992,635),'Sample progress only. No file is downloaded in this video.',400,20,muted)
    elif screen in ['compose','answer','attach','voice']:
        header('A clearer project update')
        if screen=='compose':
            c.wrap((995,230),'Ready when\nyou are.',395,39,ink,'serif')
            c.wrap((995,344),'Write naturally. Review your draft before sending.',390,23,muted)
            value='Make this update clearer.'[:int(min(1,p*2)*25)]
            composer(value)
        elif screen=='answer':
            c.box((1025,183,1407,255),'#EEEAE2',12); c.wrap((1040,196),'Make this update shorter and clearer.',351,21)
            c.text((992,299),'Here’s a concise version:',23,ink,'bold')
            full='Hi team,\n\nThe onboarding flow is ready for review. Please share feedback by Thursday so we can finalize the release on Friday.\n\nThanks, Maya'
            c.wrap((992,347),full[:int(len(full)*min(1,p*2.4))],405,22,gap=6)
            if p>.43:
                c.text((993,594),'Copy   |   Retry',21,green); c.line(992,640,1403)
                c.text((993,664),'Make it warmer  →',22,ink)
            composer(stop=p<.43)
        elif screen=='attach':
            c.wrap((992,204),'Text, ready\nfor context.',410,37,ink,'serif')
            c.box((992,326,1403,476),'#EEEAE2',12)
            c.text((1009,344),'project-update.txt',23,ink,'bold'); c.text((1009,386),'Text attachment  ·  2 KB',19,muted)
            c.text((1009,429),'Remove attachment',19,green)
            c.wrap((993,524),'Review your draft and selected file, then press Send.',400,24)
            composer('Make this update clearer.')
        else:
            c.wrap((992,195),'Voice to draft',415,37,ink,'serif')
            c.wrap((992,275),'1. Open the phone speech service\n2. Speak your message\n3. Review the returned text',405,23,gap=15)
            c.box((992,469,1403,606),'#EEEAE2',12)
            c.text((1010,486),'Draft returned',21,green,'bold'); c.wrap((1010,525),'Help me plan tomorrow.',370,23)
            composer('Help me plan tomorrow.')
    elif screen=='menu':
        header(); section('Your workspace')
        for j,t in enumerate(['New chat','Conversations','Explore','Models','Preferences']): row(283+j*92,t)
    elif screen in ['history','historyactions']:
        header('Conversations'); c.box((990,191,1407,251),None,12,'#CCC8BE')
        c.text((1005,207),'Search conversations',22,muted)
        c.text((992,286),'TODAY',15,muted,'bold')
        row(326,'A clearer project update','Edited today','⋯'); row(429,'Weekend project plan','Edited today','⋯')
        c.text((992,548),'YESTERDAY',15,muted,'bold'); row(590,'Understanding APIs','Edited yesterday','⋯')
        c.button(795,'+ New chat')
        if screen=='historyactions':
            c.box((1050,365,1398,593),'#FFFDF8',14,'#C9C4B8')
            for j,t in enumerate(['Rename','Share / export','Delete conversation']):
                c.text((1071,384+j*68),t,22,'#9F392D' if j==2 else ink)
    elif screen=='settings':
        header('Preferences')
        for j,t in enumerate(['Appearance','Responses','Memory','Models & storage','Conversations','Privacy','Advanced','About & help']): row(203+j*80,t)
    elif screen=='appearance':
        header('Appearance'); section('Make it comfortable')
        for j,t in enumerate(['Paper light','Matching dark','Follow system']): row(271+j*70,t,action='●' if (j==1 and p>.45) or (j==0 and p<=.45) else '○')
        c.text((992,516),'Text size',24,ink,'bold'); c.text((992,552),'Small       Default       Large',20,muted)
        c.line(1004,603,1386,green); knob=1200 if p<.65 else 1290
        c.d.ellipse((knob-10,593,knob+10,613),fill=green)
        c.box((992,655,1403,755),'#252925' if p>.45 else '#EEEAE2',12)
        c.text((1008,674),'A little clarity starts here.',23 if p<.65 else 27,'#F7F5F0' if p>.45 else ink)
        c.text((1008,714),'Reading preview',18,'#C8CEC8' if p>.45 else muted)
        c.button(795,'Save appearance')
    elif screen=='responses':
        header('Responses'); section('Helpful, in your own way')
        c.text((992,266),'Response style',22,ink,'bold')
        for j,t in enumerate(['Concise','Balanced','Detailed']):
            x=992+j*140; c.box((x,309,x+130,358),green if j==0 else '#EEEAE2',9); c.text((x+15,321),t,19,'white' if j==0 else ink)
        c.text((992,414),'Your instructions',23,ink,'bold')
        c.box((992,458,1404,649),None,12,'#CCC8BE'); c.wrap((1010,477),'Use plain language and give practical examples.',374,23)
        c.wrap((993,690),'These preferences guide future responses.',400,20,muted)
        c.button(795,'Save preferences')
    elif screen=='memory':
        header('Memory'); section('Remember what matters')
        c.text((992,268),'Use saved memory',23,ink,'bold'); toggle(266,p<.65)
        c.wrap((992,328),'Manage saved preferences below. Turning memory off does not delete them.',405,21,muted)
        row(452,'Short, practical answers','Saved preference','×'); row(566,'Examples help me learn','Saved preference','×')
        c.wrap((992,739),'Remove a saved item with its × control.',405,20,muted)
    elif screen=='storage':
        header('Models & storage'); section('Keep space for your work')
        row(281,'Qwen 2.5 1.5B','Active  ·  Installed','●'); row(409,'Llama 3.2 1B','Installed  ·  Not active','×')
        c.wrap((992,557),'Storage sizes would appear beside each installed model.',401,23,muted)
        c.button(693,'Browse models')
        c.wrap((992,776),'Deleting a model requires a new download to use it again.',400,20,muted)
    elif screen=='clear':
        header('Conversations'); row(208,'Open conversation history','Share a selected chat')
        c.text((992,387),'Delete all conversations',23,'#9F392D','bold')
        c.box((979,486,1415,740),'#FFFDF8',17,'#CFC9BD')
        c.text((1000,505),'Delete all conversations?',25,ink,'bold')
        c.wrap((1000,549),'This removes your chats. Models and saved memories are kept.',385,22)
        c.button(653,'Delete chats','#9F392D',1000,220); c.text((1260,668),'Cancel',21,green)
    elif screen=='privacy':
        header('Privacy'); section('Know where data goes')
        for j,(a,b) in enumerate([('Local generation','Responses run on your device.'),('Model downloads','Internet is needed to download.'),('Voice input','Your phone service may use internet.'),('Sharing','You choose what to send and where.')]): row(276+j*119,a,b,'')
        c.text((992,808),'Read privacy policy  →',22,green)
    elif screen=='advanced':
        header('Advanced'); c.text((992,191),'Custom model URL',22,ink,'bold')
        c.box((992,232,1403,310),None,10,'#CCC8BE'); c.wrap((1007,244),'https://huggingface.co/\nQwen/Qwen2.5-1.5B-Instruct-GGUF',380,17)
        for j,(a,b) in enumerate([('Temperature','0.7'),('Top-p','0.9'),('Top-k','40'),('Response token limit','512')]):
            y=345+j*94; c.text((992,y),a,22,ink,'bold'); c.text((1350,y),b,21,green)
            c.line(992,y+53,1401); c.d.ellipse((1145,y+47,1157,y+59),fill=green)
        c.button(795,'Save advanced settings')
    elif screen=='about':
        header('About & help'); mark(c,1146,185,82)
        c.text((1080,283),'Moonlight',38,ink,'serif'); c.text((1116,338),'Design preview',20,muted)
        for j,t in enumerate(['App version','Model licenses','Privacy policy','Troubleshooting']): row(416+j*81,t)
        c.wrap((992,784),'Download, performance and voice guidance.',400,20,muted)
    return im

def prepare():
    (WORK/'scenes.json').write_text(json.dumps(SCENES,ensure_ascii=False,indent=2),encoding='utf-8')
    sheet=Image.new('RGB',(1000,math.ceil(len(SCENES)/2)*313),'white')
    for i in range(len(SCENES)):
        frame=draw(i)
        frame.resize((500,313)).save(WORK/f'preview-{i:02}.png')
        sheet.paste(frame.resize((500,313)),((i%2)*500,(i//2)*313))
    sheet.save(OUT/'storyboard.jpg',quality=90)
    draw(0).save(OUT/'poster.png')
    print(f'Prepared {len(SCENES)} scenes',flush=True)

def render():
    sys.path.insert(0,str(ROOT/'.local-release/video-runtime'))
    import imageio_ffmpeg
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    clips=[]; chapters=[]; elapsed=0
    for i,s in enumerate(SCENES):
        voice=WORK/f'voice-{i:02}.wav'
        with wave.open(str(voice),'rb') as f: duration=f.getnframes()/f.getframerate()+1.3
        duration=max(8,duration); count=math.ceil(duration*FPS); duration=count/FPS
        video=WORK/f'clip-{i:02}.mp4'
        cmd=[ffmpeg,'-y','-loglevel','error','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-', '-i',str(voice),'-af','apad','-t',str(duration),'-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',str(video)]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        # Draw expensive text only at state changes, retaining animated taps and progress.
        cache={}
        for f in range(count):
            p=f/count
            key=round(p*40)/40 if s['screen'] in ['download','compose','answer','appearance','memory'] else .7
            if key not in cache: cache[key]=draw(i,key)
            im=cache[key].copy(); d=ImageDraw.Draw(im)
            if s['focus'] and .2<p<.7:
                x,y=s['focus']; phase=((p-.2)*5)%1; r=13+int(phase*21)
                d.ellipse((x-r,y-r,x+r,y+r),outline='#78957D',width=3)
                d.ellipse((x-5,y-5,x+5,y+5),fill='#234737')
            # A brief fade-in signals a new navigation step.
            if f<5: im=Image.blend(Image.new('RGB',(W,H),'#F7F5F0'),im,(f+1)/5)
            proc.stdin.write(im.tobytes())
        proc.stdin.close()
        if proc.wait()!=0: raise RuntimeError(f'Encoder failed on scene {i}')
        clips.append(video)
        chapters.append(f'{int(elapsed)//60:02}:{int(elapsed)%60:02}  {s["title"]}')
        elapsed+=duration
        print(f'Rendered {i+1}/{len(SCENES)}: {s["title"]}',flush=True)
    listing=WORK/'clips.txt'; listing.write_text('\n'.join("file '"+str(p).replace('\\','/')+"'" for p in clips),encoding='utf-8')
    output=OUT/'Moonlight-Paper-Mono-Walkthrough.mp4'
    subprocess.run([ffmpeg,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(listing),'-c','copy','-movflags','+faststart',str(output)],check=True)
    (OUT/'chapters.txt').write_text('\n'.join(chapters),encoding='utf-8')
    (OUT/'transcript.txt').write_text('\n\n'.join(c+'\n'+s['speech'] for c,s in zip(chapters,SCENES)),encoding='utf-8')
    # Validate decoding end to end, not just successful file creation.
    subprocess.run([ffmpeg,'-v','error','-i',str(output),'-f','null','-'],check=True)
    print(f'COMPLETE {elapsed:.1f}s, {output.stat().st_size} bytes: {output}',flush=True)

if __name__=='__main__':
    prepare() if '--prepare' in sys.argv else render()
