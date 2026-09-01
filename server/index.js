import express from 'express';
import cors from 'cors';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import {GoogleGenAI} from '@google/genai';
import admin from 'firebase-admin';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const secrets = new SecretManagerServiceClient();
let cachedKey;

async function getGeminiKey(){
  if(cachedKey) return cachedKey;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  if(!projectId) throw new Error('GOOGLE_CLOUD_PROJECT is required');
  const name = `projects/${projectId}/secrets/GEMINI_API_KEY/versions/latest`;
  const [version] = await secrets.accessSecretVersion({name});
  cachedKey = version.payload.data.toString();
  return cachedKey;
}

async function verifyBearer(req,res,next){
  try{
    const h=req.headers.authorization||'';
    if(!h.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
    req.user=await auth.verifyIdToken(h.slice(7));
    next();
  }catch(e){ return res.status(401).json({error:'Invalid authentication token'}); }
}

const app=express();
app.use(cors({origin:true}));
app.use(express.json({limit:'32kb'}));
app.get('/api/health',(req,res)=>res.json({ok:true,service:'personal-gemini-journal'}));

app.post('/api/chat',verifyBearer,async(req,res)=>{
  try{
    const {messages}=req.body;
    if(!Array.isArray(messages)||messages.length===0) return res.status(400).json({error:'messages is required'});
    if(messages.length>30) return res.status(400).json({error:'Conversation too long'});
    const key=await getGeminiKey();
    const ai=new GoogleGenAI({apiKey:key});
    const contents=messages.map(m=>({role:m.role==='model'?'model':'user',parts:[{text:String(m.text).slice(0,8000)}]}));
    const response=await ai.models.generateContent({model:'gemini-2.5-flash',contents,config:{systemInstruction:'You are a private journaling and brainstorming assistant. Do not claim confidentiality beyond the application security controls. Be concise, supportive, practical, and never request passwords, API keys, or authentication tokens.'}});
    res.json({text:response.text||''});
  }catch(e){console.error(e);res.status(500).json({error:'AI request failed'});}
});

app.post('/api/summarize',verifyBearer,async(req,res)=>{
  try{
    const {messages}=req.body;
    if(!Array.isArray(messages)||!messages.length) return res.status(400).json({error:'messages is required'});
    const key=await getGeminiKey();
    const ai=new GoogleGenAI({apiKey:key});
    const transcript=messages.map(m=>`${m.role}: ${m.text}`).join('\n').slice(0,30000);
    const r=await ai.models.generateContent({model:'gemini-2.5-flash',contents:[{role:'user',parts:[{text:`Summarize this journal conversation into JSON with keys title, summary, insights, nextActions. insights and nextActions must be arrays. Conversation:\n${transcript}`}]}],config:{responseMimeType:'application/json'}});
    const summary=JSON.parse(r.text||'{}');
    const ref=db.collection('users').doc(req.user.uid).collection('journals').doc();
    await ref.set({ownerId:req.user.uid,...summary,createdAt:admin.firestore.FieldValue.serverTimestamp()});
    res.json({id:ref.id,...summary});
  }catch(e){console.error(e);res.status(500).json({error:'Summary failed'});}
});

app.get('/api/journals',verifyBearer,async(req,res)=>{
  const snap=await db.collection('users').doc(req.user.uid).collection('journals').orderBy('createdAt','desc').limit(50).get();
  res.json(snap.docs.map(d=>({id:d.id,...d.data()})));
});

const port=process.env.PORT||8080;
app.listen(port,()=>console.log(`API listening on ${port}`));
