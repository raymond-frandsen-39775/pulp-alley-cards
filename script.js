    // ===== CONFIG =====
    const GAS_URL = 'https://script.google.com/macros/s/AKfycbyZgs9DSPDUnbE63xiwhTefRqp20bpbSaD3illB_060SlDtmlYyjovgYecKBHIEjnRI0g/exec';
    
	// ===== Clear hand =====
    document.getElementById('btnClearHand').addEventListener('click', () => {
      if(!handEl.firstChild) return;
      // Reuse modal to confirm
      document.getElementById('confirmTitle').textContent = 'Clear entire hand?';
      document.querySelector('#confirm .modalMsg').textContent = 'All cards will be removed from your hand.';
      modal.classList.add('show');
      btnYes.onclick = () => { handEl.innerHTML=''; updateHandCount(); restoreConfirmText(); closeModal(); };
      btnNo.onclick  = () => { restoreConfirmText(); closeModal(); };
      modal.addEventListener('click', (e)=> { if(e.target===modal){ restoreConfirmText(); closeModal(); } }, { once:true });
      window.addEventListener('keydown', (e)=>{ if(e.key==='Escape'){ restoreConfirmText(); closeModal(); } }, { once:true });
      function restoreConfirmText(){
        document.getElementById('confirmTitle').textContent = 'Remove card?';
        document.querySelector('#confirm .modalMsg').textContent = 'This card will be removed from your hand.';
      }
    });

    // ===== Wire up search =====
    document.getElementById('btnSearch').addEventListener('click', () => doSearch(1));
    document.getElementById('q').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(1); });
    
	// ===== JSONP helper (for CORS-free Apps Script calls) =====
    function jsonp(url){
      return new Promise((resolve, reject) => {
        const cb = 'cb_' + Math.random().toString(36).slice(2);
        const s = document.createElement('script');
        window[cb] = (data) => { resolve(data); delete window[cb]; s.remove(); };
        s.onerror = () => { reject(new Error('JSONP request failed')); delete window[cb]; s.remove(); };
        s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
        document.body.appendChild(s);
      });
    }

	function renderIconInline(raw) {
	  if (!raw) return '';

	  // normalize: lowercase, trim, strip extension
	  let key = String(raw).trim().toLowerCase()
		.replace(/\.(png|jpe?g|svg|webp)$/i, '')
		.replace(/[^a-z0-9]+/g, '');

	  const alias = {
		fl: 'flame', flame: 'flame',
		pe: 'person', person: 'person', user: 'person',
		ge: 'gear', gear: 'gear',
		st: 'star', star: 'star',
		sk: 'skull', skull: 'skull',
		lt: 'bolt', bolt: 'bolt', lightning: 'bolt',
		gl: 'glass', glass: 'glass',
		lo: 'lock', lock: 'lock'

	  };
	  key = alias[key] || key;

	  const ICON_MAP = {
		flame: 'bi-fire',
		person: 'bi-person-fill',
		gear: 'bi-gear-fill',
		star: 'bi-star-fill',
		skull: 'bi-skull',
		bolt: 'bi-lightning-charge-fill',
		glass: 'bi-search',
		lock: 'bi-lock-fill'
	  };

	  const cls = ICON_MAP[key];
	  if (!cls) return '';

	  // positioned circular badge container
	  return `<span class="story-icon"><i class="bi ${cls}" aria-hidden="true"></i></span>`;
	}


    // ===== Corner ornament SVG =====
    function ornSvg(){
      return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">'
           + '<path fill="#4c2b16" d="M0,0 L64,0 L64,8 C44,8 20,24 8,40 L0,40 Z" opacity=".85"/></svg>';
    }

    // ===== Divider SVG with three skull tiles =====
    function skullDividerSepia(){
      return '<svg viewBox="0 0 300 36" xmlns="http://www.w3.org/2000/svg">'
           + '<g stroke="#3c2a1a" stroke-width="2" stroke-linecap="round" fill="none">'
           + '<path d="M8 18 H95"/><path d="M205 18 H292"/></g>'
           + '<rect x="110" y="6" width="24" height="24" fill="#2b1a10" stroke="#3c2a1a"/>'
           + '<rect x="138" y="6" width="24" height="24" fill="#2b1a10" stroke="#3c2a1a"/>'
           + '<rect x="166" y="6" width="24" height="24" fill="#2b1a10" stroke="#3c2a1a"/>'
           + '<defs><g id="s">'
           + '<path d="M12,5 c5,0 9,3.5 9,8 c0,3 -1.5 4.5 -3.5 5.4 v2.2 h-11 v-2.2 C4.5,17.5 3,16 3,13 C3,8.5 7,5 12,5 z" fill="#f7f2e3" stroke="#3c2a1a" stroke-width="0.75"/>'
           + '<ellipse cx="9" cy="12" rx="2" ry="2.8" fill="#3c2a1a"/>'
           + '<ellipse cx="15" cy="12" rx="2" ry="2.8" fill="#3c2a1a"/>'
           + '<path d="M12 14 l-1.5 2.2 h3 z" fill="#3c2a1a"/>'
           + '<rect x="8" y="19.2" width="8" height="3.2" rx="0.8" fill="#3c2a1a"/></g></defs>'
           + '<use href="#s" x="110" y="6"/><use href="#s" x="138" y="6"/><use href="#s" x="166" y="6"/></svg>';
    }

    // ===== Text helpers =====
    function escapeHtml(s){
      return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function escapeAttr(s){ return escapeHtml(s).replace(/"/g,'&quot;'); }
    function nl2br(s){ return String(s).replace(/\r?\n/g,'<br>'); }

    // ===== ID → Object map =====
    let idToObj = {};

    // ===== Card HTML (exact visual parity with Google version) =====
    function cardHTML(o, opts){
      opts = opts || {};
      var name = o.Name || 'Untitled',
          play = o.Play || '',
          effect = o.Effect || '',
          flavor = o.Flavor || '',
          skills = o.Skills || '',
          id = o.ID || '',
          cardLimit = o.CardLimit || '',
          chall = o.ChallengeValue || '',
          storyIcon = o.StoryIcon || '';

      var html = '<div class="card" data-id="'+escapeAttr(id)+'">'
        + '<div class="corner tl">'+ornSvg()+'</div>'
        + '<div class="corner tr">'+ornSvg()+'</div>'
        + '<div class="corner br">'+ornSvg()+'</div>'
        + '<div class="corner bl">'+ornSvg()+'</div>';

      // "X" remove button when rendering in the Hand
      if (opts.isHand) {
        const uidAttr = opts.uid ? ' data-uid="'+escapeAttr(opts.uid)+'"' : '';
        html += '<button class="removeBtn"'+uidAttr+' data-id="'+escapeAttr(id)+'" title="Remove from hand">×</button>';
      }

      if (opts.showAdd)
        html += '<div class="actions"><button class="btn-add" data-id="'+escapeAttr(id)+'">+ Add to hand</button></div>';

      html += '<div class="title">'+escapeHtml(name)+'</div>';

      if (play) {
        const normalizedPlay = String(play).trim().toLowerCase();
        const mustPlay = normalizedPlay === 'you must play immediately.';
        const playStyle  = mustPlay ? 'color:#a00;font-weight:900;' : '';
        const labelStyle = mustPlay ? 'color:#a00;' : '';
        html += '<div class="row" style="'+playStyle+'"><span class="label" style="'+labelStyle+'">Play:</span> '+nl2br(escapeHtml(play))+'</div>';
      }
      if (effect)
        html += '<div class="row"><span class="label">Effect:</span> '+nl2br(escapeHtml(effect))+'</div>';

      if (flavor) {
        let f = String(flavor).trim();
        if (!/^["“].*["”]$/.test(f)) f = '"'+f+'"';
        html += '<div class="flavor">'+escapeHtml(f)+'</div>';
      }

      html += '<div class="divider">'+skullDividerSepia()+'</div>';
      html += '<div class="challengeHdr">Challenge</div>';

      if (skills)
        html += '<div class="skills">'+escapeHtml(skills)+'</div>';

      html += '<div class="badge left">'+(chall ? escapeHtml(chall) : '—')+'</div>';
      html += renderIconInline(storyIcon); // right badge
      html += '<div class="footer">#'+escapeHtml(id)+'/'+escapeHtml(cardLimit)+' • Pulp Alley © 2025</div>'
           +  '</div>';

      return html;
    }

    // ===== Render results payload =====
    function render(payload){
      const headers = payload.headers||[], rows = payload.rows||[];
      const resultsEl = document.getElementById('results');
      if(!rows.length){ resultsEl.innerHTML='<p>No cards found.</p>'; return; }
      const objs = rows.map(r => { const o = {}; headers.forEach((h,i)=> o[h]=r[i]); return o; });
      idToObj = {}; objs.forEach(o => { if(o && o.ID!=null) idToObj[o.ID]=o; });
      resultsEl.innerHTML = objs.map(o => cardHTML(o,{showAdd:true})).join('');
      // wire add buttons
      resultsEl.querySelectorAll('.btn-add').forEach(btn => {
        btn.addEventListener('click', () => addToHand(btn.getAttribute('data-id')));
      });
    }

    // ===== Live search via Apps Script JSONP =====
    async function doSearch(page = 1){
      const q = document.getElementById('q').value.trim();
      const res = document.getElementById('results');

      if (!q) { res.innerHTML = '<p>Please enter a search term.</p>'; return; }
      res.innerHTML = '<p><em>Searching…</em></p>';

      try {
        const url = GAS_URL + '?mode=json&q=' + encodeURIComponent(q) + '&page=' + page + '&_=' + Date.now();
        const payload = await jsonp(url);
        // Expected shape: {headers:[...], rows:[...]}
        if (!Array.isArray(payload.headers) || !Array.isArray(payload.rows)) {
          const list = Array.isArray(payload && payload.data) ? payload.data : [];
          const headers = list.length ? Object.keys(list[0]) : [];
          const rows = list.map(o => headers.map(h => o[h] ?? ''));
          render({ headers, rows });
        } else {
          render(payload);
        }
      } catch (e) {
        console.error(e);
        res.innerHTML = '<p style="color:#900;">Search failed: ' + escapeHtml(e.message) + '</p>';
      }
    }

    // ===== Hand management =====
    const handEl = document.getElementById('hand');
    const handCountEl = document.getElementById('handCount');

    function addToHand(id){
      const o = idToObj[id];
      if(!o) return;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = cardHTML(o, { isHand:true, uid:String(Math.random()).slice(2) });
      const card = wrapper.firstElementChild;
      handEl.appendChild(card);
      updateHandCount();

      // wire remove button for this card
      const rm = card.querySelector('.removeBtn');
      if (rm) rm.addEventListener('click', () => confirmRemove(card));
    }

    function updateHandCount(){
      handCountEl.textContent = handEl.querySelectorAll('.card').length;
    }

    // ===== Confirm modal for removals =====
    const modal = document.getElementById('confirm');
    const btnYes = document.getElementById('confirmYes');
    const btnNo = document.getElementById('confirmNo');
    let pendingRemove = null;

    function confirmRemove(card){
      pendingRemove = card;
      modal.classList.add('show');
      btnYes.onclick = () => { if(pendingRemove){ pendingRemove.remove(); updateHandCount(); } closeModal(); };
      btnNo.onclick  = closeModal;
      modal.addEventListener('click', (e)=> { if(e.target===modal) closeModal(); }, { once:true });
      window.addEventListener('keydown', escClose, { once:true });
    }
    function escClose(e){ if(e.key==='Escape') closeModal(); }
    function closeModal(){ modal.classList.remove('show'); pendingRemove=null; }


