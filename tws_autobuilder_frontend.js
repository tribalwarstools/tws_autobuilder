(function () {
    'use strict';

    if (!window.AutoBuilderBackend) {
        console.error("AutoBuilderBackend não encontrado!");
        return;
    }

    // ================================
    // SHORTCUTS DO BACKEND
    // ================================
    const B = window.AutoBuilderBackend;

    // ================================
    // ESTILOS DO PAINEL
    // ================================
    const css = `
        #tws_autob_panel {
            position: fixed;
            top: 80px;
            right: 0;
            width: 290px;
            background: #f5f5f5;
            border: 2px solid #c2a878;
            padding: 10px;
            z-index: 99999;
            font-size: 13px;
            font-family: Verdana;
        }

        #tws_autob_panel h3 {
            margin: 0;
            font-size: 15px;
            margin-bottom: 8px;
            color: #6b4500;
        }

        #tws_autob_log {
            height: 140px;
            overflow-y: auto;
            background: #fff;
            padding: 4px;
            border: 1px solid #aaa;
        }

        .tws_input {
            width: 100%;
            padding: 3px;
            margin-bottom: 5px;
        }

        .tws_btn {
            width: 100%;
            margin-top: 4px;
            padding: 6px;
            border: 1px solid #a57b52;
            cursor: pointer;
            background: #dfd1b0;
        }
        .tws_btn:hover {
            background: #e9dfc7;
        }

        .tws_flex {
            display: flex;
            justify-content: space-between;
            margin: 4px 0;
        }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // ================================
    // PAINEL HTML
    // ================================
    const panel = document.createElement('div');
    panel.id = 'tws_autob_panel';
    panel.innerHTML = `
        <h3>AutoBuilder v5.0</h3>

        <div class="tws_flex">
            <span>Status:</span>
            <b id="tws_status">---</b>
        </div>

        <button id="tws_toggle" class="tws_btn">Carregando...</button>

        <hr>

        <div>
            <label>Prioridade (CSV):</label>
            <input id="tws_priority" class="tws_input" placeholder="main,farm,storage">
            <button id="tws_save_priority" class="tws_btn">Salvar Prioridade</button>
        </div>

        <hr>

        <div>
            <label>Níveis Máximos (JSON):</label>
            <textarea id="tws_maxlvl" class="tws_input" style="height:60px;"></textarea>
            <button id="tws_save_maxlvl" class="tws_btn">Salvar MaxLevel</button>
        </div>

        <hr>

        <div>
            <label>Níveis atuais:</label>
            <pre id="tws_levels" style="background:#fff;padding:4px;border:1px solid #aaa;height:100px;overflow:auto;"></pre>
        </div>

        <hr>

        <div>
            <label>Log:</label>
            <div id="tws_autob_log"></div>
        </div>
    `;
    document.body.appendChild(panel);

    // ================================
    // FUNÇÕES DE UI
    // ================================
    function log(msg) {
        const box = document.getElementById("tws_autob_log");
        const time = new Date().toLocaleTimeString();
        box.innerHTML = `[${time}] ${msg}<br>` + box.innerHTML;
    }

    function refreshStatus() {
        const cfg = B.loadConfig();
        document.getElementById("tws_status").innerText = cfg.auto ? "ATIVO" : "PAUSADO";
        document.getElementById("tws_toggle").innerText = cfg.auto ? "Desativar" : "Ativar";

        document.getElementById("tws_priority").value = cfg.priority.join(",");

        document.getElementById("tws_maxlvl").value = JSON.stringify(cfg.maxLevel, null, 2);

        const lv = B.getBuildings();
        document.getElementById("tws_levels").innerText = JSON.stringify(lv, null, 2);
    }

    // Intervalo para atualizar níveis em tempo real
    setInterval(refreshStatus, 2000);

    // ================================
    // EVENTOS DO PAINEL
    // ================================
    document.getElementById("tws_toggle").onclick = () => {
        const cfg = B.loadConfig();
        B.setAuto(!cfg.auto);
        log("AutoBuilder: " + (!cfg.auto ? "ATIVADO" : "DESATIVADO"));
        refreshStatus();
    };

    document.getElementById("tws_save_priority").onclick = () => {
        const value = document.getElementById("tws_priority").value.trim();
        if (!value) return;
        const arr = value.split(",").map(s => s.trim()).filter(Boolean);
        B.setPriority(arr);
        log("Prioridade salva.");
        refreshStatus();
    };

    document.getElementById("tws_save_maxlvl").onclick = () => {
        try {
            const json = JSON.parse(document.getElementById("tws_maxlvl").value);
            B.setMaxLevel(json);
            log("MaxLevel atualizado.");
            refreshStatus();
        } catch {
            alert("JSON inválido em Níveis Máximos.");
        }
    };

    // Primeira atualização
    refreshStatus();
    setTimeout(() => log("AutoBuilder carregado!"), 300);

})();
