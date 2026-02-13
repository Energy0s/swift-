/**
 * Store de mensagens SWIFT MT
 * Armazena todas as mensagens geradas
 */

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
  status: 'draft' | 'sent' | 'acknowledged' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const messages: SwiftMessage[] = [];
let messageIdCounter = 1;

export const messagesStore = {
  create: (data: Omit<SwiftMessage, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const msg: SwiftMessage = {
      ...data,
      id: messageIdCounter++,
      createdAt: now,
      updatedAt: now,
    };
    messages.push(msg);
    return msg;
  },

  findByUserId: (
    userId: number,
    options?: { messageType?: SwiftMessageType; limit?: number; page?: number; status?: string }
  ) => {
    let list = messages.filter((m) => m.userId === userId);
    if (options?.messageType) {
      list = list.filter((m) => m.messageType === options.messageType);
    }
    if (options?.status) {
      list = list.filter((m) => m.status === options.status);
    }
    const limit = options?.limit ?? 20;
    const page = options?.page ?? 1;
    const total = list.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = list.slice(start, start + limit).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { messages: paginated, pagination: { page, limit, total, pages } };
  },

  findById: (id: number) => messages.find((m) => m.id === id),

  update: (id: number, data: Partial<Pick<SwiftMessage, 'status' | 'rawMessage' | 'updatedAt'>>) => {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx >= 0) {
      messages[idx] = {
        ...messages[idx],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return messages[idx];
    }
    return null;
  },
};
