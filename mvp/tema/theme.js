// Gerenciamento do Tema Escuro/Claro
class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    getStoredTheme() {
        return localStorage.getItem('healthTechTheme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('healthTechTheme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.updateToggleButton(theme);
        this.setStoredTheme(theme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        
        // Disparar evento personalizado para que outros componentes saibam da mudança
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.currentTheme }
        }));
    }

    updateToggleButton(theme) {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.className = 'bi bi-sun';
                themeToggle.title = 'Alternar para modo claro';
            } else {
                icon.className = 'bi bi-moon-stars';
                themeToggle.title = 'Alternar para modo escuro';
            }
        }
    }

    // Método para obter o tema atual
    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Inicializar o gerenciador de tema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Também garantir que o tema seja aplicado se o script carregar depois do DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}