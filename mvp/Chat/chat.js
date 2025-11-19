// Gerenciamento do Espaço Seguro (Fórum Anônimo)
class SafeSpace {
    constructor() {
        this.posts = this.loadPosts();
        this.currentPostId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();

        // Tentar carregar do servidor
        if (window.api && window.api.fetchWithAuth) {
            window.api.fetchWithAuth('/api/chat').then(messages => {
                // messages: [{id, content, created_at, user_id, user_name}]
                this.posts = messages.map(m => ({
                    id: m.id.toString(),
                    title: '',
                    content: m.content,
                    category: 'desabafo',
                    timestamp: new Date(m.created_at).getTime(),
                    likes: 0,
                    comments: 0,
                    sensitive: false,
                    author: m.user_name || 'Anônimo'
                }));
                this.renderPosts();
                this.updateStats();
            }).catch(err => {
                console.warn('Erro ao carregar mensagens do servidor, usando localStorage.', err);
                this.posts = this.loadPosts();
                this.renderPosts();
                this.updateStats();
            });
        } else {
            this.posts = this.loadPosts();
            this.renderPosts();
            this.updateStats();
        }
    }

    setupEventListeners() {
        // Formulário de nova postagem
        const postForm = document.getElementById('post-form');
        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.createPost();
            });
        } else {
            console.error('Formulário post-form não encontrado!');
        }

        // Filtros
        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.renderPosts();
            });
        }

        const sortPosts = document.getElementById('sort-posts');
        if (sortPosts) {
            sortPosts.addEventListener('change', () => {
                this.renderPosts();
            });
        }

        // Busca
        const searchPosts = document.getElementById('search-posts');
        if (searchPosts) {
            searchPosts.addEventListener('input', (e) => {
                this.renderPosts(e.target.value);
            });
        }
    }

    // Carregar posts do localStorage
    loadPosts() {
        const stored = localStorage.getItem('safeSpacePosts');
        return stored ? JSON.parse(stored) : [
            {
                id: '1',
                title: 'Primeiro dia de caminhada',
                content: 'Hoze consegui caminhar 20 minutos! Foi difícil, mas me sinto orgulhoso. Alguém mais está começando agora?',
                category: 'conquista',
                timestamp: new Date().getTime() - 86400000, // 1 dia atrás
                likes: 5,
                comments: 2,
                sensitive: false
            },
            {
                id: '2',
                title: 'Preciso de ajuda com ansiedade',
                content: 'Ultimamente tenho me sentido muito ansioso e isso está atrapalhando meus hábitos saudáveis. Alguém tem dicas de como lidar?',
                category: 'apoio',
                timestamp: new Date().getTime() - 172800000, // 2 dias atrás
                likes: 8,
                comments: 3,
                sensitive: true
            }
        ];
    }

    // Salvar posts no localStorage
    savePosts() {
        localStorage.setItem('safeSpacePosts', JSON.stringify(this.posts));
        this.updateStats();
    }

    // Criar nova postagem
    createPost() {
        const titleInput = document.getElementById('post-title');
        const contentInput = document.getElementById('post-content');
        const categoryInput = document.getElementById('post-category');
        const sensitiveInput = document.getElementById('post-sensitive');

        // Verificar se os elementos existem
        if (!titleInput || !contentInput || !categoryInput || !sensitiveInput) {
            console.error('Elementos do formulário não encontrados');
            this.showNotification('Erro: Formulário não encontrado!', 'error');
            return;
        }

        const title = titleInput.value;
        const content = contentInput.value;
        const category = categoryInput.value;
        const sensitive = sensitiveInput.checked;

        if (!content.trim()) {
            this.showNotification('Por favor, escreva sua mensagem!', 'error');
            return;
        }

        // Enviar para o servidor (conteúdo será salvo com user_id do token)
        if (window.api && window.api.fetchWithAuth) {
            window.api.fetchWithAuth('/api/chat', {
                method: 'POST',
                body: JSON.stringify({ content: content.trim() })
            }).then(created => {
                const post = {
                    id: created.id.toString(),
                    title: title.trim(),
                    content: created.content,
                    category,
                    timestamp: new Date(created.created_at).getTime(),
                    likes: 0,
                    comments: 0,
                    sensitive,
                    author: created.user_name || 'Anônimo'
                };
                this.posts.unshift(post);
                this.savePosts();
                this.renderPosts();
                this.resetForm();
                this.showNotification('Mensagem publicada com sucesso!', 'success');
            }).catch(err => {
                console.error('Erro ao publicar mensagem:', err);
                // Se o servidor não estiver disponível, salvar localmente
                this.savePostLocally(title, content, category, sensitive);
            });
        } else {
            // Se não tiver API disponível, salvar localmente
            this.savePostLocally(title, content, category, sensitive);
        }
    }

    // Salvar post localmente (fallback)
    savePostLocally(title, content, category, sensitive) {
        const newPost = {
            id: Date.now().toString(),
            title: title.trim(),
            content: content.trim(),
            category,
            timestamp: new Date().getTime(),
            likes: 0,
            comments: 0,
            sensitive,
            author: this.generateAnonymousName()
        };

        this.posts.unshift(newPost);
        this.savePosts();
        this.renderPosts();
        this.resetForm();
        this.showNotification('Mensagem publicada com sucesso!', 'success');
    }

    // Gerar nome anônimo aleatório
    generateAnonymousName() {
        const adjectives = ['Corajoso', 'Determinado', 'Resiliente', 'Esperançoso', 'Fortaleza', 'Lutador', 'Guerreiro', 'Vitorioso'];
        const animals = ['Leão', 'Fênix', 'Águia', 'Tigre', 'Lobo', 'Urso', 'Golfinho', 'Coruja'];
        const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        return `${adjective} ${animal}`;
    }

    // Curtir postagem
    likePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            // Verificar se o usuário já curtiu este post
            const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
            
            if (!likedPosts[postId]) {
                post.likes++;
                likedPosts[postId] = true;
                localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
                this.savePosts();
                this.renderPosts();
                this.showNotification('Apoio enviado! 💚', 'success');
            } else {
                this.showNotification('Você já apoiou esta mensagem!', 'info');
            }
        }
    }

    // Renderizar postagens
    renderPosts(searchTerm = '') {
        const container = document.getElementById('posts-container');
        const loading = document.getElementById('loading-posts');
        const noPosts = document.getElementById('no-posts');

        loading.style.display = 'none';
        
        let filteredPosts = [...this.posts];

        // Aplicar filtro de categoria
        const categoryFilter = document.getElementById('filter-category').value;
        if (categoryFilter) {
            filteredPosts = filteredPosts.filter(post => post.category === categoryFilter);
        }

        // Aplicar busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(term) ||
                post.content.toLowerCase().includes(term)
            );
        }

        // Aplicar ordenação
        const sortBy = document.getElementById('sort-posts').value;
        switch (sortBy) {
            case 'oldest':
                filteredPosts.sort((a, b) => a.timestamp - b.timestamp);
                break;
            case 'popular':
                filteredPosts.sort((a, b) => b.likes - a.likes);
                break;
            case 'newest':
            default:
                filteredPosts.sort((a, b) => b.timestamp - a.timestamp);
                break;
        }

        if (filteredPosts.length === 0) {
            container.innerHTML = '';
            noPosts.style.display = 'block';
            return;
        }

        noPosts.style.display = 'none';
        container.innerHTML = filteredPosts.map(post => this.createPostCard(post)).join('');
    }

    // Criar card de postagem
    createPostCard(post) {
        const timeAgo = this.getTimeAgo(post.timestamp);
        const categoryIcons = {
            'desabafo': '🎗️',
            'duvida': '❓',
            'conquista': '🎉',
            'apoio': '🤗',
            'dica': '💡'
        };

        const categoryLabels = {
            'desabafo': 'Desabafo',
            'duvida': 'Dúvida',
            'conquista': 'Conquista',
            'apoio': 'Pedindo Apoio',
            'dica': 'Dica'
        };

        const isSensitive = post.sensitive ? 'border-warning' : '';

        return `
            <div class="neo-card p-4 mb-4 post-card ${isSensitive}" data-post-id="${post.id}">
                ${post.sensitive ? `
                    <div class="alert alert-warning small mb-3">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Esta mensagem contém conteúdo sensível
                    </div>
                ` : ''}
                
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <span class="badge bg-primary mb-2">${categoryIcons[post.category]} ${categoryLabels[post.category]}</span>
                        ${post.title ? `<h6 class="mb-1">${post.title}</h6>` : ''}
                    </div>
                    <small class="text-muted">${timeAgo}</small>
                </div>

                <div class="post-content mb-3">
                    ${this.truncateText(post.content, 200)}
                </div>

                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <button class="btn-like btn-sm neo-button me-2" onclick="window.safeSpace.likePost('${post.id}')">
                            <i class="bi bi-heart me-1"></i>
                            <span class="like-count">${post.likes}</span>
                        </button>
                        <small class="text-muted">
                            <i class="bi bi-person-circle me-1"></i>${post.author}
                        </small>
                    </div>
                    <button class="btn btn-sm neo-button" onclick="window.safeSpace.viewFullPost('${post.id}')">
                        Ler mais
                    </button>
                </div>
            </div>
        `;
    }

    // Ver postagem completa
    viewFullPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const categoryLabels = {
            'desabafo': 'Desabafo',
            'duvida': 'Dúvida',
            'conquista': 'Conquista',
            'apoio': 'Pedindo Apoio',
            'dica': 'Dica'
        };

        const modalTitle = document.getElementById('postModalTitle');
        const modalContent = document.getElementById('postModalContent');

        modalTitle.textContent = post.title || 'Mensagem';
        
        modalContent.innerHTML = `
            <div class="mb-3">
                <span class="badge bg-primary">${categoryLabels[post.category]}</span>
                <small class="text-muted ms-2">${this.formatDate(post.timestamp)}</small>
            </div>
            
            ${post.sensitive ? `
                <div class="alert alert-warning small mb-3">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Esta mensagem contém conteúdo sensível
                </div>
            ` : ''}
            
            <div class="post-full-content mb-4">
                ${post.content.replace(/\n/g, '<br>')}
            </div>
            
            <div class="d-flex justify-content-between align-items-center border-top pt-3">
                <div class="d-flex align-items-center">
                    <button class="btn-like btn-sm neo-button me-3" onclick="window.safeSpace.likePost('${post.id}')">
                        <i class="bi bi-heart me-1"></i>
                        Apoiar (<span class="like-count">${post.likes}</span>)
                    </button>
                    <small class="text-muted">
                        <i class="bi bi-person-circle me-1"></i>${post.author}
                    </small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
        `;

        const modal = new bootstrap.Modal(document.getElementById('postModal'));
        modal.show();
    }

    // Atualizar estatísticas
    updateStats() {
        const totalPosts = this.posts.length;
        const totalLikes = this.posts.reduce((sum, post) => sum + post.likes, 0);

        document.getElementById('total-posts').textContent = totalPosts;
        document.getElementById('total-likes').textContent = totalLikes;
    }

    // Resetar formulário
    resetForm() {
        const form = document.getElementById('post-form');
        if (form) {
            form.reset();
        }
    }

    // Utilitários
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    getTimeAgo(timestamp) {
        const now = new Date().getTime();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Agora mesmo';
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours} h atrás`;
        if (days === 1) return 'Ontem';
        return `${days} dias atrás`;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showNotification(message, type = 'info') {
        // Criar notificação estilo neomórfico
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
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }
}

// Inicializar o Espaço Seguro quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.safeSpace = new SafeSpace();
});