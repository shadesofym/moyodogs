import sharp from 'sharp';
const images = [['malu-original.jpg','malu.webp',2000],['malu-portrait-original.jpg','malu-portrait.webp',1000],['yam-original.jpg','yam.webp',1000],['bumblebee-original.png','bumblebee.webp',1000]];
for (const [source,destination,width] of images) {
  await sharp(`public/media/${source}`).rotate().resize({width,withoutEnlargement:true}).webp({quality:85}).toFile(`public/media/${destination}`);
  console.log(destination);
}
