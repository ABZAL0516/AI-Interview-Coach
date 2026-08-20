document.addEventListener('DOMContentLoaded',()=>{
 const e=JSON.parse(localStorage.getItem('latestEvaluation')||'null');
 const setup=JSON.parse(localStorage.getItem('interviewSetup')||'{}');
 if(!e){go('setup', true);return}
 $('#resultMeta').textContent=`${setup.role||'Interview'} · ${setup.experience||''}`;
 $('#grandScore').innerHTML=`${e.grandScore}<span>/100</span>`;
 $('#recommendation').textContent=e.recommendation||'';
 $('#summary').textContent=e.overall?.summary||'';
 $('#l1Score').textContent=`${e.level1.score}/${e.level1.maxScore}`;
 $('#l2Score').textContent=`${e.level2.score}/${e.level2.maxScore}`;
 $('#l3Score').textContent=`${e.level3.score}/${e.level3.maxScore}`;
 const fill=(id,a)=>{$(id).innerHTML=(a?.length?a:['No feedback available.']).map(x=>`<li>${x}</li>`).join('')};
 fill('#strengths',e.overall?.strengths);fill('#weaknesses',e.overall?.weaknesses);
 const all=[['Level 1',e.level1],['Level 2',e.level2],['Level 3',e.level3]];
 $('#feedbackList').innerHTML=all.flatMap(([name,l])=>(l.questions||[]).map((q,i)=>`<details class="feedback-item"><summary>${name} · Question ${i+1} · ${q.score} points</summary><p><b>${q.verdict||''}</b></p><p>${q.feedback||'No detailed feedback.'}</p></details>`)).join('');
});
