/* HAUS BARBER | Public privacy-by-design experience (no framework, no trackers). */
(() => {
  'use strict';

  const LANGS=['pt-BR','en','es','ja','de'];
  const KEYS={
    consent:'vyzo:haus_barber:consent:v1',
    locale:'vyzo:haus_barber:locale:v1',
    customer:'vyzo:haus_barber:remember:v1'
  };
  const DAY=86400000;
  const CONSENT_DAYS=180;
  const CUSTOMER_DAYS=90;
  const $=(id)=>document.getElementById(id);
  const words=window.HAUS_I18N||{};
  const originalText=new WeakMap();
  const originalAttributes=new WeakMap();
  let currentLanguage='pt-BR';
  let decision=null;
  let lastFocus=null;
  let preferenceDialog=null;
  let banner=null;
  let prefExternal=null;

  const ui={
    'pt-BR':{
      eyebrow:'PRIVACIDADE HAUS',title:'Sua privacidade é importante para nós',
      explanation:'Usamos armazenamento necessário para o funcionamento do site e, somente com sua autorização, carregamos o mapa externo do Google. Não identificamos ferramentas de anúncios ou estatísticas instaladas.',
      accept:'ACEITAR TODOS',reject:'REJEITAR OPCIONAIS',custom:'PERSONALIZAR',
      settings:'PREFERÊNCIAS DE PRIVACIDADE',settingsText:'Você pode atualizar a autorização do mapa a qualquer momento. Seu idioma e a opção de lembrar seus dados são preferências independentes.',
      essential:'Necessários',essentialDesc:'Funcionamento, segurança da sessão administrativa, idioma escolhido e registro da sua decisão.',always:'SEMPRE ATIVOS',
      external:'Mapa externo (Google Maps)',externalDesc:'O mapa incorporado só se conecta ao Google após sua autorização. Os links externos podem ser abertos sem habilitar o mapa.',
      save:'SALVAR PREFERÊNCIAS',close:'Fechar preferências',more:'Política de Privacidade',
      stored:'Preferências de privacidade atualizadas.',remembered:'Seus dados foram lembrados neste navegador.',
      forgotten:'Os dados salvos neste navegador foram apagados.',phoneNeeded:'Para lembrar seus dados, informe um telefone com DDD válido.',
      mapTitle:'Localização da Haus Barber',mapInfo:'O mapa do Google só é carregado com sua autorização. Você também pode abrir a localização diretamente no Google Maps.',
      mapButton:'AUTORIZAR E MOSTRAR MAPA ↗',help:'A decisão de lembrar dados pessoais não é vinculada ao consentimento para o mapa.'
    },
    en:{
      eyebrow:'HAUS PRIVACY',title:'Your privacy matters to us',
      explanation:'We use essential storage to operate the website and only load the embedded Google map with your permission. We have not identified any advertising or analytics trackers in this website.',
      accept:'ACCEPT ALL',reject:'REJECT OPTIONAL',custom:'CUSTOMIZE',
      settings:'PRIVACY PREFERENCES',settingsText:'You can update the map permission at any time. Your language and the option to remember your details are separate preferences.',
      essential:'Essential',essentialDesc:'Site operation, administrative session security, chosen language and your consent choice.',always:'ALWAYS ON',
      external:'External map (Google Maps)',externalDesc:'The embedded map connects to Google only after your permission. You can still open the external links without enabling it.',
      save:'SAVE PREFERENCES',close:'Close preferences',more:'Privacy Policy',
      stored:'Privacy preferences updated.',remembered:'Your details are saved in this browser.',
      forgotten:'Saved details have been removed from this browser.',phoneNeeded:'To save your details, enter a valid phone number with area code.',
      mapTitle:'Haus Barber location',mapInfo:'The Google map loads only with your permission. You can also open the location directly in Google Maps.',
      mapButton:'ALLOW AND SHOW MAP ↗',help:'Remembering contact details is separate from your consent to load the map.'
    },
    es:{
      eyebrow:'PRIVACIDAD HAUS',title:'Tu privacidad es importante para nosotros',
      explanation:'Usamos almacenamiento esencial para que el sitio funcione y solo cargamos el mapa integrado de Google con tu permiso. No hemos identificado rastreadores de anuncios ni estadísticas en este sitio.',
      accept:'ACEPTAR TODO',reject:'RECHAZAR OPCIONALES',custom:'PERSONALIZAR',
      settings:'PREFERENCIAS DE PRIVACIDAD',settingsText:'Puedes cambiar el permiso del mapa cuando quieras. Tu idioma y la opción de recordar tus datos son preferencias independientes.',
      essential:'Necesarios',essentialDesc:'Funcionamiento del sitio, seguridad de la sesión administrativa, idioma elegido y registro de tu decisión.',always:'SIEMPRE ACTIVOS',
      external:'Mapa externo (Google Maps)',externalDesc:'El mapa integrado solo se conecta a Google con tu permiso. Los enlaces externos se pueden abrir sin activarlo.',
      save:'GUARDAR PREFERENCIAS',close:'Cerrar preferencias',more:'Política de Privacidad',
      stored:'Preferencias de privacidad actualizadas.',remembered:'Tus datos quedaron guardados en este navegador.',
      forgotten:'Se han borrado los datos guardados en este navegador.',phoneNeeded:'Para recordar tus datos, introduce un teléfono válido con prefijo.',
      mapTitle:'Ubicación de Haus Barber',mapInfo:'El mapa de Google solo se carga con tu autorización. También puedes abrir la ubicación directamente en Google Maps.',
      mapButton:'AUTORIZAR Y MOSTRAR MAPA ↗',help:'Recordar datos de contacto es independiente del permiso para cargar el mapa.'
    },
    ja:{
      eyebrow:'HAUS プライバシー',title:'お客様のプライバシーを大切にしています',
      explanation:'サイトの動作に必要な保存機能を使用し、お客様が許可した場合にのみ Google マップを読み込みます。このサイトでは広告・アクセス解析のトラッカーは確認されていません。',
      accept:'すべて許可',reject:'任意項目を拒否',custom:'設定を変更',
      settings:'プライバシー設定',settingsText:'地図の読み込み許可はいつでも変更できます。言語とお客様情報の保存は別々の設定です。',
      essential:'必須',essentialDesc:'サイトの動作、管理者セッションの保護、選択した言語、同意の記録。',always:'常に有効',
      external:'外部地図（Google マップ）',externalDesc:'埋め込み地図は許可した場合にのみ Google に接続します。地図を許可しなくても外部リンクは開けます。',
      save:'設定を保存',close:'設定を閉じる',more:'プライバシーポリシー',
      stored:'プライバシー設定を更新しました。',remembered:'このブラウザーに情報を保存しました。',
      forgotten:'このブラウザーに保存された情報を削除しました。',phoneNeeded:'情報を保存するには、市外局番を含む有効な電話番号を入力してください。',
      mapTitle:'Haus Barber の所在地',mapInfo:'Google マップは許可した場合のみ読み込まれます。Google マップで直接場所を開くこともできます。',
      mapButton:'許可して地図を表示 ↗',help:'連絡先の保存と地図の読み込みへの同意は別の選択です。'
    },
    de:{
      eyebrow:'HAUS DATENSCHUTZ',title:'Ihre Privatsphäre ist uns wichtig',
      explanation:'Wir verwenden notwendige Speicherfunktionen für den Betrieb der Website. Die eingebettete Google-Karte laden wir nur mit Ihrer Einwilligung. Werbe- oder Analyse-Tracker wurden auf dieser Website nicht festgestellt.',
      accept:'ALLE AKZEPTIEREN',reject:'OPTIONALE ABLEHNEN',custom:'ANPASSEN',
      settings:'DATENSCHUTZEINSTELLUNGEN',settingsText:'Die Freigabe der Karte können Sie jederzeit ändern. Sprache und das Speichern Ihrer Angaben sind unabhängige Einstellungen.',
      essential:'Notwendig',essentialDesc:'Websitebetrieb, Sicherheit der Verwaltungssitzung, gewählte Sprache und Ihre Einwilligungsentscheidung.',always:'IMMER AKTIV',
      external:'Externe Karte (Google Maps)',externalDesc:'Die eingebettete Karte verbindet sich erst nach Ihrer Einwilligung mit Google. Externe Links funktionieren auch ohne Freigabe.',
      save:'EINSTELLUNGEN SPEICHERN',close:'Einstellungen schließen',more:'Datenschutzerklärung',
      stored:'Datenschutzeinstellungen aktualisiert.',remembered:'Ihre Angaben wurden in diesem Browser gespeichert.',
      forgotten:'Die gespeicherten Angaben wurden aus diesem Browser entfernt.',phoneNeeded:'Um Ihre Angaben zu speichern, geben Sie eine gültige Telefonnummer mit Vorwahl ein.',
      mapTitle:'Standort von Haus Barber',mapInfo:'Die Google-Karte wird nur mit Ihrer Zustimmung geladen. Sie können den Standort auch direkt in Google Maps öffnen.',
      mapButton:'ERLAUBEN UND KARTE ANZEIGEN ↗',help:'Das Merken von Kontaktdaten ist unabhängig von der Freigabe der Karte.'
    }
  };

  function getStorage(k){
    try{return window.localStorage.getItem(k)}catch{return null}
  }
  function putStorage(k,v){
    try{window.localStorage.setItem(k,v);return true}catch{return false}
  }
  function removeStorage(k){
    try{window.localStorage.removeItem(k)}catch{/* storage disabled */}
  }
  function msg(key){return (ui[currentLanguage]||ui['pt-BR'])[key]||key}
  function norm(text){return String(text||'').replace(/\s+/g,' ').trim()}
  function translate(raw){
    if(currentLanguage==='pt-BR')return raw;
    const key=norm(raw);
    if(!key)return raw;
    const dictionary=words[currentLanguage]||{};
    let value=dictionary[key];
    if(!value){
      const price=key.match(/^CORTES A PARTIR DE (R\$\s*[\d.,]+)$/);
      if(price)value=(dictionary['CORTES A PARTIR DE {price}']||'CORTES A PARTIR DE {price}').replace('{price}',price[1]);
      if(key.startsWith('Selecionado:'))value=(dictionary['Selecionado:']||'Selecionado:')+key.slice('Selecionado:'.length);
    }
    if(!value)return raw;
    const start=raw.match(/^\s*/)?.[0]||'',end=raw.match(/\s*$/)?.[0]||'';
    return start+value+end;
  }
  function skip(node){
    const parent=node.parentElement;
    return !parent||!!parent.closest('script,style,textarea,noscript,[data-haus-no-translate],.haus-language-select');
  }
  function syncText(node){
    if(!node||node.nodeType!==3||skip(node))return;
    const str=node.data;
    let rec=originalText.get(node);
    if(!rec){rec={base:str,last:str};originalText.set(node,rec)}
    else if(str!==rec.last&&str!==rec.base){rec.base=str}
    const out=translate(rec.base);
    if(node.data!==out)node.data=out;
    rec.last=out;
  }
  function syncAttributes(el){
    if(!el||el.nodeType!==1||el.closest('[data-haus-no-translate],.haus-language-select'))return;
    const attributes=['placeholder','aria-label','title'];
    let saved=originalAttributes.get(el);
    if(!saved){saved={};originalAttributes.set(el,saved)}
    for(const attr of attributes){
      const actual=el.getAttribute(attr);
      if(actual===null)continue;
      const entry=saved[attr];
      if(!entry)saved[attr]={base:actual,last:actual};
      else if(actual!==entry.last&&actual!==entry.base)entry.base=actual;
      const rec=saved[attr],output=translate(rec.base).trim();
      if(output!==actual)el.setAttribute(attr,output);
      rec.last=output;
    }
  }
  function scan(root){
    if(!root)return;
    if(root.nodeType===3){syncText(root);return}
    if(root.nodeType!==1&&root.nodeType!==9)return;
    if(root.nodeType===1&&root.matches('script,style,noscript,[data-haus-no-translate]'))return;
    const el=root.nodeType===9?root.documentElement:root;
    syncAttributes(el);
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    let n;
    while((n=walker.nextNode())){
      if(n.nodeType===3)syncText(n);
      else if(n.nodeType===1)syncAttributes(n);
    }
  }
  let observer=null;
  function switchLocale(lang,persist=true){
    currentLanguage=LANGS.includes(lang)?lang:'pt-BR';
    document.documentElement.lang=currentLanguage;
    if(persist)putStorage(KEYS.locale,currentLanguage);
    document.querySelectorAll('.haus-language-select').forEach(s=>{s.value=currentLanguage});
    renderConsentStrings();
    scan(document.body);
    window.dispatchEvent(new CustomEvent('haus-language-change',{detail:{locale:currentLanguage}}));
    // Changing a language updates copy and calendar, never resets typed booking values.
  }

  function loadDecision(){
    try{
      const d=JSON.parse(getStorage(KEYS.consent)||'null');
      if(d?.v===1&&typeof d.external==='boolean'&&Number(d.expires)>Date.now())return d;
    }catch{/* invalid/expired preference */}
    removeStorage(KEYS.consent);
    return null;
  }
  function saveDecision(external){
    decision={v:1,external:Boolean(external),saved:Date.now(),expires:Date.now()+CONSENT_DAYS*DAY};
    putStorage(KEYS.consent,JSON.stringify(decision));
    applyExternal();
    if(banner)banner.hidden=true;
    closeSettings();
    announce(msg('stored'));
  }
  function applyExternal(){
    const iframe=$('haus-external-map'),placeholder=$('haus-map-placeholder');
    if(!iframe||!placeholder)return;
    if(decision?.external===true){
      const url=iframe.dataset.hausSrc;
      if(url&&iframe.getAttribute('src')!==url)iframe.setAttribute('src',url);
      iframe.hidden=false;placeholder.hidden=true;
    }else{
      iframe.removeAttribute('src');iframe.hidden=true;placeholder.hidden=false;
    }
  }
  function announce(message){
    const t=$('haus-remember-status');
    if(t){t.textContent=message;t.hidden=false}
  }
  function make(tag,attrs={},text){
    const el=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));
    if(text!==undefined)el.textContent=text;
    return el;
  }
  function makeButton(label,kind,onClick){
    const button=make('button',{type:'button',class:'haus-cookie-btn '+(kind||'')},label);
    button.addEventListener('click',onClick);
    return button;
  }
  function buildConsentUI(){
    if(!document.body||banner)return;
    banner=make('aside',{id:'haus-cookie-banner',class:'haus-cookie-banner',role:'region','aria-label':'Preferências de privacidade'});
    const copy=make('div',{class:'haus-cookie-copy'});
    copy.append(make('span',{class:'haus-cookie-kicker','data-haus-no-translate':''},msg('eyebrow')));
    const title=make('h2',{id:'haus-cookie-title','data-haus-no-translate':''},msg('title'));
    const description=make('p',{'data-haus-no-translate':''},msg('explanation'));
    const privacyLink=make('a',{href:'privacidade.html','data-haus-no-translate':''},msg('more'));
    const sentence=make('p');sentence.style.marginTop='8px';sentence.append(privacyLink);
    copy.append(title,description,sentence);
    const actions=make('div',{class:'haus-cookie-actions','data-haus-no-translate':''});
    actions.append(makeButton(msg('reject'),'reject',()=>saveDecision(false)));
    actions.append(makeButton(msg('accept'),'primary',()=>saveDecision(true)));
    actions.append(makeButton(msg('custom'),'full',()=>openSettings()));
    banner.append(copy,actions);
    const overlay=make('div',{id:'haus-cookie-overlay',class:'haus-cookie-overlay',hidden:''});
    const panel=make('section',{class:'haus-cookie-panel',role:'dialog','aria-modal':'true','aria-labelledby':'haus-cookie-panel-title',tabindex:'-1'});
    const header=make('div',{class:'haus-cookie-panel-head'});
    const h=make('h2',{id:'haus-cookie-panel-title','data-haus-no-translate':''},msg('settings'));
    const close=make('button',{type:'button',class:'haus-cookie-dismiss','aria-label':msg('close')},'×');
    close.addEventListener('click',()=>closeSettings());
    header.append(h,close);panel.append(header);
    const desc=make('p',{'data-haus-no-translate':''},msg('settingsText'));panel.append(desc);
    const essential=make('div',{class:'haus-cookie-pref'});
    const essentialWords=make('div');
    essentialWords.append(make('strong',{'data-haus-no-translate':''},msg('essential')),make('p',{'data-haus-no-translate':''},msg('essentialDesc')));
    essential.append(essentialWords,make('span',{class:'haus-essential-tag','data-haus-no-translate':''},msg('always')));
    const external=make('label',{class:'haus-cookie-pref'});
    const externalWords=make('div');
    externalWords.append(make('strong',{'data-haus-no-translate':''},msg('external')),make('p',{'data-haus-no-translate':''},msg('externalDesc')));
    prefExternal=make('input',{id:'haus-pref-external',type:'checkbox','aria-label':msg('external')});
    external.append(externalWords,prefExternal);panel.append(essential,external);
    const panelActions=make('div',{class:'haus-cookie-panel-actions','data-haus-no-translate':''});
    panelActions.append(makeButton(msg('save'),'primary',()=>saveDecision(prefExternal.checked)));
    panelActions.append(makeButton(msg('reject'),'reject',()=>saveDecision(false)));
    panelActions.append(makeButton(msg('accept'),'accept',()=>saveDecision(true)));
    panel.append(panelActions);overlay.append(panel);
    document.body.append(banner,overlay);
    preferenceDialog=overlay;
    banner.hidden=!!decision;
    applyExternal();
  }
  function renderConsentStrings(){
    if(!banner||!preferenceDialog)return;
    const copy=banner.querySelector('.haus-cookie-copy');
    copy.querySelector('span').textContent=msg('eyebrow');
    copy.querySelector('h2').textContent=msg('title');
    copy.querySelectorAll('p')[0].textContent=msg('explanation');
    copy.querySelector('a').textContent=msg('more');
    const buttons=banner.querySelectorAll('.haus-cookie-actions button');
    [msg('reject'),msg('accept'),msg('custom')].forEach((text,i)=>buttons[i].textContent=text);
    const panel=preferenceDialog.querySelector('.haus-cookie-panel');
    panel.querySelector('h2').textContent=msg('settings');
    panel.querySelector('.haus-cookie-dismiss').setAttribute('aria-label',msg('close'));
    panel.querySelectorAll(':scope > p')[0].textContent=msg('settingsText');
    const pref=panel.querySelectorAll('.haus-cookie-pref');
    pref[0].querySelector('strong').textContent=msg('essential');
    pref[0].querySelector('p').textContent=msg('essentialDesc');
    pref[0].querySelector('span').textContent=msg('always');
    pref[1].querySelector('strong').textContent=msg('external');
    pref[1].querySelector('p').textContent=msg('externalDesc');
    prefExternal.setAttribute('aria-label',msg('external'));
    [msg('save'),msg('reject'),msg('accept')].forEach((text,i)=>
      panel.querySelectorAll('.haus-cookie-panel-actions button')[i].textContent=text
    );
    const placeholder=$('haus-map-placeholder');
    if(placeholder){
      placeholder.querySelector('strong').textContent=msg('mapTitle');
      placeholder.querySelector('p').textContent=msg('mapInfo');
      placeholder.querySelector('button').textContent=msg('mapButton');
    }
  }
  function openSettings(){
    if(!preferenceDialog)return;
    lastFocus=document.activeElement;
    prefExternal.checked=decision?.external===true;
    preferenceDialog.hidden=false;
    preferenceDialog.querySelector('.haus-cookie-dismiss').focus();
    document.body.style.overflow='hidden';
  }
  function closeSettings(){
    if(!preferenceDialog||preferenceDialog.hidden)return;
    preferenceDialog.hidden=true;
    document.body.style.overflow='';
    if(lastFocus?.isConnected)lastFocus.focus();
    lastFocus=null;
  }
  function trapSettings(e){
    if(preferenceDialog?.hidden)return;
    if(e.key==='Escape'){e.preventDefault();closeSettings();return}
    if(e.key!=='Tab')return;
    const controls=[...preferenceDialog.querySelectorAll('button,input:not([disabled])')].filter(x=>!x.hidden);
    if(!controls.length)return;
    const first=controls[0],last=controls.at(-1);
    if(e.shiftKey&&(document.activeElement===first||!preferenceDialog.contains(document.activeElement))){
      e.preventDefault();last.focus();
    }else if(!e.shiftKey&&(document.activeElement===last||!preferenceDialog.contains(document.activeElement))){
      e.preventDefault();first.focus();
    }
  }
  function readRemembered(){
    try{
      const d=JSON.parse(getStorage(KEYS.customer)||'null');
      if(d?.v===1&&typeof d.name==='string'&&typeof d.phone==='string'&&
        Number(d.expires)>Date.now()&&d.name.length<=80&&/^\d{10,13}$/.test(d.phone))return d;
    }catch{/* invalid record */}
    removeStorage(KEYS.customer);return null;
  }
  function validPhone(phone){
    const digits=String(phone||'').replace(/\D/g,'');
    return /^(\d{10}|\d{11}|55\d{10}|55\d{11})$/.test(digits)?digits:null;
  }
  function initRemember(){
    const input=$('nome'),phone=$('telefone'),opt=$('haus-remember'),forget=$('haus-forget');
    if(!input||!phone||!opt||!forget)return;
    const saved=readRemembered();
    if(saved){
      if(!input.value)input.value=saved.name;
      if(!phone.value)phone.value=saved.phone;
      opt.checked=true;forget.hidden=false;
    }
    opt.addEventListener('change',()=>{
      if(!opt.checked&&readRemembered()){
        removeStorage(KEYS.customer);
        forget.hidden=true;announce(msg('forgotten'));
      }
    });
    forget.addEventListener('click',()=>{
      const prior=readRemembered();
      removeStorage(KEYS.customer);forget.hidden=true;opt.checked=false;
      if(prior){
        if(input.value===prior.name)input.value='';
        if(validPhone(phone.value)===prior.phone)phone.value='';
      }
      announce(msg('forgotten'));
    });
  }
  function rememberAfterBooking(data){
    if(!data||!data.checked)return false;
    const name=String(data.name||'').trim();
    const phone=validPhone(data.phone);
    if(name.length<2||name.length>80||!phone)return false;
    const saved={v:1,name,phone,saved:Date.now(),expires:Date.now()+CUSTOMER_DAYS*DAY};
    const ok=putStorage(KEYS.customer,JSON.stringify(saved));
    if(ok){$('haus-forget').hidden=false;announce(msg('remembered'))}
    return ok;
  }

  // Functions used by the booking script after successful RPC; no DB storage of phone number.
  window.hausExperience={
    t:(phrase)=>translate(phrase).trim(),
    getLocale:()=>currentLanguage,
    validPhone,
    rememberAfterBooking,
    openSettings,
    changeLanguage:switchLocale,
    rescan:()=>scan(document.body),
    consent:()=>decision?{external:decision.external}:null
  };

  try{
    const value=getStorage(KEYS.locale);
    if(LANGS.includes(value))currentLanguage=value;
  }catch{/* preference optional */}
  decision=loadDecision();
  buildConsentUI();
  document.querySelectorAll('.haus-language-select').forEach(s=>{
    s.value=currentLanguage;
    s.addEventListener('change',()=>switchLocale(s.value));
  });
  document.querySelectorAll('#haus-cookie-settings').forEach(b=>b.addEventListener('click',openSettings));
  $('haus-load-map')?.addEventListener('click',()=>saveDecision(true));
  document.addEventListener('keydown',trapSettings);
  preferenceDialog?.addEventListener('click',e=>{if(e.target===preferenceDialog)closeSettings()});
  initRemember();
  renderConsentStrings();
  scan(document.body);
  document.documentElement.lang=currentLanguage;
  if(currentLanguage!=='pt-BR')window.dispatchEvent(new CustomEvent('haus-language-change',{detail:{locale:currentLanguage}}));
  observer=new MutationObserver(records=>{
    for(const r of records){
      if(r.type==='characterData')syncText(r.target);
      else if(r.type==='childList'){
        for(const n of r.addedNodes)scan(n);
      }
    }
  });
  observer.observe(document.body,{childList:true,characterData:true,subtree:true});
})();