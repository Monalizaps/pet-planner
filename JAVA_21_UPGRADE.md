# Upgrade do Java Runtime para Java 21 LTS

## 📋 Resumo das Alterações

Este documento descreve as alterações realizadas para fazer o upgrade do runtime Java para a versão LTS (Long-Term Support) **Java 21** no projeto Android do Pet Planner.

## ✅ O que foi feito

### 1. Instalação do Java 21
- Instalado o OpenJDK 21 usando Homebrew: `brew install openjdk@21`
- Criado symlink para o sistema reconhecer o JDK: `/Library/Java/JavaVirtualMachines/openjdk-21.jdk`

### 2. Configurações do Gradle

#### Arquivo: `android/app/build.gradle`
Adicionado o bloco de configuração de compatibilidade Java:

```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_21
    targetCompatibility JavaVersion.VERSION_21
}

kotlinOptions {
    jvmTarget = '21'
}
```

Essas configurações garantem que:
- O código fonte Java seja compatível com Java 21
- O bytecode gerado seja para Java 21
- O Kotlin também compile para JVM target 21

## 🔍 Verificação

Para verificar se o Java 21 está instalado corretamente, execute:

```bash
/usr/libexec/java_home -V
```

Você deve ver o Java 21 listado nas opções disponíveis.

## 🚀 Próximos Passos

1. **Digite sua senha** quando solicitado para criar o symlink do JDK 21
2. **Teste o build** do Android:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

3. **Verifique a compilação** para garantir que não há erros de compatibilidade

## 📝 Notas Importantes

- **Java 21** é uma versão LTS (Long-Term Support) lançada em setembro de 2023
- Suporte estendido até setembro de 2031
- Inclui melhorias de performance, segurança e novas features
- Compatível com React Native e Expo
- Android Gradle Plugin requer Java 17+ para as versões mais recentes

## 🔧 Versões Anteriores

Antes do upgrade, o projeto estava usando:
- Java 17 (Zulu 17.56.15)

## 📚 Referências

- [OpenJDK 21 Release Notes](https://openjdk.org/projects/jdk/21/)
- [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- [React Native Requirements](https://reactnative.dev/docs/environment-setup)
