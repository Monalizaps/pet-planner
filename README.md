# 🐾 Pet Planner

<div align="center">

![Pet Planner](https://img.shields.io/badge/Pet-Planner-6C63FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDIxQzE2LjQxODMgMjEgMjAgMTcuNDE4MyAyMCAxM0MyMCA4LjU4MTcyIDE2LjQxODMgNSAxMiA1QzcuNTgxNzIgNSA0IDguNTgxNzIgNCAxM0M0IDE3LjQxODMgNy41ODE3MiAyMSAxMiAyMVoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)

**O aplicativo completo para cuidar dos seus pets com estilo e segurança! 🐶🐱**

[Recursos](#-recursos) • [Instalação](#-instalação) • [Segurança](#-segurança) • [Screenshots](#-screenshots) • [Tecnologias](#-tecnologias)

</div>

---

## 📱 Sobre o Projeto

Pet Planner é um aplicativo mobile completo desenvolvido em React Native + Expo que permite aos tutores de pets gerenciar de forma fácil e segura todas as informações e cuidados com seus animais de estimação.

### ✨ Destaques

- 🎨 **Interface Moderna**: Design clean e intuitivo com gradientes e animações
- 🔒 **Segurança Máxima**: 7 camadas de proteção contra adulteração de dados
- 📅 **Calendário Inteligente**: Visualize todas as tarefas com marcadores de patinha
- 📸 **Perfis Completos**: Foto, raça, idade, peso e muito mais
- 🔔 **Notificações**: Lembretes para não esquecer nenhum cuidado
- 🌐 **Feed Social**: Compartilhe curiosidades e links das redes sociais

---

## 🚀 Recursos

### 👤 Perfil do Tutor
- ✅ Criação de perfil personalizado com foto
- ✅ Edição de informações (nome, email, telefone)
- ✅ Saudação personalizada na tela inicial
- ✅ Opção de excluir perfil e todos os dados

### 🐾 Gestão de Pets
- ✅ Adicionar pets com foto e informações completas
- ✅ Tipos: Cachorro, Gato, Pássaro, Outro
- ✅ Dados: Nome, raça, data de nascimento, peso, cor, notas
- ✅ Cálculo automático de idade
- ✅ Editar e excluir pets
- ✅ Perfil individual de cada pet

### 📋 Tarefas e Lembretes
- ✅ Criar tarefas vinculadas a cada pet
- ✅ Agendamento de data e hora
- ✅ Notificações push no horário agendado
- ✅ Tarefas recorrentes (diária, semanal, mensal)
- ✅ Marcar como concluída
- ✅ Visualização no calendário

### 📅 Calendário
- ✅ Visualização mensal em português
- ✅ Marcadores de patinha (🐾) nos dias com tarefas
- ✅ Cores diferentes para dia atual
- ✅ Interface intuitiva e responsiva

### 📱 Feed Social
- ✅ Compartilhar curiosidades sobre seus pets
- ✅ Links para TikTok e Instagram
- ✅ Criar posts personalizados
- ✅ Excluir posts
- ✅ Pull to refresh

### 🔒 Segurança
- ✅ Criptografia SHA-256 de todos os dados
- ✅ Validação de integridade com checksum
- ✅ Proteção contra XSS e injeção
- ✅ Rate limiting em todas operações
- ✅ Sanitização automática de inputs
- ✅ Detecção de adulteração de dados
- ✅ Proteção contra Burp Suite e proxies

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Expo Go app (para testar no dispositivo)

### Passo a Passo

```bash
# Clone o repositório
git clone https://github.com/Monalizaps/pet-planner.git

# Entre na pasta
cd pet-planner

# Instale as dependências
npm install --legacy-peer-deps

# Inicie o projeto
npx expo start
```

### Executar no Dispositivo

1. Instale o **Expo Go** no seu smartphone
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Escaneie o QR Code que aparece no terminal

3. Pronto! O app abrirá no seu dispositivo 📱

---

## 🛡️ Segurança

O Pet Planner implementa **7 camadas de segurança** para proteger seus dados:

### 1️⃣ Criptografia de Dados
Todos os dados são criptografados usando SHA-256 antes de serem salvos localmente.

### 2️⃣ Validação de Integridade
Checksums automáticos detectam qualquer adulteração de dados.

### 3️⃣ Validação de Schema
Todos os dados são validados antes de serem aceitos.

### 4️⃣ Sanitização XSS
Proteção contra injeção de scripts maliciosos.

### 5️⃣ Rate Limiting
Prevenção de abuso com limites de requisições.

### 6️⃣ Anti-Tampering
Detecção de modificações no app e nos dados.

### 7️⃣ Proteção contra Proxies
Detecção de Burp Suite e ferramentas de interceptação.

📖 **Documentação completa**: [SECURITY.md](./SECURITY.md)  
🔧 **Guia de uso**: [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)

---

## 📸 Screenshots

<div align="center">

| Tela Inicial | Perfil do Pet | Calendário |
|:---:|:---:|:---:|
| ![Home](https://via.placeholder.com/250x500/6C63FF/FFFFFF?text=Home) | ![Pet](https://via.placeholder.com/250x500/6C63FF/FFFFFF?text=Pet+Profile) | ![Calendar](https://via.placeholder.com/250x500/6C63FF/FFFFFF?text=Calendar) |

| Adicionar Pet | Feed Social | Perfil do Tutor |
|:---:|:---:|:---:|
| ![Add](https://via.placeholder.com/250x500/6C63FF/FFFFFF?text=Add+Pet) | ![Feed](https://via.placeholder.com/250x500/6C63FF/FFFFFF?text=Social+Feed) | ![Profile](https://via.placeholder.com/250x500/6C63FF/FFFFFF?text=Tutor+Profile) |

</div>

---

## 🛠️ Tecnologias

### Core
- **[React Native](https://reactnative.dev/)** - Framework mobile
- **[Expo SDK 54](https://expo.dev/)** - Plataforma de desenvolvimento
- **[TypeScript](https://www.typescriptlang.org/)** - Linguagem tipada

### Navegação
- **[Expo Router v6](https://docs.expo.dev/router/introduction/)** - Navegação file-based

### UI/UX
- **[React Native Calendars](https://github.com/wix/react-native-calendars)** - Calendário
- **[@expo/vector-icons](https://icons.expo.fyi/)** - Ícones
- **React Native Gestures & Reanimated** - Animações

### Armazenamento
- **[@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage)** - Storage local

### Segurança
- **[expo-crypto](https://docs.expo.dev/versions/latest/sdk/crypto/)** - Criptografia SHA-256
- **Custom Security Layer** - Sistema proprietário de segurança

### Funcionalidades
- **[expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)** - Push notifications
- **[expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)** - Seleção de imagens
- **[@react-native-community/datetimepicker](https://github.com/react-native-datetimepicker/datetimepicker)** - Seletor de data/hora
- **[uuid](https://www.npmjs.com/package/uuid)** - Geração de IDs únicos

---

## 📂 Estrutura do Projeto

```
pet-planner/
├── app/
│   ├── services/          # Serviços (storage, security)
│   │   ├── storage.ts     # CRUD com criptografia
│   │   ├── security.ts    # Sistema de segurança
│   │   └── appSecurity.ts # Proteções do app
│   ├── types/             # TypeScript interfaces
│   │   └── index.ts       # Tutor, Pet, Task
│   ├── utils/             # Utilitários
│   │   └── notifications.ts
│   ├── _layout.tsx        # Root layout
│   ├── index.tsx          # Tela inicial
│   ├── profile.tsx        # Perfil do tutor
│   ├── add-pet.tsx        # Adicionar pet
│   ├── edit-pet.tsx       # Editar pet
│   ├── add-task.tsx       # Adicionar tarefa
│   └── feed.tsx           # Feed social
├── SECURITY.md            # Documentação de segurança
├── SECURITY_GUIDE.md      # Guia de uso de segurança
├── package.json
└── README.md
```

---

## 🎯 Roadmap

### ✅ Versão 1.0 (Atual)
- [x] Gestão completa de pets
- [x] Sistema de tarefas e notificações
- [x] Calendário em português
- [x] Perfil do tutor
- [x] Feed social
- [x] Sistema de segurança completo

### 🔜 Próximas Versões
- [ ] Backup em nuvem (criptografado)
- [ ] Autenticação biométrica
- [ ] Gráficos de peso e saúde
- [ ] Compartilhamento entre tutores
- [ ] Histórico veterinário
- [ ] Lembretes de vacinas
- [ ] Dark mode
- [ ] Múltiplos idiomas

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abrir um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👩‍💻 Autora

**Monaliza Pereira**

- GitHub: [@Monalizaps](https://github.com/Monalizaps)
- LinkedIn: [Monaliza Pereira](https://www.linkedin.com/in/monalizaps)

---

## 💜 Agradecimentos

- Expo Team pela excelente plataforma
- Comunidade React Native
- Todos os tutores de pets que inspiraram este projeto

---

<div align="center">

**Feito com 💜 e muito ☕ por Monaliza Pereira**

Se este projeto te ajudou, considere dar uma ⭐!

</div>
```

2. **Inicie o servidor Expo**:
```bash
npx expo start
```

3. **Execute no dispositivo**:
   - Para iOS: Pressione `i` ou escaneie o QR code com o app Expo Go
   - Para Android: Pressione `a` ou escaneie o QR code com o app Expo Go
   - Para Web: Pressione `w`

## 📱 Como Usar

1. **Adicionar um Pet**:
   - Toque no botão `+` na tela inicial
   - Adicione uma foto (opcional)
   - Digite o nome do pet
   - Selecione o tipo de pet
   - Salve

2. **Criar uma Tarefa**:
   - Toque em um pet para ver seus detalhes
   - Toque no botão `+` na seção de tarefas
   - Digite o título da tarefa
   - Adicione uma descrição (opcional)
   - Escolha a data e horário
   - Selecione a recorrência (única, diária, semanal ou mensal)
   - Salve

3. **Gerenciar Tarefas**:
   - Toque no checkbox para marcar como concluída
   - Toque no ícone de lixeira para excluir
   - Toque e segure em um pet para excluí-lo

## 🔔 Permissões Necessárias

- **Notificações**: Para receber lembretes de tarefas
- **Biblioteca de Fotos**: Para adicionar fotos dos pets (opcional)

## 📝 Notas

- Os dados são armazenados localmente no dispositivo usando AsyncStorage
- As notificações funcionam mesmo quando o app está fechado
- Exclua um pet e todas as suas tarefas serão removidas automaticamente

## 🤝 Contribuindo

Este é um projeto de exemplo. Sinta-se livre para fazer fork e personalizar!

## 📄 Licença

MIT
