(function () {
    'use strict';

    if (window.AutoBuilderBackend) {
        console.warn("AutoBuilderBackend já carregado.");
        return;
    }

    const AutoBuilderBackend = {};
    window.AutoBuilderBackend = AutoBuilderBackend;

    const CONFIG_KEY = "tws_autobuilder_config_v63";

    // -----------------------
    // CONFIGURAÇÕES
    // -----------------------
    const defaultConfig = {
        auto: true,
        interval: 5000,
        priority: ["main", "farm", "storage", "barracks", "stable", "smith", "hide", "wall"],
        maxLevel: {
            main: 30, farm: 30, storage: 30,
            barracks: 25, stable: 20, smith: 20,
            garage: 1, hide: 10, wall: 20
        }
    };

    AutoBuilderBackend.loadConfig = function () {
        return JSON.parse(localStorage.getItem(CONFIG_KEY) || JSON.stringify(defaultConfig));
    };

    AutoBuilderBackend.saveConfig = function (cfg) {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    };

    // -----------------------
    // AUX: GET VILLAGE ID
    // -----------------------
    AutoBuilderBackend.getVillageId = function () {
        const params = new URLSearchParams(location.search);
        return params.get("village") || UI.Info.village.id;
    };

    // -----------------------
    // GET BUILDINGS LEVELS (via API)
    // -----------------------
    AutoBuilderBackend.getBuildings = async function () {
        const vid = this.getVillageId();

        const url = `/game.php?screen=main&ajax=overview&village=${vid}`;
        const res = await fetch(url);
        const data = await res.json();

        return data.buildings || {};
    };

    // -----------------------
    // GET BUILD INFO (universal parser)
    // via AJAX -> nunca depende do DOM
    // -----------------------
    AutoBuilderBackend.getBuildInfo = async function (b) {
        const vid = this.getVillageId();

        const url = `/game.php?screen=main&ajax=build&mode=build&village=${vid}&id=${b}`;
        const res = await fetch(url, { method: "GET" });

        if (!res.ok) return null;

        const data = await res.json();

        if (!data || !data.building) return null;

        return {
            can: data.building.can_build === true,
            level: data.building.level,
            cost: {
                wood: data.building.wood || 0,
                stone: data.building.stone || 0,
                iron: data.building.iron || 0
            },
            buildUrl: data.building.build_link || null
        };
    };

    // -----------------------
    // VERIFICAR SE PODE UPGRADAR
    // -----------------------
    AutoBuilderBackend.canUpgrade = function (info, currentLevel, maxLevel) {
        if (!info) return false;
        if (!info.can) return false;
        if (currentLevel >= maxLevel) return false;
        return true;
    };

    // -----------------------
    // EXECUTAR CONSTRUÇÃO
    // -----------------------
    AutoBuilderBackend.build = async function (info) {
        if (!info.buildUrl) return false;

        await fetch(info.buildUrl, { method: "GET" });

        console.log("[AutoBuilder] Construção enviada:", info.buildUrl);
        return true;
    };

    // -----------------------
    // CORE: RUN
    // -----------------------
    AutoBuilderBackend.run = async function () {
        const cfg = this.loadConfig();

        if (!cfg.auto) {
            console.log("[AutoBuilder] Auto OFF");
            return;
        }

        const buildings = await this.getBuildings();

        for (let b of cfg.priority) {
            const currentLevel = buildings[b];
            const maxLevel = cfg.maxLevel[b] ?? 999;

            if (currentLevel >= maxLevel) continue;

            const info = await this.getBuildInfo(b);
            if (!info) continue;

            if (!this.canUpgrade(info, currentLevel, maxLevel)) continue;

            console.log(`[AutoBuilder] Upgradando ${b} → nível ${currentLevel + 1}`);

            await this.build(info);
            return;
        }

        console.log("[AutoBuilder] Nada para construir.");
    };

    // -----------------------
    // LOOP AUTOMÁTICO
    // -----------------------
    (function (B) {

        if (B.__loopInstalled) return;
        B.__loopInstalled = true;

        window.__autobuilder_interval = null;

        B.runLoop = async function () {
            try {
                await B.run();
            } catch (err) {
                console.error("[AutoBuilder] Erro no loop:", err);
            }
        };

        B.start = function () {
            const cfg = B.loadConfig();

            if (window.__autobuilder_interval)
                clearInterval(window.__autobuilder_interval);

            window.__autobuilder_interval = setInterval(B.runLoop, cfg.interval);
            console.log("[AutoBuilder] Loop iniciado.");
        };

        B.stop = function () {
            if (window.__autobuilder_interval) {
                clearInterval(window.__autobuilder_interval);
                window.__autobuilder_interval = null;
                console.log("[AutoBuilder] Loop parado.");
            }
        };

        setTimeout(() => B.start(), 500);

    })(AutoBuilderBackend);

})();
