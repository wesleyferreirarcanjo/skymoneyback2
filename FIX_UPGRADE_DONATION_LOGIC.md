# 🔧 Fix: Lógica de Doação de Upgrade Corrigida

## ❌ Problema Original

Quando um usuário fazia upgrade, a doação estava sendo criada **para si mesmo**:

```typescript
// ERRADO
donor: userId       // Usuário que faz upgrade
receiver: userId    // Mesmo usuário (ERRADO!)
```

**Resultado:** Usuário doava para si mesmo, sem ajudar os próximos na fila.

---

## ✅ Lógica Correta

### **Regra de Negócio:**

Quando um usuário completa N1 e faz upgrade para N2:

1. ✅ Usuário **paga R$ 200** (doação de upgrade)
2. ✅ Esse R$ 200 **vai para o próximo usuário** que está aguardando no N2
3. ✅ Usuário **também paga R$ 100** (cascata) que vai para próximo no N1
4. ✅ Usuário é **adicionado à fila do N2** na mesma posição

### **Exceção: Primeiro Usuário**

Se o usuário é o **primeiro** a chegar no nível (não tem ninguém antes):
- ❌ Não cria doação de upgrade (não tem para quem doar)
- ✅ Apenas adiciona usuário à fila do próximo nível

---

## 🔄 Fluxo Correto

### **Cenário 1: Usuário #005 Faz Upgrade (Tem Gente no N2)**

```
Estado Inicial:
├─ N1: #005 completou (3/3 doações)
└─ N2: #001, #002, #003 já estão lá
       └─ Próximo a receber: #001

Usuário #005 clica "Aceitar Upgrade":

1. Sistema cria doação de R$ 200:
   ├─ Donor: #005 (quem está fazendo upgrade)
   └─ Receiver: #001 (próximo na fila do N2)

2. Sistema cria cascata de R$ 100:
   ├─ Donor: Sistema
   └─ Receiver: Próximo no N1

3. Sistema adiciona #005 à fila do N2:
   └─ N2: #001, #002, #003, #005
```

### **Cenário 2: Usuário #001 Faz Upgrade (Primeiro no N2)**

```
Estado Inicial:
├─ N1: #001 completou (3/3 doações)
└─ N2: Vazio (ninguém ainda)

Usuário #001 clica "Aceitar Upgrade":

1. Sistema verifica: não tem ninguém no N2
   └─ Não cria doação de upgrade (não tem para quem doar)

2. Sistema cria cascata de R$ 100:
   ├─ Donor: Sistema
   └─ Receiver: Próximo no N1

3. Sistema adiciona #001 à fila do N2:
   └─ N2: #001 (primeiro!)
```

---

## 💻 Implementação

### **Antes (Errado):**

```typescript
private async createUpgradeDonationWithPosition(
    userId: string, 
    targetLevel: number, 
    amount: number,
    position: number
): Promise<void> {
    // Adicionar à fila
    await this.ensureUserInQueueAtPosition(userId, targetLevel, position);
    
    // ❌ ERRADO: Criar doação para si mesmo
    await this.createDonation(
        userId,      // Donor: próprio usuário
        userId,      // Receiver: próprio usuário (ERRADO!)
        amount,
        donationType
    );
}
```

### **Depois (Correto):**

```typescript
private async createUpgradeDonationWithPosition(
    userId: string, 
    targetLevel: number, 
    amount: number,
    position: number
): Promise<void> {
    // Buscar próximo receptor no nível alvo
    const nextReceiver = await this.getNextReceiverInLevel(targetLevel);
    
    if (!nextReceiver || !nextReceiver.user_id) {
        // Primeiro no nível - não cria doação
        this.logger.log(`User ${userId} is first in level ${targetLevel}`);
        await this.ensureUserInQueueAtPosition(userId, targetLevel, position);
        return;
    }
    
    // Adicionar à fila
    await this.ensureUserInQueueAtPosition(userId, targetLevel, position);
    
    // ✅ CORRETO: Criar doação para próximo na fila
    await this.createDonation(
        userId,                  // Donor: usuário que está fazendo upgrade
        nextReceiver.user_id,    // Receiver: próximo na fila do nível alvo
        amount,
        donationType
    );
}
```

---

## 📊 Exemplo Prático

### **Estado do Sistema:**

```
Nível 1:
├─ #001: 3/3 doações ✅ (completou)
├─ #002: 3/3 doações ✅ (completou)
├─ #003: 3/3 doações ✅ (completou)
├─ #004: 2/3 doações ⏳
└─ #005: 3/3 doações ✅ (completou)

Nível 2:
├─ #001: 0/18 doações (precisa receber)
└─ (vazio)
```

### **#001 Faz Upgrade:**

```
POST /donations/accept-upgrade
{
  "from_level": 1,
  "to_level": 2
}

Resultado:
├─ ❌ Sem doação de upgrade (é o primeiro no N2)
├─ ✅ Cascata: R$ 100 → #004 (próximo no N1)
└─ ✅ #001 adicionado ao N2

Nível 2 após:
└─ #001: 0/18 doações
```

### **#002 Faz Upgrade:**

```
POST /donations/accept-upgrade
{
  "from_level": 1,
  "to_level": 2
}

Resultado:
├─ ✅ Upgrade: R$ 200 → #001 (próximo no N2)
├─ ✅ Cascata: R$ 100 → #004 (próximo no N1)
└─ ✅ #002 adicionado ao N2

Nível 2 após:
├─ #001: 1/18 doações (recebeu R$ 200 do #002!)
└─ #002: 0/18 doações
```

### **#003 Faz Upgrade:**

```
POST /donations/accept-upgrade
{
  "from_level": 1,
  "to_level": 2
}

Resultado:
├─ ✅ Upgrade: R$ 200 → #001 (ainda próximo no N2)
├─ ✅ Cascata: R$ 100 → #004 (próximo no N1)
└─ ✅ #003 adicionado ao N2

Nível 2 após:
├─ #001: 2/18 doações (recebeu R$ 200 do #003!)
├─ #002: 0/18 doações
└─ #003: 0/18 doações
```

---

## 🔍 Logs Esperados

### **Primeiro Usuário (Sem Doação):**

```
[UPGRADE] Creating upgrade donation for user abc123 to level 2 at position 1
[UPGRADE] User abc123 is first in level 2, no upgrade donation needed
[UPGRADE] Added user abc123 to level 2 queue at position 1
```

### **Usuários Seguintes (Com Doação):**

```
[UPGRADE] Creating upgrade donation for user def456 to level 2 at position 2
[UPGRADE] Creating donation: donor=def456 (upgrading user), receiver=abc123 (next in line), amount=200, type=UPGRADE_N2
[UPGRADE] Successfully created upgrade donation d12345: 200 from user def456 to user abc123 (position 1) in level 2
```

---

## ✅ Benefícios da Correção

### **Antes (Errado):**
- ❌ Usuário doava para si mesmo
- ❌ Ninguém recebia as doações de upgrade
- ❌ Sistema não funcionava conforme regra de negócio
- ❌ Fila do N2 não recebia dinheiro

### **Depois (Correto):**
- ✅ Usuário doa para próximo na fila
- ✅ Sistema funciona como esperado
- ✅ Cascata real acontece
- ✅ Dinheiro flui corretamente entre níveis
- ✅ Primeiro usuário não cria doação desnecessária

---

## 🧪 Testes

### **Teste 1: Primeiro Usuário**

```sql
-- Verificar N2 está vazio
SELECT COUNT(*) FROM queue WHERE donation_number = 2;
-- Resultado esperado: 0

-- Usuário faz upgrade
POST /donations/accept-upgrade {"from_level": 1, "to_level": 2}

-- Verificar:
-- 1. Usuário foi adicionado ao N2
SELECT * FROM queue WHERE donation_number = 2;
-- Resultado: 1 registro

-- 2. NÃO foi criada doação de upgrade
SELECT * FROM donations WHERE type = 'UPGRADE_N2' AND donor_id = '{userId}';
-- Resultado: 0 registros ✅ (correto)
```

### **Teste 2: Segundo Usuário**

```sql
-- Usuário #002 faz upgrade
POST /donations/accept-upgrade {"from_level": 1, "to_level": 2}

-- Verificar:
-- 1. FOI criada doação de upgrade
SELECT * FROM donations 
WHERE type = 'UPGRADE_N2' 
AND donor_id = '{user002Id}'
AND receiver_id = '{user001Id}';
-- Resultado: 1 registro ✅ (correto)

-- 2. Receptor é o #001
-- 3. Valor é R$ 200
-- 4. Status é PENDING_PAYMENT
```

---

## 📋 Arquivos Modificados

```
✏️ src/donations/donations.service.ts
   - Método: createUpgradeDonationWithPosition()
   - Linhas: 1817-1875
   - Mudanças:
     • Busca próximo receptor no nível alvo
     • Se não tem, apenas adiciona à fila (primeiro usuário)
     • Se tem, cria doação: donor=userId, receiver=nextReceiver
     • Logs detalhados adicionados
```

---

## 🚀 Deploy

```bash
# Build
npm run build

# Commit
git add src/donations/donations.service.ts
git commit -m "fix: correct upgrade donation logic - donor pays to next in line, not themselves"

# Push
git push origin develop
```

---

## ✅ Checklist

- [x] ✅ Lógica corrigida
- [x] ✅ Primeiro usuário tratado corretamente
- [x] ✅ Doação vai para próximo na fila
- [x] ✅ Logs detalhados adicionados
- [x] ✅ Build sem erros
- [x] ✅ Linter sem erros
- [x] ✅ Documentação criada

---

**✅ Correção Aplicada! Sistema Agora Funciona Corretamente!** 🚀

