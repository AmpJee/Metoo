
const starsEl=document.getElementById('stars');
for(let i=0;i<60;i++){const s=document.createElement('div');s.className='star';s.style.left=Math.random()*100+'%';s.style.top=Math.random()*70+'%';s.style.animationDelay=(Math.random()*3)+'s';starsEl.appendChild(s);}

function toggleTheme(){
  const html=document.documentElement;
  const isDark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme',isDark?'light':'dark');
  document.getElementById('themeLabel').textContent=isDark?'Day':'Night';
  document.getElementById('themeKnob').textContent=isDark?'☀️':'🌙';
}

function showAuth(id){
  document.querySelectorAll('#authWrap .screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
}
function enterApp(){
  document.getElementById('authWrap').style.display='none';
  document.getElementById('mainApp').classList.remove('hidden');
  showToast('Welcome — your shop is live 🎉');
}
function logout(){
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('authWrap').style.display='flex';
  showAuth('welcome');
}

function nav(el,screen){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.main .screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('app-'+screen).classList.add('active');
  const titles={home:['Home','Everything about your shop, at a glance.'],inventory:['Inventory','Add, edit, and track your products.'],orders:['Order status','Confirm, ship, and track deliveries.'],chat:['Chat with Retailer','Messages, requests, and reports.']};
  document.getElementById('pageTitle').textContent=titles[screen][0];
  document.getElementById('pageSub').textContent=titles[screen][1];
  if(screen==='orders')setOrderTab(document.querySelector('#orderTabs .tab'),'confirm');
}

function pop(el){el.style.animation='none';requestAnimationFrame(()=>{el.style.animation='popIn .4s cubic-bezier(.34,1.56,.64,1)';});}

function openAddProduct(){const f=document.getElementById('addProductForm');f.style.display=f.style.display==='none'?'block':'none';}
function submitProduct(){showToast('Product added — pending verification ✅');document.getElementById('addProductForm').style.display='none';}

const orderData={confirm:[{name:'Order #221 — Silk Scarf ×2',meta:'Requested 10 min ago'},{name:'Order #222 — Sandals ×1',meta:'Requested 25 min ago'}],ship:[{name:'Order #218 — Lantern Set ×3',meta:'Confirmed, ready to pack'}],deliver:[{name:'Order #210 — Silk Scarf ×1',meta:'Courier: Kerry Express'}],returned:[{name:'Order #199 — Sandals ×1',meta:'Pending return approval'}]};
function setOrderTab(el,key){
  document.querySelectorAll('#orderTabs .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const pane=document.getElementById('orderPane');pane.innerHTML='';
  orderData[key].forEach(o=>{
    const div=document.createElement('div');div.className='order-card';
    div.innerHTML=`<div class="meta"><strong>${o.name}</strong><span>${o.meta}</span></div><div>${key==='confirm'?`<button class="btn good small" onclick="decide(this,'accepted')">Accept</button><button class="btn bad small" onclick="decide(this,'rejected')" style="margin-left:8px;">Reject</button>`:`<span class="badge pending">${key==='returned'?'Awaiting approval':'In progress'}</span>`}</div>`;
    pane.appendChild(div);
  });
}
function decide(btn,result){const wrap=btn.parentElement;wrap.innerHTML=`<span class="badge ${result}">${result==='accepted'?'Accepted':'Rejected'}</span>`;pop(wrap.querySelector('.badge'));showToast(result==='accepted'?'Order accepted ✅':'Order rejected');}

function openChat(el,title){document.querySelectorAll('.chat-contact').forEach(c=>c.classList.remove('active'));el.classList.add('active');document.getElementById('chatHeadTitle').textContent=title;document.getElementById('chatBody').innerHTML=`<div class="msg in">You're now viewing: ${title}</div>`;}
function sendMsg(){const input=document.getElementById('chatInput');if(!input.value.trim())return;const body=document.getElementById('chatBody');const msg=document.createElement('div');msg.className='msg out';msg.textContent=input.value;body.appendChild(msg);body.scrollTop=body.scrollHeight;input.value='';}

function showToast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>t.classList.remove('show'),2600);}
