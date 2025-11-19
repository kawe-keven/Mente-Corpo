const { useState, useEffect } = React;

const API_URL = 'http://localhost:4000/api';

function CentralConteudoMasculino() {
    const [conteudos, setConteudos] = useState([]);
    const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
    const [busca, setBusca] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const categorias = [
        { id: 'todos', nome: 'Todos' },
        { id: 'saude', nome: 'Saúde' },
        { id: 'fitness', nome: 'Fitness' },
        { id: 'nutricao', nome: 'Nutrição' },
        { id: 'mental', nome: 'Saúde Mental' },
        { id: 'estilo', nome: 'Estilo de Vida' }
    ];

    // Buscar conteúdos da API
    useEffect(() => {
        fetchConteudos();
    }, [categoriaAtiva, busca]);

    const fetchConteudos = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams();
            if (categoriaAtiva !== 'todos') {
                params.append('categoria', categoriaAtiva);
            }
            if (busca) {
                params.append('busca', busca);
            }
            
            const response = await fetch(`${API_URL}/content?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar conteúdos');
            }
            
            const data = await response.json();
            console.log('Conteúdos carregados:', data);
            setConteudos(data);
        } catch (err) {
            console.error('Erro ao buscar conteúdos:', err);
            setError('Servidor offline. Mostrando conteúdos de exemplo.');
            
            // Fallback para dados estáticos em caso de erro
            setConteudos(getConteudosEstaticos());
        } finally {
            setLoading(false);
        }
    };

    const getConteudosEstaticos = () => {
        const todosConteudos = [
            {
                id: 1,
                titulo: 'Câncer de Próstata: Prevenção e Diagnóstico Precoce',
                categoria: 'saude',
                descricao: 'Entenda a importância do exame de PSA e toque retal para detecção precoce do câncer de próstata, principal câncer entre homens.',
                imagem: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Dr. Marcos Silva - Urologista',
                views: 0,
                likes: 0
            },
            {
                id: 2,
                titulo: 'Testosterona: Sinais de Deficiência e Tratamentos',
                categoria: 'saude',
                descricao: 'Conheça os sintomas da baixa testosterona, quando procurar ajuda médica e as opções de tratamento disponíveis.',
                imagem: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Dr. Pedro Santos - Endocrinologista',
                views: 0,
                likes: 0
            },
            {
                id: 3,
                titulo: 'Treino de Força Após os 40: Construindo Massa Muscular',
                categoria: 'fitness',
                descricao: 'Protocolo específico de musculação para homens acima de 40 anos, focando em ganho de massa e prevenção de lesões.',
                imagem: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop',
                tipo: 'video',
                autor: 'Prof. Carlos Mendes - Ed. Física',
                views: 0,
                likes: 0
            },
            {
                id: 4,
                titulo: 'Saúde Mental Masculina: Rompendo o Silêncio',
                categoria: 'mental',
                descricao: 'A importância de buscar ajuda psicológica. Dados mostram que homens buscam 50% menos ajuda que mulheres para questões emocionais.',
                imagem: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Psic. Roberto Alves',
                views: 0,
                likes: 0
            },
            {
                id: 5,
                titulo: 'Dieta para Hipertrofia Masculina',
                categoria: 'nutricao',
                descricao: 'Plano alimentar completo com cálculo de macros, horários de refeições e suplementação para ganho de massa muscular.',
                imagem: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Nutr. João Ferreira',
                views: 0,
                likes: 0
            },
            {
                id: 6,
                titulo: 'Disfunção Erétil: Causas e Tratamentos Modernos',
                categoria: 'saude',
                descricao: 'Abordagem médica sobre as causas físicas e psicológicas da disfunção erétil e os tratamentos mais eficazes disponíveis.',
                imagem: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Dr. André Costa - Urologista',
                views: 0,
                likes: 0
            },
            {
                id: 7,
                titulo: 'Depressão em Homens: Sintomas Diferentes',
                categoria: 'mental',
                descricao: 'Como a depressão se manifesta diferentemente em homens: irritabilidade, agressividade e comportamentos de risco.',
                imagem: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop',
                tipo: 'video',
                autor: 'Dr. Luís Martins - Psiquiatra',
                views: 0,
                likes: 0
            },
            {
                id: 8,
                titulo: 'HIIT para Queima de Gordura Abdominal',
                categoria: 'fitness',
                descricao: 'Treino intervalado de alta intensidade focado na redução da gordura visceral, fator de risco para doenças cardíacas.',
                imagem: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=250&fit=crop',
                tipo: 'video',
                autor: 'Prof. Ricardo Lima',
                views: 0,
                likes: 0
            },
            {
                id: 9,
                titulo: 'Calvície Masculina: Tratamentos Comprovados',
                categoria: 'estilo',
                descricao: 'Opções baseadas em evidências científicas: minoxidil, finasterida e transplante capilar. O que realmente funciona.',
                imagem: 'https://images.unsplash.com/photo-1622296089863-eb7fc0daa1e1?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Dr. Felipe Rocha - Dermatologista',
                views: 0,
                likes: 0
            },
            {
                id: 10,
                titulo: 'Suplementação Essencial para Homens',
                categoria: 'nutricao',
                descricao: 'Vitamina D, Ômega-3, Zinco e Magnésio: suplementos com evidências científicas para saúde masculina.',
                imagem: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Nutr. Marcos Oliveira',
                views: 0,
                likes: 0
            },
            {
                id: 11,
                titulo: 'Saúde Cardiovascular: Exercícios Preventivos',
                categoria: 'fitness',
                descricao: 'Protocolo de exercícios aeróbicos e anaeróbicos para prevenção de infartos e AVC, principais causas de morte em homens.',
                imagem: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=250&fit=crop',
                tipo: 'video',
                autor: 'Dr. Tiago Cardoso - Cardiologista',
                views: 0,
                likes: 0
            },
            {
                id: 12,
                titulo: 'Gerenciamento de Estresse no Trabalho',
                categoria: 'mental',
                descricao: 'Técnicas práticas de mindfulness e gestão de tempo para reduzir o estresse ocupacional e prevenir burnout.',
                imagem: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Psic. Fernando Dias',
                views: 0,
                likes: 0
            },
            {
                id: 13,
                titulo: 'Alimentação Anti-inflamatória para Homens',
                categoria: 'nutricao',
                descricao: 'Como reduzir inflamações crônicas através da dieta, prevenindo doenças cardiovasculares e articulares.',
                imagem: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Nutr. Gabriel Costa',
                views: 0,
                likes: 0
            },
            {
                id: 14,
                titulo: 'Sono de Qualidade: Impacto na Testosterona',
                categoria: 'estilo',
                descricao: 'A relação entre privação de sono e queda nos níveis de testosterona. Estratégias para melhorar a qualidade do sono.',
                imagem: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop',
                tipo: 'video',
                autor: 'Dr. Alexandre Nunes',
                views: 0,
                likes: 0
            },
            {
                id: 15,
                titulo: 'Cuidados com a Pele Masculina',
                categoria: 'estilo',
                descricao: 'Rotina básica de skincare para homens: proteção solar, hidratação e prevenção do envelhecimento precoce.',
                imagem: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=250&fit=crop',
                tipo: 'artigo',
                autor: 'Dr. Renato Souza - Dermatologista',
                views: 0,
                likes: 0
            }
        ];

        // Aplicar filtros nos dados estáticos
        return todosConteudos.filter(conteudo => {
            const filtroPorCategoria = categoriaAtiva === 'todos' || conteudo.categoria === categoriaAtiva;
            const filtroPorBusca = !busca || 
                conteudo.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                conteudo.descricao.toLowerCase().includes(busca.toLowerCase());
            return filtroPorCategoria && filtroPorBusca;
        });
    };

    const handleCategoriaChange = (categoriaId) => {
        setCategoriaAtiva(categoriaId);
    };

    const handleBuscaChange = (e) => {
        setBusca(e.target.value);
    };

    const handleAcessarConteudo = async (conteudoId) => {
        try {
            // Registrar visualização
            await fetch(`${API_URL}/content/${conteudoId}`);
            
            // Aqui você pode redirecionar para uma página de detalhes do conteúdo
            alert(`Acessando conteúdo #${conteudoId}. Em breve, página de detalhes será implementada.`);
        } catch (err) {
            console.error('Erro ao acessar conteúdo:', err);
        }
    };

    return (
        <div className="container">
            <header className="header">
                <h1>Central de Conteúdo Masculino</h1>
                <p className="subtitle">Conteúdo especializado para saúde e bem-estar masculino</p>
            </header>

            {error && (
                <div className="alert alert-warning" role="alert" style={{
                    padding: '15px',
                    marginBottom: '20px',
                    borderRadius: '10px',
                    background: 'var(--bg-color)',
                    boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)',
                    color: 'var(--warning-color)'
                }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            <div className="search-section">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar conteúdo..."
                    value={busca}
                    onChange={handleBuscaChange}
                />
            </div>

            <div className="categorias">
                {categorias.map(categoria => (
                    <button
                        key={categoria.id}
                        className={`categoria-btn ${categoriaAtiva === categoria.id ? 'active' : ''}`}
                        onClick={() => handleCategoriaChange(categoria.id)}
                    >
                        {categoria.nome}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status" style={{
                        width: '3rem',
                        height: '3rem',
                        color: 'var(--primary-color)'
                    }}>
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                    <p style={{ marginTop: '15px', color: 'var(--secondary-color)' }}>Carregando conteúdos...</p>
                </div>
            ) : (
                <div className="conteudos-grid">
                    {conteudos.length > 0 ? (
                        conteudos.map(conteudo => (
                            <div key={conteudo.id} className="conteudo-card">
                                <div className="conteudo-imagem">
                                    <img src={conteudo.imagem} alt={conteudo.titulo} />
                                    <span className="tipo-badge">{conteudo.tipo}</span>
                                </div>
                                <div className="conteudo-info">
                                    <h3>{conteudo.titulo}</h3>
                                    <p>{conteudo.descricao}</p>
                                    {conteudo.autor && <p className="autor">{conteudo.autor}</p>}
                                    <div className="conteudo-stats">
                                        {conteudo.views > 0 && (
                                            <small className="text-muted">
                                                <i className="bi bi-eye me-1"></i>
                                                {conteudo.views} visualizações
                                            </small>
                                        )}
                                        {conteudo.likes > 0 && (
                                            <small className="text-muted ms-2">
                                                <i className="bi bi-heart me-1"></i>
                                                {conteudo.likes} curtidas
                                            </small>
                                        )}
                                    </div>
                                    <button 
                                        className="btn-acessar"
                                        onClick={() => handleAcessarConteudo(conteudo.id)}
                                    >
                                        Acessar Conteúdo
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">
                            <i className="bi bi-search" style={{ fontSize: '3rem', marginBottom: '15px', color: 'var(--secondary-color)' }}></i>
                            <p>Nenhum conteúdo encontrado.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<CentralConteudoMasculino />);
