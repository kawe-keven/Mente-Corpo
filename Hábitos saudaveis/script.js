// Dados dos hábitos com metas, unidades e cores
const habits = [
    { 
        id: 1, 
        name: "Beber Água", 
        points: 10, 
        icon: "💧", 
        completed: false,
        type: "quantity",
        unit: "ml",
        goal: 2000,
        current: 0,
        pointsPerUnit: 0.005,
        increment: 200, // Incremento de 200ml
        color: "#007bff", // Azul para água
        progressColor: "#007bff"
    },
    { 
        id: 2, 
        name: "Caminhar", 
        points: 15, 
        icon: "🚶", 
        completed: false,
        type: "quantity",
        unit: "passos",
        goal: 10000,
        current: 0,
        pointsPerUnit: 0.0015,
        increment: 1000, // Incremento de 1000 passos
        color: "#28a745", // Verde para caminhada
        progressColor: "#28a745"
    },
    { 
        id: 3, 
        name: "Dormir Bem", 
        points: 20, 
        icon: "😴", 
        completed: false,
        type: "quantity",
        unit: "horas",
        goal: 8,
        current: 0,
        pointsPerUnit: 2.5,
        increment: 1,
        color: "#6f42c1", // Roxo para dormir
        progressColor: "#6f42c1"
    },
    { 
        id: 4, 
        name: "Meditar", 
        points: 10, 
        icon: "🧘", 
        completed: false,
        type: "quantity",
        unit: "minutos",
        goal: 20,
        current: 0,
        pointsPerUnit: 0.5,
        increment: 5,
        color: "#17a2b8", // Azul claro para meditar
        progressColor: "#17a2b8"
    },
    { 
        id: 5, 
        name: "Alimentação Saudável", 
        points: 15, 
        icon: "🥗", 
        completed: false,
        type: "quantity",
        unit: "refeições",
        goal: 3,
        current: 0,
        pointsPerUnit: 5,
        increment: 1,
        color: "#20c997", // Verde água para alimentação
        progressColor: "#20c997"
    },
    { 
        id: 6, 
        name: "Exercitar-se", 
        points: 20, 
        icon: "💪", 
        completed: false,
        type: "quantity",
        unit: "minutos",
        goal: 30,
        current: 0,
        pointsPerUnit: 0.67,
        increment: 5,
        color: "#dc3545", // Vermelho para exercício
        progressColor: "#dc3545"
    },
    { 
        id: 7, 
        name: "Ler", 
        points: 10, 
        icon: "📚", 
        completed: false,
        type: "quantity",
        unit: "minutos",
        goal: 30,
        current: 0,
        pointsPerUnit: 0.33,
        increment: 5,
        color: "#fd7e14", // Laranja para ler
        progressColor: "#fd7e14"
    },
    { 
        id: 8, 
        name: "Sem Açúcar", 
        points: 15, 
        icon: "🚫🍬", 
        completed: false,
        type: "boolean",
        unit: "dia",
        goal: 1,
        current: 0,
        increment: 1,
        color: "#6c757d", // Cinza para sem açúcar
        progressColor: "#6c757d"
    }
];

// Elementos DOM
const habitsContainer = document.getElementById('habits-container');
const totalPointsElement = document.getElementById('total-points');
const progressFillElement = document.getElementById('progress-fill');
const completedHabitsElement = document.getElementById('completed-habits');
const weeklyStreakElement = document.getElementById('weekly-streak');
const totalCompletedElement = document.getElementById('total-completed');
const resetButton = document.getElementById('reset-button');
const resetCountdownElement = document.getElementById('reset-countdown');
const weeklySummaryBtn = document.getElementById('weekly-summary-btn');

// Carregar dados do localStorage
let userData = JSON.parse(localStorage.getItem('healthyHabitsData')) || {
    points: 0,
    completedHabits: [],
    weeklyStreak: 0,
    totalCompleted: 0,
    lastReset: new Date().toDateString(),
    weekStart: new Date().toDateString(),
    history: [],
    currentWeekData: {
        points: 0,
        habitsCompleted: {},
        days: {},
        habitQuantities: {}
    }
};

// Inicializar a página
function init() {
    renderHabits();
    updateStats();
    updateResetCountdown();
    updateWeeklySummary();
    updateHistory();
    
    // Verificar se precisa resetar (nova semana)
    checkForReset();
}

// Renderizar os hábitos
function renderHabits() {
    habitsContainer.innerHTML = '';
    
    habits.forEach(habit => {
        const isCompleted = userData.completedHabits.includes(habit.id);
        const currentQuantity = getHabitCurrentQuantity(habit.id);
        const progress = (currentQuantity / habit.goal) * 100;
        const pointsEarned = calculatePointsFromQuantity(habit, currentQuantity);
        
        const habitCard = document.createElement('div');
        habitCard.className = 'col-sm-6 col-md-4 col-lg-3 mb-3';
        
        if (habit.type === "boolean") {
            // Hábitos booleanos (sim/não)
            habitCard.innerHTML = `
                <div class="habit-card neo-card ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-icon text-center">${habit.icon}</div>
                    <div class="habit-name text-center fw-bold mb-2">${habit.name}</div>
                    <div class="habit-points text-center text-muted">${habit.points} pontos</div>
                    <div class="text-center mt-3">
                        <button class="btn ${isCompleted ? 'btn-success' : 'btn-outline-success'} btn-sm" 
                                onclick="toggleBooleanHabit(${habit.id})">
                            ${isCompleted ? '✅ Concluído' : 'Marcar'}
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Hábitos com quantidade - mostrar incremento específico
            const incrementText = habit.increment > 1 ? 
                `(incremento: ${habit.increment} ${habit.unit})` : 
                '';
            
            habitCard.innerHTML = `
                <div class="habit-card neo-card ${progress >= 100 ? 'completed' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-icon text-center">${habit.icon}</div>
                    <div class="habit-name text-center fw-bold mb-2">${habit.name}</div>
                    <div class="habit-points text-center text-muted">
                        ${Math.round(pointsEarned)}/${habit.points} pontos
                    </div>
                    
                    <div class="habit-details text-center mt-2">
                        <div>${currentQuantity} / ${habit.goal} ${habit.unit}</div>
                        <div class="progress habit-progress">
                            <div class="progress-bar" style="width: ${Math.min(progress, 100)}%; background-color: ${habit.progressColor}"></div>
                        </div>
                    </div>
                    
                    <div class="quantity-controls">
                        <button class="btn-quantity" onclick="updateHabitQuantity(${habit.id}, -1)" 
                                title="Diminuir ${habit.increment} ${habit.unit}">
                            <i class="bi bi-dash"></i>
                        </button>
                        <input type="number" 
                               class="quantity-input" 
                               value="${currentQuantity}" 
                               min="0" 
                               max="${habit.goal}"
                               step="${habit.increment}"
                               onchange="updateHabitQuantity(${habit.id}, 0, this.value)"
                               oninput="this.value = Math.max(0, Math.min(${habit.goal}, this.value))">
                        <button class="btn-quantity" onclick="updateHabitQuantity(${habit.id}, 1)"
                                title="Aumentar ${habit.increment} ${habit.unit}">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    
                    <div class="text-center small mt-2 text-muted">
                        Meta: ${habit.goal} ${habit.unit} ${incrementText}
                    </div>
                </div>
            `;
        }
        
        habitsContainer.appendChild(habitCard);
    });
}

// Obter quantidade atual do hábito
function getHabitCurrentQuantity(habitId) {
    const today = new Date().toDateString();
    if (userData.currentWeekData.habitQuantities[today] && 
        userData.currentWeekData.habitQuantities[today][habitId] !== undefined) {
        return userData.currentWeekData.habitQuantities[today][habitId];
    }
    return 0;
}

// Calcular pontos baseado na quantidade
function calculatePointsFromQuantity(habit, quantity) {
    if (habit.type === "boolean") {
        return quantity >= habit.goal ? habit.points : 0;
    }
    return Math.min(habit.points, quantity * habit.pointsPerUnit);
}

// Atualizar quantidade do hábito - COM LIMITES
function updateHabitQuantity(habitId, change, directValue = null) {
    const habit = habits.find(h => h.id === habitId);
    const today = new Date().toDateString();
    
    // Inicializar estrutura de dados se não existir
    if (!userData.currentWeekData.habitQuantities[today]) {
        userData.currentWeekData.habitQuantities[today] = {};
    }
    
    // Obter valor atual
    let currentValue = getHabitCurrentQuantity(habitId);
    
    // Atualizar valor
    if (directValue !== null) {
        // Para entrada direta, arredondar para o múltiplo mais próximo do incremento
        let newValue = parseInt(directValue) || 0;
        if (habit.increment > 1) {
            newValue = Math.round(newValue / habit.increment) * habit.increment;
        }
        currentValue = Math.max(0, newValue);
    } else {
        // Para incremento/decremento, usar o valor do incremento específico
        const incrementValue = change * habit.increment;
        currentValue = Math.max(0, currentValue + incrementValue);
    }
    
    // APLICAR LIMITES MÁXIMOS ESPECÍFICOS PARA CADA HÁBITO
    switch(habitId) {
        case 1: // Beber Água - máximo 2000ml
            currentValue = Math.min(currentValue, 2000);
            break;
        case 2: // Caminhar - máximo 10000 passos
            currentValue = Math.min(currentValue, 10000);
            break;
        case 3: // Dormir Bem - máximo 8 horas
            currentValue = Math.min(currentValue, 8);
            break;
        case 4: // Meditar - máximo 20 minutos
            currentValue = Math.min(currentValue, 20);
            break;
        case 5: // Alimentação Saudável - máximo 3 refeições
            currentValue = Math.min(currentValue, 3);
            break;
        case 6: // Exercitar-se - máximo 30 minutos
            currentValue = Math.min(currentValue, 30);
            break;
        case 7: // Ler - máximo 30 minutos
            currentValue = Math.min(currentValue, 30);
            break;
        case 8: // Sem Açúcar - máximo 1 (já é booleano)
            currentValue = Math.min(currentValue, 1);
            break;
    }
    
    // Salvar novo valor
    userData.currentWeekData.habitQuantities[today][habitId] = currentValue;
    
    // Calcular pontos anteriores
    const previousPoints = calculatePointsFromQuantity(habit, currentValue - (change * habit.increment));
    const newPoints = calculatePointsFromQuantity(habit, currentValue);
    const pointsDifference = newPoints - previousPoints;
    
    // Atualizar pontos totais
    userData.points += pointsDifference;
    
    // Verificar se o hábito foi completado
    const wasCompleted = userData.completedHabits.includes(habitId);
    const isNowCompleted = currentValue >= habit.goal;
    
    if (isNowCompleted && !wasCompleted) {
        userData.completedHabits.push(habitId);
        userData.totalCompleted += 1;
    } else if (!isNowCompleted && wasCompleted) {
        const index = userData.completedHabits.indexOf(habitId);
        if (index > -1) {
            userData.completedHabits.splice(index, 1);
            userData.totalCompleted -= 1;
        }
    }
    
    // Atualizar dados semanais
    updateWeeklyData(habitId, pointsDifference);
    
    // Salvar e atualizar interface
    saveData();
    renderHabits();
    updateStats();
    updateWeeklySummary();
}

// Alternar hábitos booleanos
function toggleBooleanHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    const isCompleted = userData.completedHabits.includes(habitId);
    
    if (isCompleted) {
        // Remover
        const index = userData.completedHabits.indexOf(habitId);
        userData.completedHabits.splice(index, 1);
        userData.points -= habit.points;
        userData.totalCompleted -= 1;
        updateWeeklyData(habitId, -habit.points);
    } else {
        // Adicionar
        userData.completedHabits.push(habitId);
        userData.points += habit.points;
        userData.totalCompleted += 1;
        updateWeeklyData(habitId, habit.points);
    }
    
    // Atualizar quantidade para 1 ou 0
    const today = new Date().toDateString();
    if (!userData.currentWeekData.habitQuantities[today]) {
        userData.currentWeekData.habitQuantities[today] = {};
    }
    userData.currentWeekData.habitQuantities[today][habitId] = isCompleted ? 0 : 1;
    
    saveData();
    renderHabits();
    updateStats();
    updateWeeklySummary();
}

// Atualizar dados semanais
function updateWeeklyData(habitId, pointsDifference) {
    const today = new Date().toDateString();
    
    // Inicializar dados do dia se não existirem
    if (!userData.currentWeekData.days[today]) {
        userData.currentWeekData.days[today] = {
            points: 0,
            habitsCompleted: []
        };
    }
    
    // Atualizar pontos do dia
    userData.currentWeekData.days[today].points += pointsDifference;
    userData.currentWeekData.points += pointsDifference;
    
    // Atualizar hábitos completos do dia
    const habit = habits.find(h => h.id === habitId);
    const currentQuantity = getHabitCurrentQuantity(habitId);
    const isCompleted = currentQuantity >= habit.goal;
    
    if (isCompleted && !userData.currentWeekData.days[today].habitsCompleted.includes(habitId)) {
        userData.currentWeekData.days[today].habitsCompleted.push(habitId);
    } else if (!isCompleted) {
        const index = userData.currentWeekData.days[today].habitsCompleted.indexOf(habitId);
        if (index > -1) {
            userData.currentWeekData.days[today].habitsCompleted.splice(index, 1);
        }
    }
}

// Atualizar estatísticas na tela
function updateStats() {
    totalPointsElement.textContent = `${Math.round(userData.points)} pontos`;
    
    const completedCount = userData.completedHabits.length;
    completedHabitsElement.textContent = completedCount;
    
    // Calcular progresso (máximo de pontos possíveis)
    const maxPoints = habits.reduce((total, habit) => total + habit.points, 0);
    const progressPercentage = maxPoints > 0 ? (userData.points / maxPoints) * 100 : 0;
    progressFillElement.style.width = `${progressPercentage}%`;
    
    weeklyStreakElement.textContent = userData.weeklyStreak;
    totalCompletedElement.textContent = userData.totalCompleted;
}

// Atualizar contagem regressiva para reset
function updateResetCountdown() {
    const lastReset = new Date(userData.lastReset);
    const nextReset = new Date(lastReset);
    nextReset.setDate(nextReset.getDate() + 7);
    
    const today = new Date();
    const diffTime = nextReset - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    resetCountdownElement.textContent = `Próximo reset em: ${diffDays} dia${diffDays !== 1 ? 's' : ''}`;
    
    if (diffDays <= 1) {
        resetCountdownElement.parentElement.className = "alert alert-warning d-flex align-items-center";
    }
}

// Atualizar sequência de semanas
function updateStreak() {
    // Implementação simplificada - em app real verificaria semana anterior
    if (userData.completedHabits.length === habits.length) {
        userData.weeklyStreak += 1;
    }
}

// Verificar se precisa resetar (nova semana)
function checkForReset() {
    const today = new Date();
    const lastReset = new Date(userData.lastReset);
    
    // Calcular a diferença em dias
    const diffTime = Math.abs(today - lastReset);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 7) {
        // Salvar dados da semana no histórico antes de resetar
        saveWeekToHistory();
        resetHabits();
    }
}

// Salvar semana no histórico
function saveWeekToHistory() {
    const weekData = {
        date: userData.weekStart,
        points: userData.currentWeekData.points,
        habitsCompleted: {...userData.currentWeekData.habitsCompleted},
        days: {...userData.currentWeekData.days},
        habitQuantities: {...userData.currentWeekData.habitQuantities},
        streak: userData.weeklyStreak
    };
    
    userData.history.unshift(weekData);
    
    // Manter apenas as últimas 8 semanas no histórico
    if (userData.history.length > 8) {
        userData.history = userData.history.slice(0, 8);
    }
}

// Resetar hábitos (início de nova semana)
function resetHabits() {
    // Salvar semana atual no histórico
    saveWeekToHistory();
    
    // Resetar dados
    userData.completedHabits = [];
    userData.points = 0;
    userData.lastReset = new Date().toDateString();
    userData.weekStart = new Date().toDateString();
    userData.currentWeekData = {
        points: 0,
        habitsCompleted: {},
        days: {},
        habitQuantities: {}
    };
    
    saveData();
    renderHabits();
    updateStats();
    updateResetCountdown();
    updateWeeklySummary();
    updateHistory();
}

// Atualizar resumo semanal - COM BARRAS DE PROGRESSO COLORIDAS
function updateWeeklySummary() {
    // Pontuação da semana
    document.getElementById('weekly-points').textContent = Math.round(userData.currentWeekData.points);
    
    // Progresso semanal
    const maxWeeklyPoints = habits.reduce((total, habit) => total + habit.points, 0);
    const weeklyProgress = maxWeeklyPoints > 0 ? (userData.currentWeekData.points / maxWeeklyPoints) * 100 : 0;
    document.getElementById('weekly-progress-bar').style.width = `${weeklyProgress}%`;
    document.getElementById('weekly-progress-text').textContent = `${Math.round(weeklyProgress)}% completo`;
    
    // Desempenho por hábito - BARRAS DE PROGRESSO COLORIDAS
    const performanceContainer = document.getElementById('weekly-habits-performance');
    performanceContainer.innerHTML = '';
    
    habits.forEach(habit => {
        const today = new Date().toDateString();
        const currentQuantity = getHabitCurrentQuantity(habit.id);
        const progress = (currentQuantity / habit.goal) * 100;
        const pointsEarned = calculatePointsFromQuantity(habit, currentQuantity);
        
        const habitPerformance = document.createElement('div');
        habitPerformance.className = 'mb-3';
        
        habitPerformance.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span>${habit.icon} ${habit.name}</span>
                <small class="text-muted">${Math.round(pointsEarned)}/${habit.points} pontos</small>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small>${Math.round(currentQuantity)}/${habit.goal} ${habit.unit}</small>
                <small class="text-muted">${Math.round(progress)}%</small>
            </div>
            <div class="progress week-progress mb-2">
                <div class="progress-bar" style="width: ${Math.min(progress, 100)}%; background-color: ${habit.progressColor}"></div>
            </div>
        `;
        
        performanceContainer.appendChild(habitPerformance);
    });
    
    // Conquistas
    updateAchievements();
    
    // Atualizar modal de resumo
    updateModalSummary();
}

// Atualizar conquistas
function updateAchievements() {
    const achievementsContainer = document.getElementById('weekly-achievements');
    achievementsContainer.innerHTML = '';
    
    const achievements = [];
    const today = new Date().toDateString();
    
    // Verificar conquistas
    if (userData.currentWeekData.points >= 500) {
        achievements.push('🏆 Pontuação Máxima - 500+ pontos!');
    }
    
    if (userData.weeklyStreak >= 2) {
        achievements.push(`🔥 Sequência de ${userData.weeklyStreak} semanas!`);
    }
    
    // Hábitos com meta atingida hoje
    const todaysCompletedHabits = habits.filter(habit => {
        const quantity = getHabitCurrentQuantity(habit.id);
        return quantity >= habit.goal;
    });
    
    if (todaysCompletedHabits.length === habits.length) {
        achievements.push('🎯 Todos os hábitos completos hoje!');
    }
    
    // Hábitos com excelente desempenho
    habits.forEach(habit => {
        const quantity = getHabitCurrentQuantity(habit.id);
        if (quantity > habit.goal * 1.5) {
            achievements.push(`⭐ ${habit.name} - Excelente!`);
        }
    });
    
    if (achievements.length === 0) {
        achievements.push('💪 Continue assim! Cada dia conta!');
    }
    
    achievements.forEach(achievement => {
        const achievementElement = document.createElement('div');
        achievementElement.className = 'small mt-1';
        achievementElement.textContent = achievement;
        achievementsContainer.appendChild(achievementElement);
    });
}

// Atualizar modal de resumo
function updateModalSummary() {
    const modalContent = document.getElementById('modal-weekly-content');
    const today = new Date();
    const weekStart = new Date(userData.weekStart);
    
    modalContent.innerHTML = `
        <div class="text-center mb-4">
            <h4>Resumo da Semana</h4>
            <p class="text-muted">${weekStart.toLocaleDateString()} - ${today.toLocaleDateString()}</p>
        </div>
        
        <div class="row text-center mb-4">
            <div class="col-4">
                <div class="neo-card p-3">
                    <h5>${Math.round(userData.currentWeekData.points)}</h5>
                    <small>Pontos</small>
                </div>
            </div>
            <div class="col-4">
                <div class="neo-card p-3">
                    <h5>${Object.keys(userData.currentWeekData.days).length}</h5>
                    <small>Dias Ativos</small>
                </div>
            </div>
            <div class="col-4">
                <div class="neo-card p-3">
                    <h5>${userData.weeklyStreak}</h5>
                    <small>Sequência</small>
                </div>
            </div>
        </div>
        
        <h6>Progresso Diário</h6>
        ${generateDailyProgress()}
    `;
}

// Gerar progresso diário
function generateDailyProgress() {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = '<div class="row text-center">';
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toDateString();
        const dayData = userData.currentWeekData.days[dateString];
        const points = dayData ? Math.round(dayData.points) : 0;
        
        html += `
            <div class="col">
                <div class="neo-card p-2">
                    <small class="d-block">${days[date.getDay()]}</small>
                    <strong>${points}</strong>
                    <small class="d-block">pts</small>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Atualizar histórico
function updateHistory() {
    const historyContainer = document.getElementById('weeks-history');
    
    if (userData.history.length === 0) {
        historyContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-clock-history display-4 d-block mb-2"></i>
                <p>Nenhum histórico disponível ainda.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    userData.history.forEach((week, index) => {
        const weekDate = new Date(week.date);
        html += `
            <div class="neo-card p-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6>Semana ${userData.history.length - index}</h6>
                    <small class="text-muted">${weekDate.toLocaleDateString()}</small>
                </div>
                <div class="row text-center mt-2">
                    <div class="col-4">
                        <strong class="text-primary">${Math.round(week.points)}</strong>
                        <div class="small">Pontos</div>
                    </div>
                    <div class="col-4">
                        <strong class="text-success">${Object.keys(week.days).length}</strong>
                        <div class="small">Dias Ativos</div>
                    </div>
                    <div class="col-4">
                        <strong class="text-warning">${week.streak}</strong>
                        <div class="small">Sequência</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    historyContainer.innerHTML = html;
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('healthyHabitsData', JSON.stringify(userData));
}

// Event listeners
resetButton.addEventListener('click', resetHabits);

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', init);