export interface IInitiatePaymentPayload {
	workOrderId: string;
	payerReference?: string;
}

export interface IRefundPaymentPayload {
	reason?: string;
}
