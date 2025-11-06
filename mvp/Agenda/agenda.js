// Gerenciamento da Agenda de Saúde
class HealthAgenda {
    constructor() {
        // Inicialmente vazio; vamos tentar carregar do servidor
        this.appointments = [];
        this.editingId = null;
        this.currentFilter = 'all';
        this.init();
    }

    // Inicializar a agenda
    init() {
        this.setMinDate();
        this.setupEventListeners();

        // Carregar do servidor e depois renderizar
        if (window.api && window.api.fetchWithAuth) {
            this.loadAppointmentsFromServer().then(() => {
                this.renderAppointments();
                this.checkUpcomingAppointments();
                this.updateStats();
                this.updateProgressBar();
            }).catch(err => {
                console.warn('Falha ao carregar agenda do servidor, usando localStorage.', err);
                this.appointments = this.loadAppointments();
                this.renderAppointments();
                this.checkUpcomingAppointments();
                this.updateStats();
                this.updateProgressBar();
            });
        } else {
            this.appointments = this.loadAppointments();
            this.renderAppointments();
            this.checkUpcomingAppointments();
            this.updateStats();
            this.updateProgressBar();
        }
    }

    // Configurar data mínima para hoje (PERMITIR MESMO DIA)
    setMinDate() {
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];
        document.getElementById('appointment-date').min = todayFormatted;
        
        // Listener para atualizar hora mínima dinamicamente E ADICIONAR 1 DIA
        document.getElementById('appointment-date').addEventListener('change', (e) => {
            const selectedDate = e.target.value; // Formato: YYYY-MM-DD
            const today = new Date();
            const todayFormatted = today.toISOString().split('T')[0];
            
            if (selectedDate === todayFormatted) {
                // Se for hoje, definir hora mínima como hora atual
                const now = new Date();
                const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                                   now.getMinutes().toString().padStart(2, '0');
                document.getElementById('appointment-time').min = currentTime;
            } else {
                // Se for data futura, permitir qualquer horário
                document.getElementById('appointment-time').min = '00:00';
            }
            
            // ADICIONAR 1 DIA APÓS O INPUT DO USUÁRIO
            this.addOneDayAfterInput(selectedDate);
        });
    }

    // NOVO MÉTODO: Adicionar 1 dia após o input do usuário
    addOneDayAfterInput(selectedDate) {
        if (!selectedDate) return;
        
        // Converter a data selecionada para objeto Date
        const date = new Date(selectedDate);
        
        // Adicionar 1 dia
        date.setDate(date.getDate() + 1);
        
        // Formatar a nova data para YYYY-MM-DD
        const nextDay = date.toISOString().split('T')[0];
        
        // Preencher automaticamente o campo com a data do próximo dia
        document.getElementById('appointment-date').value = nextDay;
        
        // Mostrar notificação informando sobre a alteração
        this.showNotification(
            `Data ajustada para: ${this.formatDate(nextDay)}`, 
            'info'
        );
        
        // Atualizar também a validação de hora para a nova data
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];
        
        if (nextDay === todayFormatted) {
            const now = new Date();
            const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                               now.getMinutes().toString().padStart(2, '0');
            document.getElementById('appointment-time').min = currentTime;
        } else {
            document.getElementById('appointment-time').min = '00:00';
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formulário
        document.getElementById('appointment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppointment();
        });

        // Filtros
        document.getElementById('filter-all').addEventListener('click', () => this.setFilter('all'));
        document.getElementById('filter-upcoming').addEventListener('click', () => this.setFilter('upcoming'));
        document.getElementById('filter-past').addEventListener('click', () => this.setFilter('past'));

        // Busca e filtro por tipo
        document.getElementById('search-appointments').addEventListener('input', (e) => {
            this.renderAppointments(e.target.value);
        });

        document.getElementById('filter-type').addEventListener('change', (e) => {
            this.renderAppointments();
        });

        // Cancelar edição
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Confirmação de exclusão
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.deleteAppointment(this.editingId);
        });

        // NOVO: Adicionar 1 dia também no evento de input (em tempo real)
        document.getElementById('appointment-date').addEventListener('input', (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                // Pequeno delay para garantir que o valor foi completamente inserido
                setTimeout(() => {
                    this.addOneDayAfterInput(selectedDate);
                }, 500);
            }
        });
    }

    // Carregar agendamentos do localStorage
    loadAppointments() {
        const stored = localStorage.getItem('healthAgenda');
        return stored ? JSON.parse(stored) : [];
    }

    // Carregar agendamentos do servidor via API
    async loadAppointmentsFromServer() {
        const events = await window.api.fetchWithAuth('/api/agenda');
        // Preservar flags locais (ex.: completed) quando o usuário estiver usando sincronização com servidor.
        // Carregamos o armazenamento local e criamos um mapa id -> completed para mesclar com os dados do servidor.
        const localStored = this.loadAppointments();
        const localCompletedMap = {};
        localStored.forEach(item => {
            if (item && item.id) localCompletedMap[item.id.toString()] = !!item.completed;
        });

        // Mapear eventos do backend para o formato esperado e mesclar o estado 'completed' vindo do localStorage
        this.appointments = events.map(e => {
            const start = e.start || null;
            let date = '';
            let time = '';
            if (start) {
                const d = new Date(start);
                date = d.toISOString().split('T')[0];
                time = d.toTimeString().split(' ')[0].slice(0,5);
            }
            const idStr = e.id.toString();
            return {
                id: e.id.toString(),
                createdAt: e.created_at || new Date().toISOString(),
                type: e.type || '',
                description: e.title || e.details || '',
                doctor: e.doctor || '',
                location: e.location || '',
                date,
                time,
                notes: e.details || '',
                reminder: false,
                // Preservar completed se houver no localStorage, caso contrário usar false
                completed: localCompletedMap[idStr] || false
            };
        });
    }

    // Salvar agendamentos no localStorage
    saveToStorage() {
        localStorage.setItem('healthAgenda', JSON.stringify(this.appointments));
    }

    // Salvar/editar agendamento
    saveAppointment() {
        const formData = this.getFormData();
        
        if (!formData) return;

        // VALIDAÇÃO: Verificar se é um agendamento para data/hora passada
        const appointmentDateTime = new Date(formData.date + ' ' + (formData.time || '00:00'));
        const now = new Date();
        
        if (appointmentDateTime < now && !this.editingId) {
            this.showNotification('Não é possível agendar para uma data/hora que já passou!', 'error');
            return;
        }

        // Usar API se disponível
        if (window.api && window.api.fetchWithAuth) {
            if (this.editingId) {
                // Editar evento no servidor
                window.api.fetchWithAuth(`/api/agenda/${this.editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title: formData.description, details: formData.notes, start: formData.date + (formData.time ? ' ' + formData.time : ''), end: null })
                }).then(updated => {
                    // Atualizar local
                    const index = this.appointments.findIndex(a => a.id === this.editingId);
                    if (index !== -1) this.appointments[index] = { ...this.appointments[index], ...formData };
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.resetForm();
                    this.showNotification('Agendamento atualizado!', 'success');
                }).catch(err => {
                    console.error(err);
                    this.showNotification('Erro ao atualizar agendamento. Tente novamente.', 'error');
                });
            } else {
                // Criar no servidor
                window.api.fetchWithAuth('/api/agenda', {
                    method: 'POST',
                    body: JSON.stringify({ title: formData.description, details: formData.notes, start: formData.date + (formData.time ? ' ' + formData.time : ''), end: null })
                }).then(created => {
                    const newAppointment = {
                        id: created.id.toString(),
                        createdAt: created.created_at || new Date().toISOString(),
                        ...formData
                    };
                    this.appointments.push(newAppointment);
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.resetForm();
                    this.showNotification('Agendamento salvo!', 'success');
                }).catch(err => {
                    console.error(err);
                    this.showNotification('Erro ao salvar no servidor. Salvando localmente.', 'error');
                    // fallback local
                    const newAppointment = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...formData };
                    this.appointments.push(newAppointment);
                    this.saveToStorage();
                    this.renderAppointments();
                });
            }
        } else {
            // fallback local
            if (this.editingId) {
                const index = this.appointments.findIndex(a => a.id === this.editingId);
                if (index !== -1) {
                    this.appointments[index] = { ...this.appointments[index], ...formData };
                }
            } else {
                const newAppointment = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...formData };
                this.appointments.push(newAppointment);
            }
            this.saveToStorage();
            this.renderAppointments();
            this.updateStats();
            this.checkUpcomingAppointments();
            this.updateProgressBar();
            this.resetForm();
            this.showNotification(this.editingId ? 'Agendamento atualizado!' : 'Agendamento salvo!', 'success');
        }
    }

    // Obter dados do formulário
    getFormData() {
        const type = document.getElementById('appointment-type').value;
        const description = document.getElementById('appointment-description').value;
        const doctor = document.getElementById('appointment-doctor').value;
        const location = document.getElementById('appointment-location').value;
        const date = document.getElementById('appointment-date').value;
        const time = document.getElementById('appointment-time').value;
        const notes = document.getElementById('appointment-notes').value;
        const reminder = document.getElementById('appointment-reminder').checked;

        if (!type || !description || !date) {
            this.showNotification('Preencha os campos obrigatórios!', 'error');
            return null;
        }

        return {
            type,
            description,
            doctor,
            location,
            date,
            time,
            notes,
            reminder,
            completed: false
        };
    }

    // Preencher formulário para edição
    editAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        document.getElementById('appointment-type').value = appointment.type;
        document.getElementById('appointment-description').value = appointment.description;
        document.getElementById('appointment-doctor').value = appointment.doctor || '';
        document.getElementById('appointment-location').value = appointment.location || '';
        document.getElementById('appointment-date').value = appointment.date;
        document.getElementById('appointment-time').value = appointment.time || '';
        document.getElementById('appointment-notes').value = appointment.notes || '';
        document.getElementById('appointment-reminder').checked = appointment.reminder;

        this.editingId = id;
        document.getElementById('cancel-edit').style.display = 'block';
        
        // Scroll para o formulário
        document.getElementById('appointment-form').scrollIntoView({ behavior: 'smooth' });
    }

    // Cancelar edição
    cancelEdit() {
        this.editingId = null;
        document.getElementById('cancel-edit').style.display = 'none';
        this.resetForm();
    }

    // Resetar formulário
    resetForm() {
        document.getElementById('appointment-form').reset();
        this.editingId = null;
        document.getElementById('cancel-edit').style.display = 'none';
        
        // Resetar validações de tempo
        document.getElementById('appointment-time').min = '00:00';
    }

    // Excluir agendamento
    deleteAppointment(id) {
        if (window.api && window.api.fetchWithAuth) {
            window.api.fetchWithAuth(`/api/agenda/${id}`, { method: 'DELETE' }).then(() => {
                this.appointments = this.appointments.filter(a => a.id !== id);
                this.renderAppointments();
                this.updateStats();
                this.checkUpcomingAppointments();
                this.updateProgressBar();
                const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
                if (modal) modal.hide();
                this.showNotification('Agendamento excluído!', 'success');
            }).catch(err => {
                console.error(err);
                this.showNotification('Erro ao excluir no servidor. Tente novamente.', 'error');
            });
        } else {
            this.appointments = this.appointments.filter(a => a.id !== id);
            this.saveToStorage();
            this.renderAppointments();
            this.updateStats();
            this.checkUpcomingAppointments();
            this.updateProgressBar();
            const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
            if (modal) modal.hide();
            this.showNotification('Agendamento excluído!', 'success');
        }
    }

    // Marcar como concluído
    toggleCompleted(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (appointment) {
            // Toggle locally first
            appointment.completed = !appointment.completed;

            // If API available, persist to server
            if (window.api && window.api.fetchWithAuth) {
                window.api.fetchWithAuth(`/api/agenda/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ completed: appointment.completed })
                }).then(updated => {
                    // Update local entry with server response (to keep consistency)
                    const idx = this.appointments.findIndex(a => a.id === updated.id.toString());
                    if (idx !== -1) this.appointments[idx] = { ...this.appointments[idx], ...{
                        completed: !!updated.completed,
                        title: updated.title || this.appointments[idx].title,
                        details: updated.details || this.appointments[idx].notes,
                        start: updated.start || this.appointments[idx].date
                    } };
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.updateProgressBar();
                }).catch(err => {
                    console.error('Erro ao atualizar completed no servidor', err);
                    // Fallback: keep change locally
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.updateProgressBar();
                });
            } else {
                // No API: persist locally
                this.saveToStorage();
                this.renderAppointments();
                this.updateStats();
                this.updateProgressBar();
            }
        }
    }

    // Configurar filtro
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Atualizar botões ativos
        document.getElementById('filter-all').classList.toggle('active', filter === 'all');
        document.getElementById('filter-upcoming').classList.toggle('active', filter === 'upcoming');
        document.getElementById('filter-past').classList.toggle('active', filter === 'past');
        
        this.renderAppointments();
    }

    // Renderizar agendamentos
    renderAppointments(searchTerm = '') {
        const container = document.getElementById('appointments-list');
        const noAppointments = document.getElementById('no-appointments');
        
        let filteredAppointments = this.appointments;

        // Aplicar filtro principal
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (this.currentFilter) {
            case 'upcoming':
                filteredAppointments = filteredAppointments.filter(a => {
                    const appointmentDate = new Date(a.date);
                    appointmentDate.setHours(0, 0, 0, 0);
                    return appointmentDate >= today && !a.completed;
                });
                break;
            case 'past':
                filteredAppointments = filteredAppointments.filter(a => {
                    const appointmentDate = new Date(a.date);
                    appointmentDate.setHours(0, 0, 0, 0);
                    return appointmentDate < today || a.completed;
                });
                break;
        }

        // Aplicar filtro por tipo
        const typeFilter = document.getElementById('filter-type').value;
        if (typeFilter) {
            filteredAppointments = filteredAppointments.filter(a => a.type === typeFilter);
        }

        // Aplicar busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredAppointments = filteredAppointments.filter(a => 
                a.description.toLowerCase().includes(term) ||
                (a.doctor && a.doctor.toLowerCase().includes(term)) ||
                (a.location && a.location.toLowerCase().includes(term))
            );
        }

        // Ordenar por data (mais próximos primeiro)
        filteredAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filteredAppointments.length === 0) {
            container.innerHTML = '';
            noAppointments.style.display = 'block';
            return;
        }

        noAppointments.style.display = 'none';
        container.innerHTML = filteredAppointments.map(appointment => this.createAppointmentCard(appointment)).join('');
    }

    // Criar card de agendamento
    createAppointmentCard(appointment) {
        const appointmentDate = new Date(appointment.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        appointmentDate.setHours(0, 0, 0, 0);
        
        const isPast = appointmentDate < today || appointment.completed;
        const isToday = appointmentDate.getTime() === today.getTime();
        const daysUntil = this.getDaysDifference(appointment.date);
        
        const typeIcons = {
            consulta: 'bi-person-heart',
            exame: 'bi-heart-pulse',
            retorno: 'bi-arrow-repeat',
            cirurgia: 'bi-scissors',
            vacina: 'bi-droplet'
        };

        const typeColors = {
            consulta: 'primary',
            exame: 'warning',
            retorno: 'info',
            cirurgia: 'danger',
            vacina: 'success'
        };

        // Determinar cor do card baseado na proximidade
        let urgencyClass = '';
        if (!isPast && !appointment.completed) {
            if (daysUntil <= 1) {
                urgencyClass = 'urgency-high';
            } else if (daysUntil <= 3) {
                urgencyClass = 'urgency-medium';
            } else {
                urgencyClass = 'urgency-low';
            }
        }

        return `
            <div class="neo-card p-3 mb-3 ${isPast || appointment.completed ? 'completed' : ''} ${urgencyClass}">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center">
                        <i class="bi ${typeIcons[appointment.type]} text-${typeColors[appointment.type]} me-2"></i>
                        <h6 class="mb-0">${appointment.description}</h6>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm neo-button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="window.agenda.editAppointment('${appointment.id}')">
                                <i class="bi bi-pencil me-2"></i>Editar
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="window.agenda.toggleCompleted('${appointment.id}')">
                                <i class="bi bi-${appointment.completed ? 'x' : 'check'}-circle me-2"></i>
                                ${appointment.completed ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#confirmModal" onclick="window.agenda.editingId = '${appointment.id}'">
                                <i class="bi bi-trash me-2"></i>Excluir
                            </a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="row small text-muted">
                    <div class="col-md-6">
                        <div class="mb-1">
                            <i class="bi bi-calendar me-1"></i>
                            ${this.formatDate(appointment.date)} ${appointment.time ? `- ${appointment.time}` : ''}
                            ${isToday ? '<span class="badge bg-warning ms-1">Hoje</span>' : ''}
                            ${!isPast && !appointment.completed ? `<span class="badge ${this.getUrgencyBadgeClass(daysUntil)} ms-1">${this.getDaysUntilText(daysUntil)}</span>` : ''}
                        </div>
                        ${appointment.doctor ? `<div class="mb-1"><i class="bi bi-person me-1"></i>${appointment.doctor}</div>` : ''}
                        ${appointment.location ? `<div class="mb-1"><i class="bi bi-geo-alt me-1"></i>${appointment.location}</div>` : ''}
                    </div>
                    <div class="col-md-6">
                        ${appointment.notes ? `<div class="mb-1"><i class="bi bi-chat-text me-1"></i>${appointment.notes}</div>` : ''}
                        ${appointment.reminder ? `<div class="mb-1"><i class="bi bi-bell me-1"></i>Lembrete ativo</div>` : ''}
                        ${appointment.completed ? `<div class="text-success"><i class="bi bi-check-circle me-1"></i>Concluído</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Verificar agendamentos próximos
    checkUpcomingAppointments() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const upcomingAppointments = this.appointments.filter(appointment => {
            const appointmentDate = new Date(appointment.date);
            appointmentDate.setHours(0, 0, 0, 0);
            
            return !appointment.completed && 
                   appointmentDate >= today && 
                   appointmentDate <= nextWeek;
        });

        this.showAlerts(upcomingAppointments);
    }

    // Mostrar alertas
    showAlerts(upcomingAppointments) {
        const alertSection = document.getElementById('alert-section');
        const alertsContainer = document.getElementById('alerts-container');

        if (upcomingAppointments.length === 0) {
            alertSection.style.display = 'none';
            return;
        }

        alertSection.style.display = 'block';
        alertsContainer.innerHTML = upcomingAppointments.map(appointment => {
            const daysUntil = this.getDaysDifference(appointment.date);
            let alertClass = 'alert-warning';
            
            if (daysUntil <= 1) {
                alertClass = 'alert-danger';
            } else if (daysUntil <= 3) {
                alertClass = 'alert-warning';
            } else {
                alertClass = 'alert-info';
            }
            
            return `
                <div class="alert ${alertClass} mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${appointment.description}</strong> - ${this.formatDate(appointment.date)}
                            ${appointment.time ? `às ${appointment.time}` : ''}
                        </div>
                        <small>${this.getDaysUntilText(daysUntil)}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Atualizar estatísticas
    updateStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const total = this.appointments.length;
        const upcoming = this.appointments.filter(a => {
            const appointmentDate = new Date(a.date);
            appointmentDate.setHours(0, 0, 0, 0);
            return !a.completed && appointmentDate >= today && appointmentDate <= nextWeek;
        }).length;
        
        const completed = this.appointments.filter(a => a.completed).length;
        const exams = this.appointments.filter(a => a.type === 'exame').length;

        document.getElementById('total-appointments').textContent = total;
        document.getElementById('upcoming-appointments').textContent = upcoming;
        document.getElementById('completed-appointments').textContent = completed;
        document.getElementById('exams-count').textContent = exams;
    }

    // BARRA DE PROGRESSO SIMPLIFICADA - APENAS UMA
    updateProgressBar() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Encontrar próximo agendamento não concluído
        const upcomingAppointments = this.appointments
            .filter(a => {
                const appointmentDate = new Date(a.date);
                appointmentDate.setHours(0, 0, 0, 0);
                return !a.completed && appointmentDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Se não existir o container, criar um
        if (!document.getElementById('progress-container')) {
            this.createProgressBar();
        }
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressDays = document.getElementById('progress-days');
        
        if (upcomingAppointments.length === 0) {
            if (progressFill) progressFill.style.width = '0%';
            if (progressText) progressText.textContent = 'Nenhum agendamento futuro';
            if (progressDays) progressDays.textContent = '';
            return;
        }
        
        const nextAppointment = upcomingAppointments[0];
        const daysUntil = this.getDaysDifference(nextAppointment.date);
        
        // Calcular progresso (0-100%) baseado na proximidade (máximo 30 dias)
        const maxDays = 30;
        const progress = Math.max(0, Math.min(100, ((maxDays - daysUntil) / maxDays) * 100));
        
        // Atualizar display
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `Próximo: ${nextAppointment.description}`;
        if (progressDays) progressDays.textContent = daysUntil === 0 ? 'Hoje' : `${daysUntil} dias`;
        
        // Atualizar cor baseada na urgência
        if (progressFill) {
            if (daysUntil <= 1) {
                progressFill.style.background = 'linear-gradient(45deg, #dc3545, #e4606d)';
            } else if (daysUntil <= 3) {
                progressFill.style.background = 'linear-gradient(45deg, #ffc107, #ffd54f)';
            } else if (daysUntil <= 7) {
                progressFill.style.background = 'linear-gradient(45deg, #17a2b8, #39c0d3)';
            } else {
                progressFill.style.background = 'linear-gradient(45deg, #28a745, #48c78e)';
            }
        }
    }

    // Criar barra de progresso no DOM
    createProgressBar() {
        const header = document.querySelector('header.text-center');
        if (!header) return;
        
        const progressHtml = `
            <div class="row justify-content-center mb-4">
                <div class="col-lg-10">
                    <div class="neo-card p-4" id="progress-container">
                        <h4 class="h6 mb-3 text-center">
                            <i class="bi bi-clock text-primary me-2"></i>Progresso para Próximo Agendamento
                        </h4>
                        <div class="progress-bar mb-3">
                            <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small id="progress-text" class="text-muted">Nenhum agendamento futuro</small>
                            <small id="progress-days" class="text-muted fw-bold"></small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        header.insertAdjacentHTML('afterend', progressHtml);
    }

    // Utilitários
    formatDate(dateString) {
        const date = new Date(dateString);
        // CORREÇÃO: Usar método correto para formatar data sem problemas de timezone
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Calcular diferença em dias (CORRIGIDO)
    getDaysDifference(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        // CORREÇÃO: Calcular diferença correta em dias
        const diffTime = targetDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    getDaysUntilText(daysUntil) {
        if (daysUntil === 0) return 'Hoje';
        if (daysUntil === 1) return 'Amanhã';
        if (daysUntil > 1) return `Em ${daysUntil} dias`;
        return 'Passado';
    }

    getUrgencyBadgeClass(daysUntil) {
        if (daysUntil <= 1) return 'bg-danger';
        if (daysUntil <= 3) return 'bg-warning';
        return 'bg-info';
    }

    showNotification(message, type = 'info') {
        // Criar notificação simples
        const alert = document.createElement('div');
        alert.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.querySelector('.container').insertBefore(alert, document.querySelector('.container').firstChild);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Integração com o tema escuro
function setupThemeIntegration() {
    // Verificar se há um tema salvo e aplicar
    const savedTheme = localStorage.getItem('healthTechTheme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Escutar mudanças de tema
    window.addEventListener('themeChanged', (event) => {
        // Recriar a barra de progresso para aplicar novas cores
        if (window.agenda) {
            setTimeout(() => {
                window.agenda.updateProgressBar();
            }, 100);
        }
    });
}

// Inicializar a agenda quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.agenda = new HealthAgenda();
    setupThemeIntegration();
});