// Gerenciamento do Cadastro
class Cadastro {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadExistingUsers();
    }

    setupEventListeners() {
        const form = document.getElementById('cadastroForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCadastro(e));
        }

        // Validação em tempo real da confirmação de senha
        const senhaInput = document.getElementById('senha');
        const confirmarSenhaInput = document.getElementById('confirmarSenha');
        
        if (confirmarSenhaInput) {
            confirmarSenhaInput.addEventListener('input', () => {
                this.validarSenhas();
            });
        }

        if (senhaInput) {
            senhaInput.addEventListener('input', () => {
                this.validarSenhas();
            });
        }

        // Formatação do telefone
        const telefoneInput = document.getElementById('telefone');
        if (telefoneInput) {
            telefoneInput.addEventListener('input', (e) => {
                this.formatarTelefone(e);
            });
        }
    }

    loadExistingUsers() {
        // Carrega usuários existentes do localStorage
        this.usuarios = JSON.parse(localStorage.getItem('healthTechUsers')) || [];
    }

    handleCadastro(event) {
        event.preventDefault();
        event.stopPropagation();

        const form = event.target;
        
        if (form.checkValidity() && this.validarSenhas()) {
            this.criarUsuario();
        } else {
            form.classList.add('was-validated');
        }
    }

    validarSenhas() {
        const senha = document.getElementById('senha');
        const confirmarSenha = document.getElementById('confirmarSenha');
        
        if (senha.value !== confirmarSenha.value) {
            confirmarSenha.setCustomValidity('As senhas não coincidem');
            confirmarSenha.classList.add('is-invalid');
            return false;
        } else {
            confirmarSenha.setCustomValidity('');
            confirmarSenha.classList.remove('is-invalid');
            return true;
        }
    }

    criarUsuario() {
        const usuario = {
            id: Date.now().toString(),
            nome: document.getElementById('nome').value,
            dataNascimento: document.getElementById('dataNascimento').value,
            email: document.getElementById('email').value.toLowerCase(),
            telefone: document.getElementById('telefone').value,
            senha: document.getElementById('senha').value,
            dataCadastro: new Date().toISOString(),
            ultimoLogin: null
        };

        // Verificar se o e-mail já existe
        if (this.usuarios.find(u => u.email === usuario.email)) {
            this.mostrarNotificacao('Este e-mail já está cadastrado. Use outro e-mail ou faça login.', 'error');
            return;
        }

        // Adicionar usuário à lista
        this.usuarios.push(usuario);
        localStorage.setItem('healthTechUsers', JSON.stringify(this.usuarios));

        // Salvar usuário logado
        localStorage.setItem('currentUser', JSON.stringify(usuario));

        // Inicializar dados do usuário
        this.inicializarDadosUsuario(usuario.id);

        this.mostrarNotificacao('Cadastro realizado com sucesso! Redirecionando...', 'success');
        
        // Redirecionar para a agenda após 2 segundos
        setTimeout(() => {
            window.location.href = '/mvp/Agenda/agenda.html';
        }, 2000);
    }

    inicializarDadosUsuario(userId) {
        // Inicializar dados dos hábitos saudáveis
        const habitsData = {
            userId: userId,
            points: 0,
            completedHabits: [],
            weeklyStreak: 0,
            currentWeekData: {
                points: 0,
                habitQuantities: {}
            },
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('healthyHabitsData', JSON.stringify(habitsData));

        // Inicializar dados da agenda
        const agendaData = [];
        localStorage.setItem('healthAgenda', JSON.stringify(agendaData));

        // Inicializar dados do chat
        const chatData = [];
        localStorage.setItem('safeSpacePosts', JSON.stringify(chatData));
    }

    formatarTelefone(event) {
        let value = event.target.value.replace(/\D/g, '');
        
        if (value.length <= 11) {
            if (value.length <= 2) {
                value = value.replace(/^(\d{0,2})/, '($1');
            } else if (value.length <= 6) {
                value = value.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
            } else if (value.length <= 10) {
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
        }
        
        event.target.value = value;
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

// Inicializar o cadastro quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.cadastro = new Cadastro();
});

// Verificar se já existe um usuário logado
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = '/mvp/Agenda/agenda.html';
    }
});