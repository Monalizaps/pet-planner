# 🚀 Guia Rápido - Pet Planner

## Início Rápido

### 1. Instalação
```bash
npm install
```

### 2. Executar o App
```bash
npx expo start
```

### 3. Testar no Dispositivo
- Baixe o app **Expo Go** na App Store ou Google Play
- Escaneie o QR code que aparece no terminal
- O app será carregado automaticamente

---

## 📱 Fluxo de Uso

### Primeira vez usando o app:

1. **Tela Inicial (vazia)**
   - Você verá a mensagem "Nenhum pet cadastrado"
   - Toque no botão **+** (roxo, no canto superior direito)

2. **Adicionar Pet**
   - Toque na área circular para adicionar uma foto (opcional)
   - Digite o nome do pet (ex: "Rex")
   - Selecione o tipo: 🐶 Cachorro, 🐱 Gato, 🦜 Pássaro ou 🐾 Outro
   - Toque em "Salvar Pet"

3. **Ver Detalhes do Pet**
   - Você voltará para a tela inicial
   - Toque no card do pet que acabou de criar
   - Verá a tela de detalhes com a foto e a mensagem "Nenhuma tarefa cadastrada"

4. **Adicionar Tarefa**
   - Toque no botão **+** (roxo, ao lado de "Tarefas")
   - Preencha:
     - **Título**: ex: "Dar ração"
     - **Descrição** (opcional): ex: "2 xícaras pela manhã"
     - **Data**: toque no calendário para escolher
     - **Horário**: toque no relógio para escolher
     - **Recorrência**: escolha entre Única vez, Diária, Semanal ou Mensal
   - Toque em "Salvar Tarefa"

5. **Gerenciar Tarefas**
   - Toque no ⭕ para marcar como concluída (ficará ✅)
   - Toque no 🗑️ para excluir a tarefa
   - Tarefas concluídas ficam riscadas

---

## 🔔 Notificações

As notificações serão enviadas automaticamente nos horários agendados:
- **Primeira vez**: O app pedirá permissão para enviar notificações - clique em "Permitir"
- **Diárias**: Todos os dias no horário escolhido
- **Semanais**: Mesmo dia da semana e horário
- **Mensais**: Mesmo dia do mês e horário

---

## 💡 Dicas

- **Excluir Pet**: Toque e **segure** no card do pet na tela inicial
- **Excluir Tarefa**: Toque no ícone de lixeira 🗑️
- **Editar**: Atualmente não há edição - exclua e crie novamente
- **Backup**: Os dados ficam salvos apenas no dispositivo

---

## 🎨 Exemplos de Uso

### Exemplo 1: Cachorro com rotina de alimentação
- Pet: "Thor" (Cachorro)
- Tarefas:
  - "Dar ração" - Diária às 8h e 18h
  - "Passeio" - Diária às 7h e 19h
  - "Banho" - Semanal aos sábados às 10h

### Exemplo 2: Gato com cuidados veterinários
- Pet: "Luna" (Gato)
- Tarefas:
  - "Limpar caixa de areia" - Diária às 20h
  - "Vacina" - Única vez (data específica)
  - "Escovação" - Semanal às quintas às 19h

---

## ❓ Problemas Comuns

### Notificações não funcionam
- Verifique se permitiu notificações quando o app pediu
- No iOS: Configurações > Pet Planner > Notificações
- No Android: Configurações > Apps > Pet Planner > Notificações

### App não inicia
```bash
# Limpar cache e reinstalar
npx expo start -c
```

### Erros de dependências
```bash
# Reinstalar tudo
rm -rf node_modules package-lock.json
npm install
```

---

## 📦 Próximos Passos (Melhorias Futuras)

- [ ] Editar pets e tarefas
- [ ] Histórico de tarefas concluídas
- [ ] Múltiplos horários para a mesma tarefa
- [ ] Categorias de tarefas (alimentação, saúde, higiene)
- [ ] Sincronização com calendário
- [ ] Exportar/Importar dados
- [ ] Modo escuro
- [ ] Compartilhar cuidados com outros usuários

---

Aproveite seu Pet Planner! 🐾
