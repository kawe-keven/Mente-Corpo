// Gerenciamento da Página de Perfil
class UserProfile {
    constructor() {
        this.userData = null;
        this.habitsData = null;
        this.agendaData = null;
        this.chatData = null;
        this.currentAvatarFile = null;
        this.init();
    }

    init() {
        this.loadUserData();
        this.loadDashboardData();
        this.setupEventListeners();
        this.loadAvatar();
    }

    // Carregar dados do usuário do cadastro / backend
    async loadUserData() {
        // Primeiro, tentar pegar os dados do currentUser (salvos no login/cadastro)
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (currentUser) {
            const userData = {
                name: currentUser.name || 'Usuário',
                email: currentUser.email || '',
                fullName: currentUser.name || '',
                birthdate: currentUser.birthdate || '',
                gender: currentUser.gender || '',
                phone: currentUser.phone || '',
                registrationDate: currentUser.created_at || new Date().toISOString(),
                avatar: currentUser.avatar || null
            };
            
            this.userData = userData;
            localStorage.setItem('userData', JSON.stringify(userData));
            this.displayUserData();
            return;
        }

        // Fallback: tentar buscar do backend
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                const res = await fetch('/api/users/me', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    const user = await res.json();
                    const userData = {
                        name: user.name || 'Usuário',
                        email: user.email || '',
                        fullName: user.name || user.fullName || '',
                        birthdate: user.birthdate || '',
                        gender: user.gender || '',
                        phone: user.phone || '',
                        registrationDate: user.created_at || new Date().toISOString(),
                        avatar: user.avatar || null
                    };
                    this.userData = userData;
                    localStorage.setItem('userData', JSON.stringify(userData));
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    this.displayUserData();
                    return;
                }
            } catch (err) {
                console.error('Erro ao buscar perfil do servidor:', err);
            }
        }

        // Último fallback: dados básicos do localStorage antigo
        const existingProfileData = JSON.parse(localStorage.getItem('userData')) || {};
        const userData = {
            name: existingProfileData.name || 'Usuário',
            email: existingProfileData.email || '',
            fullName: existingProfileData.fullName || '',
            birthdate: existingProfileData.birthdate || '',
            gender: existingProfileData.gender || '',
            phone: existingProfileData.phone || '',
            registrationDate: existingProfileData.registrationDate || new Date().toISOString(),
            avatar: existingProfileData.avatar || null
        };

        this.userData = userData;
        this.displayUserData();
    }

    // Carregar avatar do usuário
    loadAvatar() {
        const avatarData = localStorage.getItem('userAvatar');
        if (avatarData) {
            const avatarImage = document.getElementById('avatar-image');
            const avatarIcon = document.getElementById('avatar-icon');
            const previewImage = document.getElementById('avatar-preview-image');
            const previewIcon = document.getElementById('avatar-preview-icon');
            
            avatarImage.src = avatarData;
            avatarImage.classList.remove('d-none');
            avatarIcon.classList.add('d-none');
            
            previewImage.src = avatarData;
            previewImage.classList.remove('d-none');
            previewIcon.classList.add('d-none');
        }
    }

    // Salvar avatar do usuário
    saveAvatar(avatarData) {
        localStorage.setItem('userAvatar', avatarData);
        this.loadAvatar();
        this.showNotification('Foto de perfil atualizada com sucesso!', 'success');
    }

    // Remover avatar do usuário
    removeAvatar() {
        localStorage.removeItem('userAvatar');
        const avatarImage = document.getElementById('avatar-image');
        const avatarIcon = document.getElementById('avatar-icon');
        const previewImage = document.getElementById('avatar-preview-image');
        const previewIcon = document.getElementById('avatar-preview-icon');
        
        avatarImage.classList.add('d-none');
        avatarIcon.classList.remove('d-none');
        
        previewImage.classList.add('d-none');
        previewIcon.classList.remove('d-none');
        
        this.currentAvatarFile = null;
        this.showNotification('Foto de perfil removida', 'info');
    }

    // Carregar dados do dashboard
    loadDashboardData() {
        // Carregar dados dos hábitos
        const habitsData = JSON.parse(localStorage.getItem('healthyHabitsData')) || {
            points: 0,
            completedHabits: [],
            weeklyStreak: 0,
            currentWeekData: { points: 0 }
        };

        // Carregar dados da agenda
        const agendaData = JSON.parse(localStorage.getItem('healthAgenda')) || [];

        // Carregar dados do chat
        const chatData = JSON.parse(localStorage.getItem('safeSpacePosts')) || [];

        this.habitsData = habitsData;
        this.agendaData = agendaData;
        this.chatData = chatData;

        this.updateStats();
        this.loadRecentActivities();
        this.loadHealthGoals();
    }

    // Exibir dados do usuário
    displayUserData() {
        document.getElementById('user-name').textContent = this.userData.name || 'Usuário';
        document.getElementById('user-email').textContent = this.userData.email || 'Email não cadastrado';
        
        // Informações pessoais
        document.getElementById('info-fullname').textContent = this.userData.fullName || this.userData.name || 'Nome não informado';
        document.getElementById('info-birthdate').textContent = this.userData.birthdate && this.userData.birthdate !== '' ? 
            this.formatDate(this.userData.birthdate) : 'Data não informada';
        document.getElementById('info-gender').textContent = this.userData.gender && this.userData.gender !== '' ? 
            this.capitalizeFirst(this.userData.gender) : 'Não especificado';
        document.getElementById('info-phone').textContent = this.userData.phone && this.userData.phone !== '' ? 
            this.userData.phone : 'Telefone não cadastrado';

        // Data de registro
        const registrationDate = new Date(this.userData.registrationDate);
        const options = { year: 'numeric', month: 'long' };
        document.getElementById('member-since').textContent = `Membro desde: ${registrationDate.toLocaleDateString('pt-BR', options)}`;

        // Nível do usuário baseado nos pontos
        const totalPoints = this.habitsData?.points || 0;
        const userLevel = this.calculateUserLevel(totalPoints);
        document.getElementById('user-level').textContent = `Nível: ${userLevel}`;
    }

    // Atualizar estatísticas
    updateStats() {
        // Total de hábitos concluídos
        const totalHabits = this.habitsData.completedHabits?.length || 0;
        document.getElementById('total-habits').textContent = totalHabits;

        // Total de compromissos
        const totalAppointments = this.agendaData.length;
        document.getElementById('total-appointments').textContent = totalAppointments;

        // Pontos totais
        const totalPoints = Math.round(this.habitsData.points || 0);
        document.getElementById('total-points').textContent = totalPoints;

        // Posts na comunidade
        document.getElementById('community-posts').textContent = this.chatData.length;

        // Progresso semanal
        const maxWeeklyPoints = 8 * 20; // 8 hábitos × 20 pontos máximos cada
        const weeklyPoints = Math.round(this.habitsData.currentWeekData?.points || 0);
        const progressPercentage = maxWeeklyPoints > 0 ? 
            (weeklyPoints / maxWeeklyPoints) * 100 : 0;
        
        document.getElementById('weekly-progress').style.width = `${progressPercentage}%`;
        document.getElementById('weekly-progress-percent').textContent = `${Math.round(progressPercentage)}%`;
        document.getElementById('weekly-points').textContent = weeklyPoints;

        // Sequência atual
        document.getElementById('current-streak').textContent = this.habitsData.weeklyStreak || 0;
    }

    // Carregar atividades recentes
    loadRecentActivities() {
        const container = document.getElementById('recent-activities');
        const activities = [];

        // Adicionar hábitos recentes
        const today = new Date().toDateString();
        const todayHabits = this.habitsData.currentWeekData?.habitQuantities?.[today] || {};
        const completedToday = Object.entries(todayHabits).filter(([habit, value]) => value > 0);
        
        completedToday.forEach(([habit, value]) => {
            activities.push({
                type: 'habit',
                description: `Concluiu ${value}x ${this.getHabitName(habit)}`,
                date: new Date(),
                icon: 'bi-check-circle text-success'
            });
        });

        // Adicionar compromissos recentes (últimos 7 dias)
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const recentAppointments = this.agendaData.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            return appointmentDate >= lastWeek;
        });

        recentAppointments.forEach(appointment => {
            activities.push({
                type: 'appointment',
                description: `${appointment.completed ? 'Concluiu' : 'Agendou'} ${appointment.description}`,
                date: new Date(appointment.date),
                icon: appointment.completed ? 'bi-calendar-check text-success' : 'bi-calendar-plus text-primary'
            });
        });

        // Adicionar posts recentes (últimos 7 dias)
        const recentPosts = this.chatData.filter(post => {
            const postDate = new Date(post.timestamp);
            return postDate >= lastWeek;
        });

        recentPosts.forEach(post => {
            activities.push({
                type: 'post',
                description: 'Postou no Espaço Seguro',
                date: new Date(post.timestamp),
                icon: 'bi-chat-heart text-info'
            });
        });

        // Ordenar por data (mais recente primeiro) e limitar a 10
        activities.sort((a, b) => b.date - a.date);
        const recentActivities = activities.slice(0, 10);

        if (recentActivities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-activity display-6 d-block mb-2"></i>
                    <p class="small">Nenhuma atividade recente</p>
                </div>
            `;
            return;
        }

        container.innerHTML = recentActivities.map(activity => `
            <div class="timeline-item">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <div class="d-flex align-items-center">
                        <i class="${activity.icon} me-2"></i>
                        <span class="small">${activity.description}</span>
                    </div>
                    <small class="timeline-date">${this.formatRelativeDate(activity.date)}</small>
                </div>
            </div>
        `).join('');
    }

    // Carregar metas de saúde
    loadHealthGoals() {
        const container = document.getElementById('health-goals');
        const goals = JSON.parse(localStorage.getItem('healthGoals')) || [];

        if (goals.length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-3">Nenhuma meta definida ainda</p>';
            return;
        }

        container.innerHTML = goals.map(goal => `
            <div class="neo-card p-3 mb-2 goal-item">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <div class="small fw-bold">${goal.title}</div>
                        <div class="small text-muted">${goal.description}</div>
                    </div>
                    <span class="badge ${goal.completed ? 'bg-success' : 'bg-secondary'} ms-2">
                        ${goal.completed ? 'Concluída' : 'Em andamento'}
                    </span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge goal-category-badge bg-primary">${this.getCategoryName(goal.category)}</span>
                    ${goal.deadline ? `<small class="text-muted">Até ${this.formatDate(goal.deadline)}</small>` : ''}
                </div>
                ${!goal.completed ? `
                <div class="progress-bar mt-2">
                    <div class="progress-fill" style="width: ${goal.progress || 0}%"></div>
                </div>
                <div class="d-flex justify-content-between mt-1">
                    <small class="text-muted">Progresso</small>
                    <small class="text-muted">${goal.progress || 0}%</small>
                </div>
                ` : ''}
            </div>
        `).join('');
    }

    // Configurar event listeners
    setupEventListeners() {
        // Botão de editar perfil
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            this.openEditProfileModal();
        });

        // Botão de salvar perfil
        document.getElementById('save-profile-btn').addEventListener('click', () => {
            this.saveProfile();
        });

        // Botão de editar avatar
        document.getElementById('avatar-edit-btn').addEventListener('click', () => {
            this.openAvatarUploadModal();
        });

        // Botão de escolher avatar
        document.getElementById('choose-avatar-btn').addEventListener('click', () => {
            document.getElementById('avatar-file-input').click();
        });

        // Input de arquivo do avatar
        document.getElementById('avatar-file-input').addEventListener('change', (e) => {
            this.handleAvatarSelect(e);
        });

        // Botão de remover avatar
        document.getElementById('remove-avatar-btn').addEventListener('click', () => {
            this.removeAvatar();
        });

        // Botão de salvar avatar
        document.getElementById('save-avatar-btn').addEventListener('click', () => {
            this.saveAvatar(this.currentAvatarFile);
        });

        // Botão de adicionar meta
        document.getElementById('add-goal-btn').addEventListener('click', () => {
            this.openAddGoalModal();
        });

        // Botão de salvar meta
        document.getElementById('save-goal-btn').addEventListener('click', () => {
            this.saveHealthGoal();
        });

        // Atualizar valor do range de progresso
        document.getElementById('goal-progress').addEventListener('input', (e) => {
            document.getElementById('goal-progress-value').textContent = `${e.target.value}%`;
        });

        // Atualizar dados a cada 30 segundos
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    // Abrir modal de edição de perfil
    openEditProfileModal() {
        // Preencher formulário com dados atuais
        document.getElementById('edit-name').value = this.userData.name;
        document.getElementById('edit-email').value = this.userData.email;
        document.getElementById('edit-birthdate').value = this.userData.birthdate || '';
        document.getElementById('edit-phone').value = this.userData.phone || '';
        document.getElementById('edit-gender').value = this.userData.gender || '';

        // Abrir modal
        const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        modal.show();
    }

    // Abrir modal de upload de avatar
    openAvatarUploadModal() {
        const modal = new bootstrap.Modal(document.getElementById('avatarUploadModal'));
        modal.show();
    }

    // Abrir modal de adicionar meta
    openAddGoalModal() {
        // Resetar formulário
        document.getElementById('add-goal-form').reset();
        document.getElementById('goal-progress-value').textContent = '0%';
        
        const modal = new bootstrap.Modal(document.getElementById('addGoalModal'));
        modal.show();
    }

    // Manipular seleção de avatar
    handleAvatarSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
            this.showNotification('Por favor, selecione um arquivo de imagem válido.', 'error');
            return;
        }

        // Validar tamanho do arquivo (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('A imagem deve ter no máximo 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImage = document.getElementById('avatar-preview-image');
            const previewIcon = document.getElementById('avatar-preview-icon');
            
            previewImage.src = e.target.result;
            previewImage.classList.remove('d-none');
            previewIcon.classList.add('d-none');
            
            this.currentAvatarFile = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Salvar perfil
    saveProfile() {
        const updatedData = {
            ...this.userData,
            name: document.getElementById('edit-name').value,
            email: document.getElementById('edit-email').value,
            birthdate: document.getElementById('edit-birthdate').value,
            phone: document.getElementById('edit-phone').value,
            gender: document.getElementById('edit-gender').value,
            fullName: document.getElementById('edit-name').value
        };

        // Validar dados
        if (!updatedData.name || !updatedData.email) {
            this.showNotification('Nome e email são obrigatórios', 'error');
            return;
        }

        // Salvar no localStorage (apenas no userData, não altera o cadastroData)
        localStorage.setItem('userData', JSON.stringify(updatedData));
        
        // Atualizar dados locais
        this.userData = updatedData;
        this.displayUserData();

        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();

        this.showNotification('Perfil atualizado com sucesso!', 'success');
    }

    // Salvar meta de saúde
    saveHealthGoal() {
        const title = document.getElementById('goal-title').value;
        const description = document.getElementById('goal-description').value;
        const category = document.getElementById('goal-category').value;
        const deadline = document.getElementById('goal-deadline').value;
        const progress = parseInt(document.getElementById('goal-progress').value);

        if (!title) {
            this.showNotification('O título da meta é obrigatório', 'error');
            return;
        }

        const goals = JSON.parse(localStorage.getItem('healthGoals')) || [];
        goals.push({
            id: Date.now(),
            title,
            description,
            category,
            deadline,
            progress,
            completed: progress === 100,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem('healthGoals', JSON.stringify(goals));
        this.loadHealthGoals();
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addGoalModal'));
        modal.hide();

        this.showNotification('Meta adicionada com sucesso!', 'success');
    }

    // Utilitários
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    formatRelativeDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours} h atrás`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;
        
        return this.formatDate(date);
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    calculateUserLevel(points) {
        if (points >= 1000) return 'Mestre';
        if (points >= 500) return 'Avançado';
        if (points >= 200) return 'Intermediário';
        if (points >= 50) return 'Iniciante';
        return 'Novato';
    }

    getHabitName(habitKey) {
        const habitNames = {
            'water': 'Água',
            'exercise': 'Exercício',
            'sleep': 'Sono',
            'meditation': 'Meditação',
            'reading': 'Leitura',
            'healthy_meal': 'Refeição Saudável',
            'no_sugar': 'Sem Açúcar',
            'walk': 'Caminhada'
        };
        return habitNames[habitKey] || habitKey;
    }

    getCategoryName(category) {
        const categories = {
            'fitness': 'Fitness',
            'nutricao': 'Nutrição',
            'saude-mental': 'Saúde Mental',
            'sono': 'Sono',
            'habitos': 'Hábitos',
            'outro': 'Outro'
        };
        return categories[category] || category;
    }

    showNotification(message, type = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1060;
            min-width: 300px;
        `;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Inicializar o perfil quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.userProfile = new UserProfile();
});