# 🔄 Upgrade em Cascata - Guia Frontend

## 📋 Resumo das Mudanças

### **O Que Mudou?**

A lógica de upgrade foi alterada para implementar **upgrades em cascata com manutenção de posição**:

1. ✅ **Upgrades devem ser sequenciais** - Não pode "pular" posições
2. ✅ **Posição é mantida** - Usuário #005 no N1 vira #005 no N2
3. ✅ **Validação de ordem** - Sistema bloqueia upgrade se usuários anteriores não fizeram

---

## 🚫 **Cenários de Bloqueio**

### **Quando o Upgrade NÃO é Permitido:**

#### **Exemplo 1: Usuário Anterior Não Fez Upgrade**

```
Fila N1:
#001 - João   | ✅ 3/3 doações | ✅ Fez upgrade para N2
#002 - Maria  | ✅ 3/3 doações | ✅ Fez upgrade para N2
#003 - Pedro  | ✅ 3/3 doações | ❌ NÃO fez upgrade ainda
#004 - Ana    | ✅ 3/3 doações | ⏳ BLOQUEADA - aguarda #003

Ana vê:
❌ "Aguarde os participantes anteriores fazerem upgrade primeiro. 
    Upgrades devem ser feitos em ordem sequencial."
```

#### **Exemplo 2: Usuário Anterior Não Completou**

```
Fila N1:
#010 - Carlos | ✅ 3/3 doações | ✅ Fez upgrade
#011 - Laura  | ⏳ 2/3 doações | ⏳ Ainda não completou
#012 - Bruno  | ✅ 3/3 doações | ⏳ BLOQUEADO - aguarda #011 completar

Bruno vê:
❌ "Aguarde os participantes anteriores completarem e fazerem upgrade."
```

---

## ✅ **Cenários Permitidos**

### **Quando o Upgrade É Permitido:**

#### **Exemplo 1: Primeiro da Fila**

```
#001 - João | ✅ 3/3 doações | ✅ Pode fazer upgrade imediatamente
```

#### **Exemplo 2: Todos Anteriores Já Fizeram Upgrade**

```
#001 - João  | ✅ Fez upgrade
#002 - Maria | ✅ Fez upgrade
#003 - Pedro | ✅ 3/3 doações | ✅ Pode fazer upgrade
```

#### **Exemplo 3: Anteriores Não Completaram**

```
#001 - João  | ✅ Fez upgrade
#002 - Maria | ⏳ 1/3 doações (não completou)
#003 - Pedro | ⏳ 0/3 doações (não completou)
#004 - Ana   | ✅ Fez upgrade
#005 - Carlos| ✅ 3/3 doações | ✅ Pode fazer upgrade
                                    (anteriores não completaram ou já fizeram)
```

---

## 🎨 **Mudanças na Interface**

### **1. Modal de Nível Completado (Atualizado)**

```
╔═══════════════════════════════════════════════════════╗
║  🎉 Parabéns! Você completou o Nível 1!             ║
║                                                       ║
║  📊 Resumo:                                          ║
║  • Doações recebidas: 3/3                           ║
║  • Total recebido: R$ 300,00                        ║
║  • Sua posição: #005                                ║
║                                                       ║
║  🔄 Upgrade disponível para Nível 2                  ║
║                                                       ║
║  Status da fila:                                     ║
║  • #001 - João  ✅ Fez upgrade                      ║
║  • #002 - Maria ✅ Fez upgrade                      ║
║  • #003 - Pedro ✅ Fez upgrade                      ║
║  • #004 - Ana   ✅ Fez upgrade                      ║
║  • #005 - Você  ⏳ Pode fazer upgrade agora!       ║
║                                                       ║
║  💰 Detalhes do Upgrade:                            ║
║  • Upgrade N1→N2: R$ 200                           ║
║  • Cascata N1: R$ 100                              ║
║  • Sua posição no N2: #005 (mantida)               ║
║                                                       ║
║  [✅ Fazer Upgrade]  [⏸️ Aguardar]                 ║
╚═══════════════════════════════════════════════════════╝
```

### **2. Modal de Bloqueio (Novo)**

```
╔═══════════════════════════════════════════════════════╗
║  ⚠️ Upgrade Bloqueado                               ║
║                                                       ║
║  📊 Sua situação:                                    ║
║  • Nível 1: Completado ✅ (3/3 doações)            ║
║  • Sua posição: #005                                ║
║                                                       ║
║  🚫 Não é possível fazer upgrade ainda              ║
║                                                       ║
║  Status da fila:                                     ║
║  • #001 - João  ✅ Fez upgrade                      ║
║  • #002 - Maria ✅ Fez upgrade                      ║
║  • #003 - Pedro ✅ Completou mas não fez upgrade    ║
║  • #004 - Ana   ⏳ Ainda não completou (2/3)       ║
║  • #005 - Você  ⏳ BLOQUEADO                        ║
║                                                       ║
║  📝 Explicação:                                      ║
║  Upgrades devem ser feitos em ordem sequencial.     ║
║  Aguarde os participantes anteriores (#003 e #004)  ║
║  completarem e fazerem upgrade.                     ║
║                                                       ║
║  ⏱️ Você será notificado quando puder fazer        ║
║     upgrade.                                         ║
║                                                       ║
║  [OK, Entendi]                                       ║
╚═══════════════════════════════════════════════════════╝
```

### **3. Indicador de Status na Dashboard**

```
┌──────────────────────────────────────────┐
│ Nível 1                                  │
│ ✅ Completado (3/3 doações)             │
│                                          │
│ Upgrade:                                 │
│ ⏳ Aguardando ordem                     │
│                                          │
│ Você está na posição #005                │
│ 2 usuários à sua frente ainda não        │
│ fizeram upgrade                          │
│                                          │
│ [Ver Detalhes]                          │
└──────────────────────────────────────────┘
```

---

## 🔌 **Endpoint e Resposta**

### **Endpoint (Não Mudou)**

```
POST /donations/accept-upgrade
```

**Body:**
```json
{
  "from_level": 1,
  "to_level": 2
}
```

### **Resposta de Sucesso**

```json
{
  "message": "Upgrade realizado com sucesso!",
  "new_level": 2,
  "donations_created": [
    {
      "type": "upgrade",
      "level": 2,
      "amount": 200,
      "position": 5
    },
    {
      "type": "cascade",
      "level": 1,
      "amount": 100
    }
  ]
}
```

### **Resposta de Erro - Bloqueado**

```json
{
  "statusCode": 400,
  "message": "Aguarde os participantes anteriores fazerem upgrade primeiro. Upgrades devem ser feitos em ordem sequencial.",
  "error": "Bad Request"
}
```

### **Resposta de Erro - Não Completou**

```json
{
  "statusCode": 400,
  "message": "Você ainda não completou este nível",
  "error": "Bad Request"
}
```

---

## 📡 **Novo Endpoint para Verificar Status**

Você pode querer criar um endpoint no frontend para verificar o status antes de mostrar o botão:

```
GET /donations/my-level-progress
```

**Resposta:**
```json
[
  {
    "level": 1,
    "donations_received": 3,
    "donations_required": 3,
    "total_received": 300,
    "progress_percentage": 100,
    "level_completed": true,
    "level_completed_at": "2025-01-15T10:30:00Z",
    "can_upgrade": true,  // ← Adicionar este campo (novo)
    "blocked_by_position": false,  // ← Adicionar este campo (novo)
    "position": 5,  // ← Adicionar este campo (novo)
    "users_ahead_blocking": 2  // ← Adicionar este campo (novo)
  }
]
```

**Sugestão:** Adicione esses campos extras no backend para facilitar a UI.

---

## 🎯 **Fluxo de Experiência do Usuário**

### **Passo 1: Usuário Completa Nível**

1. Usuário recebe a 3ª doação do N1
2. Doador confirma
3. Sistema:
   - Atualiza progresso (3/3)
   - Marca nível como completado
   - **NOVO:** Verifica se pode fazer upgrade
   - Retorna resposta com `upgrade_available`

### **Passo 2: Frontend Verifica Status**

```javascript
// Ao receber confirmação de doação
if (response.level_completed) {
  if (response.upgrade_available.can_upgrade) {
    // Mostrar modal de upgrade permitido
    showUpgradeModal(response.upgrade_available);
  } else {
    // Mostrar modal de upgrade bloqueado
    showBlockedModal({
      message: "Upgrade bloqueado. Aguarde participantes anteriores.",
      position: response.upgrade_available.from_level_position,
      blockingUsers: response.upgrade_available.users_blocking
    });
  }
}
```

### **Passo 3: Usuário Tenta Fazer Upgrade**

```javascript
async function handleUpgradeClick() {
  try {
    const response = await api.post('/donations/accept-upgrade', {
      from_level: 1,
      to_level: 2
    });
    
    // Sucesso!
    showSuccessMessage(response.message);
    refreshLevels();
    
  } catch (error) {
    if (error.response.status === 400) {
      // Bloqueado por ordem
      showErrorModal(error.response.data.message);
    }
  }
}
```

---

## 🧪 **Casos de Teste Frontend**

### **Teste 1: Primeiro da Fila**
- ✅ Completar N1 como #001
- ✅ Ver modal de upgrade
- ✅ Clicar "Fazer Upgrade"
- ✅ Ver sucesso
- ✅ Ver posição #001 no N2

### **Teste 2: Bloqueado por Anterior**
- ✅ Completar N1 como #005
- ✅ #003 completou mas não fez upgrade
- ✅ Ver modal de bloqueio
- ✅ Não ver botão "Fazer Upgrade" ativo

### **Teste 3: Desbloqueio Automático**
- ✅ #003 faz upgrade
- ✅ #004 faz upgrade
- ✅ #005 recebe notificação
- ✅ #005 pode fazer upgrade

---

## 📝 **Checklist de Implementação**

### **Backend (✅ Completo)**
- [x] Validação de ordem sequencial
- [x] Manutenção de posição
- [x] Mensagens de erro claras
- [x] Logs detalhados

### **Frontend (Sugerido)**
- [ ] Atualizar modal de nível completado
- [ ] Criar modal de upgrade bloqueado
- [ ] Adicionar indicador de status na dashboard
- [ ] Mostrar posição atual em cada nível
- [ ] Mostrar quantos usuários estão bloqueando
- [ ] Implementar notificação quando desbloquear
- [ ] Desabilitar botão de upgrade quando bloqueado
- [ ] Adicionar tooltip explicativo
- [ ] Testar todos os cenários de bloqueio

---

## 🚀 **Resumo para Desenvolvedor Frontend**

### **O Que Você Precisa Fazer:**

1. **Verificar resposta de confirmação de doação**
   - Checar `level_completed` e `upgrade_available`

2. **Mostrar modal apropriado**
   - Se `can_upgrade = true` → Modal de upgrade
   - Se `can_upgrade = false` → Modal de bloqueio

3. **Tratar erro 400 no endpoint**
   - Mostrar mensagem de bloqueio ao usuário

4. **Adicionar indicadores visuais**
   - Posição atual
   - Status de upgrade (disponível/bloqueado)
   - Quantos usuários à frente

5. **Implementar sistema de notificação**
   - Notificar quando upgrade for desbloqueado

---

## 📞 **Dúvidas Frequentes**

**Q: E se dois usuários tentarem fazer upgrade ao mesmo tempo?**
A: O backend valida sequencialmente. O primeiro request que chegar será processado. O segundo receberá erro se estiver fora de ordem.

**Q: Posso "pular" o upgrade e ir direto para N3?**
A: Não. Deve fazer upgrade sequencial: N1→N2→N3.

**Q: Minha posição muda quando faço upgrade?**
A: Não. Sua posição é mantida. #005 no N1 vira #005 no N2.

**Q: O que acontece se eu não fizer upgrade?**
A: Você bloqueia todos os usuários depois de você. Eles não poderão fazer upgrade até você fazer.

---

**✅ Implementação Completa no Backend!**
**Frontend pode começar a integrar! 🚀**

