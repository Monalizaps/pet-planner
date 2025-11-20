# 🔧 Comandos Úteis - Pet Planner

## Comandos Principais

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npx expo start

# Iniciar com cache limpo
npx expo start -c

# Abrir no iOS Simulator (requer macOS e Xcode)
npx expo start --ios

# Abrir no Android Emulator (requer Android Studio)
npx expo start --android

# Abrir no navegador web
npx expo start --web
```

### Instalação e Limpeza
```bash
# Instalar dependências
npm install

# Reinstalar tudo do zero
rm -rf node_modules package-lock.json
npm install

# Verificar versões dos pacotes
npm list

# Atualizar dependências do Expo
npx expo install --fix
```

### Build e Produção
```bash
# Build para Android (APK)
npx eas build --platform android

# Build para iOS (requer conta Apple Developer)
npx eas build --platform ios

# Build para ambas as plataformas
npx eas build --platform all
```

### Debugging
```bash
# Ver logs em tempo real
npx react-native log-ios
npx react-native log-android

# Inspecionar elementos (no navegador)
# Pressione: j (no terminal do Expo)
```

### TypeScript
```bash
# Verificar erros de tipo
npx tsc --noEmit

# Verificar tipos em watch mode
npx tsc --noEmit --watch
```

### Linting (se configurado)
```bash
# Adicionar ESLint
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Rodar ESLint
npx eslint . --ext .ts,.tsx
```

## Atalhos do Terminal (durante `expo start`)

Quando o servidor Expo está rodando:

- `a` - Abrir no Android
- `i` - Abrir no iOS
- `w` - Abrir no navegador web
- `r` - Recarregar o app
- `m` - Alternar menu
- `d` - Abrir DevTools
- `j` - Abrir React DevTools
- `c` - Limpar cache e recarregar
- `?` - Mostrar todos os comandos

## Estrutura de Pastas

```
pet-planner/
├── app/                    # Código-fonte principal
│   ├── _layout.tsx        # Layout/navegação raiz
│   ├── index.tsx          # Tela inicial (lista de pets)
│   ├── add-pet.tsx        # Formulário de adicionar pet
│   ├── add-task.tsx       # Formulário de adicionar tarefa
│   ├── pet/               # Rotas dinâmicas
│   │   └── [id].tsx       # Detalhes do pet
│   ├── services/          # Lógica de negócio
│   │   └── storage.ts     # AsyncStorage
│   ├── utils/             # Utilitários
│   │   └── notifications.ts
│   └── types/             # Tipos TypeScript
│       └── index.ts
├── node_modules/          # Dependências (gerado)
├── package.json           # Configuração do projeto
├── tsconfig.json          # Configuração TypeScript
├── app.json              # Configuração Expo
└── README.md             # Documentação
```

## Arquivos Importantes

### package.json
- Define dependências e scripts do projeto
- Versões dos pacotes Expo e React Native

### app.json
- Configuração do app (nome, ícone, splash screen)
- Plugins do Expo
- Configurações específicas de plataforma

### tsconfig.json
- Configuração do TypeScript
- Paths e aliases

## Adicionar Novas Dependências

```bash
# Usar comando do Expo (recomendado)
npx expo install nome-do-pacote

# Exemplo: adicionar biblioteca de ícones
npx expo install react-native-vector-icons
```

## Resetar Projeto (se algo der errado)

```bash
# 1. Remover tudo
rm -rf node_modules package-lock.json

# 2. Limpar cache do watchman (macOS/Linux)
watchman watch-del-all

# 3. Reinstalar
npm install

# 4. Iniciar limpo
npx expo start -c
```

## Publicar no Expo (compartilhar online)

```bash
# Fazer login no Expo
npx expo login

# Publicar o projeto
npx expo publish

# Outros usuários podem abrir via QR code ou link
```

## Gerar Build de Produção

### Configurar EAS (Expo Application Services)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

## Dicas de Performance

1. **Otimizar imagens**: Use formato WebP ou compacte PNGs
2. **Lazy loading**: Carregue componentes sob demanda
3. **Memoização**: Use `React.memo` e `useMemo` para listas grandes
4. **AsyncStorage**: Não armazene dados muito grandes (limite ~6MB)
5. **Notificações**: Cancele notificações antigas para economizar memória

## Recursos Adicionais

- [Documentação Expo](https://docs.expo.dev)
- [Expo Router](https://expo.github.io/router)
- [React Native](https://reactnative.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Expo Forums](https://forums.expo.dev)
