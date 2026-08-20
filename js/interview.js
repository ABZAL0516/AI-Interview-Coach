let state={level:1,index:0,questions:null,answers:{1:[],2:[],3:[]},setup:null};
function showOverlay(title,text){$('#overlayTitle').textContent=title;$('#overlayText').textContent=text;$('#overlay').classList.remove('hidden')}
function hideOverlay(){$('#overlay').classList.add('hidden')}
function render(){
 const qs=state.questions?.[String(state.level)]||[];
 const q=qs[state.index];
 $('#questionText').textContent=q||'No question available.';
 $('#questionCount').textContent=`Question ${state.index+1} of ${qs.length}`;
 $('#levelTag').textContent=`Level ${state.level}`;
 for(let i=1;i<=3;i++) $('#step'+i).className='step '+(i<state.level?'done':i===state.level?'active':'');
}
async function load(){
 state.setup=JSON.parse(localStorage.getItem('interviewSetup')||'null');
 if(!state.setup){go('setup', true);return}
 $('#roleDisplay').textContent=`${state.setup.role} · ${state.setup.experience}`;
 showOverlay('Preparing your interview','Gemini AI is generating your questions...');
 try{
  const r=await fetch('/api/generate-questions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...state.setup,previousQuestions:JSON.parse(localStorage.getItem('questionHistory')||'[]')})});
  const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.error||'Could not generate questions');
  state.questions=d.questions;
  const hist=[...JSON.parse(localStorage.getItem('questionHistory')||'[]'),...(d.questions['2']||[]),...(d.questions['3']||[])].slice(-60);
  localStorage.setItem('questionHistory',JSON.stringify(hist));
  render(); hideOverlay();
 }catch(err){$('#overlayTitle').textContent='Interview unavailable';$('#overlayText').textContent=err.message; $('#overlay').querySelector('.spinner').style.display='none';}
}
document.addEventListener('DOMContentLoaded',()=>{
 load();
 $('#answerInput').addEventListener('input',()=>{const v=$('#answerInput').value.trim();$('#wordCount').textContent=`${v?v.split(/\s+/).length:0} words`});
 $('#answerForm').addEventListener('submit',async e=>{
  e.preventDefault(); const answer=$('#answerInput').value.trim(); if(!answer)return;
  const qs=state.questions[String(state.level)]; state.answers[state.level].push({question:qs[state.index],answer});
  $('#answerInput').value=''; $('#wordCount').textContent='0 words';
  state.index++;
  if(state.index<qs.length){render();return}
  if(state.level<3){state.level++;state.index=0;render();toast(`Level ${state.level} started`);return}
  showOverlay('Evaluating your interview','Gemini AI is carefully reviewing all 15 answers...');
  try{
   const r=await fetch('/api/evaluate-interview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...state.setup,answers:state.answers})});
   const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Evaluation failed');
   localStorage.setItem('latestEvaluation',JSON.stringify(d.evaluation));
   const history=JSON.parse(localStorage.getItem('interviewHistory')||'[]');
   history.unshift({date:new Date().toISOString(),role:state.setup.role,experience:state.setup.experience,score:d.evaluation.grandScore,recommendation:d.evaluation.recommendation,evaluation:d.evaluation});
   localStorage.setItem('interviewHistory',JSON.stringify(history.slice(0,30)));
   go('results');
  }catch(err){hideOverlay();toast(err.message)}
 });
});
