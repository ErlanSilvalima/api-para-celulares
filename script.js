// Configuração da Coordenada Base: Uninassau (Ex: Unidade Graças, Recife)
// Latitude e Longitude reais da Uninassau para cálculo referencial de distância
const UNINASSAU_COORDS = { lat: -8.0435, lon: -34.8986 };

// Elementos da interface do DOM
const inputCep = document.getElementById('cep');
const btnCalcular = document.getElementById('btn-calcular');
const resultSection = document.getElementById('result-section');
const errorMessage = document.getElementById('error-message');

const resEndereco = document.getElementById('res-endereco');
const resDistancia = document.getElementById('res-distancia');
const resPreco = document.getElementById('res-preco');

// Formata o CEP inserido para o padrão 00000-000 enquanto o usuário digita
inputCep.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) {
        value = value.substring(0, 5) + "-" + value.substring(5, 8);
    }
    e.target.value = value;
});

// Ação de disparo do cálculo
btnCalcular.addEventListener('click', processarCep);

async function processarCep() {
    const cepLimpo = inputCep.value.replace(/\D/g, "");
    errorMessage.textContent = "";
    resultSection.classList.add('hidden');

    if (cepLimpo.length !== 8) {
        errorMessage.textContent = "Por favor, digite um CEP válido com 8 dígitos.";
        return;
    }

    try {
        btnCalcular.textContent = "Buscando...";
        btnCalcular.disabled = true;

        // Chamada à API pública ViaCEP para coletar endereço do destino
        const response = await fetch(`https://viacep.com.br{cepLimpo}/json/`);
        const data = await response.json();

        if (data.erro) {
            errorMessage.textContent = "CEP não encontrado. Verifique os números.";
            return;
        }

        // Mostra os dados do endereço
        resEndereco.innerHTML = `${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro} <br> ${data.localidade} - ${data.uf}`;

        // Como APIs gratuitas não retornam Latitude/Longitude pelo CEP sem chaves pagas,
        // geramos coordenadas mockadas/aproximadas simulando os bairros da cidade.
        const destinoCoords = gerarCoordenadasAproximadas(data.uf);

        // Calcula a distância usando a Fórmula de Haversine
        const distanciaKm = calcularHaversine(
            UNINASSAU_COORDS.lat, UNINASSAU_COORDS.lon,
            destinoCoords.lat, destinoCoords.lon
        );

        // Calcula a taxa referencial baseada na média de preço por KM do Uber Moto
        const precoUberMoto = calcularPrecoUberMoto(distanciaKm);

        // Atualiza a tela com os valores encontrados
        resDistancia.textContent = `${distanciaKm.toFixed(1)} km`;
        resPreco.textContent = precoUberMoto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        resultSection.classList.remove('hidden');

    } catch (error) {
        errorMessage.textContent = "Erro na comunicação com o serviço. Tente novamente.";
    } finally {
        btnCalcular.textContent = "Calcular";
        btnCalcular.disabled = false;
    }
}

// Implementação da Fórmula matemática de Haversine para cálculo de geolocalização
function calcularHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio médio da terra em quilômetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância final em KM
}

// Algoritmo de cálculo de taxa do Uber Moto: Tarifa base fixa + Valor dinâmico por KM
function calcularPrecoUberMoto(distancia) {
    const tarifaBase = 4.50;  /* Preço mínimo de saída do serviço de moto */
    const valorPorKm = 1.30;  /* Média referencial cobrada por quilômetro */
    
    let total = tarifaBase + (distancia * valorPorKm);
    
    // Força um preço mínimo aceitável de corrida caso a distância seja muito curta
    return total < 6.00 ? 6.00 : total;
}

// Função auxiliar para fins educacionais (simula uma resposta de geolocalização regional)
function gerarCoordenadasAproximadas(uf) {
    // Se o CEP for de Pernambuco (PE), simula um ponto no raio metropolitano (Ex: Boa Viagem ou Olinda)
    if (uf === "PE") {
        const variacaoLat = (Math.random() - 0.5) * 0.09;
        const variacaoLon = (Math.random() - 0.5) * 0.09;
        return { lat: UNINASSAU_COORDS.lat + variacaoLat, lon: UNINASSAU_COORDS.lon + variacaoLon };
    }
    // Caso seja outro estado, gera uma distância maior simulada
    return { lat: -23.5505, lon: -46.6333 }; // Coordenada padrão de SP
}
