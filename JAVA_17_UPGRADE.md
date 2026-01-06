# Upgrade do Java Runtime para Java 17 LTS

## 📋 Resumo das Alterações

Este documento descreve as alterações realizadas para fazer o upgrade do runtime Java para a versão LTS (Long-Term Support) **Java 17** no projeto Android do Pet Planner.

**Nota**: Embora o objetivo inicial fosse migrar para Java 21, optamos por Java 17 devido à melhor compatibilidade com o ecossistema React Native e Expo atual.

## ✅ O que foi feito

### 1. Preparação do Ambiente
- Verificado que o OpenJDK 17 (Zulu) já estava instalado no sistema
- Verificado que o Java 21 está disponível para futuras migrações
- Configurado o ambiente para usar Java 17 como baseline

### 2. Configurações do Projeto

#### Arquivo: `android/app/build.gradle`
Adicionadas as configurações de compatibilidade Java 17:

```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}

kotlinOptions {
    jvmTarget = '17'
}

// Configure Java Toolchain
java {
  toolchain {
    languageVersion = JavaLanguageVersion.of(17)
  }
}
```

#### Arquivo: `android/build.gradle`
Adicionada configuração global para todos os subprojetos:

```gradle
allprojects {
  repositories {
    google()
    mavenCentral()
    maven { url 'https://www.jitpack.io' }
  }
  
  // Configure JVM Toolchain for Java 17
  plugins.withType(JavaPlugin) {
    java {
      toolchain {
        languageVersion = JavaLanguageVersion.of(17)
      }
    }
  }
}
```

#### Arquivo: `android/gradle.properties`
Configurado o JDK home para Java 17:

```properties
# Configure Java version
org.gradle.java.home=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

Essas configurações garantem que:
- O código fonte Java seja compatível com Java 17
- O bytecode gerado seja para Java 17
- O Kotlin também compile para JVM target 17
- Todas as dependências usem a mesma versão de Java

## 🔍 Verificação

Para verificar se o Java 17 está configurado corretamente:

```bash
cd android
export JAVA_HOME="/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home"
./gradlew clean
./gradlew assembleDebug
```

O build deve ser executado com sucesso sem conflitos de versão Java.

## 📊 Decisão Técnica: Por que Java 17?

### Motivos para escolher Java 17 ao invés de Java 21:

1. **Compatibilidade com React Native**: O ecossistema React Native ainda tem melhor suporte para Java 17
2. **Dependências terceiras**: Muitas bibliotecas React Native têm configurações hardcoded para Java 17
3. **Estabilidade**: Java 17 é mais maduro e testado no contexto de desenvolvimento mobile
4. **Suporte LTS**: Java 17 também é uma versão LTS com suporte até setembro de 2029

### Teste realizado com Java 21:
- ❌ Conflitos de JVM Target entre Java e Kotlin tasks
- ❌ Incompatibilidade com dependências como `@react-native-community/datetimepicker`
- ❌ Complexidade adicional de configuração sem benefícios evidentes

### Resultado com Java 17:
- ✅ Build bem-sucedido sem conflitos
- ✅ Compatibilidade total com todas as dependências
- ✅ Configuração simples e direta
- ✅ Melhor suporte do ecossistema

## 🎯 Benefícios Alcançados

- **Performance**: Java 17 oferece melhorias significativas de performance comparado ao Java 8
- **Segurança**: Correções de segurança e atualizações mais recentes
- **Recursos**: Acesso a recursos modernos da linguagem Java (records, pattern matching, etc.)
- **Compatibilidade**: Mantém compatibilidade total com React Native e Expo
- **Suporte LTS**: Suporte garantido até setembro de 2029

## 🔧 Versões Anteriores vs Atual

| Aspecto | Antes | Depois |
|---------|--------|---------|
| Java Runtime | Java 8 (implícito) | Java 17 LTS |
| Configuração | Não explícita | Explícita e consistente |
| Toolchain | Não configurado | JVM Toolchain configurado |
| Compatibilidade | Básica | Otimizada para React Native |

## 📚 Referências

- [Java 17 Release Notes](https://openjdk.org/projects/jdk/17/)
- [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- [React Native Requirements](https://reactnative.dev/docs/environment-setup)
- [Gradle JVM Toolchain Documentation](https://docs.gradle.org/current/userguide/toolchains.html)
