import React from 'react';
import { useParams } from 'react-router-dom';
import { getGroupByRoute, getGroupByCode } from '../constants/swiftMtTypes';
import PaymentListPage from './PaymentListPage';
import MessageFormPage from './MessageFormPage';

/** Pagamentos que usam /messages e devem mostrar lista (não MT101/MT103 que têm rotas próprias) */
const PAYMENT_LIST_CODES = ['MT104', 'MT107', 'MT200', 'MT201', 'MT202', 'MT203', 'MT204', 'MT205', 'MT207'];

const MessagesRouteHandler: React.FC = () => {
  const { mtCode } = useParams<{ mtCode: string }>();
  const group = mtCode ? (getGroupByRoute(mtCode) ?? getGroupByCode(mtCode)) : null;
  const codes = group ? group.codes : (mtCode ? [mtCode] : []);
  const isPaymentList = mtCode && codes.some((c) => PAYMENT_LIST_CODES.includes(c));

  if (isPaymentList) {
    return <PaymentListPage />;
  }
  return <MessageFormPage />;
};

export default MessagesRouteHandler;
