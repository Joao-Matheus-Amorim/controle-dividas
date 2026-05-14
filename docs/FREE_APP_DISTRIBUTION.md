# FamilyFinance - Como Transformar em App de Graça

## Objetivo

Este documento define caminhos gratuitos ou de baixo custo para simular, instalar e validar o FamilyFinance como aplicativo no celular antes de publicar oficialmente nas lojas.

## Estrategia recomendada

A estrategia deve ser em fases:

1. Web responsivo instalado na tela inicial.
2. PWA com manifesto e icones.
3. App Expo em modo desenvolvimento com Expo Go.
4. Build Android gratuito para teste.
5. Publicacao oficial apenas quando o produto estiver validado.

## Caminho 1 - Web app instalado na tela inicial

Este e o caminho mais rapido e gratuito.

O usuario abre o site publicado no navegador do celular e adiciona a tela inicial.

### iPhone

1. Abrir o site no Safari.
2. Tocar em Compartilhar.
3. Tocar em Adicionar a Tela de Inicio.
4. Abrir pelo icone criado.

### Android

1. Abrir o site no Chrome.
2. Tocar no menu de tres pontos.
3. Tocar em Adicionar a tela inicial.
4. Abrir pelo icone criado.

### Vantagens

- Gratuito.
- Nao precisa App Store.
- Nao precisa Google Play.
- Funciona com o site atual.
- Ideal para homologacao familiar.

### Limites

- Ainda e web.
- Sem recursos nativos completos.
- Experiencia depende do navegador.
- Notificacoes podem ser limitadas.

## Caminho 2 - PWA

PWA significa Progressive Web App.

O sistema continua web, mas ganha comportamento mais parecido com app instalado.

### Itens necessarios

- manifest.json.
- icones do app.
- tema visual mobile-first.
- tela de login limpa.
- responsividade forte.
- opcional: service worker.

### Vantagens

- Gratuito.
- Pode ser instalado na tela inicial.
- Mantem um unico codigo web.
- Otimo para primeira entrega familiar.

### Limites

- iOS tem limitacoes.
- Nem todos os recursos nativos ficam disponiveis.
- Ainda nao e app nativo real.

## Caminho 3 - Expo Go

Quando o app mobile React Native for criado, a familia pode testar sem publicar em loja usando Expo Go.

### Fluxo

1. Desenvolvedor roda o app com Expo.
2. Expo mostra um QR Code.
3. Usuario instala Expo Go no celular.
4. Usuario escaneia o QR Code.
5. O app abre no celular.

### Vantagens

- Gratuito para testes.
- Experiencia mais proxima de app nativo.
- Bom para desenvolvimento e validacao.

### Limites

- Precisa Expo Go instalado.
- Nao e instalacao final independente.
- Algumas libs nativas podem exigir development build.

## Caminho 4 - Build Android gratuito

Android permite testes mais flexiveis.

Com Expo/EAS ou build local, e possivel gerar um APK/AAB para instalacao de teste.

### Vantagens

- Pode instalar fora da Play Store.
- Bom para testar com a familia.
- Mais simples que iOS.

### Limites

- Usuario precisa permitir instalacao fora da loja.
- Distribuicao manual exige cuidado.
- Nao substitui publicacao final.

## Caminho 5 - iOS sem App Store

iOS e mais restrito.

Opcoes possiveis:

- Expo Go durante desenvolvimento.
- TestFlight com conta Apple Developer.
- App Store quando estiver pronto.

### Limite importante

Para distribuicao real no iPhone fora do Expo Go, normalmente sera necessario Apple Developer.

## Decisao para o FamilyFinance

A recomendacao para este projeto e:

1. Primeiro entregar web responsivo instalavel na tela inicial.
2. Depois evoluir para PWA.
3. Em seguida criar app Expo e testar com Expo Go.
4. Gerar build Android de teste.
5. Deixar publicacao em lojas para fase posterior.

## Plano pratico imediato

Antes do app nativo, melhorar a web publicada para parecer app:

- login mobile-first;
- cadastro mobile-first;
- dashboard mobile;
- bottom navigation;
- botao rapido de gasto;
- icone e nome de app;
- manifest para instalacao.

## Conclusao

Da para simular e validar o FamilyFinance como app gratuitamente antes de pagar publicacao em loja.

O melhor caminho inicial e transformar a web publicada em experiencia mobile-first instalavel, e depois evoluir para Expo/React Native.
