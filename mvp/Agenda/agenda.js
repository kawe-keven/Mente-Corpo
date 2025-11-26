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
        
        // Criar a barra de progresso imediatamente
        this.createProgressBar();

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

    // Configurar data mínima para hoje
    setMinDate() {
        const today = new Date();
        const todayFormatted = today.toISOString().split('T')[0];
        document.getElementById('appointment-date').min = todayFormatted;
        
        // Listener para atualizar hora mínima dinamicamente
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
        });
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
        console.log('💾 Salvando agendamento...');
        const formData = this.getFormData();
        
        if (!formData) {
            console.log('❌ FormData inválido');
            return;
        }

        console.log('📋 Dados do formulário:', formData);

        // VALIDAÇÃO: Verificar se é um agendamento para data/hora passada
        const appointmentDateTime = new Date(formData.date + ' ' + (formData.time || '00:00'));
        const now = new Date();
        
        if (appointmentDateTime < now && !this.editingId) {
            console.log('❌ Data/hora no passado');
            this.showNotification('Não é possível agendar para uma data/hora que já passou!', 'error');
            return;
        }

        // Usar API se disponível
        if (window.api && window.api.fetchWithAuth) {
            if (this.editingId) {
                console.log('✏️ Editando agendamento:', this.editingId);
                // Editar evento no servidor
                window.api.fetchWithAuth(`/api/agenda/${this.editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title: formData.description, details: formData.notes, start: formData.date + (formData.time ? ' ' + formData.time : ''), end: null })
                }).then(updated => {
                    console.log('✅ Agendamento atualizado no servidor:', updated);
                    // Atualizar local
                    const index = this.appointments.findIndex(a => a.id === this.editingId || a.id.toString() === this.editingId.toString());
                    if (index !== -1) this.appointments[index] = { ...this.appointments[index], ...formData };
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.resetForm();
                    this.showNotification('Agendamento atualizado!', 'success');
                }).catch(err => {
                    console.error('❌ Erro ao atualizar:', err);
                    this.showNotification('Erro ao atualizar agendamento. Tente novamente.', 'error');
                });
            } else {
                console.log('➕ Criando novo agendamento');
                // Criar no servidor
                window.api.fetchWithAuth('/api/agenda', {
                    method: 'POST',
                    body: JSON.stringify({ title: formData.description, details: formData.notes, start: formData.date + (formData.time ? ' ' + formData.time : ''), end: null })
                }).then(created => {
                    console.log('✅ Agendamento criado no servidor:', created);
                    const newAppointment = {
                        id: created.id.toString(),
                        createdAt: created.created_at || new Date().toISOString(),
                        ...formData
                    };
                    this.appointments.push(newAppointment);
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.resetForm();
                    this.showNotification('Agendamento salvo!', 'success');
                    console.log('✅ Agendamento adicionado à lista local');
                }).catch(err => {
                    console.error('❌ Erro ao criar no servidor:', err);
                    this.showNotification('Erro ao salvar no servidor. Salvando localmente.', 'warning');
                    // fallback local
                    const newAppointment = { id: Date.now().toString(), createdAt: new Date().toISOString(), ...formData };
                    this.appointments.push(newAppointment);
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.resetForm();
                    this.showNotification('Agendamento salvo localmente!', 'success');
                });
            }
        } else {
            console.log('💾 Salvando localmente (API não disponível)');
            // fallback local
            if (this.editingId) {
                const index = this.appointments.findIndex(a => a.id === this.editingId || a.id.toString() === this.editingId.toString());
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
            console.log('✅ Agendamento salvo localmente');
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
        console.log('🗑️ Excluindo agendamento:', id);
        console.log('🔍 Tipo do ID:', typeof id);
        
        // Fechar modal primeiro
        const modalElement = document.getElementById('confirmModal');
        if (modalElement) {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        
        if (window.api && window.api.fetchWithAuth) {
            console.log('📡 Enviando requisição DELETE para:', `/api/agenda/${id}`);
            window.api.fetchWithAuth(`/api/agenda/${id}`, { method: 'DELETE' })
                .then(response => {
                    console.log('✅ Resposta do servidor:', response);
                    this.appointments = this.appointments.filter(a => a.id !== id && a.id.toString() !== id.toString());
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.showNotification('Agendamento excluído!', 'success');
                    console.log('✅ Agendamento excluído com sucesso');
                })
                .catch(err => {
                    console.error('❌ Erro completo:', err);
                    console.error('❌ Mensagem:', err.message);
                    console.error('❌ Stack:', err.stack);
                    
                    // Tentar excluir localmente como fallback
                    this.appointments = this.appointments.filter(a => a.id !== id && a.id.toString() !== id.toString());
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.showNotification('Agendamento excluído localmente (erro no servidor)', 'warning');
                });
        } else {
            this.appointments = this.appointments.filter(a => a.id !== id && a.id.toString() !== id.toString());
            this.saveToStorage();
            this.renderAppointments();
            this.updateStats();
            this.checkUpcomingAppointments();
            this.updateProgressBar();
            this.showNotification('Agendamento excluído!', 'success');
            console.log('✅ Agendamento excluído localmente');
        }
    }

    // Marcar como concluído (agora exclui automaticamente)
    toggleCompleted(id) {
        const appointment = this.appointments.find(a => a.id === id || a.id.toString() === id.toString());
        if (!appointment) {
            console.error('❌ Agendamento não encontrado:', id);
            return;
        }
        
        console.log('✅ Marcando como concluído e excluindo:', id);
        console.log('🔍 Tipo do ID:', typeof id);
        
        // Agora ao marcar como concluído, excluímos automaticamente
        if (window.api && window.api.fetchWithAuth) {
            console.log('📡 Enviando requisição DELETE para:', `/api/agenda/${id}`);
            // Excluir do servidor
            window.api.fetchWithAuth(`/api/agenda/${id}`, { method: 'DELETE' })
                .then(response => {
                    console.log('✅ Resposta do servidor:', response);
                    this.appointments = this.appointments.filter(a => a.id !== id && a.id.toString() !== id.toString());
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.showNotification('Agendamento concluído e removido!', 'success');
                    console.log('✅ Agendamento concluído e excluído do servidor');
                })
                .catch(err => {
                    console.error('❌ Erro completo ao excluir do servidor:', err);
                    console.error('❌ Mensagem:', err.message);
                    // Fallback: excluir localmente
                    this.appointments = this.appointments.filter(a => a.id !== id && a.id.toString() !== id.toString());
                    this.saveToStorage();
                    this.renderAppointments();
                    this.updateStats();
                    this.checkUpcomingAppointments();
                    this.updateProgressBar();
                    this.showNotification('Agendamento concluído e removido localmente!', 'warning');
                });
        } else {
            // Excluir localmente
            this.appointments = this.appointments.filter(a => a.id !== id && a.id.toString() !== id.toString());
            this.saveToStorage();
            this.renderAppointments();
            this.updateStats();
            this.checkUpcomingAppointments();
            this.updateProgressBar();
            this.showNotification('Agendamento concluído e removido!', 'success');
            console.log('✅ Agendamento concluído e excluído localmente');
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
                    const appointmentDate = this.parseLocalDate(a.date);
                    appointmentDate.setHours(0, 0, 0, 0);
                    return appointmentDate >= today && !a.completed;
                });
                break;
            case 'past':
                filteredAppointments = filteredAppointments.filter(a => {
                    const appointmentDate = this.parseLocalDate(a.date);
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
        filteredAppointments.sort((a, b) => this.parseLocalDate(a.date) - this.parseLocalDate(b.date));

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
        const appointmentDate = this.parseLocalDate(appointment.date);
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
                            <li><a class="dropdown-item text-success" href="#" onclick="window.agenda.toggleCompleted('${appointment.id}'); return false;">
                                <i class="bi bi-check-circle me-2"></i>Concluir e Remover
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" data-bs-toggle="modal" data-bs-target="#confirmModal" onclick="window.agenda.editingId = '${appointment.id}'; return false;">
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
            const appointmentDate = this.parseLocalDate(appointment.date);
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
            const appointmentDate = this.parseLocalDate(a.date);
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
        console.log('🔄 Atualizando barra de progresso...');
        console.log('📊 Total de agendamentos:', this.appointments.length);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Encontrar próximo agendamento não concluído
        const upcomingAppointments = this.appointments
            .filter(a => {
                const appointmentDate = this.parseLocalDate(a.date);
                appointmentDate.setHours(0, 0, 0, 0);
                return !a.completed && appointmentDate >= today;
            })
            .sort((a, b) => this.parseLocalDate(a.date) - this.parseLocalDate(b.date));
        
        console.log('📅 Agendamentos futuros:', upcomingAppointments.length);
        
        // Se não existir o container, criar um
        if (!document.getElementById('progress-container')) {
            console.log('⚠️ Container não encontrado, criando...');
            this.createProgressBar();
        }
        
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressDays = document.getElementById('progress-days');
        const progressContainer = document.getElementById('progress-container');
        
        if (!progressFill || !progressText || !progressDays) {
            console.error('❌ Elementos da barra de progresso não encontrados!');
            console.log('progressFill:', progressFill);
            console.log('progressText:', progressText);
            console.log('progressDays:', progressDays);
            return;
        }
        
        // Garantir que o container esteja visível
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        
        if (upcomingAppointments.length === 0) {
            console.log('ℹ️ Nenhum agendamento futuro');
            progressFill.style.width = '0%';
            progressFill.style.background = 'linear-gradient(45deg, #28a745, #48c78e)';
            progressText.textContent = 'Nenhum agendamento futuro';
            progressDays.textContent = '';
            return;
        }
        
        const nextAppointment = upcomingAppointments[0];
        const daysUntil = this.getDaysDifference(nextAppointment.date);
        
        console.log('🎯 Próximo agendamento:', nextAppointment.description);
        console.log('📆 Dias até o agendamento:', daysUntil);
        
        // Calcular progresso (0-100%) baseado na proximidade (máximo 30 dias)
        const maxDays = 30;
        const progress = Math.max(0, Math.min(100, ((maxDays - daysUntil) / maxDays) * 100));
        
        console.log('📈 Progresso calculado:', progress + '%');
        
        // Atualizar cor baseada na urgência ANTES de definir a largura
        let bgColor = 'linear-gradient(45deg, #28a745, #48c78e)';
        if (daysUntil <= 1) {
            bgColor = 'linear-gradient(45deg, #dc3545, #e4606d)';
        } else if (daysUntil <= 3) {
            bgColor = 'linear-gradient(45deg, #ffc107, #ffd54f)';
        } else if (daysUntil <= 7) {
            bgColor = 'linear-gradient(45deg, #17a2b8, #39c0d3)';
        }
        
        // Atualizar display com animação
        progressFill.style.background = bgColor;
        // Forçar reflow para garantir animação
        void progressFill.offsetWidth;
        progressFill.style.width = `${progress}%`;
        
        progressText.textContent = `Próximo: ${nextAppointment.description}`;
        
        if (daysUntil === 0) {
            progressDays.textContent = 'Hoje!';
            progressDays.style.color = '#dc3545';
            progressDays.style.fontWeight = 'bold';
        } else if (daysUntil === 1) {
            progressDays.textContent = 'Amanhã';
            progressDays.style.color = '#ffc107';
            progressDays.style.fontWeight = 'bold';
        } else {
            progressDays.textContent = `${daysUntil} dias`;
            progressDays.style.color = '';
            progressDays.style.fontWeight = 'bold';
        }
        
        console.log('✅ Barra de progresso atualizada com sucesso!');
    }

    // Criar barra de progresso no DOM
    createProgressBar() {
        console.log('🔨 Tentando criar barra de progresso...');
        
        // Verificar se já existe para evitar duplicação
        if (document.getElementById('progress-container')) {
            console.log('ℹ️ Barra de progresso já existe');
            return;
        }
        
        const header = document.querySelector('header.text-center');
        if (!header) {
            console.error('❌ Header não encontrado!');
            return;
        }
        
        console.log('✅ Header encontrado, criando barra...');
        
        const progressHtml = `
            <div class="row justify-content-center mb-4" style="margin-top: 2rem;">
                <div class="col-lg-10">
                    <div class="neo-card p-4" id="progress-container" style="display: block;">
                        <h4 class="h6 mb-3 text-center">
                            <i class="bi bi-clock text-primary me-2"></i>Progresso para Próximo Agendamento
                        </h4>
                        <div class="progress-bar mb-3">
                            <div class="progress-fill" id="progress-fill" style="width: 0%; background: linear-gradient(45deg, #28a745, #48c78e); transition: width 0.5s ease;"></div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center">
                            <small id="progress-text" class="text-muted">Carregando...</small>
                            <small id="progress-days" class="text-muted fw-bold"></small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        header.insertAdjacentHTML('afterend', progressHtml);
        console.log('✅ Barra de progresso criada com sucesso!');
        
        // Verificar se foi criada
        const container = document.getElementById('progress-container');
        console.log('📦 Container após criação:', container ? 'Encontrado' : 'Não encontrado');
    }

    // Utilitários
    formatDate(dateString) {
        // Corrigir problema de timezone: usar split direto da string YYYY-MM-DD
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Criar objeto Date local sem problemas de timezone UTC
    parseLocalDate(dateString) {
        // dateString no formato YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        // Mês em JavaScript é 0-indexed (0 = Janeiro, 11 = Dezembro)
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    // Calcular diferença em dias (CORRIGIDO)
    getDaysDifference(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Criar date local sem problemas de timezone UTC
        const targetDate = this.parseLocalDate(dateString);
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