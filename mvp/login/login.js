// Gerenciamento do Login
class Login {
    constructor() {
        this.init();
    }

    init() {
        // Verificar se já está logado e redirecionar
        if (this.isUserLoggedIn()) {
            window.location.href = '/mvp/inicio/inicio.html';
            return;
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    isUserLoggedIn() {
        return !!localStorage.getItem('authToken');
    }

    handleLogin(event) {
        event.preventDefault();
        event.stopPropagation();

        const form = event.target;
        if (form.checkValidity()) {
            this.validarLogin();
        } else {
            form.classList.add('was-validated');
        }
    }

    async validarLogin() {
        const email = document.getElementById('loginEmail').value.toLowerCase();
        const senha = document.getElementById('loginSenha').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: senha })
            });

            const data = await res.json();
            if (!res.ok) {
                this.mostrarNotificacao(data.error || 'Erro ao fazer login', 'error');
                document.getElementById('loginSenha').value = '';
                return;
            }

            // Salvar token e usuário
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            this.mostrarNotificacao('Login realizado com sucesso! Redirecionando...', 'success');

            setTimeout(() => {
                window.location.href = '/mvp/inicio/inicio.html';
            }, 800);
        } catch (err) {
            console.error(err);
            this.mostrarNotificacao('Erro de rede. Tente novamente.', 'error');
        }
    }

    mostrarNotificacao(mensagem, tipo = 'info') {
        // Remover notificações existentes
        const notificacoesExistentes = document.querySelectorAll('.alert-notification');
        notificacoesExistentes.forEach(notif => notif.remove());

        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo === 'error' ? 'danger' : tipo} alert-notification alert-dismissible fade show`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        alert.innerHTML = `
            <i class="bi bi-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Inicializar o login quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.login = new Login();
});