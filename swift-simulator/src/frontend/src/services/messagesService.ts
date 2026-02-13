import api from './api';

export type SwiftMessageType =
  | 'MT101' | 'MT102' | 'MT102STP' | 'MT103' | 'MT103REMIT' | 'MT103STP'
  | 'MT104' | 'MT105' | 'MT106' | 'MT107' | 'MT110' | 'MT111' | 'MT112'
  | 'MT121' | 'MT190' | 'MT191' | 'MT192' | 'MT195' | 'MT196' | 'MT198' | 'MT199'
  | 'MT200' | 'MT201' | 'MT202' | 'MT203' | 'MT204' | 'MT205' | 'MT206' | 'MT207'
  | 'MT210' | 'MT256' | 'MT290' | 'MT291' | 'MT292' | 'MT295' | 'MT296' | 'MT298' | 'MT299'
  | 'MT300' | 'MT303' | 'MT304' | 'MT305' | 'MT307' | 'MT308'
  | 'MT320' | 'MT330' | 'MT340' | 'MT350' | 'MT360' | 'MT380' | 'MT381'
  | 'MT390' | 'MT395' | 'MT396' | 'MT398' | 'MT399'
  | 'MT400' | 'MT405' | 'MT410' | 'MT412' | 'MT416' | 'MT420' | 'MT430'
  | 'MT450' | 'MT455' | 'MT456' | 'MT490' | 'MT491' | 'MT492' | 'MT495' | 'MT496' | 'MT498' | 'MT499'
  | 'MT500' | 'MT501' | 'MT502' | 'MT520' | 'MT530'
  | 'MT540' | 'MT541' | 'MT542' | 'MT543' | 'MT544' | 'MT545' | 'MT546' | 'MT547' | 'MT548'
  | 'MT550' | 'MT560' | 'MT564' | 'MT599';

export interface SwiftMessage {
  id: number;
  userId: number;
  messageType: SwiftMessageType;
  referenceNumber: string;
  rawMessage: string;
  payload: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const getMessages = (params?: {
  messageType?: SwiftMessageType;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.messageType) searchParams.set('messageType', params.messageType);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  return api.get<{
    status: string;
    data: { messages: SwiftMessage[]; pagination: { page: number; limit: number; total: number; pages: number } };
  }>(`/messages${qs ? `?${qs}` : ''}`);
};

export const getMessage = (id: number) => {
  return api.get<{
    status: string;
    data: { message: SwiftMessage };
  }>(`/messages/${id}`);
};

export const createMessage = (messageType: SwiftMessageType, payload: Record<string, unknown>) => {
  return api.post<{
    status: string;
    message: string;
    data: { message: SwiftMessage };
  }>('/messages', { messageType, payload });
};
