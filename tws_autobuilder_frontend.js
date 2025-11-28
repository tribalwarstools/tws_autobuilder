(function(){
    'use strict';

    if (!window.AutoBuilderBackend) {
        console.error("AutoBuilderBackend não encontrado. Cole primeiro o backend v6.3.");
        return;
    }
    const B = window.AutoBuilderBackend;

    // ===== CSS =====
    const CSS = `
    #ab_panel { position: fixed; top: 70px; right: 10px; width: 360px; max-height: 80vh;
                background: #f7f6f2; border: 2px solid #b88f45; padding: 10px; z-index:999999;
                font-family: Arial, Helvetica, sans-serif; font-size:13px; box-shadow:0 6px 18px rgba(0,0,0,0.3);
                overflow:auto; border-radius:6px;}
    #ab_panel h4{margin:4px 0 8px 0;color:#6b4500}
    .ab_row{display:flex;gap:6px;align-items:center;margin-bottom:6px}
    .ab_btn{flex:1;padding:6px;border-radius:4px;border:1px solid #a57b52;background:#e8dec1;cursor:pointer}
    .ab_btn.small{flex:0;padding:4px 6px;width:auto}
    .ab_select,.ab_input{padding:6px;border:1px solid #cbb589;border-radius:4px;background:#fff; width:100%}
    #ab_priority_list{background:#fff;border:1px solid #ddd;padding:6px;border-radius:4px;max-height:120px;overflow:auto}
    .ab_item{display:flex;align-items:center;justify-content:space-between;padding:4px 6px;border-bottom:1px solid #eee}
    .ab_item:last-child{border-bottom:none}
    .ab_item .label{flex:1}
    .ab_small{width:58px;padding:4px}
    #ab_levels{background:#fff;border:1px solid #ddd;padding:6px;border-radius:4px;max-height:120px;overflow:auto;font-family:monospace;font-size:12px}
    #ab_logs{background:#0f1720;color:#cfe8d0;padding:6px;border-radius:4px;max-height:140px;overflow:auto;font-family:monospace;font-size:12px}
    .ab_muted{color:#666;font-size:12px}
    `;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // ===== Building list (should match backend default) =====
    const BUILDINGS = ["main","barracks","stable","garage","smith","market","snob","wood","stone","iron","storage","farm","hide","wall"];

    // ===== CREATE PANEL =====
    if (document.getElementById('ab_panel')) document.getElementById('ab_panel').remove();
    const panel = document.createElement('div');
    panel.id = 'ab_panel';
    panel.innerHTML = `
        <h4>AutoBuilder UI v6.3</h4>

        <div class="ab_row">
            <button id="ab_toggle" class="ab_btn">Carregando...</button>
            <button id="ab_runnow" class="ab_btn small">Run now</button>
        </div>

        <div class="ab_row">
            <div style="flex:1">
                <label class="ab_muted">Adicionar prioridade</label>
                <select id="ab_add_select" class="ab_select"></select>
            </div>
            <button id="ab_add_btn" class="ab_btn small">Add</button>
        </div>

        <div id="ab_priority_list" class="ab_muted"></div>

        <div style="height:8px"></div>

        <div class="ab_row">
            <div style="flex:1">
                <label class="ab_muted">Adicionar / Editar MaxLevel</label>
                <select id="ab_max_select" class="ab_select"></select>
            </div>
            <input id="ab_max_value" type="number" class="ab_small" min="1" placeholder="lvl">
            <button id="ab_max_add" class="ab_btn small">Salvar</button>
        </div>

        <div style="height:6px"></div>
        <div id="ab_max_list" class="ab_muted"></div>

        <div style="height:8px"></div>

        <div>
            <label class="ab_muted">Níveis atuais (auto refresh)</label>
            <div id="ab_levels"></div>
        </div>

        <div style="height:8px"></div>

        <div class="ab_row">
            <button id="ab_export" class="ab_btn small">Export Config</button>
            <button id="ab_import" class="ab_btn small">Import Config</button>
            <button id="ab_clearlogs" class="ab_btn small">Clear Logs</button>
        </div>

        <div style="height:8px"></div>

        <div>
            <label class="ab_muted">Logs</label>
            <div id="ab_logs"></div>
        </div>
    `;
    document.body.appendChild(panel);

    // ===== UI ELEMENTS =====
    const $toggle = document.getElementById('ab_toggle');
    const $runNow = document.getElementById('ab_runnow');
    const $addSelect = document.getElementById('ab_add_select');
    const $addBtn = document.getElementById('ab_add_btn');
    const $priorityList = document.getElementById('ab_priority_list');
    const $maxSelect = document.getElementById('ab_max_select');
    const $maxValue = document.getElementById('ab_max_value');
    const $maxAdd = document.getElementById('ab_max_add');
    const $maxList = document.getElementById('ab_max_list');
    const $levels = document.getElementById('ab_levels');
    const $export = document.getElementById('ab_export');
    const $import = document.getElementById('ab_import');
    const $clearLogs = document.getElementById('ab_clearlogs');
    const $logs = document.getElementById('ab_logs');

    // ===== populate selects =====
    BUILDINGS.forEach(b=>{
        const o1 = document.createElement('option'); o1.value = b; o1.textContent = b; $addSelect.appendChild(o1);
        const o2 = document.createElement('option'); o2.value = b; o2.textContent = b; $maxSelect.appendChild(o2);
    });

    // ===== helpers =====
    function uiLog(msg){
        const time = new Date().toLocaleTimeString();
        $logs.innerHTML = `[${time}] ${msg}\n` + $logs.innerHTML;
    }

    function saveCfg(cfg){ B.saveConfig(cfg); uiLog("Config salva"); renderAll(); }

    // render priority with controls
    function renderPriority(cfg){
        $priorityList.innerHTML = '';
        (cfg.priority || []).forEach((b, idx)=>{
            const row = document.createElement('div'); row.className='ab_item';
            row.innerHTML = `<div class="label">${idx+1}. ${b}</div>
                <div style="display:flex;gap:4px">
                 <button class="ab_btn small" data-act="up" data-idx="${idx}">↑</button>
                 <button class="ab_btn small" data-act="down" data-idx="${idx}">↓</button>
                 <button class="ab_btn small" data-act="rm" data-idx="${idx}">✖</button>
                </div>`;
            $priorityList.appendChild(row);
        });
    }

    // render maxLevel
    function renderMax(cfg){
        $maxList.innerHTML = '';
        const keys = Object.keys(cfg.maxLevel || {});
        if (!keys.length){ $maxList.innerHTML = '<div class="ab_muted">Nenhum nível máximo definido</div>'; return; }
        keys.forEach(k=>{
            const v = cfg.maxLevel[k];
            const el = document.createElement('div'); el.className='ab_item';
            el.innerHTML = `<div class="label">${k}: <b>${v}</b></div>
                <div style="display:flex;gap:4px">
                  <button class="ab_btn small" data-act="edit" data-key="${k}">edit</button>
                  <button class="ab_btn small" data-act="del" data-key="${k}">del</button>
                </div>`;
            $maxList.appendChild(el);
        });
    }

    // render current buildings (async)
    let refreshBuildingsTimer = null;
    async function renderBuildings(){
        try{
            const data = await B.getBuildings();
            // data may be object or promise
            const o = (typeof data === 'object') ? data : await data;
            $levels.textContent = JSON.stringify(o, null, 2);
        }catch(err){
            $levels.textContent = "Erro ao ler níveis: "+err;
        }
    }

    // refresh UI (cfg + levels)
    function renderAll(){
        const cfg = B.loadConfig();
        $toggle.textContent = cfg.auto ? 'Desativar' : 'Ativar';
        renderPriority(cfg);
        renderMax(cfg);
        renderBuildings();
    }

    // ===== events =====
    $addBtn.onclick = ()=>{
        const b = $addSelect.value;
        const cfg = B.loadConfig();
        cfg.priority = cfg.priority || [];
        if (!cfg.priority.includes(b)){
            cfg.priority.push(b);
            saveCfg(cfg);
            uiLog("Adicionado prioridade: "+b);
        } else uiLog("Já existe na prioridade: "+b);
    };

    $priorityList.onclick = (ev)=>{
        const btn = ev.target.closest('button');
        if (!btn) return;
        const act = btn.dataset.act;
        const idx = Number(btn.dataset.idx);
        const cfg = B.loadConfig();
        const pr = cfg.priority || [];
        if (act==='up' && idx>0){ [pr[idx-1],pr[idx]]=[pr[idx],pr[idx-1]]; saveCfg(cfg); }
        if (act==='down' && idx<pr.length-1){ [pr[idx+1],pr[idx]]=[pr[idx],pr[idx+1]]; saveCfg(cfg); }
        if (act==='rm'){ pr.splice(idx,1); saveCfg(cfg); }
    };

    $maxAdd.onclick = ()=>{
        const b = $maxSelect.value;
        const lvl = Number($maxValue.value);
        if (!b || !lvl || lvl < 1){ alert('Selecione prédio e nível maior que 0'); return; }
        const cfg = B.loadConfig();
        cfg.maxLevel = cfg.maxLevel || {};
        cfg.maxLevel[b] = lvl;
        saveCfg(cfg);
        uiLog(`MaxLevel salvo: ${b} -> ${lvl}`);
        $maxValue.value = '';
    };

    $maxList.onclick = (ev)=>{
        const btn = ev.target.closest('button');
        if (!btn) return;
        const act = btn.dataset.act;
        const key = btn.dataset.key;
        const cfg = B.loadConfig();
        if (act==='del'){ delete cfg.maxLevel[key]; saveCfg(cfg); uiLog('MaxLevel removido: '+key); }
        if (act==='edit'){ $maxSelect.value = key; $maxValue.value = cfg.maxLevel[key]; }
    };

    $toggle.onclick = ()=>{
        const cfg = B.loadConfig();
        cfg.auto = !cfg.auto;
        saveCfg(cfg);
        uiLog('Auto ' + (cfg.auto ? 'ativado' : 'desativado'));
        // ensure start/stop called on backend
        try{
            if (cfg.auto && typeof B.start === 'function') B.start();
            if (!cfg.auto && typeof B.stop === 'function') B.stop();
        }catch(e){ console.warn(e) }
    };

    $runNow.onclick = async ()=>{
        uiLog('Executando run() manualmente...');
        try{
            await B.run();
            uiLog('run() finalizado');
            await renderBuildings();
        }catch(err){
            uiLog('Erro run(): '+err);
            console.error(err);
        }
    };

    $export.onclick = ()=>{
        const cfg = B.loadConfig();
        const txt = JSON.stringify(cfg, null, 2);
        navigator.clipboard.writeText(txt).then(()=> uiLog('Config copiada para clipboard'));
    };

    $import.onclick = async ()=>{
        const txt = prompt("Cole o JSON da config:");
        if (!txt) return;
        try{
            const parsed = JSON.parse(txt);
            B.saveConfig(parsed);
            uiLog('Config importada');
            renderAll();
        }catch(e){
            alert('JSON inválido');
        }
    };

    $clearLogs.onclick = ()=> { $logs.innerHTML = ''; uiLog('Logs limpos'); };

    // auto refresh levels every 3s
    setInterval(renderBuildings, 3000);

    // initial render
    renderAll();
    uiLog('UI carregada (v6.3)');

})();
