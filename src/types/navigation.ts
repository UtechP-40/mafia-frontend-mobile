export type RootStackParamList = {
  Auth: undefined;
  MainMenu: undefined;
  Lobby: { roomId?: string };
  Game: { roomId: string };
  Results: { gameId: string };
};