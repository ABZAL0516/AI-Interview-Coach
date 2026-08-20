import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();
const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
const app=express(), PORT=process.env.PORT||5000;
const API_KEY=process.env.GEMINI_API_KEY||'';
const MODEL=process.env.GEMINI_MODEL||'gemini-2.5-flash';
const ai=API_KEY?new GoogleGenAI({apiKey:API_KEY}):null;
app.use(cors());
app.use(express.json({ limit: '400kb' }));

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
const HR=[
'Can you introduce yourself and walk me through your background?',
'Why did you choose this career path, and what interests you about this role?',
'What are your key strengths and one area you are currently working to improve?',
'How do you handle constructive criticism or feedback on your work?',
'Tell me about a time you had to work under a tight deadline. How did you handle it?'
];
const roleFocus={
'Frontend Developer':'HTML, CSS, JavaScript, responsive design, accessibility, browser behavior, React and frontend performance',
'Backend Developer':'server-side programming, REST APIs, databases, authentication, validation, error handling and backend architecture',
'Full-Stack Developer':'frontend-backend integration, JavaScript, REST APIs, databases, authentication and deployment',
'Software Developer':'programming fundamentals, data structures, debugging, testing, design and problem solving',
'Mobile App Developer':'mobile UI, navigation, APIs, lifecycle, local storage, permissions and performance',
'AI / ML Engineer':'Python, machine learning, data preprocessing, model training, metrics, deep learning and deployment',
'Data Analyst':'SQL, spreadsheets, data cleaning, dashboards, visualization and business reasoning',
'Data Scientist':'Python, statistics, probability, machine learning, experimentation and model evaluation',
'DevOps / Cloud Engineer':'Linux, Git, CI/CD, Docker, cloud, networking, monitoring and reliability',
'Cybersecurity Analyst':'network security, authentication, vulnerabilities, incident response and threat detection',
'QA / Automation Tester':'test design, API testing, UI automation, regression and defect tracking',
'UI/UX Designer':'user research, information architecture, wireframes, usability, accessibility and design systems',
'Product / Project Manager':'requirements, prioritization, Agile, stakeholder communication, risk and delivery'
};
function clean(t){return String(t||'').replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim()}
async function ask(prompt,schema){
 if(!ai) throw new Error('Gemini AI is not configured. Add GEMINI_API_KEY to .env.');
 let last;
 for(let i=1;i<=3;i++){try{
   const r=await ai.models.generateContent({model:MODEL,contents:prompt,config:{responseMimeType:'application/json',responseSchema:schema}});
   return JSON.parse(clean(r.text));
 }catch(e){last=e; if(i<3) await new Promise(r=>setTimeout(r,i*1800));}}
 throw last;
}
const qSchema={type:Type.OBJECT,properties:{'2':{type:Type.ARRAY,items:{type:Type.STRING}},'3':{type:Type.ARRAY,items:{type:Type.STRING}}},required:['2','3']};

app.get('/api/health',(_,res)=>res.json({success:true,geminiConfigured:Boolean(ai),model:MODEL}));
app.post('/api/generate-questions',async(req,res)=>{
 const {role='Full-Stack Developer',experience='Fresher',previousQuestions=[]}=req.body||{};
 if(!ai)return res.status(503).json({success:false,error:'Gemini AI is not configured. Add GEMINI_API_KEY to .env.'});
 const focus=roleFocus[role]||'the selected professional role';
 const avoid=Array.isArray(previousQuestions)?previousQuestions.slice(-60).join('\n- '):'';
 const prompt=`You create a realistic interview for a ${experience} ${role}. Role focus: ${focus}.
Generate exactly 5 Level 2 technical/role questions and exactly 5 Level 3 practical scenario/problem-solving questions.
Questions must suit the experience level, be clear, non-duplicated, and not repeat these previous questions:
- ${avoid||'None'}
Return JSON only.`;
 try{
  const raw=await ask(prompt,qSchema);
  const l2=Array.isArray(raw['2'])?raw['2'].map(String).filter(Boolean).slice(0,5):[];
  const l3=Array.isArray(raw['3'])?raw['3'].map(String).filter(Boolean).slice(0,5):[];
  if(l2.length!==5||l3.length!==5)throw new Error('Gemini did not return exactly 5 questions per level.');
  res.json({success:true,questions:{'1':HR,'2':l2,'3':l3}});
 }catch(e){console.error(e);res.status(502).json({success:false,error:e.message||'Could not generate interview questions.'})}
});

const evalSchema={type:Type.OBJECT,properties:{
 level1:{type:Type.OBJECT,properties:{questions:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{score:{type:Type.NUMBER},verdict:{type:Type.STRING},feedback:{type:Type.STRING}},required:['score','verdict','feedback']}},feedback:{type:Type.STRING}},required:['questions']},
 level2:{type:Type.OBJECT,properties:{questions:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{score:{type:Type.NUMBER},verdict:{type:Type.STRING},feedback:{type:Type.STRING}},required:['score','verdict','feedback']}},feedback:{type:Type.STRING}},required:['questions']},
 level3:{type:Type.OBJECT,properties:{questions:{type:Type.ARRAY,items:{type:Type.OBJECT,properties:{score:{type:Type.NUMBER},verdict:{type:Type.STRING},feedback:{type:Type.STRING}},required:['score','verdict','feedback']}},feedback:{type:Type.STRING}},required:['questions']},
 overall:{type:Type.OBJECT,properties:{strengths:{type:Type.ARRAY,items:{type:Type.STRING}},weaknesses:{type:Type.ARRAY,items:{type:Type.STRING}},summary:{type:Type.STRING}},required:['strengths','weaknesses','summary']}
},required:['level1','level2','level3','overall']};

function pack(level){return (level||[]).map((x,i)=>`Q${i+1}: ${x.question}\nA${i+1}: ${x.answer||'[NO ANSWER]'}`).join('\n\n')}
function norm(items,maxEach){return Array.from({length:5},(_,i)=>{const x=items?.[i]||{};return{score:Math.max(0,Math.min(maxEach,Math.round(Number(x.score)||0))),verdict:String(x.verdict||''),feedback:String(x.feedback||'')}})}
function recommendation(s){return s>=85?'Strong Hire':s>=70?'Hire':s>=50?'Need Improvement':'Not Recommended'}

app.post('/api/evaluate-interview',async(req,res)=>{
 const {role='Developer',experience='Fresher',answers={}}=req.body||{};
 if(!ai)return res.status(503).json({success:false,error:'Gemini AI is not configured. Add GEMINI_API_KEY to .env.'});
 const prompt=`You are a strict senior interviewer evaluating a ${experience} ${role}.
Evaluate each answer against its exact question. Do not reward word count. Gibberish, irrelevant answers and "I don't know" should score 0.
There are 5 questions per level. Maximum per Level 1 question is 6, Level 2 is 8, Level 3 is 6.
Level 1: communication/relevance. Level 2: technical correctness and depth. Level 3: practical reasoning and problem solving.
Return exactly 5 evaluations for each level plus strengths, weaknesses and a concise summary.

LEVEL 1:
${pack(answers['1'])}
LEVEL 2:
${pack(answers['2'])}
LEVEL 3:
${pack(answers['3'])}`;
 try{
  const raw=await ask(prompt,evalSchema);
  const a=norm(raw.level1?.questions,6),b=norm(raw.level2?.questions,8),c=norm(raw.level3?.questions,6);
  const s1=a.reduce((s,x)=>s+x.score,0),s2=b.reduce((s,x)=>s+x.score,0),s3=c.reduce((s,x)=>s+x.score,0),grand=s1+s2+s3;
  res.json({success:true,evaluation:{grandScore:grand,recommendation:recommendation(grand),level1:{score:s1,maxScore:30,questions:a},level2:{score:s2,maxScore:40,questions:b},level3:{score:s3,maxScore:30,questions:c},overall:{strengths:Array.isArray(raw.overall?.strengths)?raw.overall.strengths.slice(0,5):[],weaknesses:Array.isArray(raw.overall?.weaknesses)?raw.overall.weaknesses.slice(0,5):[],summary:String(raw.overall?.summary||'')}}});
 }catch(e){console.error(e);res.status(502).json({success:false,error:e.message||'Gemini could not evaluate the interview.'})}
});
// Explicit page routes keep local and deployed navigation predictable.
app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')));
for (const page of ['index','login','signup','setup','interview','results','profile']) {
  app.get(`/${page}`, (_, res) => res.sendFile(path.join(__dirname, `${page}.html`)));
}

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => console.log(`AI Interview Coach running on port ${PORT}`));
}

export default app;
