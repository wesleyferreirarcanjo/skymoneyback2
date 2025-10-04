# 🔧 Fix: userId is required for upgrade

## ❌ Erro Original

```
POST https://skymoney-test-back.dq4298.easypanel.host//donations/accept-upgrade 400 (Bad Request)

Error: 400: Bad Request - Erro ao processar upgrade: userId is required for upgrade
```

---

## 🐛 Causa do Problema

**Arquivo:** `src/donations/donations.controller.ts`

**Linhas:** 406 e 424

**Problema:** Usando `req.user.userId` ao invés de `req.user.id`

```typescript
// ❌ ERRADO (linhas 406 e 424)
req.user.userId  // undefined!

// ✅ CORRETO
req.user.id      // valor correto do JWT payload
```

---

## ✅ Correção Aplicada

### **Antes (Errado):**

```typescript
@Get('my-level-progress')
async getUserLevelProgress(@Request() req) {
    return this.donationsService.getUserLevelProgress(req.user.userId); // ❌
}

@Post('accept-upgrade')
@UseGuards(JwtAuthGuard)
async acceptUpgrade(@Request() req, @Body() body: ...) {
    return this.donationsService.acceptUpgrade(
        req.user.userId,  // ❌
        body.from_level,
        body.to_level
    );
}
```

### **Depois (Correto):**

```typescript
@Get('my-level-progress')
async getUserLevelProgress(@Request() req) {
    return this.donationsService.getUserLevelProgress(req.user.id); // ✅
}

@Post('accept-upgrade')
@UseGuards(JwtAuthGuard)
async acceptUpgrade(@Request() req, @Body() body: ...) {
    return this.donationsService.acceptUpgrade(
        req.user.id,  // ✅
        body.from_level,
        body.to_level
    );
}
```

---

## 📊 Padrão do Projeto

**JWT Payload estrutura:**

```typescript
{
  id: 'afc3e132-5b58-4162-bc8e-42f6093976aa',
  email: 'user1@test.com',
  role: 'USER',
  iat: 1234567890,
  exp: 1234567890
}
```

**Todos os controllers usam:**
- ✅ `req.user.id` (correto)
- ❌ `req.user.userId` (não existe no payload)

**Exemplos no projeto:**

```typescript
// users.controller.ts
getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id); // ✅
}

// donations.controller.ts (outros endpoints)
getStats(@Request() req) {
    return this.donationsService.getStats(req.user.id); // ✅
}

getToSend(@Request() req) {
    return this.donationsService.getToSend(req.user.id); // ✅
}

// queue.controller.ts
findMyQueues(@Request() req) {
    return this.queueService.findByUserId(req.user.id); // ✅
}
```

---

## 🔍 Por Que Aconteceu?

Durante a implementação inicial dos endpoints de upgrade, foi usado `req.user.userId` (provavelmente por analogia com outros frameworks), mas o JWT payload do projeto usa apenas `id`.

---

## ✅ Verificação

### **Build:**
```bash
npm run build
# ✅ Sucesso - sem erros
```

### **Linter:**
```bash
# ✅ Sem erros de linting
```

### **Teste Manual:**
```bash
curl -X POST https://skymoney-test-back.dq4298.easypanel.host/donations/accept-upgrade \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"from_level": 1, "to_level": 2}'

# ✅ Deve funcionar agora
```

---

## 📋 Arquivos Modificados

```
✏️ src/donations/donations.controller.ts
   - Linha 406: req.user.userId → req.user.id
   - Linha 424: req.user.userId → req.user.id
```

---

## 🚀 Deploy

```bash
# Build
npm run build

# Commit
git add src/donations/donations.controller.ts
git commit -m "fix: use req.user.id instead of req.user.userId in upgrade endpoints"

# Push (deploy automático)
git push origin develop
```

---

## ✅ Status

- [x] ✅ Erro identificado
- [x] ✅ Correção aplicada
- [x] ✅ Build sem erros
- [x] ✅ Linter sem erros
- [x] ✅ Pronto para deploy

---

## 🎯 Resultado Esperado

**Antes:**
```json
{
  "statusCode": 400,
  "message": "Erro ao processar upgrade: userId is required for upgrade",
  "error": "Bad Request"
}
```

**Depois:**
```json
{
  "message": "Upgrade realizado com sucesso!",
  "new_level": 2,
  "donations_created": [...]
}
```

---

**✅ Correção Aplicada e Pronta para Deploy!** 🚀

