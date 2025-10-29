// Gerenciamento do Login
class Login {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadExistingUsers();
    }

    setupEventListeners() {
        const form = document.getElementById('loginForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    loadExistingUsers() {
        this.usuarios = JSON.parse(localStorage.getItem('healthTechUsers')) || [];
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

    validarLogin() {
        const email = document.getElementById('loginEmail').value.toLowerCase();
        const senha = document.getElementById('loginSenha').value;

        const usuario = this.usuarios.find(u => u.email === email && u.senha === senha);

        if (usuario) {
            // Atualizar último login
            usuario.ultimoLogin = new Date().toISOString();
            localStorage.setItem('healthTechUsers', JSON.stringify(this.usuarios));
            
            // Salvar usuário logado
            localStorage.setItem('currentUser', JSON.stringify(usuario));

            this.mostrarNotificacao('Login realizado com sucesso! Redirecionando...', 'success');
            
            // Redirecionar para a agenda após 1 segundo
            setTimeout(() => {
                window.location.href = '/mvp/Agenda/agenda.html';
            }, 1000);
        } else {
            this.mostrarNotificacao('E-mail ou senha incorretos. Tente novamente.', 'error');
            document.getElementById('loginSenha').value = '';
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

// Verificar se já existe um usuário logado
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = '/mvp/Agenda/agenda.html';
    }
});