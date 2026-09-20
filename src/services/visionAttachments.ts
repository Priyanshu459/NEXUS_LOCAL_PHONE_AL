export interface VisionAttachment {
  kind: 'image'|'video';
  frames: {dataUrl:string;seconds?:number}[];
  durationSeconds?:number;
}

export function visionParts(media:VisionAttachment) {
  const max=media.kind==='video'?4:1;
  if(!['image','video'].includes(media.kind)||!Array.isArray(media.frames)||media.frames.length!==max)throw new Error('Attach an image or a video with four sampled frames.');
  if(media.kind==='video'&&(!Number.isFinite(media.durationSeconds)||media.durationSeconds!<=0||media.durationSeconds!>60))throw new Error('Choose a video of 60 seconds or less.');
  const parts:({type:'text';text:string}|{type:'image_url';image_url:{url:string}})[]=[];
  if(media.kind==='video')parts.push({type:'text',text:`Video sample: four still frames from a ${media.durationSeconds}-second clip. Audio and unsampled moments are unavailable. Describe only what the supplied frames support.`});
  for(const frame of media.frames){
    if(typeof frame.dataUrl!=='string'||frame.dataUrl.length>350000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(frame.dataUrl))throw new Error('Invalid or oversized image attachment. Select the file again.');
    if(media.kind==='video'){
      if(!Number.isFinite(frame.seconds)||frame.seconds!<0||frame.seconds!>media.durationSeconds!)throw new Error('Invalid video timestamp.');
      parts.push({type:'text',text:`Frame at ${frame.seconds!.toFixed(2)} seconds:`});
    }
    parts.push({type:'image_url',image_url:{url:frame.dataUrl}});
  }
  return parts;
}
