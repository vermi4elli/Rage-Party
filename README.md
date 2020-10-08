# Rage-Party      
![Node.js CI](https://github.com/vermi4elli/Rage-Party/workflows/Node.js%20CI/badge.svg)
## Description
**Rage Party** is an online sandbox 2d third-person-shooter with coop and pvp possibilities. Players can co-op in endless mode of enemy waves or compete against each other. The rating system shows the total rating of players.
## Main Functionality
- [ ] Players can register their own account;   
- [ ] Players can communicate via a global or a team chat;
- [ ] Game allows player customize their account:
  - [ ] change their nickname;
  - [ ] change their avatar;
  - [ ] delete their account and user information;
- [ ] Players can choose which game mode to play;

## Functionality Details
- [ ] The pointer locks in the game fields borders;

## Technologies

### Frontend
```
- HTML5 + CSS
- PixiJS - WebGL
```
### Backend
```
- Node.JS
- Fastify
- MessagePack ? - fast data serialization
- PostgreSQL - save the chat history, accounts data and scores
- IndexedDB - make the game "internet-addiction-free"
```
