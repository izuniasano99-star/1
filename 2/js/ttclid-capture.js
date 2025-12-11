/**
 * TikTok Click ID (ttclid) - Captura Universal
 * 
 * Este script captura e persiste o ttclid do TikTok Ads para garantir
 * que todas as conversões sejam corretamente atribuídas aos anúncios.
 * 
 * IMPORTANTE: Este script deve ser incluído em TODAS as páginas do site,
 * ANTES do TikTok Pixel, para garantir funcionamento correto.
 * 
 * @version 1.0.0
 * @author Sistema de Rastreamento TikTok
 */

(function() {
    'use strict';
    
    console.log('🎯 TikTok ttclid Capture - Inicializando...');
    
    /**
     * Função auxiliar para obter cookie
     * @param {string} name - Nome do cookie
     * @returns {string|null} Valor do cookie ou null
     */
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }
    
    /**
     * Função auxiliar para definir cookie
     * @param {string} name - Nome do cookie
     * @param {string} value - Valor do cookie
     * @param {number} days - Dias até expiração
     */
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // Remove 'www.' do domínio para funcionar em subdomínios
        const domain = window.location.hostname.replace(/^www\./, '');
        
        // Define cookie com domínio amplo, path /, e duração especificada
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; domain=${domain}; SameSite=Lax`;
        
        console.log(`✅ Cookie ${name} definido:`, value);
    }
    
    /**
     * Captura ttclid da URL
     * @returns {string|null} ttclid ou null
     */
    function captureTtclidFromUrl() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get('ttclid');
        } catch (error) {
            console.error('❌ Erro ao capturar ttclid da URL:', error);
            return null;
        }
    }
    
    /**
     * Salva ttclid em cookie e localStorage
     * @param {string} ttclid - Click ID do TikTok
     * @returns {boolean} Sucesso da operação
     */
    function saveTtclid(ttclid) {
        if (!ttclid) return false;
        
        try {
            // Salva em cookie (365 dias)
            setCookie('ttclid', ttclid, 365);
            
            // Salva em localStorage (backup)
            localStorage.setItem('ttclid', ttclid);
            localStorage.setItem('ttclid_timestamp', Date.now().toString());
            
            console.log('✅ ttclid salvo com sucesso:', ttclid);
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar ttclid:', error);
            return false;
        }
    }
    
    /**
     * Recupera ttclid salvo anteriormente
     * @returns {string|null} ttclid salvo ou null
     */
    function getSavedTtclid() {
        // Tenta cookie primeiro (mais confiável)
        let ttclid = getCookie('ttclid');
        
        if (ttclid) {
            console.log('ℹ️ ttclid recuperado do cookie:', ttclid);
            return ttclid;
        }
        
        // Fallback para localStorage
        try {
            ttclid = localStorage.getItem('ttclid');
            if (ttclid) {
                console.log('ℹ️ ttclid recuperado do localStorage:', ttclid);
                
                // Re-sincroniza com cookie se não existir
                if (!getCookie('ttclid')) {
                    setCookie('ttclid', ttclid, 365);
                }
                
                return ttclid;
            }
        } catch (error) {
            console.error('❌ Erro ao ler localStorage:', error);
        }
        
        return null;
    }
    
    /**
     * Função principal - inicializa captura de ttclid
     */
    function init() {
        // 1. Tenta capturar da URL
        const urlTtclid = captureTtclidFromUrl();
        
        if (urlTtclid) {
            console.log('🎯 ttclid encontrado na URL:', urlTtclid);
            saveTtclid(urlTtclid);
            
            // Expõe globalmente para uso no backend
            window.TIKTOK_CLICK_ID = urlTtclid;
            
        } else {
            // 2. Se não tem na URL, tenta recuperar salvo
            const savedTtclid = getSavedTtclid();
            
            if (savedTtclid) {
                console.log('ℹ️ Usando ttclid salvo anteriormente');
                window.TIKTOK_CLICK_ID = savedTtclid;
            } else {
                console.warn('⚠️ Nenhum ttclid encontrado (usuário não veio de anúncio do TikTok)');
                window.TIKTOK_CLICK_ID = null;
            }
        }
        
        // 3. Log de debug detalhado
        console.log('📊 Status do ttclid:');
        console.log('  - URL:', urlTtclid || 'não encontrado');
        console.log('  - Cookie:', getCookie('ttclid') || 'não encontrado');
        console.log('  - localStorage:', localStorage.getItem('ttclid') || 'não encontrado');
        console.log('  - window.TIKTOK_CLICK_ID:', window.TIKTOK_CLICK_ID || 'não definido');
    }
    
    // Executa imediatamente
    init();
    
    /**
     * API pública para manipulação de ttclid
     */
    window.TikTokClickID = {
        /**
         * Obtém o ttclid atual
         * @returns {string|null} ttclid ou null
         */
        get: function() {
            return window.TIKTOK_CLICK_ID || getSavedTtclid();
        },
        
        /**
         * Limpa todos os dados de ttclid
         */
        clear: function() {
            setCookie('ttclid', '', -1);
            localStorage.removeItem('ttclid');
            localStorage.removeItem('ttclid_timestamp');
            window.TIKTOK_CLICK_ID = null;
            console.log('🗑️ ttclid limpo com sucesso');
        },
        
        /**
         * Força salvamento de um ttclid específico
         * @param {string} ttclid - Click ID a ser salvo
         * @returns {boolean} Sucesso da operação
         */
        set: function(ttclid) {
            if (!ttclid || typeof ttclid !== 'string') {
                console.error('❌ ttclid inválido');
                return false;
            }
            window.TIKTOK_CLICK_ID = ttclid;
            return saveTtclid(ttclid);
        },
        
        /**
         * Retorna informações de debug
         * @returns {object} Objeto com informações de debug
         */
        debug: function() {
            return {
                current: window.TIKTOK_CLICK_ID,
                cookie: getCookie('ttclid'),
                localStorage: localStorage.getItem('ttclid'),
                timestamp: localStorage.getItem('ttclid_timestamp'),
                url: captureTtclidFromUrl()
            };
        }
    };
    
    // Log de sucesso
    console.log('✅ TikTok ttclid Capture - Pronto!');
    
})();


