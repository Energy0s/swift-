import api from './api';

export interface Transfer {
  id: number;
  userId: number;
  referenceNumber: string;
  sourceAccountId: number;
  destinationIban: string;
  destinationBic: string;
  destinationHolderName: string;
  amount: number;
  currency: string;
  fees: number;
  totalAmount: number;
  purpose?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransferPayload {
  sourceAccountId: number;
  destinationIban: string;
  destinationBic: string;
  destinationHolderName: string;
  amount: number;
  currency: string;
  purpose?: string;
  categoryPurpose?: string;
  /** 23B - Bank Operation Code: CRED, SPAY, SSTD, SPRI */
  bankOperationCode?: 'CRED' | 'SPAY' | 'SSTD' | 'SPRI';
  /** 71A - Details of Charges: OUR, BEN, SHA */
  detailsOfCharges?: 'OUR' | 'BEN' | 'SHA';
}

export const getTransferStats = () => {
  return api.get<{
    status: string;
    data: { sentToday: number; pending: number };
  }>('/transfers/stats');
};

export const getTransfers = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  accountId?: number;
  reference?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.accountId) searchParams.set('accountId', String(params.accountId));
  if (params?.reference) searchParams.set('reference', params.reference);
  const qs = searchParams.toString();
  return api.get<{
    status: string;
    data: {
      transfers: Transfer[];
      pagination: { page: number; limit: number; total: number; pages: number };
    };
  }>(`/transfers${qs ? `?${qs}` : ''}`);
};

export const getTransfer = (id: number) => {
  return api.get<{
    status: string;
    data: {
      transfer: Transfer & {
        destinationAccount?: { iban: string; bic: string; holderName: string };
        sourceAccount?: { iban: string; bic: string; accountNumber: string };
      };
    };
  }>(`/transfers/${id}`);
};

export const getSwiftMessage = (id: number, format: string) => {
  return api.get(`/transfers/${id}/swift-message?format=${format}`, {
    responseType: 'text',
  });
};

export const createTransfer = (payload: CreateTransferPayload) => {
  return api.post<{
    status: string;
    message: string;
    data: {
      transfer: { id: number; referenceNumber: string; status: string; estimatedCompletion: string };
    };
  }>('/transfers', payload);
};
