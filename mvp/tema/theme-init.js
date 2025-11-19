// Aplicação imediata do tema - executa antes da página renderizar
(function() {
    'use strict';
    
    // Aplicar tema imediatamente do localStorage
    const savedTheme = localStorage.getItem('healthTechTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();
