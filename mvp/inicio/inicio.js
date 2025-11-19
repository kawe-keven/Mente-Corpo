// Gerenciamento da Página Inicial
class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.loadDashboardData();
        this.updateStats();
        this.loadUpcomingAppointments();
        this.setupEventListeners();
    }

    // Verificar status de autenticação e mostrar menu apropriado
    checkAuthStatus() {
        const isLoggedIn = !!(localStorage.getItem('authToken') || localStorage.getItem('currentUser'));
        const userMenu = document.getElementById('user-menu');
        const guestMenu = document.getElementById('guest-menu');
        
        // Elementos que devem ser visíveis apenas para usuários autenticados
        const userStats = document.getElementById('user-stats');
        const userProgress = document.getElementById('user-progress');
        const quickActions = document.getElementById('quick-actions');
        
        if (isLoggedIn) {
            if (userMenu) userMenu.style.display = 'block';
            if (guestMenu) guestMenu.style.display = 'none';
            if (userStats) userStats.style.display = 'block';
            if (userProgress) userProgress.style.display = 'block';
            if (quickActions) quickActions.style.display = 'block';
            
            // Configurar logout
            const logoutBtn = document.querySelector('[data-logout]');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Tem certeza que deseja sair?')) {
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('authToken');
                        sessionStorage.removeItem('redirectAfterLogin');
                        window.location.reload();
                    }
                });
            }
        } else {
            if (userMenu) userMenu.style.display = 'none';
            if (guestMenu) guestMenu.style.display = 'flex';
            if (userStats) userStats.style.display = 'none';
            if (userProgress) userProgress.style.display = 'none';
            if (quickActions) quickActions.style.display = 'none';
        }
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
    }

    // Atualizar estatísticas
    updateStats() {
        // Hábitos de hoje
        const today = new Date().toDateString();
        const todayHabits = this.habitsData.currentWeekData?.habitQuantities?.[today] || {};
        const completedToday = Object.values(todayHabits).filter(val => val > 0).length;
        document.getElementById('today-habits').textContent = completedToday;

        // Próximos compromissos
        const upcomingAppointments = this.agendaData.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return !appointment.completed && appointmentDate >= today;
        }).length;
        document.getElementById('next-appointment').textContent = upcomingAppointments;

        // Pontos da semana
        const weeklyPoints = Math.round(this.habitsData.currentWeekData?.points || 0);
        document.getElementById('weekly-points').textContent = weeklyPoints;

        // Mensagens da comunidade
        document.getElementById('community-posts').textContent = this.chatData.length;

        // Progresso geral
        const maxWeeklyPoints = 8 * 20; // 8 hábitos × 20 pontos máximos cada
        const progressPercentage = maxWeeklyPoints > 0 ? 
            (this.habitsData.currentWeekData?.points / maxWeeklyPoints) * 100 : 0;
        
        document.getElementById('overall-progress').style.width = `${progressPercentage}%`;
        document.getElementById('progress-percent').textContent = `${Math.round(progressPercentage)}%`;

        // Sequência atual
        document.getElementById('current-streak').textContent = this.habitsData.weeklyStreak || 0;

        // Pontos totais
        document.getElementById('total-points').textContent = Math.round(this.habitsData.points || 0);
    }

    // Carregar próximos compromissos
    loadUpcomingAppointments() {
        const container = document.getElementById('upcoming-appointments');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingAppointments = this.agendaData
            .filter(appointment => {
                const appointmentDate = new Date(appointment.date);
                appointmentDate.setHours(0, 0, 0, 0);
                return !appointment.completed && appointmentDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3); // Mostrar apenas os 3 próximos

        if (upcomingAppointments.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-calendar-x display-6 d-block mb-2"></i>
                    <p class="small">Nenhum compromisso agendado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingAppointments.map(appointment => {
            const appointmentDate = new Date(appointment.date);
            const daysUntil = this.getDaysDifference(appointment.date);
            
            const typeIcons = {
                consulta: 'bi-person-heart',
                exame: 'bi-heart-pulse',
                retorno: 'bi-arrow-repeat',
                cirurgia: 'bi-scissors',
                vacina: 'bi-droplet'
            };

            return `
                <div class="neo-card p-3 mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <i class="bi ${typeIcons[appointment.type]} text-primary me-2"></i>
                            <div>
                                <div class="small fw-bold">${appointment.description}</div>
                                <div class="small text-muted">${this.formatDate(appointment.date)}</div>
                            </div>
                        </div>
                        <span class="badge ${this.getUrgencyBadgeClass(daysUntil)}">
                            ${this.getDaysUntilText(daysUntil)}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Configurar event listeners
    setupEventListeners() {
        // Atualizar dados a cada 30 segundos
        setInterval(() => {
            this.loadDashboardData();
            this.updateStats();
            this.loadUpcomingAppointments();
        }, 30000);
    }

    // Utilitários
    getDaysDifference(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    getDaysUntilText(daysUntil) {
        if (daysUntil === 0) return 'Hoje';
        if (daysUntil === 1) return 'Amanhã';
        if (daysUntil > 1) return `${daysUntil}d`;
        return 'Passado';
    }

    getUrgencyBadgeClass(daysUntil) {
        if (daysUntil <= 1) return 'bg-danger';
        if (daysUntil <= 3) return 'bg-warning';
        return 'bg-info';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// Inicializar o dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Função para mostrar notificações
function showNotification(message, type = 'info') {
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