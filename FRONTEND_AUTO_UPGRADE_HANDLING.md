# 🎯 Frontend: Tratamento de Auto-Upgrade

## 📋 Problema Identificado

Quando usuário completa N1, backend já faz **upgrade automático**, mas:
- ❌ Frontend ainda mostra **modal de upgrade**
- ❌ Quando usuário clica "Aceitar", dá **erro 400**: "Você já está neste nível"

---

## ✅ Solução

### **Resposta do Backend:**

Quando usuário confirma última doação do N1:

```json
{
  "message": "Doação confirmada! Upgrade automático processado.",
  "level_completed": true,
  "completed_level": 1,
  "auto_upgraded": true  // ← NOVO CAMPO
}
```

### **Frontend Deve:**

1. ✅ **Detectar** `auto_upgraded: true`
2. ✅ **NÃO mostrar modal** de confirmação de upgrade
3. ✅ **Mostrar notificação** de sucesso
4. ✅ **Recarregar dados** (doações para enviar/receber)

---

## 💻 Implementação Frontend

### **1. Detectar Auto-Upgrade na Confirmação**

```typescript
// donations.service.ts ou similar
async confirmDonation(donationId: string) {
  const response = await api.post(`/donations/${donationId}/confirm`);
  
  // ✅ Detectar auto-upgrade
  if (response.data.auto_upgraded) {
    // Mostrar notificação de sucesso
    toast.success(
      '🎉 Parabéns! Você completou o nível e foi automaticamente promovido! ' +
      'Suas novas doações já foram criadas.'
    );
    
    // Recarregar dados
    await this.refreshDonations();
    
    return response.data;
  }
  
  // ✅ Se tem upgrade disponível (mas não automático)
  if (response.data.upgrade_available) {
    // Mostrar modal de confirmação (apenas N2 e N3)
    return response.data;
  }
  
  // ✅ Doação normal
  toast.success('Doação confirmada com sucesso!');
  return response.data;
}
```

### **2. No Componente de Doações**

```typescript
// DonationsPage.tsx ou similar
const handleConfirmDonation = async (donationId: string) => {
  try {
    const result = await confirmDonation(donationId);
    
    // ✅ Auto-upgrade: apenas notificar
    if (result.auto_upgraded) {
      // Já foi mostrada notificação no service
      // Apenas recarregar lista
      await loadDonations();
      return;
    }
    
    // ✅ Upgrade disponível (N2/N3): mostrar modal
    if (result.upgrade_available) {
      setShowUpgradeModal(true);
      setUpgradeInfo(result.upgrade_available);
      return;
    }
    
    // ✅ Doação normal
    await loadDonations();
    
  } catch (error) {
    toast.error('Erro ao confirmar doação');
  }
};
```

### **3. Modal de Upgrade (Apenas N2/N3)**

```typescript
// UpgradeModal.tsx
const UpgradeModal = ({ upgradeInfo, onConfirm, onCancel }) => {
  // Este modal SÓ deve aparecer quando:
  // - level_completed: true
  // - upgrade_available: { ... }
  // - auto_upgraded: false ou undefined
  
  // Se auto_upgraded: true, NÃO mostrar este modal
  if (upgradeInfo.auto_upgraded) {
    return null;
  }
  
  return (
    <Modal>
      <h2>🎉 Parabéns! Você completou o nível {upgradeInfo.from_level}!</h2>
      <p>Deseja fazer upgrade para o nível {upgradeInfo.to_level}?</p>
      
      <div>
        <strong>Requisitos:</strong>
        <ul>
          <li>Upgrade: R$ {upgradeInfo.requirements.upgrade_amount}</li>
          {upgradeInfo.requirements.cascade_amount && (
            <li>Cascata: R$ {upgradeInfo.requirements.cascade_amount}</li>
          )}
          {upgradeInfo.requirements.reinjection_amount && (
            <li>Reinjeção: R$ {upgradeInfo.requirements.reinjection_amount}</li>
          )}
        </ul>
      </div>
      
      <button onClick={onConfirm}>✅ Aceitar Upgrade</button>
      <button onClick={onCancel}>❌ Agora Não</button>
    </Modal>
  );
};
```

---

## 📊 Fluxo Completo

### **Cenário 1: N1 (Automático)**

```
Usuário confirma 3ª doação do N1
    ↓
Backend retorna:
{
  "message": "Upgrade automático processado!",
  "level_completed": true,
  "completed_level": 1,
  "auto_upgraded": true  // ← Chave!
}
    ↓
Frontend detecta auto_upgraded: true
    ↓
✅ Mostra toast: "Upgrade automático realizado!"
✅ NÃO mostra modal
✅ Recarrega lista de doações
    ↓
Resultado:
- Usuário agora tem doação de R$ 200 para enviar (UPGRADE_N2)
- Próximo usuário tem cascata de R$ 100 para receber
```

### **Cenário 2: N2 (Manual)**

```
Usuário confirma 18ª doação do N2
    ↓
Backend retorna:
{
  "message": "Doação confirmada com sucesso!",
  "level_completed": true,
  "completed_level": 2,
  "upgrade_available": {
    "can_upgrade": true,
    "from_level": 2,
    "to_level": 3,
    "requirements": { ... }
  }
  // ❌ Sem auto_upgraded
}
    ↓
Frontend detecta upgrade_available (sem auto_upgraded)
    ↓
✅ Mostra modal: "Quer fazer upgrade?"
    ↓
Se usuário clicar "Sim":
    ↓
POST /donations/accept-upgrade
    ↓
Backend cria doações de upgrade
```

---

## 🔍 Como Detectar no Frontend

### **Tipo TypeScript:**

```typescript
interface DonationConfirmResponse {
  message: string;
  level_completed?: boolean;
  completed_level?: number;
  auto_upgraded?: boolean;  // ← NOVO
  upgrade_available?: {
    can_upgrade: boolean;
    from_level: number;
    to_level: number;
    requirements: {
      upgrade_amount?: number;
      cascade_amount?: number;
      reinjection_amount?: number;
      total: number;
    };
  };
}
```

### **Lógica de Detecção:**

```typescript
const handleConfirmResponse = (response: DonationConfirmResponse) => {
  // 1. Verificar auto-upgrade PRIMEIRO
  if (response.auto_upgraded) {
    // N1: Já foi feito automaticamente
    showSuccessNotification();
    reloadDonations();
    return;
  }
  
  // 2. Verificar upgrade disponível (N2/N3)
  if (response.upgrade_available) {
    // N2/N3: Mostrar modal para usuário decidir
    showUpgradeModal(response.upgrade_available);
    return;
  }
  
  // 3. Doação normal
  showSuccessNotification();
  reloadDonations();
};
```

---

## ✅ Checklist de Implementação

### **Backend (Já Implementado):**
- [x] ✅ Retorna `auto_upgraded: true` para N1
- [x] ✅ Retorna `upgrade_available` para N2/N3
- [x] ✅ Cria doações automaticamente no N1
- [x] ✅ Aguarda decisão do usuário no N2/N3

### **Frontend (Precisa Implementar):**
- [ ] ⚠️ Detectar `auto_upgraded: true`
- [ ] ⚠️ NÃO mostrar modal quando `auto_upgraded: true`
- [ ] ⚠️ Mostrar notificação de sucesso
- [ ] ⚠️ Recarregar lista de doações
- [ ] ⚠️ Apenas mostrar modal para N2/N3

---

## 🎯 Resumo

| Campo | Quando Aparece | Ação do Frontend |
|-------|---------------|------------------|
| `auto_upgraded: true` | ✅ N1 completado | Notificar + Recarregar (sem modal) |
| `upgrade_available: {...}` | ✅ N2/N3 completado | Mostrar modal de decisão |
| Nenhum | ✅ Doação normal | Apenas notificar |

---

## 🐛 Debug

### **Se modal ainda aparecer no N1:**

```typescript
// Verificar se está detectando corretamente
console.log('🔍 Confirm response:', response);
console.log('🔍 Auto-upgraded?', response.auto_upgraded);

if (response.auto_upgraded) {
  console.log('✅ N1 auto-upgrade detected - NOT showing modal');
} else if (response.upgrade_available) {
  console.log('⚠️ Manual upgrade available - SHOWING modal');
}
```

### **Se erro "Você já está neste nível":**

Isso significa que:
1. ✅ Backend já fez o upgrade automático
2. ❌ Frontend ainda mostrou o modal
3. ❌ Usuário clicou "Aceitar" de novo
4. ❌ Backend rejeitou (usuário já está no nível 2)

**Solução:** Implementar detecção de `auto_upgraded: true` no frontend.

---

**✅ Com Esta Implementação, Frontend Vai Tratar Corretamente os Auto-Upgrades!** 🎉

