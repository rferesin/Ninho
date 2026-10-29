# Ninho

Ninho e um aplicativo de metas financeiras com envelopes.

A ideia e simples: o dinheiro entra, parte fica reservada em ninhos, e cada ninho mostra quanto ja foi guardado e quanto falta para a meta. Nao e um dashboard de cartoes. E um lugar para guardar dinheiro com proposito.

Exemplos de ninho:

- viagem
- reserva de emergencia
- curso
- entrada de um apartamento

Cada ninho tem meta, prazo, cor, status e um historico de aportes.

## O que o sistema faz

Depois de criar a conta, o usuario consegue:

1. Abrir ninhos com uma meta em reais
2. Guardar aportes ao longo do tempo
3. Acompanhar o progresso em percentual
4. Pausar um ninho quando nao quiser receber aportes
5. Registrar receitas e despesas
6. Organizar movimentos por categoria
7. Ver o mes atual: quanto entrou, quanto saiu, quanto esta reservado

Quando o valor guardado chega na meta, o ninho passa para **Concluido**. Se o usuario remover aportes e o saldo cair, ele volta para **Ativo**.

## Como usar

1. Crie uma conta em `/criar-conta`
2. Abra o primeiro ninho em **Ninhos**
3. Entre no ninho e registre um aporte
4. Lance receitas e despesas em **Movimentos**
5. Ajuste categorias em **Categorias**
6. Acompanhe o mes em **Visao geral**

Nao existe usuario padrao. A primeira vez e sempre **Criar conta**.

Telas:

| Rota | Tela |
| --- | --- |
| `/entrar` | Login |
| `/criar-conta` | Cadastro |
| `/app` | Visao geral do mes |
| `/app/ninhos` | Lista de envelopes |
| `/app/ninhos/:id` | Detalhe, aportes e progresso |
| `/app/movimentos` | Receitas e despesas |
| `/app/categorias` | Categorias do usuario |

## Modelo mental

```
Usuario
  cria Categorias
  abre Ninhos
  guarda Aportes em cada Ninho
  registra Movimentos (receita ou despesa)
```

Um movimento pode apontar para um ninho, mas o saldo do envelope so muda pelos aportes. Assim o historico da meta nao mistura com o extrato do mes.

## Dominio

```
User
  id, name, email, passwordHash

Category
  id, name, color, user

Nest
  id, name, description, targetAmount, currentAmount
  deadline, status, color, user

Contribution
  id, amount, date, note, nest, user

Transaction
  id, description, amount, type, date
  category, nest?, user
```

Status do ninho:

- `ACTIVE` — recebe aportes
- `PAUSED` — bloqueado para novos aportes
- `COMPLETED` — saldo atingiu a meta

Tipo de movimento:

- `INCOME` — receita
- `EXPENSE` — despesa

Ao criar a conta, o sistema ja gera categorias iniciais: Alimentacao, Moradia, Transporte, Saude, Lazer e Salario.

## Arquitetura

```
Angular
  Reactive Forms, HttpClient, Signals
      |
      |  /api  (proxy do Vite/ng serve)
      v
Spring Boot
  Controller -> Service -> Repository
      |
      v
PostgreSQL
```

O frontend nunca fala com o banco. Toda regra de negocio fica no Service Java: validacao, dono do recurso, calculo de progresso e transicao de status.

Pacotes do backend seguem o dominio, nao camadas globais:

```
com.ninho
  user
  category
  nest
  contribution
  transaction
  dashboard
  security
  common
```

No frontend:

```
frontend/src/app
  core/        modelos, API, auth, guards
  layout/      menu lateral
  features/    telas de cada fluxo
```

## API

Autenticacao JWT. Depois do login, as demais rotas exigem `Authorization: Bearer <token>`.

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dashboard

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

GET    /api/transactions
GET    /api/transactions/{id}
POST   /api/transactions
PUT    /api/transactions/{id}
DELETE /api/transactions/{id}

GET    /api/nests
GET    /api/nests/{id}
POST   /api/nests
PUT    /api/nests/{id}
DELETE /api/nests/{id}
GET    /api/nests/{id}/contributions
POST   /api/nests/{id}/contributions
DELETE /api/nests/{id}/contributions/{contributionId}
```

O Angular encaminha `/api` para `http://localhost:3001`.

## Stack

- Frontend: Angular 19, TypeScript, Reactive Forms, HttpClient, RxJS, Signals, Bootstrap 5
- Backend: Java 17, Spring Boot 3, Spring Web, Spring Data JPA, Hibernate, Bean Validation, Spring Security, JWT
- Banco: PostgreSQL 16 no Docker, ou PostgreSQL local

## Como rodar

Precisa de Java 17+, Maven, Node 20+ e Docker (recomendado). Sem Docker, o script tenta o PostgreSQL local.

Se o repositorio veio compactado, entre na pasta `workspace/` primeiro.

```bash
chmod +x scripts/prepare-env.sh scripts/start.sh
./scripts/prepare-env.sh
./scripts/start.sh
```

O `prepare-env.sh` sobe o Postgres e instala as dependencias do Angular.

O `start.sh` espera o banco autenticar, sobe a API e depois o frontend.

Enderecos:

- App: `http://localhost:4200`
- API: `http://localhost:3001`
- Health: `http://localhost:3001/api/health`

O Docker usa uma porta livre a partir de `55432` para nao brigar com um PostgreSQL que ja esteja na 5432 ou 5433.

Quando o start funcionar, o terminal mostra algo como:

```text
[ninho] Banco: jdbc:postgresql://localhost:55432/ninho
```

## Estrutura do repositorio

```text
backend/     API Spring Boot
frontend/    Angular standalone
scripts/     prepare-env.sh, start.sh e lib.sh
docker-compose.yml
```

## Regras importantes

- Cada usuario so ve os proprios ninhos, categorias e movimentos
- Categoria em uso por transacoes nao pode ser excluida
- Ninho pausado recusa aporte
- Excluir um ninho remove o historico de aportes e solta o vinculo nos movimentos
- Senha do cadastro precisa ter no minimo 8 caracteres
