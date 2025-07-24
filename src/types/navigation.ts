export type RootStackParamList = {
  Auth: undefined;
  MainMenu: undefined;
  Friends: undefined;
  Settings: undefined;
  RoomBrowser: undefined;
  Lobby: { roomId?: string };
  Game: { roomId: string };
  Results: { gameId: string };
};