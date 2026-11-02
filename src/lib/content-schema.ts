import {z} from 'astro/zod';
export const mediaPath=z.string().regex(/^\/media\/(?!.*(?:^|\/)\.\.(?:\/|$))[a-zA-Z0-9_./-]+$/);
export const photoSchema=z.object({image:mediaPath,alt:z.string().min(1)});
export const blockSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('text'),body:z.string().min(1)}),
 z.object({type:z.literal('image'),image:mediaPath,alt:z.string().min(1),caption:z.string().optional()}),
 z.object({type:z.literal('gallery'),images:z.array(photoSchema).min(1)}),
 z.object({type:z.literal('quote'),text:z.string().min(1),attribution:z.string().optional()}),
 z.object({type:z.literal('video'),file:mediaPath.regex(/\.(mp4|webm)$/i),title:z.string().min(1),poster:mediaPath.optional(),captions:mediaPath.regex(/\.vtt$/i).optional(),transcript:z.string().min(1)}),
]);
export type ContentBlock=z.infer<typeof blockSchema>;
export const timelineSchema=z.array(z.object({title:z.string().min(1),when:z.string().min(1),description:z.string().optional(),state:z.enum(['Geplant','Aktuell','Abgeschlossen']).default('Geplant'),image:mediaPath.optional(),alt:z.string().optional()}));
export type TimelineEvent=z.infer<typeof timelineSchema>[number];
