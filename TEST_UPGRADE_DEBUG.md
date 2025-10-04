# 🐛 Debug do Erro 500 no Upgrade

## 📋 Correções Implementadas

### ✅ **1. Adicionado `@UseGuards(JwtAuthGuard)` no endpoint**
```typescript
@Post('accept-upgrade')
@UseGuards(JwtAuthGuard)  // ← ADICIONADO
async acceptUpgrade(...)
```

**Problema:** Sem o guard, `req.user` pode ser `undefined`.

---

### ✅ **2. Try-Catch Completo no `acceptUpgrade`**
```typescript
async acceptUpgrade(...) {
    try {
        // 1. Verificar se usuário existe ANTES de usar
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }
        
        // ... resto do código
        
    } catch (error) {
        this.logger.error(`Error in acceptUpgrade for user ${userId}:`, error);
        // Re-throw com mensagem clara
        throw new BadRequestException(`Erro ao processar upgrade: ${error.message}`);
    }
}
```

**Problema:** Se `user` fosse `null`, `user.current_level` causaria erro.

---

### ✅ **3. Proteção no `createCascadeDonation`**
```typescript
private async createCascadeDonation(level: number, amount: number) {
    try {
        const nextReceiver = await this.getNextReceiverInLevel(level);
        
        if (!nextReceiver || !nextReceiver.user_id) {
            this.logger.warn(`No receiver found - skipping cascade`);
            return; // ← Não falha, apenas avisa
        }
        
        // ... criar doação
        
    } catch (error) {
        this.logger.error(`Error creating cascade:`, error);
        // NÃO lança erro - falha de cascade não deve bloquear upgrade
        this.logger.warn(`Continuing without cascade`);
    }
}
```

**Problema:** Se não houver próximo recebedor no N1, a cascata falhava e bloqueava todo o upgrade.

---

## 🧪 Como Testar

### **1. Verificar Logs no Servidor**

Após deploy, monitore os logs:

```bash
# Logs do NestJS mostrarão:
[DonationsService] User {userId} accepting upgrade from level 1 to 2
[DonationsService] User {userId} is at position {position} in level 1
[DonationsService] Created upgrade donation: 200 to level 2 at position {position}
[DonationsService] Created cascade donation: 100 for level 1 to user {nextUserId}
[DonationsService] User {userId} successfully upgraded from level 1 to 2
```

### **2. Teste Manual no Frontend**

```javascript
// Console do navegador
const response = await fetch('/donations/accept-upgrade', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    from_level: 1,
    to_level: 2
  })
});

const data = await response.json();
console.log('Response:', data);
```

**Respostas Esperadas:**

#### ✅ Sucesso:
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

#### ❌ Erro - Não Completou:
```json
{
  "statusCode": 400,
  "message": "Você ainda não completou este nível"
}
```

#### ❌ Erro - Bloqueado:
```json
{
  "statusCode": 400,
  "message": "Aguarde os participantes anteriores fazerem upgrade primeiro. Upgrades devem ser feitos em ordem sequencial."
}
```

#### ❌ Erro - Já Fez Upgrade:
```json
{
  "statusCode": 400,
  "message": "Você já está neste nível ou superior"
}
```

---

## 🔍 Checklist de Debug

### **Antes de Tentar Upgrade:**

- [ ] Usuário completou o nível? (3/3 doações no N1)
- [ ] Usuário está na fila do N1? (verificar tabela `queue`)
- [ ] `current_level` do usuário é 1? (verificar tabela `users`)
- [ ] Todos usuários anteriores fizeram upgrade ou não completaram?
- [ ] Token JWT é válido? (verificar headers)

### **SQL para Verificar Estado:**

```sql
-- 1. Verificar progresso do usuário
SELECT 
    u.id,
    u.email,
    u.current_level,
    q.donation_number,
    q.position,
    q.donations_received,
    q.donations_required,
    q.level_completed,
    q.level_completed_at
FROM users u
LEFT JOIN queue q ON q.user_id = u.id
WHERE u.id = '{userId}'
ORDER BY q.donation_number;

-- 2. Verificar fila do N1
SELECT 
    q.position,
    u.email,
    u.current_level,
    q.donations_received,
    q.donations_required,
    q.level_completed,
    CASE 
        WHEN u.current_level = 1 THEN '⏳ No N1'
        WHEN u.current_level >= 2 THEN '✅ Fez upgrade'
        ELSE '❓ Indefinido'
    END as status
FROM queue q
JOIN users u ON u.id = q.user_id
WHERE q.donation_number = 1
ORDER BY q.position;

-- 3. Verificar se há admin no sistema
SELECT id, email, role 
FROM users 
WHERE role = 'ADMIN';
```

---

## 🚨 Possíveis Causas do Erro 500

### **Causa 1: Usuário Não Existe na Fila**
```
Erro: User {userId} not found in level 1
```

**Solução:** Adicionar usuário à fila do N1:
```sql
INSERT INTO queue (user_id, donation_number, position, level, donations_required, is_receiver)
VALUES ('{userId}', 1, {next_position}, 1, 3, false);
```

### **Causa 2: Campo `current_level` Não Existe**
```
Erro: column "current_level" does not exist
```

**Solução:** Rodar migration:
```sql
ALTER TABLE users ADD COLUMN current_level INTEGER DEFAULT 1;
```

### **Causa 3: Campos da Queue Não Existem**
```
Erro: column "level_completed" does not exist
```

**Solução:** Rodar migration:
```sql
ALTER TABLE queue 
ADD COLUMN level INTEGER DEFAULT 1,
ADD COLUMN total_received DECIMAL(10,2) DEFAULT 0,
ADD COLUMN donations_received INTEGER DEFAULT 0,
ADD COLUMN donations_required INTEGER DEFAULT 0,
ADD COLUMN level_completed BOOLEAN DEFAULT false,
ADD COLUMN level_completed_at TIMESTAMPTZ;
```

### **Causa 4: Sem Admin no Sistema**
```
Aviso: No admin user found, using receiver as donor for cascade
```

**Solução:** Criar usuário admin:
```sql
INSERT INTO users (email, role, password, first_name, last_name)
VALUES ('admin@skymoney.com', 'ADMIN', 'hash...', 'Sistema', 'Admin');
```

---

## 📡 Endpoints Relacionados

### **Verificar Progresso**
```
GET /donations/my-level-progress
Authorization: Bearer {token}
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
    "level_completed_at": "2025-01-15T10:30:00Z"
  }
]
```

### **Fazer Upgrade**
```
POST /donations/accept-upgrade
Authorization: Bearer {token}
Content-Type: application/json

{
  "from_level": 1,
  "to_level": 2
}
```

### **Ver Fila de um Nível**
```
GET /queue?donationNumber=1
Authorization: Bearer {admin_token}
```

---

## 🔧 Como Aplicar as Correções

### **1. No Servidor de Produção:**

```bash
# 1. Fazer pull do código
git pull origin develop

# 2. Instalar dependências (se necessário)
npm install

# 3. Compilar
npm run build

# 4. Reiniciar servidor
pm2 restart skymoney-backend
# ou
npm run start:prod
```

### **2. Verificar Logs em Tempo Real:**

```bash
# PM2
pm2 logs skymoney-backend --lines 100

# Docker
docker logs -f skymoney-backend --tail 100

# Direto
tail -f logs/application.log
```

---

## 📝 Mensagens de Log Esperadas

### **Upgrade com Sucesso:**
```
[DonationsService] User abc123 accepting upgrade from level 1 to 2
[DonationsService] User abc123 is at position 5 in level 1
[DonationsService] Added user abc123 to level 2 queue at position 5
[DonationsService] Created upgrade donation: 200 to level 2 at position 5 for user abc123
[DonationsService] Created cascade donation: 100 for level 1 to user def456
[DonationsService] User abc123 successfully upgraded from level 1 to 2
```

### **Upgrade Bloqueado:**
```
[DonationsService] User abc123 accepting upgrade from level 1 to 2
[DonationsService] User abc123 (position 5) cannot upgrade yet. 
                   User xyz789 (position 3) completed but hasn't upgraded.
[DonationsService] Error in acceptUpgrade for user abc123: BadRequestException: 
                   Aguarde os participantes anteriores fazerem upgrade primeiro.
```

### **Sem Próximo Recebedor (Normal):**
```
[DonationsService] No receiver found for level 1 cascade - skipping
[DonationsService] Continuing without cascade donation for level 1
```

---

## ✅ Checklist Final

Antes de considerar resolvido:

- [ ] Build sem erros (`npm run build`)
- [ ] Sem erros de linting
- [ ] Endpoint tem `@UseGuards(JwtAuthGuard)`
- [ ] Try-catch implementado
- [ ] Logs detalhados adicionados
- [ ] Cascata não bloqueia upgrade se falhar
- [ ] Testes manuais realizados
- [ ] Logs de produção verificados

---

## 🆘 Se o Erro Persistir

### **Coletar Informações:**

1. **Log completo do erro** (com stack trace)
2. **Estado do usuário** (SQL acima)
3. **Headers da requisição** (especialmente Authorization)
4. **Body da requisição**
5. **Versão do código** (`git rev-parse HEAD`)

### **Teste Isolado:**

Teste cada método individualmente:

```typescript
// No console do NestJS ou em teste unitário
const service = app.get(DonationsService);

// 1. Verificar se usuário está na fila
const queues = await service.queueService.findByUserId(userId);
console.log('User queues:', queues);

// 2. Verificar se completou
const completed = await service.checkLevelCompletion(userId, 1);
console.log('Level completed:', completed);

// 3. Verificar se pode fazer upgrade
const canUpgrade = await service.canUserUpgradeInOrder(userId, 1);
console.log('Can upgrade:', canUpgrade);
```

---

**✅ Correções Aplicadas e Prontas para Deploy!**

