(function () {
    'use strict';

    // ================================
    // CONFIGURAÇÃO GLOBAL DO AUTOBUILDER
    // ================================
    const CONFIG_KEY = 'tws_autobuilder_config_v5';

    const defaultConfig = {
        auto: false,
        interval: 5000, // verificar a cada 5 segundos
        priority: ['main', 'farm', 'storage', 'barracks', 'stable', 'smith'],
        maxLevel: {}, // permite limitar níveis
    };

    // ================================
    // UTILITÁRIOS DE STORAGE
    // ================================
    function loadConfig() {
        try {
            return JSON.parse(localStorage.getItem(CONFIG_KEY)) || defaultConfig;
        } catch {
            return defaultConfig;
        }
    }

    function saveConfig(cfg) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    }

    const CONFIG = loadConfig();

    // ================================
    // DADOS DO JOGO USANDO MÉTODO NOVO
    // ================================
    function getBuildings() {
        return Object.entries(game_data.village.buildings).reduce((acc, [key, val]) => {
            acc[key] = Number(val);
            return acc;
        }, {});
    }

    function getBuildInfo(building) {
        if (!TribalWars || !TribalWars.buildingData) return null;

        const data = TribalWars.buildingData[building];
        if (!data) return null;

        return {
            next: data.next_level || null,
            max: data.max_level || null
        };
    }

    // ================================
    // FUNÇÃO PARA VERIFICAR SE PODE SUBIR UM EDIFÍCIO
    // ================================
    function canUpgrade(building) {
        const buildings = getBuildings();
        const currentLevel = buildings[building] ?? 0;

        const meta = getBuildInfo(building);
        if (!meta || !meta.next) return false;

        // Respeitar maxLevel definido pelo usuário
        if (CONFIG.maxLevel[building] && currentLevel >= CONFIG.maxLevel[building]) {
            return false;
        }

        // Verificar recursos
        const { wood, stone, iron } = meta.next;
        if (wood > game_data.village.wood || 
            stone > game_data.village.stone ||
            iron > game_data.village.iron) {
            return false;
        }

        // Verificar se já existe construção na fila
        if (game_data.village.building_queue && game_data.village.building_queue.length > 0) {
            return false;
        }

        return true;
    }

    // ================================
    // DISPARAR CONSTRUÇÃO DE FATO
    // ================================
    async function build(building) {
        try {
            const url = `/game.php?village=${game_data.village.id}&screen=main&ajaxaction=upgrade_building`;
            const form = new FormData();
            form.append('id', building);
            form.append('force', 1);

            const res = await fetch(url, {
                method: 'POST',
                body: form,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const json = await res.json();

            if (json && json.success) {
                return { success: true, msg: `Construindo ${building}` };
            } else {
                return { success: false, msg: json.error || `Falhou ao construir ${building}` };
            }
        } catch (e) {
            return { success: false, msg: e.toString() };
        }
    }

    // ================================
    // FUNÇÃO PRINCIPAL DO AUTOBUILDER
    // ================================
    async function autobuildTick() {
        if (!CONFIG.auto) return;

        for (const building of CONFIG.priority) {
            if (canUpgrade(building)) {
                console.log("[AutoBuilder] Tentando construir:", building);
                const result = await build(building);
                console.log("[AutoBuilder]", result.msg);
                return; // evita tentar múltiplos no mesmo tick
            }
        }
    }

    // ================================
    // LOOP AUTOMÁTICO
    // ================================
    setInterval(autobuildTick, CONFIG.interval);

    // ================================
    // EXPORTAR API BACKEND PARA O FRONTEND
    // ================================
    window.AutoBuilderBackend = {
        loadConfig,
        saveConfig,
        getBuildings,
        getBuildInfo,
        canUpgrade,
        autobuildTick,
        setAuto(v) { CONFIG.auto = v; saveConfig(CONFIG); },
        setPriority(list) { CONFIG.priority = list; saveConfig(CONFIG); },
        setMaxLevel(obj) { CONFIG.maxLevel = obj; saveConfig(CONFIG); },
    };

})();
