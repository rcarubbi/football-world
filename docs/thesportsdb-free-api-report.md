# TheSportsDB — Relatório API Free

## Rate Limiting

| Tier | Requests/min | HTTP 429 se exceder |
|------|-------------|---------------------|
| **Free** | **30** | Espera 1 minuto |
| Premium | 100 | — |
| Business | 120 | — |

**Chave free:** `123`
**Base URL v1:** `https://www.thesportsdb.com/api/v1/json/123/`
**V2:** Exclusivo Premium ($9/mês)

---

## O que está disponível no Free (V1)

### Search (Busca por texto)

| Endpoint | Parâmetro | Limite Free | Limite Premium |
|----------|-----------|-------------|----------------|
| `searchteams.php?t=` | Nome do time | **1 resultado** | 100 |
| `searchevents.php?e=` | Nome do evento | **1 resultado** | 10 |
| `searchevents.php?d=` | Data do evento | — | — |
| `searchevents.php?s=` | Temporada | — | — |
| `searchfilename.php?e=` | Filename do evento | **1 resultado** | 10 |
| `searchplayers.php?p=` | Nome do jogador | **1 resultado** | 10 |
| `searchvenues.php?v=` | Nome do estádio | **1 resultado** | 10 |

**Observação:** Busca free retorna apenas 1 resultado. Para busca completa, é necessário Premium.

### Lookup (Busca por ID)

| Endpoint | Parâmetro | Limite Free | Limite Premium |
|----------|-----------|-------------|----------------|
| `lookupleague.php?id=` | ID da liga | 1 | 1 |
| `lookuptable.php?l=&s=` | Classificação da liga | 5 | 100 |
| `lookupteam.php?id=` | ID do time | 1 | 1 |
| `lookupequipment.php?id=` | Equipamentos do time | 2 | 100 |
| `lookupplayer.php?id=` | ID do jogador | 1 | 1 |
| `lookuphonours.php?id=` | Títulos do jogador | 5 | 500 |
| `lookupformerteams.php?id=` | Times anteriores | 5 | 100 |
| `lookupmilestones.php?id=` | Marcos do jogador | 5 | 100 |
| `lookupcontracts.php?id=` | Contratos do jogador | 1 | 100 |
| `playerresults.php?id=` | Resultados do jogador | 5 | 500 |
| `lookupplayerstats.php?id=` | Estatísticas do jogador | 10 | 10.000 |
| `lookupevent.php?id=` | ID do evento | 1 | 1 |
| `eventresults.php?id=` | Resultados do evento | 5 | 100 |
| `lookuplineup.php?id=` | Escalações do evento | 5 | 100 |
| `lookuptimeline.php?id=` | Timeline do evento | 5 | 100 |
| `lookupeventstats.php?id=` | Estatísticas do evento | 5 | 100 |
| `lookuptv.php?id=` | TV channels do evento | 2 | 100 |
| `lookupvenue.php?id=` | ID do estádio | 1 | 1 |

### List (Listagens)

| Endpoint | Parâmetro | Limite Free | Limite Premium |
|----------|-----------|-------------|----------------|
| `all_sports.php` | Todos os esportes | 2 | 50 |
| `all_countries.php` | Todos os países | 50 | 500 |
| `all_leagues.php` | Todas as ligas | 10 | 3.000 |
| `search_all_leagues.php?c=&s=` | Ligas por país/esporte | 10 | 100 |
| `search_all_seasons.php?id=` | Temporadas de uma liga | 5 | 500 |
| `search_all_teams.php?l=` | Times de uma liga | 10 | 3.000 |
| `lookup_all_players.php?id=` | Jogadores de um time | 10 | 3.000 |

### Schedule (Agenda)

| Endpoint | Parâmetro | Limite Free | Limite Premium |
|----------|-----------|-------------|----------------|
| `eventsnext.php?id=` | Próximos eventos do time | 1 (só home) | 10 |
| `eventslast.php?id=` | Últimos eventos do time | 1 (só home) | 10 |
| `eventsnextleague.php?id=` | Próximos da liga | 1 | 20 |
| `eventspastleague.php?id=` | Últimos da liga | 1 | 20 |
| `eventsday.php?d=` | Eventos do dia | 3 | 1.500 |
| `eventsseason.php?id=&s=` | Eventos da temporada | 15 | 3.000 |
| `eventstv.php?d=` | Programação TV | 1 | 1.500 |

### Video

| Endpoint | Parâmetro | Limite Free | Limite Premium |
|----------|-----------|-------------|----------------|
| `eventshighlights.php?d=` | Highlights YouTube | 2 | 50 |

---

## Imagens

Imagens disponíveis via JSON retornado (JPEG fanart e PNG transparente).

**Tamanhos:** `/medium` (500px), `/small` (250px), `/tiny` (50px), original (720px).

---

## Campos de dados retornados

- **League:** nome, país, esporte, badge, fanart, banner, logo, descrição
- **Team:** nome, estádio, badge, fanart, formation, kit, country, league, website
- **Player:** nome, posição, data nascimento, altura, peso, nationality, cutout, render, fanart, thumb
- **Event:** placar, linha do tempo, escalações, estatísticas, venue, round, season
- **Venue:** nome, capacidade, localização, imagem, coordenadas

---

## Restrições importantes

1. **Free não tem V2 API** — V2 (verboso, header auth, livescores) é Premium
2. **Busca free retorna 1 resultado** — busca por texto é inútil no free
3. **Schedule time** mostra apenas eventos em casa no free
4. **Livescores** — exclusivo Premium (V2)
5. **Video highlights** — limitado a 2 por data no free
6. **Classificação (table)** — limitada a ligas de futebol destaque
7. **30 req/min** — sem缓存, batida rápida estoura rápido

---

## Resumo para o projeto football-world

### Utilizável no free:
- **Lookup por ID** — a maioria funciona (1 req por chamada, mas suficiente para cache)
- **List sports/countries/leagues** — limites generosos (50/50/10)
- **Team/Player details** — lookup por ID funcionam
- **Schedule** — eventsseason (15 free) é o mais útil
- **Imagens** — todas acessíveis sem autenticação

### Não utilizável no free:
- **Busca por texto** — retorna 1 resultado apenas
- **Livescores** — Premium only
- **V2 API** — Premium only
- **Event highlights** — muito limitado (2/dia)
