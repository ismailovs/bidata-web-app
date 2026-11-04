const $ = selector => document.querySelector(selector);
const translations = {
 uz: {
  workspace:'БИЗНЕС МАЙДОНИ',market:'Имкониятлар',saved:'Сақланганлар',account:'Ҳисоб',tagline:'Имкониятни кутманг. Биринчи бўлиб топинг.',platform:'Ўзбекистон харидлар платформаси',install:'Иловани ўрнатиш ↗',signin:'Кириш',overview:'СИЗНИНГ БОЗОРИНГИЗ. СИЗНИНГ ИМКОНИЯТИНГИЗ.',headline:'Кейинги имкониятингизни топинг.',subtitle:'Тендерлар ва харидлар — бизнесингиз учун бир жойда.',tendercount:'Кўрсатилаётган тендерлар',allcategories:'Барча йўналишлар',totalvalue:'Жами бошланғич қиймат',savedcount:'Сақланган имкониятлар',openSaved:'Рўйхатни очиш ↗',opportunities:'Харид имкониятлари',refresh:'Янгилаш ↻',search:'Тендер, товар ёки ташкилотни қидиринг',deadlineSort:'Муддати яқин',amountSort:'Қиймати юқори',savedDesc:'Қизиқарли имкониятларингиз ва ариза босқичлари шу ерда.',plansTitle:'Бозорни кенгроқ кўринг.',plansDesc:'Тендерлар билан ишлаш учун кўпроқ имконият.',free:'Бепул',freeDesc:'Бозорни ўрганишни бошланг.',free1:'Тендерлар қидируви ва фильтрлар',free2:'Шахсий сақланганлар рўйхати',free3:'Иловани бош экранга қўшиш',browse:'Тендерларни кўриш',proTitle:'Маълумотдан қарорга.',proDesc:'Барча бепул имкониятлар ва жонли тендерларни CSV файлга экспорт қилиш.',renewal:'Обуналар автоматик янгиланади. Обунани бошқариш орқали бекор қилиш мумкин.',manage:'Обунани бошқариш',export:'CSV экспорт',footer:'Маълумот билан олдинда бўлинг.',authDesc:'Сақланган тендерларингизга исталган қурилмадан киринг.',password:'Пароль',passwordHint:'Камида 12 та белги. Махсус тест паролидан фойдаланинг: бу дастлабки версия.',installTitle:'Bidata доим ёнингизда.',installDesc:'iPhone Safari браузерида:',install1:'Улашиш (Share) тугмасини босинг.',install2:'«Бош экранга қўшиш» (Add to Home Screen) ни танланг.',install3:'«Қўшиш» (Add) ни босинг.',installOther:'Android ёки компьютерда браузернинг «Иловани ўрнатиш» менюсидан фойдаланинг.',details:'Тендер тафсилотлари',sample:'Намуна маълумотлар. Бу ҳақиқий тендерлар эмас. Жонли маълумотлар уланмаган.',live:'Жонли манба • янгиланиш вақти пастда кўрсатилган.',empty:'Ҳозирча мос тендерлар йўқ.',nosaved:'Сақланган тендерлар йўқ. Картадаги юрак белгисини босинг.',save:'Сақлаш',unsave:'Сақланганлардан ўчириш',all:'Барчаси',regions:'Барча ҳудудлар',more:'Батафсил ↗',date:'Муддат',buyer:'Буюртмачи',region:'Ҳудуд',source:'Манбани очиш ↗',register:'Рўйхатдан ўтиш',noaccount:'Ҳисоб йўқми? Рўйхатдан ўтинг',hasaccount:'Ҳисоб борми? Кириш',logout:'Чиқиш',loginneeded:'Сақлаш ва компания йўналишини созлаш учун киринг.',inactive:'Обуналар ҳали очилмаган. Нархлар ва тўлов хизмати созланмоқда.',monthly:'Ойлик обуна',yearly:'Йиллик обуна',subscribe:'Обунани танлаш',pro:'Pro обуна фаол',basic:'Бепул ҳисоб',paymentReturn:'Тўлов хизмати қайтарди. Обуна ҳолати сервер орқали текширилади.',offline:'Тармоқ билан алоқа йўқ. Интернетни текширинг. Жонли маълумотлар кэшланмайди.',matches:'Менга мос харидлар',configure:'Компания йўналишини созлаш ↗',keywords:'Маҳсулот ёки хизмат калит сўзлари (вергул билан)',companyRegion:'Ҳудуд (бўш бўлса — барчаси)',saveProfile:'Компания йўналишини сақлаш',profileHelp:'Оддий калит сўзлар ва ҳудуд бўйича мослик. AI прогнози эмас. Очиқ ойнада ҳар 60 сонияда текширилади; фон хабарлари ҳали йўқ.',profileSaved:'Компания йўналиши сақланди.',match:'Компаниянгизга мос',setKeywords:'Аввал ҳисоб саҳифасида калит сўзларни белгиланг.',newTenders:'Янги тендерлар:',updated:'Манба янгиланган:',checked:'Текширилди:',review:'Кўриб чиқиш',preparing:'Ҳужжат тайёрлаш',submitted:'Юборилган',won:'Ютилган',lost:'Ютқазилган',workflow:'Иш босқичи',privacy:'Махфийлик сиёсати',terms:'Фойдаланиш шартлари',stale:'Маълумотлар янгиланмади. Қайта уриниб кўринг.',expired:'Муддати ўтган',support:'Ёрдам'
 },
 ru: {
  workspace:'РАБОЧЕЕ ПРОСТРАНСТВО',market:'Возможности',saved:'Сохранённое',account:'Аккаунт',tagline:'Не ждите возможности. Найдите её первым.',platform:'Платформа закупок Узбекистана',install:'Установить приложение ↗',signin:'Войти',overview:'ВАШ РЫНОК. ВАШИ ВОЗМОЖНОСТИ.',headline:'Найдите следующую возможность.',subtitle:'Тендеры и закупки для вашего бизнеса в одном месте.',tendercount:'Показано тендеров',allcategories:'Все направления',totalvalue:'Начальная стоимость',savedcount:'Сохранено возможностей',openSaved:'Открыть список ↗',opportunities:'Возможности для закупок',refresh:'Обновить ↻',search:'Тендер, товар или организация',deadlineSort:'Ближайший срок',amountSort:'Высокая стоимость',savedDesc:'Избранные возможности и этапы подготовки заявок.',plansTitle:'Смотрите на рынок шире.',plansDesc:'Больше возможностей для работы с тендерами.',free:'Бесплатно',freeDesc:'Начните изучать рынок.',free1:'Поиск и фильтры тендеров',free2:'Личный список сохранённого',free3:'Установка на главный экран',browse:'Смотреть тендеры',proTitle:'От данных к решению.',proDesc:'Все бесплатные функции и экспорт живых тендеров в CSV.',renewal:'Подписка продлевается автоматически. Отменить её можно через управление подпиской.',manage:'Управлять подпиской',export:'Экспорт CSV',footer:'Данные дают преимущество.',authDesc:'Открывайте сохранённые тендеры с любого устройства.',password:'Пароль',passwordHint:'Не менее 12 символов. Используйте отдельный тестовый пароль: это ранняя версия.',installTitle:'Bidata всегда под рукой.',installDesc:'В Safari на iPhone:',install1:'Нажмите «Поделиться» (Share).',install2:'Выберите «На экран Домой» (Add to Home Screen).',install3:'Нажмите «Добавить» (Add).',installOther:'На Android или компьютере используйте меню браузера «Установить приложение».',details:'Детали тендера',sample:'Демонстрационные данные. Это не настоящие тендеры. Живые данные пока не подключены.',live:'Живой источник • время обновления указано ниже.',empty:'Подходящих тендеров пока нет.',nosaved:'Сохранённых тендеров нет. Нажмите сердечко на карточке.',save:'Сохранить',unsave:'Удалить из сохранённого',all:'Все',regions:'Все регионы',more:'Подробнее ↗',date:'Срок',buyer:'Заказчик',region:'Регион',source:'Открыть источник ↗',register:'Создать аккаунт',noaccount:'Нет аккаунта? Зарегистрироваться',hasaccount:'Есть аккаунт? Войти',logout:'Выйти',loginneeded:'Войдите, чтобы сохранять тендеры и настроить профиль компании.',inactive:'Подписки ещё не открыты. Цены и платёжный сервис настраиваются.',monthly:'Ежемесячная подписка',yearly:'Годовая подписка',subscribe:'Выбрать подписку',pro:'Подписка Pro активна',basic:'Бесплатный аккаунт',paymentReturn:'Вы вернулись из платёжного сервиса. Статус подписки проверяется сервером.',offline:'Нет соединения. Проверьте интернет. Живые данные не кэшируются.',matches:'Подходящие мне закупки',configure:'Настроить направление компании ↗',keywords:'Ключевые слова товаров или услуг (через запятую)',companyRegion:'Регион (пусто — все)',saveProfile:'Сохранить профиль компании',profileHelp:'Подбор по ключевым словам и региону. Это не AI-прогноз. В открытом окне проверяется каждые 60 секунд; фоновые уведомления ещё не подключены.',profileSaved:'Профиль компании сохранён.',match:'Подходит вашей компании',setKeywords:'Сначала задайте ключевые слова в аккаунте.',newTenders:'Новые тендеры:',updated:'Источник обновлён:',checked:'Проверено:',review:'На рассмотрении',preparing:'Подготовка документов',submitted:'Подано',won:'Выиграно',lost:'Проиграно',workflow:'Этап работы',privacy:'Политика конфиденциальности',terms:'Условия использования',stale:'Данные не обновлены. Попробуйте ещё раз.',expired:'Срок истёк',support:'Поддержка'
 }
};
let lang; try { lang = localStorage.getItem('bidataLanguage') || 'uz'; } catch { lang = 'uz'; }
if (!translations[lang]) lang = 'uz';
const t = key => translations[lang][key] || key;
const state = { user:null, tenders:[], saved:[], workflow:[], profile:{keywords:'',region:''}, category:'', matches:false, mode:'sample', config:{}, plans:[], error:null, updatedAt:null, checked:null };
const node = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text !== undefined) n.textContent = text; return n; };
async function api(path, method = 'GET', body) {
 const response = await fetch('/api/' + path, { method, credentials:'same-origin', cache:'no-store', ...(body ? { headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : {}) });
 const data = await response.json(); if (!response.ok) throw new Error(data.error || response.statusText); return data;
}
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').hidden = true, 5000); }
function safeURL(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } }
function match(tender) {
 const words = state.profile.keywords.split(',').map(w => w.trim().toLocaleLowerCase()).filter(Boolean);
 const text = `${tender.title} ${tender.category}`.toLocaleLowerCase();
 return words.length > 0 && words.some(w => text.includes(w)) && (!state.profile.region || tender.region.toLocaleLowerCase().includes(state.profile.region.toLocaleLowerCase()));
}
function money(amount) { return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'uz-UZ').format(amount); }
function date(value) { return new Date(value).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {day:'numeric',month:'short',year:'numeric'}); }
function openAuth() { $('#auth-error').textContent=''; $('#auth-dialog').showModal(); }
function card(tender, workflow = false) {
 const article = node('article','tender');
 const top = node('div','card-top'); top.append(node('span','category',tender.category));
 const save = node('button','bookmark' + (state.saved.includes(tender.id) ? ' saved' : ''),state.saved.includes(tender.id) ? '♥' : '♡');
 save.setAttribute('aria-label',t(state.saved.includes(tender.id) ? 'unsave' : 'save'));
 save.setAttribute('aria-pressed',String(state.saved.includes(tender.id)));
 save.onclick = async () => {
  if (!state.user) return openAuth(); save.disabled = true;
  try { await api('bookmarks',state.saved.includes(tender.id) ? 'DELETE':'POST',{id:tender.id}); state.saved = await api('bookmarks'); render(); }
  catch(e) { toast(e.message); save.disabled=false; }
 };
 top.append(save); article.append(top,node('h3','',tender.title),node('p','buyer',tender.buyer));
 if (match(tender)) article.append(node('span','match-label','✓ ' + t('match')));
 const amount = node('div','amount',money(tender.amount) + ' '); amount.append(node('span','',tender.currency)); article.append(amount);
 const meta = node('div','card-meta'); meta.append(node('span','','⌖ ' + tender.region),node('span','',`${t('date')}: ${date(tender.deadline)}${Date.parse(tender.deadline)<Date.now() ? ' · '+t('expired') : ''}`)); article.append(meta);
 const bottom = node('div','card-bottom'); const detail = node('button','detail-button',t('more')); detail.onclick=()=>showDetail(tender); bottom.append(node('span','source',tender.source),detail);article.append(bottom);
 if (workflow) {
  const label=node('label','fine',t('workflow')); const select=node('select','workflow-select');
  for(const id of ['review','preparing','submitted','won','lost']) { const opt=node('option','',t(id)); opt.value=id; select.append(opt); }
  select.value=state.workflow.find(x=>x.tender_id===tender.id)?.stage || 'review';
  select.onchange=async()=>{select.disabled=true;try{await api('workflow','PUT',{id:tender.id,stage:select.value});state.workflow=await api('workflow');}catch(e){toast(e.message);}finally{select.disabled=false;}};
  label.append(select);article.append(label);
 }
 return article;
}
function showDetail(tender) {
 const box=$('#detail-content');box.replaceChildren(node('h2','',tender.title),node('p','amount',money(tender.amount)+' UZS'));
 for(const [key,value] of [['buyer',tender.buyer],['region',tender.region],['date',date(tender.deadline)]]) {const row=node('div','detail-row');row.append(node('span','',t(key)),node('strong','',value));box.append(row);}
 if(safeURL(tender.sourceUrl)) {const a=node('a','button',t('source'));a.href=safeURL(tender.sourceUrl);a.target='_blank';a.rel='noopener noreferrer';box.append(a);} else box.append(node('p','notice',t('sample')));
 $('#detail-dialog').showModal();
}
function renderAccount() {
 const box=$('#account-panel');box.replaceChildren();
 if(!state.user){box.append(node('p','',t('loginneeded')));const b=node('button','button',t('signin'));b.onclick=openAuth;box.append(b);return;}
 box.append(node('h2','',state.user.email),node('p','',t(state.user.pro?'pro':'basic')));
 const form=node('form','profile-form');
 const keywords=node('input');keywords.value=state.profile.keywords;keywords.maxLength=500;keywords.placeholder='кабель, компьютер, мебель';
 const region=node('input');region.value=state.profile.region;region.maxLength=100;
 for(const [title,input] of [['keywords',keywords],['companyRegion',region]]){const label=node('label','',t(title));label.append(input);form.append(label);}
 form.append(node('p','fine',t('profileHelp')));const submit=node('button','button secondary',t('saveProfile'));submit.type='submit';form.append(submit);
 form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{state.profile={keywords:keywords.value,region:region.value.trim()};await api('profile','PUT',state.profile);toast(t('profileSaved'));renderCards();}catch(error){toast(error.message);}finally{submit.disabled=false;}};
 box.append(form);const logout=node('button','quiet',t('logout'));logout.onclick=async()=>{try{await api('logout','POST',{});state.user=null;state.saved=[];state.profile={keywords:'',region:''};state.workflow=[];state.matches=false;render();}catch(e){toast(e.message);}};box.append(logout);
}
function renderCards() {
 const q=$('#search').value.toLocaleLowerCase();const region=$('#region').value;
 let list=state.tenders.filter(x=>(!q||`${x.title} ${x.buyer} ${x.region}`.toLocaleLowerCase().includes(q))&&(!region||x.region===region)&&(!state.category||x.category===state.category)&&(!state.matches||match(x)));
 list.sort($('#sort').value==='amount' ? (a,b)=>b.amount-a.amount : (a,b)=>Date.parse(a.deadline)-Date.parse(b.deadline));
 $('#tenders').replaceChildren(...(list.length ? list.map(x=>card(x)) : [node('div','empty',state.error || t('empty'))]));
 $('#metric-count').textContent=list.length;$('#metric-value').textContent=money(list.reduce((s,x)=>s+x.amount,0));$('#metric-saved').textContent=state.saved.length;
 const saved=state.tenders.filter(x=>state.saved.includes(x.id));
 $('#saved-tenders').replaceChildren(...(!state.user ? [node('div','empty',t('loginneeded'))] : saved.length ? saved.map(x=>card(x,true)) : [node('div','empty',t('nosaved'))]));
 $('#matches-toggle').classList.toggle('active',state.matches);$('#matches-toggle').setAttribute('aria-pressed',String(state.matches));
}
function renderPlans() {
 const box=$('#price-options');box.replaceChildren();
 if(state.config.billingMode==='test')box.append(node('p','notice',lang==='ru'?'ТЕСТОВЫЙ РЕЖИМ: реальных списаний нет. Используйте только тестовые платёжные данные.':'ТЕСТ РЕЖИМИ: ҳақиқий тўлов олинмайди. Фақат тест тўлов маълумотларини ишлатинг.')); 
 if(!state.config.paymentsEnabled || !state.plans.length) box.append(node('p','notice',t('inactive')));
 for(const plan of state.plans){
  const button=node('button','button',t(plan.id)+' · '+new Intl.NumberFormat(lang==='ru'?'ru-RU':'uz-UZ',{style:'currency',currency:plan.currency}).format(plan.amount/(10**new Intl.NumberFormat('en',{style:'currency',currency:plan.currency}).resolvedOptions().maximumFractionDigits)));
  button.disabled=!!state.user?.pro;
  button.onclick=async()=>{if(!state.user)return openAuth();button.disabled=true;try{const data=await api('checkout','POST',{plan:plan.id});if(!safeURL(data.url))throw Error('Invalid checkout URL');location.assign(data.url);}catch(e){toast(e.message);button.disabled=false;}};box.append(button);
 }
 $('#export').hidden=!state.user?.pro;
 $('#manage-billing').hidden=!state.user;
 const legal=$('#legal');legal.replaceChildren();
 for(const [key,url] of [['privacy',state.config.privacyUrl],['terms',state.config.termsUrl]])if(safeURL(url)){const a=node('a','',t(key));a.href=safeURL(url);a.target='_blank';a.rel='noopener';legal.append(a,document.createTextNode(' · '));}
 if(state.config.supportEmail){const a=node('a','',t('support'));a.href='mailto:'+state.config.supportEmail;legal.append(a);}
}
function render() {
 document.documentElement.lang=lang==='ru'?'ru':'uz-Cyrl';
 document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
 document.querySelectorAll('[data-placeholder]').forEach(el=>el.placeholder=t(el.dataset.placeholder));
 $('#language').textContent=lang==='uz'?'РУ':'ЎЗ';$('#auth-button').textContent=state.user?state.user.email.slice(0,1).toUpperCase():t('signin');
 $('#data-badge').textContent=state.mode==='live'?'LIVE':'DEMO';
 $('#status-banner').textContent=state.error || t(state.mode==='live'?'live':'sample');
 $('#freshness').textContent=state.checked ? (state.updatedAt?t('updated')+' '+new Date(state.updatedAt).toLocaleString():t('checked')+' '+new Date(state.checked).toLocaleTimeString()) : '';
 const old=$('#region').value;$('#region').replaceChildren();const first=node('option','',t('regions'));first.value='';$('#region').append(first);
 for(const r of [...new Set(state.tenders.map(x=>x.region))]){const opt=node('option','',r);opt.value=r;$('#region').append(opt);}$('#region').value=old;
 $('#categories').replaceChildren();
 for(const category of ['',...new Set(state.tenders.map(x=>x.category))]){const b=node('button','chip'+(category===state.category?' active':''),category||t('all'));b.setAttribute('aria-pressed',String(category===state.category));b.onclick=()=>{state.category=category;render();};$('#categories').append(b);}
 renderCards();renderPlans();renderAccount();renderAuth();route();
}
function route(){const view=['market','saved','plans','account'].includes(location.hash.slice(1))?location.hash.slice(1):'market';document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==view+'-view');document.querySelectorAll('[data-nav]').forEach(el=>{el.classList.toggle('active',el.dataset.nav===view);if(el.dataset.nav===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});}
let registering=false;
function renderAuth(){$('#auth-title').textContent=t(registering?'register':'signin');$('#auth-submit').textContent=t(registering?'register':'signin');$('#auth-toggle').textContent=t(registering?'hasaccount':'noaccount');$('#password').autocomplete=registering?'new-password':'current-password';}
$('#auth-toggle').onclick=()=>{registering=!registering;$('#auth-error').textContent='';renderAuth();};
$('#auth-form').onsubmit=async e=>{e.preventDefault();$('#auth-submit').disabled=true;$('#auth-error').textContent='';try{await api(registering?'register':'login','POST',{email:$('#email').value,password:$('#password').value});$('#password').value='';await loadAccount();$('#auth-dialog').close();render();}catch(error){$('#auth-error').textContent=error.message;}finally{$('#auth-submit').disabled=false;}};
$('#auth-button').onclick=()=>state.user?location.hash='account':openAuth();
$('#language').onclick=()=>{lang=lang==='uz'?'ru':'uz';try{localStorage.setItem('bidataLanguage',lang);}catch{}render();};
$('#search').oninput=renderCards;$('#region').onchange=renderCards;$('#sort').onchange=renderCards;
$('#matches-toggle').onclick=()=>{if(!state.user)return openAuth();if(!state.profile.keywords.trim()){toast(t('setKeywords'));location.hash='account';return;}state.matches=!state.matches;renderCards();};
$('#manage-billing').onclick=async()=>{try{const data=await api('portal','POST',{});if(!safeURL(data.url))throw Error('Invalid billing URL');location.assign(data.url);}catch(e){toast(e.message);}};
$('#refresh').onclick=()=>refreshFeed();
let installPrompt;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
$('#install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('#install-dialog').showModal();};
window.addEventListener('appinstalled',()=>$('#install').hidden=true);
if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone)$('#install').hidden=true;
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>document.getElementById(button.dataset.close).close();
window.addEventListener('hashchange',route);
async function loadAccount(){state.user=await api('me');if(state.user){[state.saved,state.profile,state.workflow]=await Promise.all([api('bookmarks'),api('profile'),api('workflow')]);}else{state.saved=[];state.profile={keywords:'',region:''};state.workflow=[];}}
let refreshing=false;
async function refreshFeed(){if(refreshing)return;refreshing=true;$('#refresh').disabled=true;try{const feed=await api('tenders');const old=new Set(state.tenders.map(t=>t.id));const newCount=old.size?feed.tenders.filter(x=>!old.has(x.id)&&(!state.matches||match(x))).length:0;state.tenders=feed.tenders;state.mode=feed.mode;state.updatedAt=feed.updatedAt;state.checked=Date.now();state.error=null;if(newCount)toast(t('newTenders')+' '+newCount);}catch(e){state.tenders=[];state.error=navigator.onLine?e.message:t('offline');}finally{refreshing=false;$('#refresh').disabled=false;render();}}
async function start(){try{state.config=await api('config');state.mode=state.config.dataMode;await loadAccount();try{state.plans=await api('plans');}catch(e){toast(e.message);}}catch(e){toast(e.message);}await refreshFeed();if(new URLSearchParams(location.search).has('checkout'))toast(t('paymentReturn'));}
render();start();
setInterval(()=>{if(document.visibilityState==='visible')refreshFeed();},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){refreshFeed();loadAccount().then(render).catch(e=>toast(e.message));}});
window.addEventListener('online',refreshFeed);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
