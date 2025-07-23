import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { gameSlice } from '../store/slices/gameSlice';

export const useGame = () => {
  const dispatch = useDispatch();
  const game = useSelector((state: RootState) => state.game);

  const joinRoom = (roomId: string) => {
    dispatch(gameSlice.actions.joinRoom(roomId));
  };

  const leaveRoom = () => {
    dispatch(gameSlice.actions.leaveRoom());
  };

  const updateGamePhase = (phase: 'lobby' | 'day' | 'night' | 'voting' | 'results') => {
    dispatch(gameSlice.actions.updateGamePhase(phase));
  };

  return {
    ...game,
    joinRoom,
    leaveRoom,
    updateGamePhase,
  };
};