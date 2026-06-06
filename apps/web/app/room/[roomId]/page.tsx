'use client';

import { use } from 'react';
import dynamic from 'next/dynamic';

const RoomView = dynamic(() => import('@/components/room/RoomView'), { ssr: false });

export default function RoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);

  const roomId = decodeURIComponent(resolvedParams.roomId);
  const participantName = resolvedSearchParams.name || 'Anonymous';

  return (
    <RoomView roomId={roomId} participantName={participantName} />
  );
}
