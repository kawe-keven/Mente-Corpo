// Sistema de proteção de páginas - Execução imediata
(function() {
    'use strict';

    function isUserLoggedIn() {
        return !!(localStorage.getItem('authToken') || localStorage.getItem('currentUser'));
    }

    function checkAuth() {
        // Páginas que NÃO requerem autenticação (públicas)
        const publicPages = [
            '/mvp/login/login.html',
            '/mvp/cadastro/cadastro.html',
            '/mvp/inicio/inicio.html'
        ];

        const currentPage = window.location.pathname;
        
        // Se não for uma página pública, verificar autenticação
        const isPublicPage = publicPages.some(page => currentPage.includes(page));
        
        if (!isPublicPage && !isUserLoggedIn()) {
            // Salvar a URL que o usuário tentou acessar
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            // Redirecionar imediatamente
            window.location.replace('/mvp/login/login.html');
            return false;
        }
        
        return true;
    }

    // Executar verificação imediatamente
    const isAuthorized = checkAuth();

    // Se autorizado, continuar com a inicialização quando DOM estiver pronto
    if (isAuthorized) {
        // Sistema de proteção de páginas
        class AuthProtection {
            constructor() {
                this.init();
            }

            init() {
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
                            sessionStorage.removeItem('redirectAfterLogin');
                            // Redirect to the login page
                            window.location.href = '/mvp/login/login.html';
                        }
                    });
                });
            }
        }

        // Inicializar proteção quando a página carregar
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                window.authProtection = new AuthProtection();
            });
        } else {
            window.authProtection = new AuthProtection();
        }
    }
})();
