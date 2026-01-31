let currentStep = 1;
const formInputs = {
    clientName: '',
    clientPhone: '',
    licensePlate: '',
    brand: '',
    model: '',
    displacement: '',
    yearManufacture: '',
    yearModel: '',
    serviceTypes: [],
    oilType: 'Indique-me a melhor opção',
    brakeType: ''
};

// --- CONFIGURAÇÃO APIBRASIL ---
const CHANNEL_NAME = "SEU_CHANNEL_NAME"; // Substitua pelo seu Channel Name
const BEARER_TOKEN = "SEU_TOKEN_BEARER"; // Substitua pelo seu Bearer Token
// ------------------------------

// Máscara de Telefone
document.getElementById('clientPhone').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    let formatted = '';
    if (value.length > 0) {
        formatted = '(' + value.slice(0, 2);
        if (value.length > 2) {
            formatted += ') ' + value.slice(2, 7);
            if (value.length > 7) {
                formatted += '-' + value.slice(7, 11);
            }
        }
    }
    e.target.value = formatted;
    formInputs.clientPhone = formatted;
});

// Máscara de Placa e Consulta Automática
document.getElementById('licensePlate').addEventListener('input', async function(e) {
    let value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    
    // Formatação Visual (ABC-1234 ou ABC1D23)
    let displayValue = value;
    if (value.length > 3) {
        // Se o 5º caractere for número, é placa antiga (formata com hífen)
        // Se for letra, é Mercosul (não costuma usar hífen, mas vamos manter a lógica de 3-4)
        const isOldPlate = value.length >= 5 && !isNaN(value[4]);
        if (isOldPlate) {
            displayValue = value.slice(0, 3) + '-' + value.slice(3);
        }
    }
    
    this.value = displayValue;
    formInputs.licensePlate = value; // Guardamos a placa limpa para a API

    // Se a placa estiver completa (7 caracteres), consulta a API
    if (value.length === 7) {
        await consultarPlaca(value);
    }
});

async function consultarPlaca(placa) {
    const plateInput = document.getElementById('licensePlate');
    const manualFields = document.getElementById('manualVehicleFields');
    
    // Feedback visual de carregamento
    plateInput.style.borderColor = '#007bff';
    showToast("Consultando dados do veículo...");

    const url = `https://api.brasilaberto.net/v1/vehicles/${placa}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Channel-Name': CHANNEL_NAME,
                'Authorization': `Bearer ${BEARER_TOKEN}`
            }
        });

        const data = await response.json();

        if (response.ok && data.result) {
            const v = data.result;
            
            // Preenche os campos
            document.getElementById('brand').value = v.brand || '';
            document.getElementById('model').value = v.model || '';
            document.getElementById('displacement').value = v.engine || '';
            document.getElementById('yearManufacture').value = v.yearManufacture || '';
            document.getElementById('yearModel').value = v.yearModel || '';

            // Atualiza o objeto formInputs
            formInputs.brand = v.brand || '';
            formInputs.model = v.model || '';
            formInputs.displacement = v.engine || '';
            formInputs.yearManufacture = v.yearManufacture || '';
            formInputs.yearModel = v.yearModel || '';

            plateInput.style.borderColor = '#28a745'; // Verde para sucesso
            showToast("Veículo identificado com sucesso!");
        } else {
            plateInput.style.borderColor = '#dc3545'; // Vermelho para erro
            showToast("Placa não encontrada. Preencha manualmente.");
        }
    } catch (error) {
        console.error('Erro na consulta:', error);
        plateInput.style.borderColor = '#dc3545';
        showToast("Erro ao consultar placa. Preencha manualmente.");
    }
}

// Captura de inputs com conversão para maiúsculas onde necessário
['clientName', 'brand', 'model', 'displacement', 'yearManufacture', 'yearModel'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        let value = this.value;
        if (['brand', 'model', 'displacement'].includes(id)) {
            value = value.toUpperCase();
            this.value = value;
        }
        formInputs[id] = value;
    });
});

document.getElementById('brakeType').addEventListener('change', function() {
    formInputs.brakeType = this.value;
});

function openExternal(url) {
    if (confirm("Você está saindo para um site externo (Carros na Web/Fipe). Estes sites podem conter anúncios. Deseja continuar?")) {
        window.open(url, '_blank');
    }
}

function nextStep(step) {
    // Validação Passo 2
    if (currentStep === 2) {
        const hasPlate = formInputs.licensePlate && formInputs.licensePlate.length >= 7;
        const hasManual = formInputs.brand && formInputs.model;
        if (!hasPlate && !hasManual) {
            showToast("Informe a placa ou os dados do veículo.");
            return;
        }
    }

    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateProgress();
    window.scrollTo(0, 0);
}

function prevStep(step) {
    document.getElementById(`step${currentStep}`).classList.remove('active');
    document.getElementById(`step${step}`).classList.add('active');
    currentStep = step;
    updateProgress();
}

function updateProgress() {
    const fill = document.getElementById('progressFill');
    fill.style.width = (currentStep / 3 * 100) + '%';
}

function toggleService(el) {
    const val = el.getAttribute('data-value');
    el.classList.toggle('selected');
    
    if (el.classList.contains('selected')) {
        formInputs.serviceTypes.push(val);
    } else {
        formInputs.serviceTypes = formInputs.serviceTypes.filter(s => s !== val);
    }

    // Lógica de Freio Traseiro
    document.getElementById('brakeTypeSection').style.display = 
        formInputs.serviceTypes.includes('disco-traseiras') ? 'block' : 'none';

    // Lógica de Óleo
    document.getElementById('oilPreference').style.display = 
        formInputs.serviceTypes.includes('oil') ? 'block' : 'none';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    t.style.opacity = '1';
    setTimeout(() => {
        t.style.opacity = '0';
        setTimeout(() => t.style.display = 'none', 500);
    }, 3000);
}

function showSummary() {
    if (formInputs.serviceTypes.length === 0) {
        showToast("Selecione ao menos um serviço.");
        return;
    }
    
    if (formInputs.serviceTypes.includes('disco-traseiras') && !formInputs.brakeType) {
        showToast("Por favor, informe o tipo de freio de mão.");
        return;
    }

    document.getElementById('sumName').textContent = formInputs.clientName || "Não informado";
    
    // Formata o texto do veículo no resumo
    let vehicleText = formInputs.licensePlate ? `[${formInputs.licensePlate}] ` : "";
    vehicleText += `${formInputs.brand} ${formInputs.model}`;
    document.getElementById('sumVehicle').textContent = vehicleText || "Não informado";
    
    const serviceMap = {
        oil: 'Óleo', transmission: 'Câmbio', arrefecimento: 'Arrefecimento',
        'disco-dianteiras': 'Freio Diant.', 'disco-traseiras': 'Freio Tras.', 'bieletas-dianteiras': 'Bieletas'
    };
    document.getElementById('sumServices').textContent = formInputs.serviceTypes.map(s => serviceMap[s]).join(', ');
    
    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function sendWhatsApp() {
    const serviceMap = {
        oil: 'Troca de Óleo + Filtros',
        transmission: 'Fluído de Câmbio Automático',
        arrefecimento: 'Sistema de Arrefecimento',
        'disco-dianteiras': 'Disco/Pastilhas Dianteiras',
        'disco-traseiras': 'Disco/Pastilhas Traseiras',
        'bieletas-dianteiras': 'Bieletas Dianteiras'
    };

    let msg = `🚗 *NOVO ORÇAMENTO - Do Óleo Sorocaba*\n\n`;
    msg += `👤 *Cliente:* ${formInputs.clientName || 'Não informado'}\n`;
    msg += `📱 *WhatsApp:* ${formInputs.clientPhone || 'Não informado'}\n\n`;
    
    msg += `*VEÍCULO:*\n`;
    msg += `• Placa: ${formInputs.licensePlate || 'Não informada'}\n`;
    msg += `• Marca/Mod: ${formInputs.brand} ${formInputs.model}\n`;
    msg += `• Motor: ${formInputs.displacement || 'N/A'}\n`;
    msg += `• Ano: ${formInputs.yearManufacture || ''}/${formInputs.yearModel || ''}\n`;

    msg += `\n*SERVIÇOS:* \n`;
    formInputs.serviceTypes.forEach(s => {
        msg += `✅ ${serviceMap[s]}\n`;
    });

    if (formInputs.serviceTypes.includes('disco-traseiras')) {
        msg += `• Freio de Mão: ${formInputs.brakeType}\n`;
    }

    if (formInputs.serviceTypes.includes('oil')) {
        msg += `\n*PREFERÊNCIA DE ÓLEO:* ${document.getElementById('oilType').value}\n`;
    }

    msg += `\n_Enviado via App Orçamento Inteligente_`;

    const url = `https://wa.me/5515998473981?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}
