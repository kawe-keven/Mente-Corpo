// Sistema de proteção de páginas
class AuthProtection {
    constructor() {
        this.init();
    }

    init() {
        this.protectPages();
    }

    isUserLoggedIn() {
       
        return !!(localStorage.getItem('authToken') || localStorage.getItem('currentUser'));
    }

    protectPages() {
        const protectedPages = [
            '/mvp/inicio/inicio.html',
            '/mvp/HabitosSaudaveis/index.html',
            '/mvp/Agenda/agenda.html',
            '/mvp/Chat/chat.html',
            '/mvp/perfil/perfil.html'
        ];

        const currentPage = window.location.pathname;
        
        // Verificar se a página atual requer autenticação
        if (protectedPages.some(page => currentPage.includes(page))) {
            if (!this.isUserLoggedIn()) {
                window.location.href = '/mvp/login/login.html';
                return;
            }
        }

        // Adicionar funcionalidade de logout
        this.setupLogout();
    }

    setupLogout() {
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tem certeza que deseja sair?')) {
                    // Remove both the user object and the auth token
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('authToken');
                    // Redirect to the login page
                    window.location.href = '/mvp/login/login.html';
                }
            });
        });
    }
}

// Inicializar proteção quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.authProtection = new AuthProtection();
});