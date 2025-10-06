# 🐛 Debug: "donor_id violates not-null constraint"

## ❌ Erro Recebido

```json
{
  "message": "Erro ao processar upgrade: null value in column \"donor_id\" of relation \"donations\" violates not-null constraint",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Request:**
```json
POST /donations/accept-upgrade
{
  "from_level": 1,
  "to_level": 2
}
```

---

## 🔍 Causa do Erro

O `donor_id` está sendo `null` ao tentar criar a doação de upgrade. Isso pode acontecer por:

1. ✅ **userId está undefined/null** no fluxo
2. ✅ **Usuário não está na fila do nível atual**
3. ✅ **Problema na query do TypeORM**

---

## 🛠️ Correções Aplicadas

### **1. Validações de userId Adicionadas**

```typescript
// No processLevelUpgradeWithPosition
if (!userId) {
    this.logger.error('[UPGRADE] userId is null or undefined!');
    throw new Error('userId is required for upgrade');
}

// No createUpgradeDonationWithPosition
if (!userId) {
    throw new Error('userId is required for upgrade donation');
}
```

### **2. Logs Detalhados Adicionados**

```typescript
this.logger.log(`[UPGRADE] Processing level upgrade for user ${userId}`);
this.logger.log(`[UPGRADE] Fetching queues for user ${userId}`);
this.logger.log(`[UPGRADE] Found ${userQueues.length} queue entries`);
this.logger.log(`[UPGRADE] User ${userId} is at position ${userPosition}`);
this.logger.log(`Creating donation with donor=${userId}, receiver=${userId}, amount=${amount}`);
```

---

## 🧪 Como Verificar o Problema

### **Passo 1: Verificar se Usuário Está na Fila do N1**

```sql
SELECT 
    u.id,
    u.email,
    u.current_level,
    q.donation_number,
    q.position,
    q.donations_received,
    q.donations_required,
    q.level_completed
FROM users u
LEFT JOIN queue q ON q.user_id = u.id
WHERE u.id = '{userId}'
ORDER BY q.donation_number;
```

**Resultado Esperado:**
```
| id      | email          | current_level | donation_number | position | donations_received | level_completed |
|---------|----------------|---------------|-----------------|----------|-------------------|-----------------|
| abc123  | user@test.com  | 1             | 1               | 5        | 3                 | true            |
```

**❌ Se não aparecer nenhuma linha com `donation_number = 1`:**
→ Usuário NÃO está na fila do N1! Precisa ser adicionado.

**Solução:**
```sql
INSERT INTO queue (
    user_id, 
    donation_number, 
    position, 
    level, 
    donations_required, 
    donations_received,
    level_completed,
    is_receiver
) VALUES (
    '{userId}',   -- ID do usuário
    1,            -- Nível 1
    {position},   -- Próxima posição disponível
    1,            -- Level
    3,            -- 3 doações necessárias no N1
    3,            -- Já recebeu 3 (se completou)
    true,         -- Level completado
    false         -- Não é recebedor atual
);
```

### **Passo 2: Verificar Logs do Servidor**

Após fazer o request, verificar os logs:

```bash
# PM2
pm2 logs skymoney-backend --lines 50

# Docker
docker logs -f skymoney-backend --tail 50
```

**Logs Esperados:**
```
[DonationsService] User abc123 accepting upgrade from level 1 to 2
[DonationsService] [UPGRADE] Processing level upgrade with position for user abc123 from level 1
[DonationsService] [UPGRADE] Fetching queues for user abc123
[DonationsService] [UPGRADE] Found 1 queue entries for user abc123
[DonationsService] [UPGRADE] User abc123 is at position 5 in level 1
[DonationsService] Creating upgrade donation for user abc123 to level 2 at position 5
[DonationsService] Creating donation with donor=abc123, receiver=abc123, amount=200, type=UPGRADE_N2
```

**❌ Se aparecer:**
```
[DonationsService] [UPGRADE] Found 0 queue entries for user abc123
```
→ Usuário não está em nenhuma fila!

**❌ Se aparecer:**
```
[DonationsService] [UPGRADE] User abc123 not found in level 1 queue
```
→ Usuário está em outras filas, mas não no N1!

### **Passo 3: Verificar Estrutura da Tabela Queue**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'queue'
ORDER BY ordinal_position;
```

**Colunas Necessárias:**
- `user_id` (uuid, nullable)
- `donation_number` (integer)
- `position` (integer)
- `level` (integer)
- `donations_received` (integer)
- `donations_required` (integer)
- `level_completed` (boolean)
- `level_completed_at` (timestamp)
- `total_received` (decimal)

**Se alguma coluna estiver faltando**, rodar migration:

```sql
ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_received DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS donations_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS donations_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS level_completed_at TIMESTAMPTZ;
```

---

## 🔧 Soluções Possíveis

### **Solução 1: Usuário Não Está na Fila do N1**

**Verificar:**
```sql
SELECT COUNT(*) 
FROM queue 
WHERE user_id = '{userId}' AND donation_number = 1;
```

**Se retornar 0, adicionar:**
```sql
-- 1. Descobrir próxima posição disponível
SELECT COALESCE(MAX(position), 0) + 1 as next_position
FROM queue
WHERE donation_number = 1;

-- 2. Adicionar usuário na fila
INSERT INTO queue (
    user_id, 
    donation_number, 
    position, 
    level, 
    donations_required,
    donations_received,
    level_completed,
    is_receiver
) VALUES (
    '{userId}',
    1,
    {next_position},  -- Use o valor do SELECT acima
    1,
    3,
    3,  -- Se já completou
    true,  -- Se já completou
    false
);
```

### **Solução 2: Campos Novos da Queue Não Existem**

**Rodar migration completa:**

```sql
-- Adicionar colunas se não existirem
ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS total_received DECIMAL(10,2) DEFAULT 0;

ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS donations_received INTEGER DEFAULT 0;

ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS donations_required INTEGER DEFAULT 0;

ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS level_completed BOOLEAN DEFAULT false;

ALTER TABLE queue 
ADD COLUMN IF NOT EXISTS level_completed_at TIMESTAMPTZ;

-- Atualizar valores padrão para registros existentes
UPDATE queue 
SET 
    level = donation_number,
    donations_required = CASE donation_number
        WHEN 1 THEN 3
        WHEN 2 THEN 18
        WHEN 3 THEN 27
        ELSE 3
    END
WHERE level IS NULL OR donations_required = 0;
```

### **Solução 3: Campo current_level Não Existe na Tabela Users**

```sql
-- Adicionar campo
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1;

-- Atualizar para usuários existentes
UPDATE users 
SET current_level = 1 
WHERE current_level IS NULL;
```

---

## 🎯 Script Completo de Verificação

Rode este script para verificar tudo de uma vez:

```sql
-- 1. Verificar usuário
SELECT 
    u.id,
    u.email,
    u.current_level,
    u.created_at
FROM users u
WHERE u.id = '{userId}';

-- 2. Verificar se está nas filas
SELECT 
    q.donation_number as level,
    q.position,
    q.donations_received,
    q.donations_required,
    q.level_completed,
    q.level_completed_at
FROM queue q
WHERE q.user_id = '{userId}'
ORDER BY q.donation_number;

-- 3. Verificar doações confirmadas recebidas no N1
SELECT 
    d.id,
    d.type,
    d.amount,
    d.status,
    d.completed_at
FROM donations d
WHERE d.receiver_id = '{userId}'
  AND d.status = 'CONFIRMED'
  AND d.amount = 100  -- Doações do N1
ORDER BY d.completed_at;

-- 4. Contar quantas doações recebeu no N1
SELECT COUNT(*) as total_donations_n1
FROM donations d
WHERE d.receiver_id = '{userId}'
  AND d.status = 'CONFIRMED'
  AND d.amount = 100;
```

**Resultado Esperado se Tudo Estiver OK:**

```
-- Usuário existe
| id     | email         | current_level | created_at          |
|--------|---------------|---------------|---------------------|
| abc123 | user@test.com | 1             | 2025-01-01 10:00:00 |

-- Está na fila do N1
| level | position | donations_received | donations_required | level_completed |
|-------|----------|-------------------|-------------------|-----------------|
| 1     | 5        | 3                 | 3                 | true            |

-- Recebeu 3 doações no N1
| id   | type | amount | status    | completed_at        |
|------|------|--------|-----------|---------------------|
| d001 | PULL | 100    | CONFIRMED | 2025-01-01 11:00:00 |
| d002 | PULL | 100    | CONFIRMED | 2025-01-01 12:00:00 |
| d003 | PULL | 100    | CONFIRMED | 2025-01-01 13:00:00 |

-- Total: 3 doações
| total_donations_n1 |
|--------------------|
| 3                  |
```

---

## 🚀 Procedimento de Correção Completo

### **1. Deploy do Código Atualizado**

```bash
git pull origin develop
npm run build
pm2 restart skymoney-backend
```

### **2. Verificar Estado do Usuário Específico**

Substituir `{userId}` pelo ID real do usuário que teve o erro:

```sql
-- Verificar tudo
SELECT 
    u.id as user_id,
    u.email,
    u.current_level,
    q.donation_number as queue_level,
    q.position,
    q.donations_received,
    q.level_completed,
    COUNT(d.id) as donations_confirmed
FROM users u
LEFT JOIN queue q ON q.user_id = u.id
LEFT JOIN donations d ON d.receiver_id = u.id 
    AND d.status = 'CONFIRMED' 
    AND d.amount = 100
WHERE u.id = '{userId}'
GROUP BY u.id, u.email, u.current_level, q.donation_number, q.position, q.donations_received, q.level_completed;
```

### **3. Corrigir se Necessário**

**Se `queue_level` for NULL:**
```sql
-- Adicionar à fila do N1
INSERT INTO queue (user_id, donation_number, position, level, donations_required, donations_received, level_completed)
SELECT 
    '{userId}',
    1,
    COALESCE(MAX(position), 0) + 1,
    1,
    3,
    (SELECT COUNT(*) FROM donations WHERE receiver_id = '{userId}' AND status = 'CONFIRMED' AND amount = 100),
    (SELECT COUNT(*) FROM donations WHERE receiver_id = '{userId}' AND status = 'CONFIRMED' AND amount = 100) >= 3
FROM queue
WHERE donation_number = 1;
```

### **4. Testar Novamente**

```bash
curl -X POST https://skymoney-test-back.dq4298.easypanel.host/donations/accept-upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"from_level": 1, "to_level": 2}'
```

### **5. Verificar Logs**

```bash
pm2 logs skymoney-backend --lines 100 | grep "\[UPGRADE\]"
```

---

## ✅ Checklist

- [ ] Código atualizado com validações e logs
- [ ] Deploy realizado
- [ ] Tabela `queue` tem todas as colunas necessárias
- [ ] Tabela `users` tem coluna `current_level`
- [ ] Usuário está na fila do N1 (verificado com SQL)
- [ ] Usuário tem `level_completed = true` no N1
- [ ] Logs mostram detalhes do processamento
- [ ] Teste manual executado com sucesso

---

**✅ Com essas correções e validações, o erro deve ser resolvido!**

Se o erro persistir, os logs detalhados irão mostrar exatamente onde está o problema.

