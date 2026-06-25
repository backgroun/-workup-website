const fs=require('fs');const {createClient}=require('@supabase/supabase-js');
const env={};for(const l of fs.readFileSync('.env.local','utf8').split(/\r?\n/)){const m=l.match(/^([A-Z0-9_]+)=(.*)$/);if(m)env[m[1]]=m[2];}
const sb=createClient(env.NEXT_PUBLIC_SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const {data}=await sb.from('products').select('image_url,sub_images,detail_blocks').eq('id','snug-life-vest').single();
  console.log("대표(image_url):", data.image_url?"O (1장)":"X");
  console.log("갤러리 썸네일(sub_images):", (data.sub_images||[]).length+"장  ← 0이어야 정상");
  console.log("상세(detail_blocks):", (data.detail_blocks||[]).length+"장  ← 13이어야 정상");
})();
