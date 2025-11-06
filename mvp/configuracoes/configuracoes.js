// Arquivo: mvp/configuracoes/configuracoes.js
// Responsável por inicializar e salvar as preferências da página de configurações.

(function () {
    console.log('configuracoes.js carregado');
    function $(id) { return document.getElementById(id); }

    function safeAddListener(el, event, handler) {
        if (!el) return; 
        el.addEventListener(event, handler);
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }

    function loadSettings() {
        try {
            const language = localStorage.getItem('setting_language') || 'pt';
            const visibility = localStorage.getItem('setting_visibility') || 'private';
            const notifications = localStorage.getItem('setting_notifications');
            const theme = localStorage.getItem('theme') || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

            const elLang = $('setting-language');
            const elVis = $('setting-visibility');
            const elNotif = $('setting-notifications');

            if (elLang) elLang.value = language;
            if (elVis) elVis.value = visibility;
            if (elNotif) elNotif.checked = (notifications === null) ? true : (notifications === 'true');

            applyTheme(theme);
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
        }
    }

    function saveSetting(key, value) {
        try {
            localStorage.setItem(key, String(value));
        } catch (err) {
            console.warn('Não foi possível salvar configuração', key, err);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();

        safeAddListener($('btn-theme-light'), 'click', () => {
            applyTheme('light');
            saveSetting('theme', 'light');
        });

        safeAddListener($('btn-theme-dark'), 'click', () => {
            applyTheme('dark');
            saveSetting('theme', 'dark');
        });

        safeAddListener($('setting-language'), 'change', (e) => {
            saveSetting('setting_language', e.target.value);
        });

        safeAddListener($('setting-visibility'), 'change', (e) => {
            saveSetting('setting_visibility', e.target.value);
        });

        const notifEl = $('setting-notifications');
        if (notifEl) {
            notifEl.addEventListener('change', (e) => {
                saveSetting('setting_notifications', e.target.checked);
            });
        }

        // Integração com auth (ex.: mostrar opções dinamicamente) - futuro
        // Se quiser, podemos esconder o dropdown quando não estiver logado e mostrar botões "Entrar"/"Cadastrar".
    });
})();
