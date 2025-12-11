/**
 * TikTok Frontend Events Handler
 * 
 * Este script monitora o status de pagamento e dispara o evento Purchase
 * no frontend quando o PIX é confirmado.
 * 
 * IMPORTANTE: Requer que verificar-pix.php esteja atualizado para retornar
 * trigger_frontend_event e frontend_event_data na resposta.
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';
    
    console.log('🎯 TikTok Frontend Events - Inicializando...');
    
    /**
     * Verifica se o TikTok Pixel está carregado
     * @returns {boolean}
     */
    function isTikTokPixelLoaded() {
        return typeof ttq !== 'undefined' && typeof ttq.track === 'function';
    }
    
    /**
     * Dispara evento Purchase no TikTok Pixel
     * @param {Object} eventData - Dados do evento
     */
    function fireTikTokPurchase(eventData) {
        if (!isTikTokPixelLoaded()) {
            console.warn('⚠️ TikTok Pixel não está carregado');
            return false;
        }
        
        try {
            console.log('🎯 Disparando evento CompletePayment:', eventData);
            
            ttq.track('CompletePayment', {
                value: eventData.value,
                currency: eventData.currency,
                content_type: eventData.content_type,
                content_id: eventData.order_id,
                order_id: eventData.order_id
            });
            
            console.log('✅ Evento CompletePayment disparado com sucesso!');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao disparar evento TikTok:', error);
            return false;
        }
    }
    
    /**
     * Hook para verificação de pagamento
     * Esta função intercepta as respostas da API verificar-pix.php
     * 
     * @param {Object} response - Resposta da API
     * @returns {Object} Response (passthrough)
     */
    function handlePaymentVerification(response) {
        // Verifica se o backend sinalizou para disparar evento
        if (response && response.trigger_frontend_event === true) {
            console.log('🎯 Backend sinalizou para disparar evento no frontend');
            
            if (response.frontend_event_data) {
                const eventData = response.frontend_event_data;
                fireTikTokPurchase(eventData);
            } else {
                console.warn('⚠️ Dados do evento não encontrados na resposta');
            }
        }
        
        return response;
    }
    
    /**
     * Wrapper para fetch que intercepta chamadas à API
     * @param {string} url
     * @param {Object} options
     * @returns {Promise}
     */
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        // Verifica se é uma chamada para verificar-pix
        if (url && url.includes('verificar-pix')) {
            console.log('🔍 Interceptando chamada para verificar-pix.php');
            
            return originalFetch.apply(this, arguments)
                .then(response => {
                    // Clone para não consumir o stream
                    const clonedResponse = response.clone();
                    
                    // Lê o JSON da resposta
                    clonedResponse.json()
                        .then(data => {
                            handlePaymentVerification(data);
                        })
                        .catch(err => {
                            console.log('⚠️ Resposta não é JSON válido');
                        });
                    
                    // Retorna response original
                    return response;
                })
                .catch(error => {
                    console.error('❌ Erro na requisição:', error);
                    throw error;
                });
        }
        
        // Para outras chamadas, executa normalmente
        return originalFetch.apply(this, arguments);
    };
    
    /**
     * API Pública
     */
    window.TikTokFrontendEvents = {
        /**
         * Dispara evento Purchase manualmente
         * @param {Object} data
         */
        firePurchase: function(data) {
            const eventData = {
                value: data.value || data.total || 0,
                currency: data.currency || 'BRL',
                content_type: data.content_type || 'product',
                order_id: data.order_id || data.external_id || data.id
            };
            
            return fireTikTokPurchase(eventData);
        },
        
        /**
         * Verifica se o Pixel está carregado
         */
        isPixelLoaded: isTikTokPixelLoaded,
        
        /**
         * Handler manual para resposta de verificação
         */
        handleVerificationResponse: handlePaymentVerification
    };
    
    console.log('✅ TikTok Frontend Events - Pronto!');
    console.log('📝 API disponível em: window.TikTokFrontendEvents');
    
})();


