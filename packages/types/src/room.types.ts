export interface RoomState {
  roomId: string;
  participants: ParticipantInfo[];
  activeStudyId: string | null;
}

export interface ParticipantInfo {
  identity: string;
  name: string;
  isPresenter: boolean;
}
