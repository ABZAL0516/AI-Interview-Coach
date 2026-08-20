document.addEventListener('DOMContentLoaded',()=>{
 const u=getUser(); if(!u)return;
 $('#profileName').textContent=u.name;$('#profileEmail').textContent=u.email;$('#avatar').textContent=(u.name||'U')[0].toUpperCase();
 const h=JSON.parse(localStorage.getItem('interviewHistory')||'[]');
 $('#totalAttempts').textContent=h.length;$('#bestScore').textContent=h.length?Math.max(...h.map(x=>x.score)): '--';$('#latestScore').textContent=h.length?h[0].score:'--';
 $('#historyList').innerHTML=h.length?h.map(x=>`<div class="history-item"><div><b>${x.role}</b><br><small>${x.experience} · ${new Date(x.date).toLocaleString()}</small></div><div style="text-align:right"><b>${x.score}/100</b><br><small>${x.recommendation}</small></div></div>`).join(''):'<div class="empty">No interviews yet. Your completed interviews will appear here.</div>';
 $('#clearHistory').addEventListener('click',()=>{if(confirm('Clear all interview history?')){localStorage.removeItem('interviewHistory');location.reload()}});
});
