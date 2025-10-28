// Gerenciamento da Página de Login/Cadastro
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulário de login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
            
            // Validação em tempo real
            const loginEmail = document.getElementById('loginEmail');
            const loginPassword = document.getElementById('loginPassword');
            
            loginEmail.addEventListener('blur', () => this.validateField(loginEmail, 'email'));
            loginPassword.addEventListener('blur', () => this.validateField(loginPassword, 'password', 6));
        }

        // Formulário de cadastro
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
            
            // Validação em tempo real
            const firstName = document.getElementById('firstName');
            const lastName = document.getElementById('lastName');
            const registerEmail = document.getElementById('registerEmail');
            const registerPassword = document.getElementById('registerPassword');
            const confirmPassword = document.getElementById('confirmPassword');
            
            firstName.addEventListener('blur', () => this.validateField(firstName, 'text'));
            lastName.addEventListener('blur', () => this.validateField(lastName, 'text'));
            registerEmail.addEventListener('blur', () => this.validateField(registerEmail, 'email'));
            registerPassword.addEventListener('blur', () => this.validateField(registerPassword, 'password', 8));
            confirmPassword.addEventListener('blur', () => this.validatePasswordMatch());
        }

        // Link de esqueci a senha
        const forgotPasswordLink = document.getElementById('forgotPassword');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }

    // Verificar se já existe uma sessão ativa
    checkExistingSession() {
        const userData = JSON.parse(localStorage.getItem('healthTechUser'));
        if (userData && userData.isLoggedIn) {
            // Redirecionar para a página inicial se já estiver logado
            window.location.href = 'index.html';
        }
    }

    // Processar login
    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validação dos campos
        if (!this.validateField(document.getElementById('loginEmail'), 'email') ||
            !this.validateField(document.getElementById('loginPassword'), 'password', 6)) {
            this.showNotification('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        // Simular verificação de credenciais
        const users = JSON.parse(localStorage.getItem('healthTechUsers')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Login bem-sucedido
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                isLoggedIn: true,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('healthTechUser', JSON.stringify(userData));
            
            this.showNotification('Login realizado com sucesso!', 'success');
            
            // Redirecionar após um breve delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            this.showNotification('E-mail ou senha incorretos.', 'error');
        }
    }

    // Processar cadastro
    handleRegister() {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        // Validações dos campos
        if (!this.validateField(document.getElementById('firstName'), 'text') ||
            !this.validateField(document.getElementById('lastName'), 'text') ||
            !this.validateField(document.getElementById('registerEmail'), 'email') ||
            !this.validateField(document.getElementById('registerPassword'), 'password', 8) ||
            !this.validatePasswordMatch() ||
            !acceptTerms) {
            this.showNotification('Por favor, corrija os erros no formulário.', 'error');
            return;
        }

        // Verificar se o e-mail já está cadastrado
        const users = JSON.parse(localStorage.getItem('healthTechUsers')) || [];
        if (users.find(u => u.email === email)) {
            this.showNotification('Este e-mail já está cadastrado.', 'error');
            return;
        }

        // Criar novo usuário
        const newUser = {
            id: this.generateId(),
            name: `${firstName} ${lastName}`,
            email: email,
            password: password, // Em uma aplicação real, isso seria criptografado
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('healthTechUsers', JSON.stringify(users));

        // Logar automaticamente após o cadastro
        const userData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('healthTechUser', JSON.stringify(userData));
        
        this.showNotification('Cadastro realizado com sucesso!', 'success');
        
        // Redirecionar após um breve delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    // Processar "esqueci minha senha"
    handleForgotPassword() {
        const email = prompt('Digite seu e-mail para redefinir a senha:');
        
        if (email && this.validateEmail(email)) {
            // Simular envio de e-mail de recuperação
            this.showNotification('Instruções para redefinir sua senha foram enviadas para seu e-mail.', 'info');
        } else if (email) {
            this.showNotification('Por favor, insira um e-mail válido.', 'error');
        }
    }

    // Validação de campo individual
    validateField(field, type, minLength = null) {
        const value = field.value.trim();
        let isValid = true;
        let message = '';
        
        field.classList.remove('is-invalid');
        
        // Remover mensagens de erro existentes
        const existingFeedback = field.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Validação de campo obrigatório
        if (!value) {
            isValid = false;
            message = 'Este campo é obrigatório.';
        }
        // Validação de e-mail
        else if (type === 'email' && !this.validateEmail(value)) {
            isValid = false;
            message = 'Por favor, insira um e-mail válido.';
        }
        // Validação de senha
        else if (type === 'password' && minLength && value.length < minLength) {
            isValid = false;
            message = `A senha deve ter pelo menos ${minLength} caracteres.`;
        }
        
        if (!isValid) {
            field.classList.add('is-invalid');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = message;
            field.parentNode.appendChild(feedback);
        }
        
        return isValid;
    }

    // Validar se as senhas coincidem
    validatePasswordMatch() {
        const password = document.getElementById('registerPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        let isValid = true;
        
        // Remover mensagens de erro existentes
        const existingFeedback = confirmPassword.parentNode.querySelector('.invalid-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        if (password.value !== confirmPassword.value) {
            isValid = false;
            confirmPassword.classList.add('is-invalid');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = 'As senhas não coincidem.';
            confirmPassword.parentNode.appendChild(feedback);
        } else {
            confirmPassword.classList.remove('is-invalid');
        }
        
        return isValid;
    }

    // Validar e-mail
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Mostrar notificações
    showNotification(message, type = 'info') {
        // Remover notificações existentes
        const existingAlerts = document.querySelectorAll('.custom-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `custom-alert ${type}`;
        alert.setAttribute('role', 'alert');
        alert.setAttribute('aria-live', 'assertive');
        alert.textContent = message;
        
        document.body.appendChild(alert);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Inicializar o gerenciador de autenticação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Função para logout (pode ser usada em outras páginas)
function logout() {
    localStorage.removeItem('healthTechUser');
    window.location.href = 'login.html';
}